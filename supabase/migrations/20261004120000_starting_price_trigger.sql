-- creators: starting_price maintenance, last-active-package guard, catalog indexes
--
-- Why this file exists
-- --------------------
-- `rls-access-control` made `influencers.starting_price` NOT NULL and backfilled it,
-- but deliberately left the maintenance to whoever introduced package editing. Until
-- something wrote it, the column was correct only because the seed backfills it on
-- line 163. That is a one-shot repair, not a rule: create a package, change a price,
-- deactivate one, and the column goes stale while the price filter and the price
-- insight keep reading it. A quietly wrong price is worse than a missing one,
-- because nothing errors.
--
-- So the invariant moves into the database, where every writer gets it for free.
-- The trigger is the only sanctioned writer of `starting_price`.
--
-- Two triggers, in this order, because they answer different questions:
--
--   1. `guard_package_deactivation` runs BEFORE. It refuses a change that would leave
--      a creator with no active package at all, and it has to run first: an AFTER
--      trigger sees the damage already done and could only complain after the fact.
--   2. `maintain_starting_price` runs AFTER. It recomputes from whatever survived.
--
-- The zero sentinel
-- -----------------
-- A creator who has just onboarded has no package, so the minimum over an empty set
-- is 0. That is the sentinel for "no price yet" and it is deliberately NOT NULL,
-- because a nullable column puts a null branch in every catalog query that reads it.
-- The catalog treats 0 as absent: it renders "belum ada paket", and it excludes such
-- a creator from the price filter and from price insight, so the sentinel can never
-- be mistaken for a real price or surface as the cheapest option in a category.
--
-- The guard is what keeps the two cases distinguishable. Without it a creator who
-- once had packages could deactivate the last one, land on the same 0, and vanish
-- from the catalog with no explanation.

-- ------------------------------------------------------------------ 1. sentinel
-- `starting_price` is NOT NULL already (rls-access-control). Only the default is
-- missing, so a creator inserted with no package lands on 0 instead of failing.
alter table public.influencers
  alter column starting_price set default 0;

comment on column public.influencers.starting_price is
  'Minimum price across the creator''s active packages; 0 means they have none. '
  'Maintained by the maintain_starting_price trigger - do not write it directly.';

-- ------------------------------------------------------------ 2. the guard (BEFORE)
-- Deactivating or deleting a creator's last active package is refused.
--
-- The message names the fix rather than just the rule: "add another package first"
-- is something the creator can act on, where "constraint violation" is not.
create or replace function public.guard_package_deactivation()
returns trigger
language plpgsql
as $$
declare
  remaining integer;
begin
  -- Deleting an active package is the same event as deactivating one, by another
  -- route, so it gets the same guard. Inactive packages are free to go.
  if tg_op = 'DELETE' then
    if not old.is_active then
      return old;
    end if;
    select count(*) into remaining
      from public.packages
     where influencer_id = old.influencer_id
       and is_active
       and id <> old.id;

    if remaining = 0 then
      raise exception
        'Paket "%" adalah paket aktif terakhir kreator ini. Tambahkan paket lain terlebih dahulu, atau nonaktifkan setelah ada penggantinya.',
        old.name
        using errcode = 'check_violation';
    end if;
    return old;
  end if;

  -- Only the active -> inactive edge is guarded. Editing a price or a summary on a
  -- package that stays active is ordinary work and must not be caught by this.
  if old.is_active and not new.is_active then
    select count(*) into remaining
      from public.packages
     where influencer_id = new.influencer_id
       and is_active
       and id <> new.id;

    if remaining = 0 then
      raise exception
        'Paket "%" adalah paket aktif terakhir kreator ini. Tambahkan paket lain terlebih dahulu, atau nonaktifkan setelah ada penggantinya.',
        new.name
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists packages_guard_deactivation on public.packages;
create trigger packages_guard_deactivation
  before update or delete on public.packages
  for each row execute function public.guard_package_deactivation();

-- -------------------------------------------------------- 3. the recompute (AFTER)
-- Recomputes the creator's starting_price as min(price) over their active packages.
--
-- Covers the four operations the catalog depends on:
--   insert  - a new package can become the cheapest
--   update  - a price change, an activation, or a deactivation
--   delete  - the cheapest one was removed
--
-- Reassignment is handled too: moving a package to a different creator changes two
-- creators, so both are recomputed. Skipping that would leave the old creator
-- quoting a price for a package they no longer offer.
create or replace function public.maintain_starting_price()
returns trigger
language plpgsql
as $$
declare
  target_creator bigint;
begin
  -- AFTER triggers see the new state, so compute the affected creator from NEW when
  -- it exists and from OLD when the row is gone.
  target_creator := case when tg_op = 'DELETE' then old.influencer_id
                         else new.influencer_id end;

  update public.influencers i
     set starting_price = cheapest.min_price
    from (
      select coalesce(min(p.price), 0) as min_price
        from public.packages p
       where p.influencer_id = target_creator
         and p.is_active
    ) as cheapest
   where i.id = target_creator;

  -- A reassignment leaves the previous creator needing the same treatment.
  if tg_op = 'UPDATE' and old.influencer_id <> new.influencer_id then
    update public.influencers i
       set starting_price = cheapest.min_price
      from (
        select coalesce(min(p.price), 0) as min_price
          from public.packages p
         where p.influencer_id = old.influencer_id
           and p.is_active
      ) as cheapest
     where i.id = old.influencer_id;
  end if;

  -- Return value is ignored for AFTER triggers; NULL is the convention.
  return null;
end;
$$;

drop trigger if exists packages_maintain_starting_price on public.packages;
create trigger packages_maintain_starting_price
  after insert or update or delete on public.packages
  for each row execute function public.maintain_starting_price();

-- Recompute every existing creator once, so applying this to a database that was
-- seeded before the trigger existed still lands on the correct value rather than
-- only being correct for future writes.
do $$
declare
  mismatched integer;
begin
  update public.influencers i
     set starting_price = coalesce(
           (select min(p.price) from public.packages p
             where p.influencer_id = i.id and p.is_active), 0)
   where i.starting_price is distinct from coalesce(
           (select min(p.price) from public.packages p
             where p.influencer_id = i.id and p.is_active), 0);

  get diagnostics mismatched = row_count;
  if mismatched > 0 then
    raise notice 'starting_price recomputed for % creator(s)', mismatched;
  end if;
end;
$$;

-- ------------------------------------------------------------------ 4. indexes
-- The catalog filters on category and city and sorts on followers, rating, and
-- starting_price, and the price insight reads category_id with starting_price.
-- These are the indexes that make those paths an index scan instead of a sort over
-- the whole table; at a dozen creators none of it matters, which is exactly why it
-- is worth adding before the table grows rather than after.
create index if not exists influencers_category_id_idx  on public.influencers (category_id);
create index if not exists influencers_city_idx        on public.influencers (city);
create index if not exists influencers_verified_idx     on public.influencers (verified);
create index if not exists influencers_rating_idx       on public.influencers (rating desc);
create index if not exists influencers_followers_idx    on public.influencers (followers desc);
create index if not exists influencers_starting_price_idx on public.influencers (starting_price);

-- The recompute trigger runs min(price) filtered by is_active for one creator on
-- every package write, so this is the index it actually depends on.
create index if not exists packages_influencer_active_idx
  on public.packages (influencer_id, is_active, price);