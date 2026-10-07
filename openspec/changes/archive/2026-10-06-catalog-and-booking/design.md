# Design

## Context

See `proposal.md` — Why. Current state, verified against the repo and the remote schema dump:

- `lib/db.ts` creates the SQLite schema on import using `node:sqlite`. `lib/data.ts` is hand-written SQL against it: `getInfluencers`, `getInfluencerById`, `getPackagesByInfluencer`, `getReviewsForInfluencer`, `getRecommendedInfluencers`, `getPriceStats`, `getCategories`, `getCities`, `getLandingStats`, and the booking reads. `scripts/seed.ts` populates `data.db` through `npm run db:seed`.
- Three column-level disagreements between that SQLite schema and Postgres, all confirmed in `supabase/migrations/20261002100608_remote_schema.sql`:
  - `influencers.niche` is free text in SQLite; Postgres has `category_id bigint NOT NULL` with `influencers_category_id_fkey REFERENCES categories(id) ON DELETE RESTRICT`. `umkms` has the same shape.
  - `influencers.base_price` in SQLite becomes `starting_price integer` in Postgres, made `NOT NULL` by `rls-access-control`.
  - `influencers.color text` exists only in SQLite. Postgres has no such column.
- `color` holds a Tailwind class string such as `bg-orange-100 text-orange-700`, consumed at `lib/data.ts:44`, `:237`, and `:567` and rendered by `app/(umkm)/dashboard/page.tsx:100` and `app/page.tsx:83`.
- Every column is granted to `anon` and `authenticated` for all verbs (`GRANT DELETE, INSERT, ... TO "anon", "authenticated"`), so the refusal of writes comes entirely from RLS having no write policy — which is the state `rls-access-control` leaves in place.
- `utils/supabase/server.ts` already provides a user-scoped server client bound to the request cookies, and `utils/supabase/client.ts` a browser client. **No service-role client exists** — one has to be added for writes.
- Foreign keys exist for `influencers.category_id`, `umkms.category_id`, and `packages.influencer_id`, so PostgREST can serve `categories(*)` and `packages(*)` as embedded resources.
- `packages` already carries `includes jsonb NOT NULL DEFAULT '[]'`, `revision_quota integer NOT NULL` with `packages_revision_quota_check CHECK (revision_quota >= 1 AND revision_quota <= 5)`, `estimated_days`, and `is_active boolean NOT NULL DEFAULT true`. No `updated_at` trigger exists despite the column being present.
- `bookings` already holds every snapshot column submission needs: `code text NOT NULL UNIQUE`, `umkm_id`, `influencer_id`, `package_id`, `package_name`, `amount`, `revision_quota`, `estimated_days`, `brief text NOT NULL`, and `status booking_status NOT NULL DEFAULT 'PENDING'`.
- `dashboard/influencer/paket/page.tsx` is the existing package management screen and reads SQLite.
- `no zod` — no validation library is installed.

## Goals / Non-Goals

**Goals:**
- Every catalog page reads through the Supabase client so the policies from `rls-access-control` are on the real request path, not only in tests.
- Booking submission writes real rows with real validation, snapshotted from the package.
- `starting_price` has a writer, so the price filter and price insight mean something.

**Non-Goals:**
- No booking status transitions, payments, revision handling, or reviews. `bookings.status` stays `PENDING` after this change.
- No chat interface. A conversation row is created because `conversations.booking_id` is `UNIQUE` and every booking needs exactly one, not because a message screen exists.
- No profile editing beyond what `auth-session` already provides.
- No pagination, infinite scroll, or full-text search index.
- No notification when a request arrives, even though `notifications` has a row type for it. Notifications are a deferred capability.
- No change to any page URL.

## Decisions

1. **Reads and writes use two different clients, and the direction never reverses.**
   Reads go through the existing user-scoped server client, so RLS decides what comes back. Writes go through a new service-role client, because `rls-access-control` deliberately grants no write policy and the publishable key therefore cannot write at all.
   The dangerous mistake available here is using the service-role client for a read because it is convenient. That silently bypasses every policy, and the resulting bug is invisible: the page renders, just with rows the caller should not see. So `createAdminClient()` is used only inside Server Actions, never in a page or a component.
   *Alternative:* add per-user INSERT/UPDATE policies so the publishable key could write — rejected, DEVELOPMENT.md §8 places that in a later hardening phase, and it would put the row-level rules for booking creation in the same place as the read rules, where they are harder to audit as a set.

2. **`createAdminClient()` reads a non-public environment variable and is marked `server-only`.**
   The variable is `SUPABASE_SERVICE_ROLE_KEY`, with no `NEXT_PUBLIC_` prefix, so Next.js cannot inline it into the client bundle even by accident. The module also imports `server-only`, which turns a mistaken import from a component into a build error rather than a runtime leak.
   *Alternative:* reusing the publishable key with elevated grants — rejected, there are no such grants.

3. **Every write action authorizes in application code, because the service role bypasses the policies.**
   Each Server Action begins with `requireRole()` from `auth-session` and then verifies the specific relationship it is about to write: that the package belongs to the caller, that the addressed creator is not the caller, that the target booking names the caller as a party. The database would refuse these writes if it could see the caller; it cannot, so the action is the enforcement point. This is the split recorded as D1b — the application owns authorization, Postgres owns invariants.
   *Alternative:* switching to a per-request client that impersonates the user for writes — rejected, it adds a second identity path to get right for a rule the action can already express in three lines.

4. **The creator palette is derived from the category in application code, and the per-creator `color` column is dropped.**
   A Tailwind class string stored in a database does not work. Tailwind scans source files for class names, so a class that only ever exists in a database row is never generated, and the avatar renders with no styling at all. The palette therefore lives in a source file as literal class strings, keyed by category, and the `color` field leaves `Influencer`.
   Keying by category rather than by creator id is what makes the choice "reasoned" rather than arbitrary: creators in one niche share a warm or cool family, and the mapping stays stable when rows are added or reordered.
   *Alternative:* store the class in Postgres and add it to a safelist — rejected, that couples stored data to the styling system and reintroduces the purge problem. *Alternative:* hash the id to pick from the palette — works, but the grouping then carries no meaning.

5. **Category and packages are read as embedded resources rather than separate round trips.**
   `influencers_category_id_fkey` and `packages_influencer_id_fkey` exist, so PostgREST can serve `select=*,categories(*),packages(*)` in one request. The creator list therefore costs one query rather than one per creator, and a creator's public page costs two — the profile with its category and packages, then its reviews by `reviewee_influencer_id`.
   This only works because `rls-access-control` added the reviewee columns. Reading reviews the old way, through `bookings`, is blocked by the party-scope policy on `bookings`.
   *Alternative:* separate queries joined in application code — rejected, it multiplies round trips by the page size for no benefit.

6. **`starting_price` is maintained by a database trigger, `NOT NULL DEFAULT 0`, and the last active package cannot be deactivated.**
   `rls-access-control` made the column `NOT NULL` and backfilled it, but left the maintenance to whoever introduced package editing. That is this change.
   The trigger recomputes the creator's `starting_price` as the minimum price across their active packages after any insert, update, or deactivate. Zero is the sentinel for "this creator has no package yet", which is what a creator who just finished onboarding looks like; the catalog renders that as "belum ada paket" and excludes it from the price filter and from price insight, so a sentinel never becomes a real price.
   Deactivating the last active package is refused with a clear message. Without that rule a creator could reach the same zero state after having had packages, and the catalog would silently stop listing them with no explanation.
   *Alternative:* let `starting_price` go nullable and treat null as absent — rejected, it reverts a decision `rls-access-control` already made and gives every catalog query a null branch.
   *Alternative:* maintain it in application code after each package write — rejected, it is one invariant that three different actions must each remember, and a forgotten update leaves the price filter quietly wrong.

7. **Booking submission writes the booking, then the conversation, and the missing atomicity is accepted deliberately.**
   `conversations.booking_id` is `UNIQUE`, so a booking and its conversation are a one-to-one pair that must both exist. Two statements from a Server Action cannot be one transaction, because the Supabase client issues each separately.
   The gap is acceptable here for a specific reason rather than by oversight: nothing reads `conversations` yet, because chat is deferred and `rls-access-control` left the table policy-less. A booking that exists without its conversation row is invisible and harmless, and the chat change can create any missing row on first use. The same argument does not hold for onboarding, where the missing row is a profile the user is waiting on.
   If chat ever needs the pair to be guaranteed at submission time, a Postgres function doing both inserts is the fix, and the two inserts are already the whole body of it.

8. **The brief is validated in the action at 50 to 2000 characters, with the requirement stated as "the minimum the system accepts" rather than a fixed number in the spec.**
   `bookings.brief` is `text NOT NULL` with no length constraint, so the bound has to live in the action. A floor keeps a request from being a one-word placeholder; a ceiling keeps a pasted document out of a field meant for a short brief.
   The spec deliberately does not name the number, because the number is a tuning decision an implementer may reasonably adjust without changing any promised behaviour.

9. **Search escapes wildcard characters before building the pattern.**
   The query is `or=(name.ilike.*term*,handle.ilike.*term*)`. A term containing `%` or `_` would otherwise become a wildcard and return rows the visitor did not search for, so both are escaped and `\` is used to neutralise them.
   *Alternative:* Postgres full-text search — rejected, the corpus is a dozen creators and a second language configuration is not worth carrying.

10. **Recommendations are assembled in application code from two small queries, because the result has to explain itself.**
    The spec requires each recommendation to show the reason it matched. That is awkward to express in SQL and trivial in application code: fetch creators in the business's category, fetch creators in its city, merge by creator id preferring the category match, sort by rating then follower count as the tiebreak, and attach the reason to each row.
    It is two indexed queries against a table with public read, not a ranking problem.
    *Alternative:* a SQL view with a computed score — rejected, it moves the tiebreak rule into the database where it cannot be read alongside the reason string, for no gain at this size.

11. **Price insight is computed in application code from one fetch of the pairs.**
    Minimum, average, and maximum over `(category_id, starting_price)` for the whole catalog is a few hundred rows. Fetching it once and reducing it in JavaScript is one round trip instead of three, and it shares the single definition of "a creator that actually has a price" with the price filter, so the two cannot disagree.
    *Alternative:* three aggregate queries, or a Postgres view — rejected, three round trips for arithmetic the client can do, and a second definition of the same rule.

12. **`lib/data.ts` is split into `lib/data/catalog.ts` and `lib/data/bookings.ts`, and the SQLite versions are deleted.**
    Keeping both would leave two answers to every question about where a page's data comes from, and the SQLite one would keep compiling while quietly going stale. Deleting them means the first page that still imports the old module fails the build instead of rendering yesterday's data.
    *Alternative:* rewrite in place — rejected, the file mixes two unrelated domains and this change is where that split becomes obvious.

13. **The creator list is capped, not paginated, and the cap is stated rather than implied.**
    A hard limit of 200 creators with the filter applied before the limit, so the cap never changes which creators match, only how many are shown at once. At the seeded scale the cap is never reached; it exists so a careless filter cannot ask PostgREST for an unbounded result.
    *Alternative:* real pagination now — rejected, it adds a control and a query shape for a list that fits on one screen, and the decision is cheap to revisit once a creator count justifies it.

14. **Cities are compared exactly, with no normalisation.**
    `influencers.city` and `umkms.city` are both free text with no reference table. The filter options come from `SELECT DISTINCT city`, and selection compares the string exactly, so `"Bandung"` and `"bandung"` are two different options. This is honest about the current schema rather than pretending to more than it does; the reference-table alternative is recorded below.
    *Alternative:* case-insensitive matching — rejected as a half-measure, since it fixes case and leaves trailing whitespace and abbreviations splitting buckets just the same, while giving the illusion the data is clean.

## Risks / Trade-offs

- [The service-role client bypasses RLS, so an action that forgets its ownership check writes something it should not] → Every write action starts from `requireRole()` and states the relationship it verifies in the task that implements it. The build fails if `createAdminClient` is imported outside `app/actions.ts`, and the integration task re-checks a cross-tenant write by hand.
- [`starting_price` is denormalized, so any writer that bypasses the trigger leaves it wrong] → The trigger is the only sanctioned writer, `is_active` rather than deletion is the way packages are retired, and the integration task asserts the column against a recomputed minimum after every kind of package change.
- [Two-party reads are exercised only where a page actually asks for them] → The catalog pages are public, so a mistake in the trigger or the embed shape shows up on the landing page immediately. The party-scoped reads are verified in change 4, where bookings are actually fetched.
- [Dropping `color` changes how every creator avatar looks] → The palette is derived per category, so the variation the seeded data had is replaced by grouped variation. That is a visual change to seeded content, not a functional one, and it is reversible by reordering the palette map.
- [The brief length bound lives only in the action, so a direct database insert can bypass it] → `brief` is `text NOT NULL`, and direct inserts are not a supported path: the browser key cannot write and the service-role client is only imported by actions. Recorded so that a future capability adding another writer also adds the bound.
- [Conversation rows can be missing because the two writes are not atomic] → Nothing reads them yet, and the chat change creates any missing row on first use. Called out in decision 7 so it is revisited when it starts to matter rather than discovered then.
- [The category embed depends on the foreign key existing] → `influencers_category_id_fkey` and `packages_influencer_id_fkey` are both in the applied schema, and `rls-access-control` leaves the dump untouched, so the embed is stable. A creator-list query that returned rows without their category would be the visible symptom.

## Migration Plan

1. Add `supabase/migrations/<new>.sql` containing the `starting_price` maintenance trigger, the `NOT NULL DEFAULT 0` tightening if `rls-access-control` has not already applied it, and indexes for the new filter and sort columns: `influencers(verified)`, `influencers(rating)`, `influencers(followers)`, `influencers(starting_price)`.
2. Add `utils/supabase/admin.ts` with the service-role client and add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`, keeping it out of any `NEXT_PUBLIC_` name.
3. Add `lib/data/catalog.ts` and port the six catalog reads, then repoint `app/influencers/page.tsx`, `app/influencers/[id]/page.tsx`, `app/insights/page.tsx`, `app/page.tsx`, and the recommendation block on the UMKM dashboard.
4. Add the package actions and repoint `dashboard/influencer/paket/page.tsx`, then remove the SQLite package reads.
5. Add the booking submission action and repoint `app/booking/[influencerId]/page.tsx` and the two history pages.
6. Delete `lib/data.ts` and the SQLite catalog tables, so nothing can read the old layer.
7. Rollback is a revert of steps 1 through 6. The trigger drops cleanly; `starting_price` returns to nullable only if step 1 tightened it, and the deleted SQLite layer is restored by `npm run db:seed`.

## Open Questions

- Should `city` become a reference table the way `category_id` already is? Both `influencers.city` and `umkms.city` are free text, so the city filter compares strings and the option list can contain near-duplicates. Answering it changes no requirement in either capability here.
- Should the price filter have a floor as well as a ceiling? The spec promises a maximum only, because a floor is a budgeting aid rather than a discovery aid, and a business that knows its budget can sort by lowest price instead.
- Should the creator list cap of 200 be surfaced to the visitor when it is reached? At the seeded scale it never is, and a "showing the first 200" notice is the kind of thing that is easy to add later and looks broken if it appears when unnecessary.
