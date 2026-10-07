# Tasks

No test runner is installed, so verification here is `npm run lint`, `npm run build`, SQL assertions against the database, and a browser walkthrough of each scenario in the two spec deltas.

## 1. Write plumbing

- [x] 1.1 Add `utils/supabase/admin.ts` exporting `createAdminClient()`, reading `SUPABASE_SERVICE_ROLE_KEY` from an environment variable with no `NEXT_PUBLIC_` prefix, and verify the variable is absent from the client bundle by searching the built output for its value
- [x] 1.2 Import `server-only` in `utils/supabase/admin.ts` and verify that importing it from a component fails the build rather than compiling
- [x] 1.3 Confirm `createAdminClient` is imported only from `app/actions.ts`, and verify a deliberate import from any page or component is rejected by the check in task 1.2
- [x] 1.4 Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and verify the server can reach the database through the admin client while the publishable key still cannot write

## 2. Catalog reads on the user-scoped client

- [x] 2.1 Add `lib/data/catalog.ts` with `getInfluencers(filters)` reading through the user-scoped server client and embedding `categories(*)` and `packages(*)`, and verify a signed-out request returns catalog rows with their category and package names populated
- [x] 2.2 Implement the search across `name` and `handle` using `ilike`, escaping `%`, `_`, and `\` in the term, and verify a search for `a%b` returns only literal matches rather than treating `%` as a wildcard
- [x] 2.3 Implement the category, city, and maximum-price filters so they combine, and verify a creator matching two of three filters is excluded and that the price filter is inclusive at the stated maximum
- [x] 2.4 Implement ordering by follower count, starting price, and rating, placing creators with no rating after those that have one, and verify each ordering on a fixture where the three orders disagree
- [x] 2.5 Apply a 200-creator cap after filtering, and verify the cap never changes which creators match and that a filtered result larger than the cap still returns exactly the cap
- [x] 2.6 Return an empty list rather than an error when filters match nothing, and verify the list page renders its empty state with a way to clear the filters
- [x] 2.7 Replace the SQLite `getInfluencers`, `getInfluencerById`, `getPackagesByInfluencer`, `getReviewsForInfluencer`, `getCategories`, and `getCities` with the Postgres versions and repoint `app/influencers/page.tsx`, `app/influencers/[id]/page.tsx`, and `app/insights/page.tsx`, verifying each page renders the same content it did before the port

## 3. Creator page and reviews

- [x] 3.1 Build the creator's public page from one profile query embedding `categories(*)` and `packages(*)`, and verify it shows bio, category, city, followers, verification, starting price, and rating with review count in two queries total rather than one per package
- [x] 3.2 Read a creator's reviews by `reviewee_influencer_id`, and verify each review shows its rating, comment, and the writing business's name without a join through `bookings`
- [x] 3.3 Render an explicit empty state for a creator with no reviews and verify it is not an error state, and verify a creator with no active packages shows that it has none rather than an empty list

## 4. Palette and types

- [x] 4.1 Add a palette map from category to literal Tailwind class strings in a source file, and verify the built stylesheet actually contains those class names, since a class that appears only in a database row is never generated
- [x] 4.2 Replace the `color` field on the creator type with a derived palette value and update `Avatar` and every consumer at `lib/data.ts:44`, `:237`, and `:567` plus `app/(umkm)/dashboard/page.tsx:100` and `app/page.tsx:83`, verifying no component still reads a stored class
- [x] 4.3 Widen `BookingStatus` in `lib/types.ts` from the four prototype values to the nine states of the `booking_status` enum, and verify every status literal used in `app/` is a member of the enum

## 5. Package management and `starting_price`

- [x] 5.1 Add the `starting_price` maintenance trigger in a new migration so an insert, a price change, an activation, or a deactivation on `packages` recomputes the creator's `starting_price` as the minimum price among their active packages, and verify each of those four operations produces the correct value by querying `influencers.starting_price` afterwards
- [x] 5.2 Ensure a creator who has just onboarded and has no package has a `starting_price` of 0 rather than a null, and verify the column is still `NOT NULL` and that a creator with no packages can be inserted
- [x] 5.3 Refuse deactivating a creator's last active package and report why, and verify the attempt leaves the package active and `starting_price` unchanged
- [x] 5.4 Add package create, edit, activate, and deactivate Server Actions, each authorizing with `requireRole("influencer")` and then verifying the package belongs to the caller, and verify a creator editing another creator's package by identifier is refused and the package is unchanged
- [x] 5.5 Validate the revision quota as an integer from one to five before insert and report a field error otherwise, and verify the same bound holds when the value reaches the database
- [x] 5.6 Validate `includes` as an array of non-empty strings before insert, and verify a non-array value is refused rather than stored
- [x] 5.7 Repoint `dashboard/influencer/paket/page.tsx` at the new actions, and verify a package created there appears on the public creator page and can be used for a request, while a deactivated one disappears from both

## 6. Price insight and recommendations

- [x] 6.1 Implement price insight by fetching `(category_id, starting_price)` once and reducing in application code, and verify the lowest, average, and highest figures match a hand-computed set for a category
- [x] 6.2 Exclude creators whose `starting_price` is 0 from price insight and from the price filter, and verify a creator with no package never appears as the cheapest option in its category
- [x] 6.3 Report that a category has no data rather than showing zeros when no creator in it has a price, and verify the empty state renders
- [x] 6.4 Implement recommendations as two queries — creators in the business's category and creators in its city — merged with the category match preferred, ordered by rating then follower count, each labelled with its reason, and verify a creator matching the category exactly outranks a larger creator from another category
- [x] 6.5 Show the recommendation block only to a signed-in UMKM, verifying a signed-out visitor, a signed-in creator, and an admin each see no recommendation block

## 7. Booking submission

- [x] 7.1 Add a `submitBooking` Server Action that requires the UMKM role, resolves the caller's own business id from `requireRole`, and refuses a caller whose role is creator or admin, and verify no booking row is created in each refused case
- [x] 7.2 In the action, load the chosen package through the admin client and verify it belongs to the creator whose page the request came from and that it is active, refusing otherwise with no booking created
- [x] 7.3 Snapshot `package_name`, `amount`, `revision_quota`, and `estimated_days` onto the booking from the loaded package rather than from anything the browser sent, and verify by submitting with altered values in the request that the stored values still come from the package
- [x] 7.4 Validate the brief as present and between the accepted minimum and maximum lengths, and verify each violation creates no booking and reports the field error
- [x] 7.5 Generate a `code` that does not collide with an existing booking, retrying on a unique violation, and verify two bookings never share a code
- [x] 7.6 Insert the booking in the default `PENDING` state, then insert the conversation for it, and verify the booking row has `status = 'PENDING'`, the brief stored verbatim, and exactly one conversation pointing at it
- [x] 7.7 Show the new request in the sending business's history and the receiving creator's incoming list with the same code, amount, package name, and pending state on both sides, and verify the dashboard counts include it

## 8. Retiring the SQLite layer

- [x] 8.1 Delete `lib/data.ts` and the catalog and booking tables it read, after confirming no file imports it, and verify `npm run build` fails on any remaining import rather than silently compiling against a stale module
- [x] 8.2 Stop `scripts/seed.ts` from being the source of truth for catalog reads and verify the app renders correctly with the SQLite database file absent, so Postgres is demonstrably the only source

## 9. Documentation

- [x] 9.1 Document in DEVELOPMENT.md that reads use the user-scoped client and writes use the service-role client, that `createAdminClient` is forbidden outside `app/actions.ts`, and that `SUPABASE_SERVICE_ROLE_KEY` must never carry a `NEXT_PUBLIC_` prefix, and verify each statement is present
- [x] 9.2 Document the `color`-in-database finding next to the palette map, since it is the kind of thing that gets reintroduced by someone optimising the avatar, and verify the note explains the Tailwind purge rather than just stating the rule

## 10. Integration checks

- [x] 10.1 Walk every scenario in `specs/creator-catalog/spec.md` and `specs/booking-request/spec.md` once against a running dev server, and verify each produces the stated result
- [x] 10.2 Apply the migration to a clean scratch project, run the seed, and verify the catalog renders and a booking can be submitted end to end with no manual repair step
- [x] 10.3 Recompute `starting_price` for every creator with an independent query and compare it against the stored value, and verify the two agree for all creators including those whose cheapest package changed
- [x] 10.4 Run `npm run lint` and `npm run build` and verify both pass with no new warnings
- [x] 10.5 Run `openspec validate catalog-and-booking --strict` and verify the change and both spec deltas validate with no findings
