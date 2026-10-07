-- RLS baseline for Kolab.id.
--
-- Adds, in order:
--   1. reviews.reviewee_umkm_id / reviewee_influencer_id + backfill + check
--   2. influencers.engagement_rate
--   3. influencers.starting_price backfill + SET NOT NULL
--   4. access-path indexes
--   5. the baseline policy set
--
-- No write policy is created anywhere in this file, so the browser key cannot
-- insert, update, or delete on any table. Server Actions use the service-role
-- client, which bypasses RLS and therefore authorizes in application code.
--
-- The six tables belonging to deferred capabilities (conversations, messages,
-- disputes, dispute_infos, resolution_offers, notifications) are deliberately
-- left with RLS enabled and no policy. A table in that state returns an empty
-- result rather than an error.

-- ----------------------------------------------------------------------------
-- 1. reviews reviewee columns
--
-- Without these, a creator's reviews can only be found by joining reviews to
-- bookings, and RLS applies to that join: under the party-scoped bookings policy
-- below, a signed-out visitor would silently get zero reviews.
-- ----------------------------------------------------------------------------

alter table public.reviews
  add column if not exists reviewee_umkm_id bigint references public.umkms (id) on delete restrict;

alter table public.reviews
  add column if not exists reviewee_influencer_id bigint references public.influencers (id) on delete restrict;

-- An UMKM reviews the creator, so the creator is the reviewee.
update public.reviews r
   set reviewee_influencer_id = b.influencer_id
  from public.bookings b
 where b.id = r.booking_id
   and r.reviewer_role = 'umkm'
   and r.reviewee_influencer_id is null;

-- A creator reviews the business, so the business is the reviewee.
update public.reviews r
   set reviewee_umkm_id = b.umkm_id
  from public.bookings b
 where b.id = r.booking_id
   and r.reviewer_role = 'influencer'
   and r.reviewee_umkm_id is null;

-- Exactly one reviewee, enforced. DEVELOPMENT.md §8 specified a polymorphic
-- reviewee_type + reviewee_id pair instead; two nullable foreign keys are used
-- so the constraint can be enforced and indexed.
alter table public.reviews
  drop constraint if exists reviews_reviewee_chk;

alter table public.reviews
  add constraint reviews_reviewee_chk
  check (num_nonnulls(reviewee_umkm_id, reviewee_influencer_id) = 1);

-- ----------------------------------------------------------------------------
-- 2. influencers.engagement_rate
--
-- Serves the existing reach-roi-estimate requirement, which already says a
-- creator without an engagement rate falls back to a default. The default
-- matches DEFAULT_ENGAGEMENT_RATE in lib/estimate.ts.
-- ----------------------------------------------------------------------------

alter table public.influencers
  add column if not exists engagement_rate numeric(4,3);

update public.influencers
   set engagement_rate = 0.035
 where engagement_rate is null;

alter table public.influencers
  alter column engagement_rate set default 0.035;

alter table public.influencers
  alter column engagement_rate set not null;

-- ----------------------------------------------------------------------------
-- 3. influencers.starting_price
--
-- NOT NULL and denormalized: /insights min/avg/max, the price filter, and
-- creator recommendation all read this column assuming a value. The trigger
-- that maintains it arrives with package editing in catalog-and-booking.
-- ----------------------------------------------------------------------------

do $$
declare
  creators_without_package integer;
begin
  select count(*) into creators_without_package
    from public.influencers i
   where not exists (
           select 1 from public.packages p where p.influencer_id = i.id
         );

  if creators_without_package > 0 then
    raise exception
      'Cannot make influencers.starting_price NOT NULL: % creator(s) have no package. Add a package for each first, or insert the creators after this migration.',
      creators_without_package;
  end if;
end
$$;

-- Only fills gaps. A stored value that disagrees with the cheapest package is
-- reported rather than silently overwritten; correcting it is the catalog
-- change's job, together with the trigger that keeps it honest.
update public.influencers i
   set starting_price = cheapest.min_price
  from (
         select p.influencer_id, min(p.price) as min_price
           from public.packages p
          group by p.influencer_id
       ) cheapest
 where cheapest.influencer_id = i.id
   and i.starting_price is null;

alter table public.influencers
  alter column starting_price set not null;

-- ----------------------------------------------------------------------------
-- 4. Access-path indexes
--
-- Postgres does not index foreign-key columns automatically, so the party-scope
-- comparisons and the catalog joins need them. At demo seed volume none of these
-- change performance; they exist because the policy subquery runs per candidate
-- row and because bookings is the one table that grows with usage.
-- ----------------------------------------------------------------------------

create index if not exists bookings_umkm_id_idx      on public.bookings (umkm_id);
create index if not exists bookings_influencer_id_idx on public.bookings (influencer_id);
create index if not exists bookings_status_idx        on public.bookings (status);

create index if not exists packages_influencer_id_idx on public.packages (influencer_id);

create index if not exists reviews_reviewee_influencer_id_idx on public.reviews (reviewee_influencer_id);
create index if not exists reviews_reviewee_umkm_id_idx        on public.reviews (reviewee_umkm_id);

create index if not exists influencers_category_id_idx on public.influencers (category_id);
create index if not exists influencers_city_idx       on public.influencers (city);

-- ----------------------------------------------------------------------------
-- 5. Policies
--
-- CREATE POLICY has no IF NOT EXISTS, so each one is guarded. A partially
-- applied migration must be safe to re-run, because db:migrate will be run
-- again.
-- ----------------------------------------------------------------------------

-- 5.1 Public catalog read. Includes umkms.budget: getLandingStats() in
--     lib/data.ts computes COUNT(*) over umkms for the landing page, and RLS
--     constrains aggregates, so a party-scoped policy would report zero UMKM to
--     the public. No code or spec reads budget.
-- 5.2 Own-row profile read.
-- 5.3 Party-scoped read of a booking.
-- 5.4 Party-scoped read of everything hanging off a booking. Authorizing the
--     booking but forgetting its children would expose a creator's payment
--     record to anyone who knew a delivery id, so each child policy resolves
--     the caller through bookings independently.

-- 5.1 public catalog ------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_public_read') then
    create policy categories_public_read on public.categories for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'influencers' and policyname = 'influencers_public_read') then
    create policy influencers_public_read on public.influencers for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'packages' and policyname = 'packages_public_read') then
    create policy packages_public_read on public.packages for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'umkms' and policyname = 'umkms_public_read') then
    create policy umkms_public_read on public.umkms for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'reviews_public_read') then
    create policy reviews_public_read on public.reviews for select using (true);
  end if;
end
$$;

-- 5.2 own profile ---------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_own_read') then
    create policy profiles_own_read on public.profiles
      for select
      using (user_id = auth.uid());
  end if;
end
$$;

-- 5.3 party-scoped booking ------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_party_read') then
    create policy bookings_party_read on public.bookings
      for select
      using (
             umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
          or influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
           );
  end if;
end
$$;

-- 5.4 party-scoped children ----------------------------------------------

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'deliveries' and policyname = 'deliveries_party_read') then
    create policy deliveries_party_read on public.deliveries
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = deliveries.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'revision_requests' and policyname = 'revision_requests_party_read') then
    create policy revision_requests_party_read on public.revision_requests
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = revision_requests.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'payments_party_read') then
    create policy payments_party_read on public.payments
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = payments.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'booking_events' and policyname = 'booking_events_party_read') then
    create policy booking_events_party_read on public.booking_events
      for select
      using (
        exists (
          select 1
            from public.bookings b
           where b.id = booking_events.booking_id
             and (
                    b.umkm_id      = (select p.umkm_id      from public.profiles p where p.user_id = auth.uid())
                 or b.influencer_id = (select p.influencer_id from public.profiles p where p.user_id = auth.uid())
             )
        )
      );
  end if;
end
$$;
