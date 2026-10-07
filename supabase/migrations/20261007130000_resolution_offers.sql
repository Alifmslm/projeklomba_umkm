-- Resolution offers: the self-service settlement steps of the ladder
-- (ARCHITECTURE §2.6, steps 3-5) — extra revisions, a price reduction, and a
-- mutual cancellation with refund terms.
--
-- The `resolution_offers` table already ships in the remote schema (booking,
-- offered by, type, value, status, expiry) but had no policy and no function.
-- This migration gives it both:
--   1. a party-scoped SELECT policy, so each party reads its own offers;
--   2. a partial unique index enforcing at most one open offer per booking;
--   3. `create_offer` and `respond_to_offer`, the only writers of an offer and
--      the only place a settlement moves held money to SPLIT / REFUNDED.
--
-- `apply_booking_transition` remains the only writer of `bookings.status`; when
-- an accepted offer moves a booking (COMPLETED / CANCELLED) it calls that
-- function, then settles the payment in the same transaction. A direct
-- cancellation still settles nothing.
--
-- Expiry is lazy: no scheduler exists, so an overdue PENDING offer is marked
-- EXPIRED when a sibling is created or a decision is attempted, and reads show
-- it as expired in between.
--
-- See openspec/changes/resolution-offers/.

-- ----------------------------------------------------- 1. read policy --
--
-- Mirrors bookings_party_read: a child resolves the caller through the booking.
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'resolution_offers'
       and policyname = 'resolution_offers_party_read'
  ) then
    create policy resolution_offers_party_read on public.resolution_offers
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = resolution_offers.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;
end
$$;

-- ------------------------------------------------- 2. one open offer --
create unique index if not exists resolution_offers_one_open
  on public.resolution_offers (booking_id)
  where status = 'PENDING';

create index if not exists resolution_offers_booking_id_idx
  on public.resolution_offers (booking_id, created_at);

-- ------------------------------------------------------ 3. create_offer --
--
-- Who may offer what, from which state. The value is type-dependent:
--   EXTRA_REVISION: number of extra revisions (>= 1), free only for now
--   DISCOUNT:       the amount the creator will accept, 0 < value < amount
--   CANCELLATION:   the amount refunded to the business, 0 < value <= amount
create or replace function public.create_offer(
  p_booking_id bigint,
  p_actor_role actor_role,
  p_type       offer_type,
  p_value      integer,
  p_note       text default null
) returns public.resolution_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_row     public.resolution_offers;
  v_allowed boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id using errcode = 'no_data_found';
  end if;

  if p_actor_role not in ('umkm', 'influencer') then
    raise exception 'Hanya pihak pada booking yang dapat mengajukan tawaran'
      using errcode = 'check_violation';
  end if;

  if v_booking.status in ('COMPLETED', 'REJECTED', 'CANCELLED') then
    raise exception 'Booking % sudah selesai', v_booking.status using errcode = 'check_violation';
  end if;

  if p_type = 'EXTRA_REVISION' then
    v_allowed := p_actor_role = 'influencer' and v_booking.status in ('SUBMITTED', 'REVISION');
  elsif p_type = 'DISCOUNT' then
    v_allowed := p_actor_role = 'influencer' and v_booking.status = 'SUBMITTED';
  elsif p_type = 'CANCELLATION' then
    v_allowed := v_booking.status in ('ACCEPTED', 'FUNDED', 'SUBMITTED', 'REVISION');
  else
    v_allowed := false;
  end if;

  if not v_allowed then
    raise exception 'Tawaran % oleh % tidak diizinkan pada status %',
      p_type, p_actor_role, v_booking.status
      using errcode = 'check_violation';
  end if;

  if p_value is null then
    raise exception 'Nilai tawaran wajib diisi' using errcode = 'check_violation';
  end if;

  if p_type = 'EXTRA_REVISION' and p_value < 1 then
    raise exception 'Jumlah revisi tambahan minimal 1' using errcode = 'check_violation';
  elsif p_type = 'DISCOUNT' and (p_value <= 0 or p_value >= v_booking.amount) then
    raise exception 'Potongan harga harus di antara 0 dan %', v_booking.amount
      using errcode = 'check_violation';
  elsif p_type = 'CANCELLATION' and (p_value <= 0 or p_value > v_booking.amount) then
    raise exception 'Nilai refund harus di antara 0 dan %', v_booking.amount
      using errcode = 'check_violation';
  end if;

  -- `fee` is always written as 0: free extra revisions only, because the escrow
  -- total is immutable and there is no second charge path (design decision 3).

  -- Clear overdue siblings so the partial unique index does not block a fresh
  -- offer, and so an expired offer stops being "open".
  update public.resolution_offers
     set status = 'EXPIRED'
   where booking_id = p_booking_id
     and status = 'PENDING'
     and expires_at <= now();

  insert into public.resolution_offers
    (booking_id, offered_by, type, value, fee, note, status, expires_at)
  values
    (p_booking_id, p_actor_role::text::party_role, p_type, p_value, 0,
     nullif(btrim(coalesce(p_note, '')), ''), 'PENDING', now() + interval '48 hours')
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'Masih ada tawaran yang menunggu keputusan'
      using errcode = 'check_violation';
end;
$$;

-- ---------------------------------------------------- 4. respond_to_offer --
create or replace function public.respond_to_offer(
  p_offer_id   bigint,
  p_actor_role actor_role,
  p_accept     boolean
) returns public.resolution_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer   public.resolution_offers;
  v_booking public.bookings;
  v_role    party_role;
begin
  if p_actor_role not in ('umkm', 'influencer') then
    raise exception 'Hanya pihak pada booking yang dapat memutuskan tawaran'
      using errcode = 'check_violation';
  end if;
  v_role := p_actor_role::text::party_role;

  select * into v_offer from public.resolution_offers where id = p_offer_id for update;
  if not found then
    raise exception 'Tawaran % tidak ditemukan', p_offer_id using errcode = 'no_data_found';
  end if;

  if v_offer.status <> 'PENDING' then
    raise exception 'Tawaran sudah diputuskan' using errcode = 'check_violation';
  end if;

  if v_offer.expires_at <= now() then
    -- Mark it expired and return it rather than raising: a raise would roll this
    -- update back, and the row must stay recorded as expired. The caller reads
    -- the returned status and reports the refusal.
    update public.resolution_offers set status = 'EXPIRED' where id = p_offer_id;
    select * into v_offer from public.resolution_offers where id = p_offer_id;
    return v_offer;
  end if;

  -- Only the counterparty decides.
  if v_offer.offered_by = v_role then
    raise exception 'Pihak yang menawarkan tidak dapat memutuskan tawarannya'
      using errcode = 'check_violation';
  end if;

  select * into v_booking from public.bookings where id = v_offer.booking_id for update;

  if not p_accept then
    update public.resolution_offers
       set status = 'DECLINED', responded_at = now()
     where id = p_offer_id
    returning * into v_offer;
    return v_offer;
  end if;

  if v_offer.type = 'EXTRA_REVISION' then
    -- No state change: the business just gets more room.
    update public.bookings
       set revision_quota = revision_quota + v_offer.value
     where id = v_offer.booking_id;

  elsif v_offer.type = 'DISCOUNT' then
    -- The transition completes the booking and releases the full total; the
    -- settlement then overwrites it to the reduced split. The filter is only the
    -- booking, because the transition has already moved the status away from
    -- HELD by the time this runs.
    perform public.apply_booking_transition(v_offer.booking_id, 'COMPLETED', p_actor_role);
    update public.payments
       set status             = 'SPLIT',
           creator_amount     = v_offer.value,
           umkm_refund_amount = total_amount - v_offer.value,
           settled_at         = now()
     where booking_id = v_offer.booking_id;

  elsif v_offer.type = 'CANCELLATION' then
    perform public.apply_booking_transition(v_offer.booking_id, 'CANCELLED', p_actor_role);
    -- Only a held payment is settled; an unpaid request just ends.
    update public.payments
       set status             = (case when v_offer.value >= total_amount then 'REFUNDED' else 'SPLIT' end)::payment_status,
           creator_amount     = total_amount - v_offer.value,
           umkm_refund_amount = v_offer.value,
           settled_at         = now()
     where booking_id = v_offer.booking_id
       and status = 'HELD';
  end if;

  update public.resolution_offers
     set status = 'ACCEPTED', responded_at = now()
   where id = p_offer_id
  returning * into v_offer;

  return v_offer;
end;
$$;