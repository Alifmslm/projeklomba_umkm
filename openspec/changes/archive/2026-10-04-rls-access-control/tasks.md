# Tasks

## 1. Tooling prerequisites

- [x] 1.1 Add `db:migrate` and `db:types` scripts to `package.json` matching DEVELOPMENT.md §4, generating types to `utils/supabase/database.types.ts` rather than the `lib/supabase/` path the doc names, and verify `npm run` lists both and that `supabase db push --help` resolves
- [x] 1.2 Correct the DEVELOPMENT.md §4 and §10 references from `lib/supabase/` to `utils/supabase/`, so the generated-types path and the documented server-client path match the files that actually exist, and verify no other `lib/supabase/` reference remains in the docs

## 2. Schema repairs

- [x] 2.1 Add nullable `reviews.reviewee_umkm_id` (FK to `umkms`) and `reviews.reviewee_influencer_id` (FK to `influencers`) in the new migration, and verify `information_schema.columns` reports both for `public.reviews`
- [x] 2.2 Backfill the two new `reviews` columns from the booking (`reviewer_role = 'umkm'` sets `reviewee_influencer_id`, `reviewer_role = 'influencer'` sets `reviewee_umkm_id`), then add `check (num_nonnulls(reviewee_umkm_id, reviewee_influencer_id) = 1)`, and verify no row has both columns null and that inserting a row with both null is rejected
- [x] 2.3 Add `influencers.engagement_rate numeric(4,3) NOT NULL DEFAULT 0.035`, and verify the column default equals `DEFAULT_ENGAGEMENT_RATE` in `lib/estimate.ts` so the `reach-roi-estimate` default-fallback scenario holds at the storage layer
- [x] 2.4 Backfill `influencers.starting_price` from each creator's cheapest `packages.price`, asserting first that every creator has at least one package and failing loudly if not, then `SET NOT NULL`, and verify `SELECT count(*) FROM influencers WHERE starting_price IS NULL` returns 0

## 3. Indexes

- [x] 3.1 Create the access-path indexes with `IF NOT EXISTS`: `bookings(umkm_id)`, `bookings(influencer_id)`, `bookings(status)`, `packages(influencer_id)`, `reviews(reviewee_influencer_id)`, `reviews(reviewee_umkm_id)`, `influencers(category_id)`, `influencers(city)`, and verify all eight appear in `pg_indexes`
- [x] 3.2 Run `EXPLAIN` on the party-scope predicate from design decision 2 against `bookings` and confirm it resolves through an index rather than a sequential scan, and verify the plan output is captured in the change notes

## 4. Policies

- [x] 4.1 Add public-read policies on `categories`, `influencers`, `packages`, `umkms`, and `reviews`, each wrapped in a `pg_policies` existence guard so the migration is re-runnable, and verify that a signed-out request returns seeded rows for all five
- [x] 4.2 Add the own-row read policy on `profiles` (`auth.uid() = user_id`), and verify a user reads their own profile while a request for another user's profile returns no rows
- [x] 4.3 Add the party-scoped read policy on `bookings` using the `profiles` subquery from design decision 2, and verify that each of the four callers in the spec delta gets the expected result: own party returns the booking, an unrelated signed-in user gets no rows, a signed-out visitor gets no rows, and an `admin`-role user who is not a party gets no rows
- [x] 4.4 Add party-scoped read policies on `deliveries`, `revision_requests`, `payments`, and `booking_events`, each resolving the caller to a booking through `bookings`, and verify that requesting each child record directly by identifier as an unrelated signed-in user returns no rows
- [x] 4.5 Verify aggregate behaviour under RLS by comparing `SELECT count(*) FROM umkms` as a signed-out caller against the service-role total, and verify the two are equal
- [x] 4.6 Verify the browser key cannot write: attempt an `INSERT` into `bookings`, an `UPDATE` of a booking status, and an `INSERT` into `reviews` using the publishable key, and verify each is rejected and that no row changed
- [x] 4.7 Confirm the six deferred tables (`conversations`, `messages`, `disputes`, `dispute_infos`, `resolution_offers`, `notifications`) still have RLS enabled and zero policies after the migration, and verify the count in `pg_policies` is unchanged for those tables
- [x] 4.8 Update DEVELOPMENT.md §8 to state that the baseline policies are applied and to name the six deliberately policy-less tables, replacing the current "enable RLS policies before launch" instruction, and verify the section no longer describes the policies as pending

## 5. Seed

- [x] 5.1 Create `supabase/seed.sql` at the path `config.toml` already references, covering exactly the rows the policy assertions need: categories, creators with `engagement_rate`, packages, UMKM, two bookings with different parties, and their reviews, and verify it runs against a freshly reset database
- [x] 5.2 Make the seed repeatable by resetting the seeded tables before inserting, and verify that running it twice in a row leaves identical row counts and identical `engagement_rate` and `starting_price` values

## 6. Integration checks

- [x] 6.1 Apply the migration and seed to a clean scratch project and re-run the full assertion set from tasks 4.1 through 4.7, and verify every assertion passes from `supabase db reset` with no manual repair step
- [x] 6.2 Run `npm run lint` and `npm run build` and verify both pass, confirming no file under `app/`, `components/`, or `lib/` was modified by this change
- [x] 6.3 Run `openspec validate rls-access-control --strict` and verify the change and its spec delta validate with no findings