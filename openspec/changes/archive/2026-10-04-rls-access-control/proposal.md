# Proposal

## Why

The Postgres schema for Kolab.id is already applied to the remote Supabase project — 17 tables, 9 enums wired to real columns, a role/status link check on `profiles`, and an `ensure_rls` event trigger that auto-enables RLS on any new table. It has **zero RLS policies**. Because RLS is enabled with no policy, PostgREST and the `@supabase/ssr` server client return nothing for every table — which is the exact read path DEVELOPMENT.md §8 and §10 prescribe. Nothing in the app reads Postgres yet (it still runs on SQLite via `lib/db.ts`), so the gap is invisible today, but no backend capability can be built or verified on top of a database that denies every read.

Two schema gaps also block capability that already exists: `influencers.engagement_rate` is absent, violating the existing `reach-roi-estimate` requirement that engagement rate be stored and used, and `starting_price` is nullable while the catalog queries (`/insights` min/avg/max, the `Cari Kreator` price filter, creator recommendation scoring) assume it is not.

## What Changes

- Add the baseline RLS policy set for the 11 tables the MVP core touches, in three groups: public read for the catalog (`categories`, `influencers`, `packages`, `umkms`, `reviews`), own-row read for `profiles`, and party-scoped read for booking-owned tables (`bookings`, `deliveries`, `revision_requests`, `payments`, `booking_events`).
- Deliberately leave the 6 deferred tables (`conversations`, `messages`, `disputes`, `dispute_infos`, `resolution_offers`, `notifications`) with RLS enabled and no policy. Nothing queries them until their capabilities land.
- Add `influencers.engagement_rate numeric(4,3) NOT NULL DEFAULT 0.035`, closing the gap against the `reach-roi-estimate` requirement that already exists.
- Make `influencers.starting_price` NOT NULL, backfilled from each creator's cheapest package, so catalog aggregates and price filters have a defined input.
- Add indexes covering the party-scope subquery path and the status/date filters the booking history and dispute queue pages will use.
- Add `supabase/seed.sql`, which `config.toml` already references at `[db.seed] sql_paths` but which does not exist, and add the missing `db:migrate` and `db:types` npm scripts that DEVELOPMENT.md §4 documents.

## Capabilities

### New Capabilities

- `rls-access-control`: which rows each role may read — public catalog reads, own-profile reads, and party-scoped reads of a booking together with its deliveries, revision requests, payment record, and event timeline.

### Modified Capabilities

- None. `reach-roi-estimate` already requires engagement rate to be stored and used per creator; this change makes the Postgres schema satisfy that requirement rather than changing it, so no delta is needed.

## Impact

- `supabase/migrations/<timestamp>_rls_baseline.sql` (new) — policies, indexes, `engagement_rate`, `starting_price` NOT NULL + backfill
- `supabase/seed.sql` (new) — minimal rows covering every policy so each access path can be verified
- `package.json` — adds `db:migrate` and `db:types`
- No application code. `lib/db.ts`, `lib/data.ts`, `lib/auth.ts`, `lib/estimate.ts`, and everything under `app/` and `components/` are untouched; the app keeps serving from SQLite until a later change ports the data layer. This change is not user-visible.
- The existing migration `20261002100608_remote_schema.sql` is left as-is, so the diff against the remote project stays reviewable as one additive file.