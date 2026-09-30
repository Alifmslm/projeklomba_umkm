# Design

## Context

See proposal.md (Why) and the three spec deltas for requirements. Current state: `app/globals.css` holds Tailwind v4 with only a `@theme inline` font override; screens style ad-hoc with `slate-*`, `indigo/violet` gradients, and hardcoded radii. `components/` has single-use pieces (Navbar, DashboardShell, InfluencerCard, StatCard, StatusBadge, NotificationBell, BookingHistoryList, UmkmShell). Data layer (`lib/*`, `app/actions.ts`, SQLite) works and stays untouched.

## Goals / Non-Goals

**Goals:**
- One `@theme` token source feeding every screen.
- Shared presentational components behind all three role surfaces.
- Route-by-route page migration with a green build after each step.

**Non-Goals:**
- No Supabase, schema, RLS, auth, or guard changes.
- No new routes, pages (incl. admin build-out), or data shapes.
- No Inter font onboarding (DESIGN_SYSTEM.md lists it; this change ships Plus Jakarta Sans only and records Inter as deferred).

## Decisions

1. **`@theme` for colors/fonts/shadows/ease; built-ins for the rest.** Colors, fonts, shadows, and easing have no usable Tailwind equivalents, so they become `@theme` keys per DESIGN_SYSTEM.md §14. Radius, spacing, and durations map to built-in classes per §16. Alternative (all-custom utilities) was rejected: more CSS to own, worse composition.
2. **Neutral override with a legacy escape hatch.** `@theme` redefines `neutral` as the warm Ink scale; legacy screens keep `slate-*` only until migrated. Alternative (a separate `ink-*` namespace) was rejected: two grays invite permanent drift.
3. **Presentational components, data stays in pages.** New components take props and render; all fetching, guards, and Server Actions stay where they are. Alternative (colocating data in components) was rejected: it would drag `lib/data.ts` and actions into the diff.
4. **Three phases, pages migrated route by route.** Tokens (additive, zero visual change) → components (built beside old ones) → pages switched one route at a time with build+lint per step. Alternative (big-bang rewrite) was rejected: unreviewable diff, no bisect point.
5. **Single-brand cleanup inside the migration.** Off-system hero gradients (`globals.css` indigo/violet/pink helpers) are replaced with blue-tinted equivalents as their screens migrate, not in a separate change.

## Risks / Trade-offs

- [Risk] Warm neutrals shift the feel of every migrated screen → Mitigation: migrate all screens in this change so no mixed state ships.
- [Risk] Overriding Tailwind's `neutral` surprises contributors → Mitigation: DESIGN_SYSTEM.md §16 documents it; lint for stray `slate-*` after migration.
- [Risk] Density regressions on data-heavy screens (riwayat, insights) → Mitigation: keep spacing values 1:1 via the §16 table, eyeball each route before moving on.

## Migration Plan

1. Land `@theme` tokens (no visual change expected; build+lint).
2. Add shared components beside existing ones (unused, build+lint).
3. Migrate routes one by one: public pages → UMKM shell pages → creator pages → login/review/booking/insights; build+lint and visual check each.
4. Remove superseded one-off components and gradient helpers; final build+lint.
5. Rollback: revert per-phase commits in reverse order; phases are independently revertable until step 4.

## Open Questions

- None blocking. Admin screens stay planned routes until a follow-up change; Inter font onboarding is deferred (see Non-Goals).
