# Proposal

## Why

The prototype already has a review screen at `app/review/[bookingId]/page.tsx` and `lib/data.ts` rolls a review up into the creator's rating by hand inside `createReview`, which means the rating is correct only if that one code path is the only one that ever runs. The Postgres schema is nearly ready for reviews and the access work is done: `reviews` carries a rating constrained to one through five, an optional comment, `reviewer_role`, and a unique constraint on the booking and reviewer role together, while `influencers.rating` and `review_count` exist as the denormalized summary the catalog sorts and displays. Nothing populates them, and the prototype's four-value `BookingStatus` has no state a review could attach to.

## What Changes

- Let both parties review each other once a request is completed, in either direction, and once per party per request.
- Record the reviewer and the reviewee from the request itself rather than from anything the browser sends, so a review cannot be aimed at the wrong party.
- Replace the hand-written rating rollup with a database trigger that recomputes the creator's rating and review count from the reviews it has actually received, and refuse updates and deletes on reviews so that number cannot drift.
- Show a creator's rating, review count, and received reviews on their public page, using the public read path `rls-access-control` already established.
- Make reviews permanent: no editing and no withdrawing.
- Make no change to a business's own rating, because `umkms` has no rating column and rating businesses is not part of this scope. A business's review of a creator is recorded and visible to both parties but rates nothing.

## Capabilities

### New Capabilities

- `reviews`: who may review whom, when a review becomes possible, what a review records, how a creator's displayed rating comes to reflect it, and the fact that a review cannot be changed afterwards.

### Modified Capabilities

- None. `reach-roi-estimate` covers the estimate shown alongside a creator, not their rating, and `frontend-pages` fixes the page set rather than what a page contains. `creator-catalog` from `catalog-and-booking` already requires that a creator's page list the reviews written about them, so this change fills in a requirement that already exists rather than changing one.

## Impact

- `app/review/[bookingId]/page.tsx` — rewritten against the Supabase client; its four prototype statuses become the completed state plus the dispute path
- `app/actions.ts` — a validated review action replacing `createReview`; the SQLite rating rollup inside it is deleted
- `lib/data.ts` / `lib/data/` — the review reads port to Postgres; the hand-written rating update is removed
- `supabase/migrations/<new>.sql` — the rating rollup trigger and a trigger refusing updates and deletes on `reviews`
- `app/influencers/[id]/page.tsx` and the creator card component — read `rating` and `review_count` from `influencers` rather than averaging on the page
- No page URL changes, and no change to the seeded demo content.

## Notes for the reviewer

- This change depends on two things earlier changes establish: `reviews.reviewee_umkm_id` and `reviews.reviewee_influencer_id`, added by `rls-access-control` so a creator's reviews can be read without passing through the party-scoped `bookings` table; and the completed state, reached through the transition function built by `booking-lifecycle`.
- Reviews opening after a dispute decision is spec'd here even though the dispute capability is deferred, because it is a settled product decision and stating it now means the dispute change does not have to invent it. It is not reachable until that capability exists.
