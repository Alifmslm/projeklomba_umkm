# Design

## Context

See `proposal.md` — Why. Current state, verified against the repo:

- `supabase/migrations/20261002100608_remote_schema.sql` (903 lines) is a schema dump pulled from the remote project. It creates 17 tables and 9 enums, then wires the enums onto real columns through `ALTER TABLE ... ADD COLUMN` (lines 274-377). `profiles.role` already carries a `profiles_role_link_chk` check that ties the role to exactly one of `umkm_id` / `influencer_id`, and an `ensure_rls` event trigger auto-enables RLS on every new table.
- That same file contains **no `CREATE POLICY`, no `CREATE INDEX`, and no trigger other than the event trigger**. All 17 tables have RLS enabled with nothing granted.
- The app still reads SQLite: `lib/db.ts` opens `data.db` with `node:sqlite` and runs `CREATE TABLE IF NOT EXISTS` on import; `lib/data.ts` is hand-written SQL against that schema; `lib/auth.ts` reads a base64 `kolab_session` cookie.
- `utils/supabase/{server,client,middleware}.ts` exist and are wired into `middleware.ts`, but nothing in `app/` imports them.
- Prerequisites are missing: `.env.local` holds literal placeholder values, `config.toml` points `[db.seed] sql_paths` at `./seed.sql` which does not exist, and `package.json` has no `db:migrate` or `db:types` script despite DEVELOPMENT.md §4 listing both.
- `reviews` carries `reviewer_role` and `UNIQUE (booking_id, reviewer_role)` but has no column identifying who was reviewed.

## Goals / Non-Goals

**Goals:**
- A policy set that makes every read path in the spec delta return the right rows for the right caller, and returns nothing for everyone else.
- Schema repairs that existing and upcoming capabilities depend on, applied in one additive migration.
- The changes verifiable with plain SQL, without booting the app.

**Non-Goals:**
- No application code. `lib/*`, `app/**`, `components/**` stay untouched and the app keeps serving from SQLite.
- No write path. Dispute decisions, payment status changes, and every other write stay behind service-role Server Actions, which RLS does not affect.
- No policies for `conversations`, `messages`, `disputes`, `dispute_infos`, `resolution_offers`, `notifications`. Those arrive with their own capability.
- No per-user write policies, no role-based admin read, no `auth.uid()`-scoped INSERT. DEVELOPMENT.md §8 already places these in a later hardening phase.
- No timestamp columns added for the timing rules in ARCHITECTURE.md §2.5. This change enables no clock.

## Decisions

1. **One new additive migration; the pulled remote schema file is not edited.**
   The dump is the only record of what the remote project actually contains, so rewriting it would destroy the diff against reality. All work goes into a new timestamped file after it.
   *Alternative:* amend the existing migration — rejected, it would no longer describe the remote state.

2. **Party scope is a subquery against `profiles`, not a denormalized party list on `bookings`.**
   ```sql
   umkm_id = (select umkm_id from public.profiles where user_id = auth.uid())
     or influencer_id = (select influencer_id from public.profiles where user_id = auth.uid())
   ```
   `profiles.user_id` is the primary key, so the subquery is an index lookup, and `profiles_role_link_chk` already guarantees the two IDs agree with the role — the policy inherits that guarantee for free. It also means a user cannot read a booking by guessing an id.
   *Alternative:* add `party_user_ids uuid[]` to `bookings` for a single indexed comparison — rejected, it duplicates data that `profiles` already owns and needs its own consistency rule.

3. **The same predicate is repeated per booking-owned table, resolved through `bookings`.**
   `deliveries`, `revision_requests`, `payments`, and `booking_events` each resolve the caller to a booking id, then check membership of that booking. The spec calls this out as its own scenario because it is where child-table policies usually leak: authorizing the booking but forgetting the children would expose a creator's payment record to anyone who knew a delivery id.
   *Alternative:* a `SECURITY DEFINER` helper function returning visible booking ids — deferred, since the subquery form is correct and the demo has no query volume that would justify the indirection.

4. **`reviews` gains `reviewee_umkm_id` and `reviewee_influencer_id`, because the public review list cannot be read through `bookings`.**
   This is the one place where the policy set forces a schema change. A creator's reviews can only be found by joining `reviews` to `bookings` to reach `bookings.influencer_id` — and RLS applies to that join, so under the party-scoped `bookings` policy a signed-out visitor would get zero reviews on the creator profile page, silently. Storing the reviewee directly makes `reviews` a standalone public read.
   ```sql
   check (num_nonnulls(reviewee_umkm_id, reviewee_influencer_id) = 1)
   ```
   `DEVELOPMENT.md §8` specified a polymorphic `reviewee_type` + `reviewee_id` pair; two nullable foreign keys are chosen instead because the constraint can then be enforced and indexed. This is the one point where the live schema is weaker than the document.
   *Alternative:* keep the join and accept an empty public review list — rejected, it breaks a requirement in this change's own spec.

5. **`umkms` is public read, including `budget`.**
   `getLandingStats()` in `lib/data.ts:349` computes `COUNT(*)` over `umkms` for the landing page, and RLS constrains aggregates, so a party-scoped policy would report zero UMKM to the public. Public read is also the product-correct posture for a marketplace where a creator needs to see who they are collaborating with.
   Trade-off accepted: `budget` becomes world-readable. No code or spec reads it.
   *Alternative:* drop `budget` from the table — rejected, it is not this change's business and removing a column is harder to undo than exposing one.

6. **An `admin`-role account receives no read access from its role alone.**
   ARCHITECTURE.md §5 gives admins dispute access and DEVELOPMENT.md §8 sketches an admin chat-read policy, but both belong to deferred capabilities. The spec delta states this as a scenario so the absence reads as a decision rather than an oversight.
   *Alternative:* grant admins read on all `bookings` now — rejected, it is a privilege with no capability behind it yet.

7. **The six deferred tables stay RLS-enabled with no policy.**
   This is already their state, so doing nothing is the correct action. It is worth stating because it is also the failure mode in DEVELOPMENT.md §11: an RLS-enabled table with no policy returns `[]` silently, so a future query against them will look like an empty table rather than a permission error.

8. **The browser key stays read-only; no write policy is added.**
   Every table has RLS enabled and none will carry an INSERT, UPDATE, or DELETE policy, so the publishable key cannot write anything. Server Actions use the service-role client, which bypasses RLS entirely.

9. **`influencers.engagement_rate numeric(4,3) NOT NULL DEFAULT 0.035`.**
   The default matches `DEFAULT_ENGAGEMENT_RATE` in `lib/estimate.ts`, so the `reach-roi-estimate` scenario "kreator tidak memiliki nilai engagement rate → gunakan default" holds at the column level. This change makes the schema satisfy a requirement that already exists, which is why `reach-roi-estimate` has no delta.
   `lib/db.ts` already has an additive-migration pattern for this exact column on SQLite (`PRAGMA table_info` then `ALTER TABLE`), which is the precedent for making it NOT NULL with a default rather than nullable.

10. **`influencers.starting_price` becomes NOT NULL, backfilled from the cheapest package.**
    `/insights` (`getPriceStats`), the `Cari Kreator` price filter, and creator recommendation scoring all read this column assuming a value. Nullable would make those aggregates silently drop creators.
    *Alternative:* drop the column and aggregate from `packages.price` — rejected for now, it turns a public uncached page into a two-level aggregate. Keeping it denormalized means a trigger must maintain it when packages change; that trigger belongs to the change that introduces package editing, and until then the seed is the only writer.

11. **Indexes are chosen from the access paths in the spec, not from query guesses.**
    Foreign-key columns get no index automatically in Postgres, so the party-scope comparisons and the catalog joins need them: `bookings(umkm_id)`, `bookings(influencer_id)`, `bookings(status)`, `packages(influencer_id)`, `reviews(reviewee_influencer_id)`, `reviews(reviewee_umkm_id)`, `influencers(category_id)`, `influencers(city)`.
    Stated plainly: at demo seed volume (12 creators, 4 UMKM) none of these change performance. They are here because the party-scope policy runs a correlated subquery per candidate row, and because `bookings` is the one table that grows with usage.
    *Alternative:* defer indexes until the data layer is ported and real query shapes exist — rejected, the policy subquery is already a known shape and it is cheaper to index now than to rediscover later.

12. **Policies are written idempotently because `db:migrate` will be re-run.**
    Postgres has no `CREATE POLICY IF NOT EXISTS`, so each policy is wrapped in a `DO $$ ... IF NOT EXISTS (select 1 from pg_policies where ...) ... $$` guard, and indexes use `CREATE INDEX IF NOT EXISTS`. A partially applied migration must be safe to re-run.

13. **Verification is a set of SQL assertions, not an app smoke test.**
    Because no application code changes, the change is verified by running, as the service role and as each role: catalog counts returning full totals, a booking returned for its own party and empty for an unrelated account, a child record requested directly by id returning empty, and an insert attempt with the publishable key being rejected. `supabase/seed.sql` is written to cover exactly the rows those assertions need — categories, creators, packages, UMKM, two bookings with different parties, and their reviews — and nothing more. Full demo data, including escrow, dispute, and chat fixtures, belongs to the changes that introduce them.

## Risks / Trade-offs

- [The migration cannot be verified against the real remote project from this checkout, because `.env.local` holds placeholder credentials] → Apply and verify against a scratch Supabase project first; `supabase/migrations` is version-controlled so the same file is re-applied to the remote project once its schema is confirmed to match the dump.
- [A table that gains RLS later without a policy returns empty rather than erroring, which reads as "no data"] → Called out in the spec delta and in DEVELOPMENT.md §11; the six deferred tables are named explicitly in the proposal so they are a known state, not a surprise.
- [Denormalized `starting_price` and `influencers.rating` can drift if written directly] → Neither has a maintaining trigger in this change; both writers are seed-only until the package-editing and review capabilities land, and both are listed as trigger work in those changes' tasks.
- [Public `reviews` rows expose `booking_id` to non-parties] → A reviewer can learn that a booking exists and its id, though not its contents, since `bookings` remains party-scoped. Accepted: booking ids are sequential and guessable regardless, and protecting them would require a second table or a column-level policy for no confidentiality gain.
- [Adding a column to `reviews` while the table already has rows] → The change applies to a project whose only rows are seed data, and both new columns are nullable until the check is added, so the order is add columns, backfill, then add the check.

## Migration Plan

1. Add `supabase/migrations/<timestamp>_rls_baseline.sql` containing, in order: the two `reviews` columns and their backfill and check; `engagement_rate`; `starting_price` backfill and `SET NOT NULL`; indexes; then policies.
2. Add `supabase/seed.sql` and the `db:migrate` / `db:types` scripts, and point the seed at the publishable-safe path documented in DEVELOPMENT.md §3.
3. Apply to a scratch project and run the assertion set from decision 13 as each of the three roles.
4. Apply the same file to the remote project with `npm run db:migrate`.
5. Rollback: drop the policies and indexes outright. The column additions are additive and droppable, but `starting_price` requires relaxing `NOT NULL` first, so a rollback is a second migration rather than a single statement.

## Verification Log

Recorded during apply. The change was applied with `supabase db reset` against a
local Postgres 17 stack; `supabase/migrations/20261002100608_remote_schema.sql`
applied cleanly onto an empty database with no preprocessing, which also
establishes that the dump describes a schema that can stand on its own.

### Index resolution (task 3.2)

`EXPLAIN` of the party-scope predicate as an authenticated party, RLS applied:

```
 Bitmap Heap Scan on bookings
   Recheck Cond: ((umkm_id = (InitPlan 3).col1) OR (influencer_id = (InitPlan 4).col1))
   ->  BitmapOr
         ->  Bitmap Index Scan on bookings_umkm_id_idx
               Index Cond: (umkm_id = (InitPlan 3).col1)
         ->  Bitmap Index Scan on bookings_influencer_id_idx
               Index Cond: (influencer_id = (InitPlan 4).col1)
```

`bookings_umkm_id_idx` and `bookings_influencer_id_idx` are both used, through a
`BitmapOr`, so task 3.2 is satisfied: the predicate resolves by index rather than
by a sequential scan of `bookings`. That holds at two rows, which is more than the
task asked for.

Two things the plan exposes, neither a defect but both worth stating:

- The `profiles` subquery was planned as `Seq Scan on profiles` in one run and as
  `Index Scan using profiles_pkey` in another, on the same data. At six profiles
  both are correct and the choice is not stable, so the earlier claim that the
  subquery "is an index lookup" holds structurally - `user_id` is the primary key -
  but is not something to rely on for performance.
- The predicate appears twice, producing four `InitPlan` nodes instead of two,
  because RLS injects its own copy of the policy predicate on top of the one
  written in the query. That duplication is an artefact of mirroring the policy in
  the `EXPLAIN` text; an application query that selects bookings without repeating
  the party filter gets one copy. It does mean the subquery is evaluated more than
  once per execution, which a `STABLE` helper would avoid. Design decision 2
  already deferred that indirection, and at this volume it is not worth it.

### Policy assertions

Run as each role. All passed.

| Check | Result |
| --- | --- |
| Signed out reads `categories` / `influencers` / `packages` / `reviews` | 4 / 4 / 6 / 3 rows |
| Signed out reads `bookings` | 0 rows |
| Signed out `count(*) FROM umkms` equals the service-role total | 4 = 4 |
| Own profile readable, other profiles not | 1 row / 0 rows |
| Party to booking 1 reads it (both the UMKM and the creator) | `KOL-2401-0001` each |
| Party to booking 2 reads it (both the UMKM and the creator) | `KOL-2401-0002` each |
| Signed-in non-party reads `bookings` | 0 rows |
| `admin`-role non-party reads `bookings` | 0 rows |
| Party reads its own booking's `payments` / `deliveries` / `booking_events` | 1 / 1 / 4 |
| Stranger reads the same three tables | 0 / 0 / 0 |
| Stranger fetches a child row directly by id | 0 rows |
| Publishable key `INSERT` into `bookings` | `42501` |
| Publishable key `INSERT` into `reviews` | `42501` |
| Publishable key `UPDATE` of a booking status | no rows matched, nothing changed |
| Publishable key `DELETE` of a booking | no rows matched, nothing changed |
| Six deferred tables still RLS-enabled with zero policies | all six, 0 policies |

The last four rows are worth reading precisely. `INSERT` is refused with a
`42501` error naming the RLS policy. `UPDATE` and `DELETE` are not: PostgREST
reports `200` with an empty body, because Postgres applies the policy to the
`WHERE` clause, matches no row, and reports zero rows affected. The write is
refused either way - booking 1 was still `ACCEPTED` afterwards and no `HACK-1`
row existed - but "rejected" means "changed nothing", not "returned 403".

### Seed repeatability (task 5.2)

Fingerprint of row counts per table, `auth.users`, `auth.identities`,
`engagement_rate` and `starting_price` per creator, and booking code and status.
Three consecutive runs produced byte-identical 164-character fingerprints.

### Two seed fields that are load-bearing

Both were found by a `500 Database error querying schema` on sign-in, whose
message names no column:

- `auth.identities` needs a row per user. GoTrue resolves the password grant
  through `identities`, not `auth.users`.
- `auth.users.confirmation_token`, `email_change`, `email_change_token_current`,
  `email_change_token_new`, `phone_change`, `phone_change_token`,
  `reauthentication_token` and `recovery_token` are nullable in the schema, but
  GoTrue scans the row into plain strings and fails on the first null with
  "converting NULL to string is unsupported". The seed sets them to `''`.

## Open Questions

- Should `city` become a reference table the way `category_id` already is? Both are free text on `influencers` and `umkms` today, so `Cari Kreator`'s city filter compares strings. Deferrable — it changes no requirement in this change.
- Should the landing page's "X+ kolaborasi selesai" (`getLandingStats().doneCount`) survive at all? It aggregates `bookings`, which is party-scoped, so it cannot be public. It needs either a `SECURITY DEFINER` aggregate or removal, and it also still reads the retired `'DONE'` literal rather than `'COMPLETED'`. That call belongs to the change that ports the catalog reads, not here.