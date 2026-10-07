# Proposal

## Why

The Kolab.id UI was built screen-by-screen with ad-hoc Tailwind values (slate palettes, indigo/violet gradients, hardcoded radii), while DESIGN_SYSTEM.md v1.1 now defines a single-brand token system mapped to Tailwind v4. Without a planned migration, new pages keep drifting from the system. A frontend-first rebuild — tokens, then shared components, then pages — gives every current and future screen (UMKM, kreator, admin per ARCHITECTURE.md) one visual language before any backend work begins.

## What Changes

- Migrate DESIGN_SYSTEM.md v1.1 tokens into Tailwind v4 `@theme` in `app/globals.css` (primary/success/neutral/semantic colors, fonts, shadows, easing); radius/spacing/durations stay on built-in utilities per the §16 mapping.
- Build a shared component library from the tokens: sidebar, dashboard header, KPI card, data table, creator card, status badge, notification bell, empty state, buttons, inputs, filter chips.
- Rebuild all pages and flows from ARCHITECTURE.md on the new components, frontend-first against the existing mock data layer (SQLite + mock cookie auth stay untouched; no Supabase migration in this change).
- Replace raw hex, arbitrary values, and off-system palettes on rebuilt screens with token utilities.

## Capabilities

### New Capabilities

- `design-tokens`: DESIGN_SYSTEM.md v1.1 tokens available as Tailwind v4 `@theme` utilities with the §16 mapping honored.
- `ui-components`: shared presentational components (sidebar, header, KPI card, table, cards, badges, bells, forms) built only from tokens.
- `frontend-pages`: every ARCHITECTURE.md page and role flow rendered with the shared components, working end to end on mock data.

### Modified Capabilities

- None (no existing specs; behavior contracts are new, implementation targets existing routes).

## Impact

- `app/globals.css` (new `@theme` block), `components/` (new/rewritten shared components), all `app/` pages (restyled onto components).
- No changes to `lib/db.ts`, `lib/data.ts`, `lib/auth.ts`, `app/actions.ts` logic, or any migration/schema docs.
- Visual diff on every screen is expected and intended; route URLs, guards, and mock-data behavior stay identical.
