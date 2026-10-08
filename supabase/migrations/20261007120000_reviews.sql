-- Reviews: the rating rollup, the immutability guard, and the public read view.
--
-- Three rules, all in the database because they are invariants rather than
-- application behaviour:
--   1. `influencers.rating` and `review_count` are derived from the reviews
--      written about that creator and recomputed on every insert. No application
--      code writes them.
--   2. A recorded review can never be changed or removed, so the number above
--      can never drift.
--   3. A creator's reviews, and the name of the business that wrote each one, are
--      readable by anyone. The author's identity lives on the booking, which is
--      party-scoped, so a view resolves that link in one place and exposes only
--      data that is public anyway (the review and the business profile).
--
-- See openspec/changes/reviews/.

-- ------------------------------------------------------------- 1. the rollup --
--
-- Recompute, never increment. `round(avg, 1)` is required because
-- `influencers.rating` is `numeric(2,1)`; an unrounded average would fail the
-- insert. Recomputing is idempotent and avoids the arithmetic error that
-- increment-plus-divide produces on the second review.
create or replace function public.sync_influencer_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reviewee_influencer_id is not null then
    update public.influencers i
       set rating = coalesce(
             (select round(avg(r.rating)::numeric, 1)
                from public.reviews r
               where r.reviewee_influencer_id = new.reviewee_influencer_id), 0),
           review_count = (
             select count(*)
               from public.reviews r
              where r.reviewee_influencer_id = new.reviewee_influencer_id)
     where i.id = new.reviewee_influencer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_rollup on public.reviews;
create trigger reviews_rollup
  after insert on public.reviews
  for each row execute function public.sync_influencer_rating();

-- -------------------------------------------------------- 2. immutability --
--
-- The rollup only listens for inserts. Without this guard an update or a delete
-- would leave the creator's summary stale with nothing to correct it, so the
-- table stops being mutable. This mirrors the `bookings.status` guard in
-- `20261006120000_booking_lifecycle.sql`: where a denormalized value depends on
-- a table's contents, that table stops being writable by ordinary means.
--
-- The one exception is the `ON DELETE CASCADE` from `bookings` (design decision
-- 7). When a booking is deleted, Postgres removes the parent row first and then
-- cascades to the reviews; at that point `bookings.id = old.booking_id` no
-- longer exists, which is how the guard tells the cascade apart from a direct
-- delete. The cascade is allowed to proceed (leaving the rating high, as
-- decision 7 records and accepts); a direct delete, or a delete while the
-- booking still exists, is refused. No capability deletes a booking today.
create or replace function public.guard_review_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE'
     and not exists (select 1 from public.bookings where id = old.booking_id)
  then
    return old;
  end if;

  raise exception 'Ulasan tidak bisa diubah atau dihapus setelah dikirim'
    using errcode = 'check_violation';
end;
$$;

drop trigger if exists reviews_immutable on public.reviews;
create trigger reviews_immutable
  before update or delete on public.reviews
  for each row execute function public.guard_review_immutable();

-- -------------------------------------------------------------- 3. backfill --
--
-- Rows seeded before this migration predate the trigger; recompute every creator
-- so the summary matches the reviews from the first request onwards. A creator
-- with no reviews is set to 0 / 0.
update public.influencers i
   set review_count = t.total,
       rating       = t.mean
  from (
    select i2.id,
           count(r.id) as total,
           coalesce(round(avg(r.rating)::numeric, 1), 0) as mean
      from public.influencers i2
      left join public.reviews r on r.reviewee_influencer_id = i2.id
     group by i2.id
  ) t
 where i.id = t.id;

-- ------------------------------------------------- 4. public read + author --
--
-- A creator's public page must list the reviews written about them and the name
-- of the business that wrote each one, to a visitor with no session. Review rows
-- are public and `umkms` is public, but which business wrote a review is only
-- recorded on `bookings`, which is party-scoped. This view resolves that link
-- once, for everyone.
--
-- `security_invoker = false` (the default, stated for clarity) makes the view run
-- with its owner's rights, which is what lets it read the booking link. It is
-- read-only: no application code writes through it, and every column is either a
-- public review field or a public business field.
create or replace view public.influencer_reviews
with (security_invoker = false)
as
select
  r.id                     as review_id,
  r.booking_id             as booking_id,
  r.rating                 as rating,
  r.comment                as comment,
  r.created_at             as created_at,
  r.reviewer_role          as reviewer_role,
  r.reviewee_umkm_id       as reviewee_umkm_id,
  r.reviewee_influencer_id as influencer_id,
  b.umkm_id                as author_umkm_id,
  u.name                   as author_name,
  u.owner                  as author_owner,
  c.slug                   as author_category_slug,
  u.city                   as author_city,
  b.package_name           as package_name
from public.reviews r
join public.bookings b on b.id = r.booking_id
join public.umkms u on u.id = b.umkm_id
left join public.categories c on c.id = u.category_id
where r.reviewee_influencer_id is not null;

grant select on public.influencer_reviews to anon, authenticated;