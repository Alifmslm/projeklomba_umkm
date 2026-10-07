# Proposal

## Why

The catalog is the only part of Kolab.id that works today, and it is the part with no future. Every read in `lib/data.ts` runs against the SQLite schema that `lib/db.ts` creates on import, and that schema disagrees with the Postgres one in three places that matter: creators are filtered by a free-text `niche` where Postgres has a `category_id` foreign key, prices are read from `base_price` where Postgres has `starting_price`, and each creator carries a Tailwind class string in a `color` column that Postgres does not have at all. Booking submission is a Server Action that inserts into SQLite with hardcoded values and no validation of the brief, the package, or the caller. Nothing in the app reads or writes Postgres, so the policies `rls-access-control` just added have no queries to apply to.

## What Changes

- Split `lib/data.ts` into catalog reads and booking reads and move the catalog onto the Supabase server client, so every page reads through the policies that now exist instead of around them.
- Replace the `niche` filter with a join to `categories`, and `base_price` with `starting_price`.
- Drop the per-creator `color` column in favour of a palette derived from the creator's category in application code, because a class string held in the database is invisible to Tailwind's scanner and would render unstyled.
- Creator list: text search across name and handle, filters for category, city, and maximum starting price, and sorting by popularity, price, and rating.
- Creator detail: the profile, the creator's active packages with their terms, and the reviews written by UMKM, read through the `reviews.reviewee_influencer_id` column that `rls-access-control` added.
- Creator recommendation for a signed-in UMKM, matched on the business's own category and city and ordered by fit rather than follower count.
- Market price insight per category, computed from `starting_price`.
- Creator package management: create, edit, and deactivate packages, with a database trigger keeping `starting_price` equal to the cheapest active package. This is the writer that `rls-access-control` deliberately left out.
- Real booking submission: validate the caller, the package, and the brief, snapshot the package's terms onto the booking, and open exactly one conversation for it.

## Capabilities

### New Capabilities

- `creator-catalog`: how anyone browses creators without an account — searching, filtering, sorting, viewing a creator's packages and reviews, seeing market price insight per category — and how a creator maintains the packages those pages offer.
- `booking-request`: how a signed-in UMKM submits a collaboration request from a creator's page, what the system records at that moment, and what it refuses.

### Modified Capabilities

- None. `reach-roi-estimate` already requires engagement rate to be stored and used per creator, and `frontend-pages` already fixes the set of pages and their responsive behaviour; this change changes where the data comes from, not what those requirements say.

## Impact

- `lib/data.ts` — split and ported; `getInfluencers`, `getInfluencerById`, `getInfluencerReviews`, `getRecommendedInfluencers`, `getPriceStats`, `getCategories`, `getCities` move to the Supabase client, while the SQLite versions are deleted rather than left to drift
- `lib/types.ts` — `BookingStatus` widened from the four prototype values to the nine states of the Postgres enum; the `color` field removed from the creator type; catalog types reshaped around `category` as an object rather than a string
- `app/actions.ts` — the mock booking action replaced by a validated submission action; package create, edit, and deactivate actions added
- `app/insights/page.tsx`, `app/influencers/page.tsx`, `app/influencers/[id]/page.tsx`, `app/page.tsx` — read through the new data layer
- `components/*` — the `Avatar` and creator-card components take a derived palette instead of a stored class
- `lib/seed.ts` and `supabase/seed.sql` — the SQLite seed stops being the source of truth for catalog reads
- `supabase/migrations/<new>.sql` — the `starting_price` maintenance trigger, and the indexes for the new filter and sort columns
- No page URL changes, and no change to the seeded catalog's content.

## Notes for the reviewer

- `engagement_rate` and `starting_price NOT NULL` arrive from `rls-access-control`. This change is the first to read them, and the first to write `starting_price`.
- The `reviews` list could not be built without the reviewee columns that `rls-access-control` added, because reading a creator's reviews through `bookings` is blocked by the party-scope policy on `bookings`.
- Creator package management is in scope here rather than deferred because `starting_price` is `NOT NULL` and denormalized. Shipping the catalog without a writer for it would leave the price filter correct only until the first seed reload.
