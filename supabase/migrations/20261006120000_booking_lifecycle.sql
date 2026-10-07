-- Booking lifecycle: one state machine, its guard, and the wrappers that must
-- write a child row alongside the state change.
--
-- Everything here is deliberately in the database rather than in the actions:
-- the legal moves, the timestamps each move implies, the payment side-effects,
-- the timeline entry, the revision counter, and the quota check. The actions
-- own authorization (they read through the caller's own session first); Postgres
-- owns the invariants. See openspec/changes/booking-lifecycle/design.md.

-- ------------------------------------------------------------------ 1. matrix --
--
-- The legal moves, as data. A move is legal when its (from, to, required actor)
-- triple is present. COMPLETED, REJECTED and CANCELLED appear only on the left:
-- they have no outgoing rows, which is what makes them finished. CANCELLED and
-- DISPUTED are members so extending the machine later is additive.
create or replace function public.apply_booking_transition(
  p_booking_id bigint,
  p_to booking_status,
  p_actor_role actor_role
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from  booking_status;
  v_row   public.bookings;
  v_actor uuid;
begin
  -- Lock first: two simultaneous actions serialise here, and the second one sees
  -- the already-moved status and finds no legal row below.
  select * into v_row from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id using errcode = 'no_data_found';
  end if;
  v_from := v_row.status;

  if not exists (
    select 1 from (values
      ('PENDING'::booking_status,   'ACCEPTED'::booking_status,  'influencer'::actor_role),
      ('PENDING'::booking_status,   'REJECTED'::booking_status,  'influencer'::actor_role),
      ('PENDING'::booking_status,   'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('PENDING'::booking_status,   'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('ACCEPTED'::booking_status,  'FUNDED'::booking_status,    'umkm'::actor_role),
      ('ACCEPTED'::booking_status,  'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('ACCEPTED'::booking_status,  'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('FUNDED'::booking_status,    'SUBMITTED'::booking_status, 'influencer'::actor_role),
      ('FUNDED'::booking_status,    'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('FUNDED'::booking_status,    'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('SUBMITTED'::booking_status, 'REVISION'::booking_status,  'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'COMPLETED'::booking_status, 'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'DISPUTED'::booking_status,  'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'DISPUTED'::booking_status,  'influencer'::actor_role),
      ('SUBMITTED'::booking_status, 'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('SUBMITTED'::booking_status, 'CANCELLED'::booking_status, 'influencer'::actor_role),
      ('REVISION'::booking_status,  'SUBMITTED'::booking_status, 'influencer'::actor_role),
      ('REVISION'::booking_status,  'CANCELLED'::booking_status, 'umkm'::actor_role),
      ('REVISION'::booking_status,  'CANCELLED'::booking_status, 'influencer'::actor_role)
    ) as m(from_status, to_status, required_role)
    where m.from_status = v_from
      and m.to_status = p_to
      and m.required_role = p_actor_role
  ) then
    raise exception 'Transisi % -> % oleh % tidak diizinkan', v_from, p_to, p_actor_role
      using errcode = 'check_violation';
  end if;

  -- The flag the guard trigger looks for. Transaction-local (true), so it is
  -- gone the moment this transaction ends and a later direct UPDATE is refused
  -- again. The trigger is the only reason this exists.
  perform set_config('kolab.in_transition', '1', true);

  update public.bookings set
    status          = p_to,
    accepted_at     = case when p_to = 'ACCEPTED'  then now() else accepted_at end,
    brief_locked_at = case when p_to = 'ACCEPTED'  then now() else brief_locked_at end,
    payment_due_at  = case when p_to = 'ACCEPTED'  then now() + interval '24 hours' else payment_due_at end,
    funded_at       = case when p_to = 'FUNDED'    then now() else funded_at end,
    deadline_at     = case when p_to = 'FUNDED'    then now() + make_interval(days => estimated_days) else deadline_at end,
    submitted_at    = case when p_to = 'SUBMITTED' then now() else submitted_at end,
    review_due_at   = case when p_to = 'SUBMITTED' then now() + interval '3 days' else review_due_at end,
    completed_at    = case when p_to = 'COMPLETED' then now() else completed_at end,
    cancelled_at    = case when p_to = 'CANCELLED' then now() else cancelled_at end
  where id = p_booking_id
  returning * into v_row;

  -- Payment side-effects. No other code path writes payments.status or
  -- creator_amount before release.
  if p_to = 'ACCEPTED' then
    insert into public.payments (booking_id, total_amount, status)
    values (p_booking_id, v_row.amount, 'UNPAID')
    on conflict (booking_id) do nothing;
  elsif p_to = 'FUNDED' then
    update public.payments set status = 'HELD', held_at = now()
     where booking_id = p_booking_id;
  elsif p_to = 'COMPLETED' then
    update public.payments
       set status = 'RELEASED', creator_amount = total_amount, settled_at = now()
     where booking_id = p_booking_id;
  end if;
  -- A cancellation leaves the payment exactly where it was.

  -- The party is resolved from the role and the booking, so the function needs
  -- no actor parameter and works whether it is called through the user client
  -- or the service role.
  if p_actor_role = 'umkm' then
    select user_id into v_actor from public.profiles where umkm_id = v_row.umkm_id limit 1;
  elsif p_actor_role = 'influencer' then
    select user_id into v_actor from public.profiles where influencer_id = v_row.influencer_id limit 1;
  end if;

  insert into public.booking_events (booking_id, from_status, to_status, actor_id, actor_role)
  values (p_booking_id, v_from, p_to, v_actor, p_actor_role);

  return v_row;
end;
$$;

-- ------------------------------------------------------- 2. the only writer --
--
-- A direct `UPDATE bookings SET status = ...` is refused. Ordinary column edits
-- (brief, revisions_used, review_extended, ...) pass through untouched, because
-- the trigger only reacts when the status actually changes without the flag.
create or replace function public.guard_booking_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('kolab.in_transition', true), '') <> '1' then
    raise exception 'bookings.status hanya boleh diubah lewat apply_booking_transition()'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_guard_status on public.bookings;
create trigger bookings_guard_status
  before update on public.bookings
  for each row execute function public.guard_booking_status();

-- ------------------------------------------------------- 3. child-row wrappers --
--
-- Each one writes its child row and then calls the state machine, so the two
-- happen in one transaction: a refused transition rolls the child row back too.
create or replace function public.submit_delivery(
  p_booking_id bigint,
  p_actor_role actor_role,
  p_content_url text,
  p_note text default null
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round integer;
begin
  if p_content_url is null or btrim(p_content_url) = '' then
    raise exception 'Link konten wajib diisi' using errcode = 'check_violation';
  end if;
  select coalesce(max(round), 0) + 1 into v_round
    from public.deliveries where booking_id = p_booking_id;
  insert into public.deliveries (booking_id, round, content_url, note)
  values (p_booking_id, v_round, btrim(p_content_url), nullif(btrim(coalesce(p_note, '')), ''));
  return public.apply_booking_transition(p_booking_id, 'SUBMITTED', p_actor_role);
end;
$$;

create or replace function public.request_revision(
  p_booking_id bigint,
  p_actor_role actor_role,
  p_delivery_id bigint,
  p_section text,
  p_note text,
  p_within_brief boolean default true
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round integer;
begin
  if p_section is null or btrim(p_section) = '' then
    raise exception 'Bagian yang direvisi wajib diisi' using errcode = 'check_violation';
  end if;
  if p_note is null or btrim(p_note) = '' then
    raise exception 'Keterangan revisi wajib diisi' using errcode = 'check_violation';
  end if;
  select round into v_round
    from public.deliveries
   where id = p_delivery_id and booking_id = p_booking_id;
  if v_round is null then
    raise exception 'Ronde yang direvisi tidak ditemukan' using errcode = 'no_data_found';
  end if;
  -- The unique(delivery_id) and the quota trigger both live on the table, so a
  -- second request on the same round or a request past the quota is refused
  -- here with the table's own error rather than silently accepted.
  insert into public.revision_requests (booking_id, delivery_id, round, section, note, within_brief)
  values (p_booking_id, p_delivery_id, v_round, btrim(p_section), btrim(p_note), coalesce(p_within_brief, true));
  return public.apply_booking_transition(p_booking_id, 'REVISION', p_actor_role);
end;
$$;

create or replace function public.open_dispute(
  p_booking_id bigint,
  p_actor_role actor_role,
  p_reason text
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  public.bookings;
  v_code text;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Alasan sengketa wajib diisi' using errcode = 'check_violation';
  end if;
  select * into v_row from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id using errcode = 'no_data_found';
  end if;
  if v_row.revisions_used < v_row.revision_quota then
    raise exception 'Kuota revisi belum habis; sengketa belum bisa dibuka'
      using errcode = 'check_violation';
  end if;
  v_code := 'DSP-' || to_char(now(), 'YYYY') || '-' || lpad(p_booking_id::text, 4, '0');
  insert into public.disputes (code, booking_id, reason, opened_by, status, due_at)
  values (v_code, p_booking_id, btrim(p_reason), p_actor_role::text::party_role, 'OPEN', now() + interval '3 days');
  return public.apply_booking_transition(p_booking_id, 'DISPUTED', p_actor_role);
end;
$$;

-- ------------------------------------------------- 4. review window extension --
create or replace function public.extend_review_window(
  p_booking_id bigint
) returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bookings;
begin
  select * into v_row from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % tidak ditemukan', p_booking_id using errcode = 'no_data_found';
  end if;
  if v_row.status <> 'SUBMITTED' then
    raise exception 'Tidak ada konten yang menunggu review' using errcode = 'check_violation';
  end if;
  if v_row.review_extended then
    raise exception 'Waktu review sudah pernah diperpanjang' using errcode = 'check_violation';
  end if;
  update public.bookings
     set review_extended = true,
         review_due_at = coalesce(review_due_at, now()) + interval '2 days'
   where id = p_booking_id
   returning * into v_row;
  return v_row;
end;
$$;

-- ------------------------------------------- 5. revision counter and quota --
create or replace function public.count_revision()
returns trigger
language plpgsql
as $$
begin
  if new.within_brief then
    update public.bookings
       set revisions_used = revisions_used + 1
     where id = new.booking_id;
  end if;
  return new;
end;
$$;

drop trigger if exists revision_requests_count on public.revision_requests;
create trigger revision_requests_count
  after insert on public.revision_requests
  for each row execute function public.count_revision();

create or replace function public.enforce_revision_quota()
returns trigger
language plpgsql
as $$
declare
  v_booking public.bookings;
begin
  if not new.within_brief then
    return new;
  end if;
  select * into v_booking from public.bookings where id = new.booking_id;
  if v_booking.revisions_used >= v_booking.revision_quota then
    raise exception 'Kuota revisi sudah habis. Ajukan sengketa untuk melanjutkan.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists revision_requests_quota on public.revision_requests;
create trigger revision_requests_quota
  before insert on public.revision_requests
  for each row execute function public.enforce_revision_quota();

-- ---------------------------------------------------------- 6. lookup indexes --
create index if not exists bookings_umkm_status_idx on public.bookings (umkm_id, status);
create index if not exists bookings_influencer_status_idx on public.bookings (influencer_id, status);