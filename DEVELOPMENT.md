# Development Guide — Kolab.id

Technical documentation for developers working on Kolab.id. For a non-technical product overview, see [README.md](./README.md).

> **Migration status:** the app code currently still uses local SQLite (`node:sqlite`) with mock cookie auth. This guide describes the **target stack (Supabase + Supabase Auth — decided)**. Code migration is pending work — see §6, §8, §9, and §12.

## 1. Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js 16.3.6 (App Router) | Server Components + Server Actions |
| Language | TypeScript 5 | Strict mode (see `tsconfig.json`) |
| UI | React 19.2.8, Tailwind CSS v4 (`@tailwindcss/postcss`) | Utility-first styling |
| Icons | lucide-react 1.47.0 | — |
| Database | Supabase (managed Postgres) | Accessed via `@supabase/ssr` + `@supabase/supabase-js`. Replaces local SQLite |
| Auth | Supabase Auth (see §9) | Replaces the mock `kolab_session` cookie |
| Fonts | Plus Jakarta Sans via `next/font/local` | Self-hosted, fully offline (no Google Fonts fetch) |
| Tooling | ESLint 9 + `eslint-config-next`, `tsx` 4.x (seed runner), Supabase CLI (migrations & type gen) | — |

No ORM is required — reads/writes go through the Supabase JS client (PostgREST) and versioned SQL migrations. No local DB file, no native bindings.

## 2. Prerequisites

- **Node.js 20+** (22 LTS recommended). The old `node:sqlite` >= 22.5 requirement no longer applies.
- npm (ships with Node).
- A **Supabase project** (free tier is enough): https://supabase.com/dashboard
- Supabase CLI — optional but recommended for migrations and type generation (`npm i -g supabase`).

## 3. Setup (Local Development)

**Step 1 — Create a Supabase project** and grab the credentials (Dashboard → Project Settings → API):

| Key | Env var | Used where |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Browser + server |
| Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server (safe to expose) |
| Secret key (`sb_secret_...`, formerly service-role) | `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — seeding / admin actions |

> Older projects show a legacy `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) instead of a publishable key — it works the same way in the snippets below.

**Step 2 — Install and configure:**

```bash
npm install
npm install @supabase/ssr @supabase/supabase-js
```

Create `.env.local` (gitignored) in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

**Step 3 — Migrate, seed, run:**

```bash
npm run db:migrate  # apply supabase/migrations/*.sql (or paste the SQL into Dashboard → SQL Editor)
npm run db:seed     # insert demo data (12 creators, 36 packages, 4 UMKMs, 9 bookings + reviews)
npm run dev         # http://localhost:3000
```

Restart `npm run dev` after any `.env.local` change — Next.js only loads env vars at startup.

Re-running `npm run db:seed` resets the demo data (truncate + re-insert).

## 4. NPM Scripts

| Script | Purpose |
| --- | --- |
| `dev` | `next dev` — local dev server with hot reload |
| `build` | `next build` — production build |
| `start` | `next start` — serve the production build |
| `lint` | `eslint` — lint the codebase |
| `db:migrate` | Apply `supabase/migrations/*.sql` to the linked project (`supabase db push`) |
| `db:seed` | Seed demo data into Supabase via `scripts/seed.ts` (service-role key, server-side only) |
| `db:types` | Regenerate typed schema (`supabase gen types typescript --linked > lib/supabase/database.types.ts`) |

## 5. Production Build

```bash
npm run build
npm start
# open http://localhost:3000
```

Notes:

- Deploy as a Node.js app (Vercel is the path of least resistance for Next.js). Static export is not possible — pages read the DB at runtime.
- Set the same three env vars on the host. Never use a `NEXT_PUBLIC_` prefix for the secret key.
- No local DB file anymore: the SQLite `database is locked` / WAL / writable-filesystem problems disappear. Postgres handles concurrent writers.
- Enable Row Level Security (RLS) policies before launch (see §8) so the publishable key cannot write arbitrarily.

## 6. Project Structure (Target)

```
app/
  actions.ts              # Server Actions: login/logout, submitBooking, setBookingStatus, submitReview
  page.tsx                # Landing page
  influencers/            # Creator list + filters, creator detail (packages, reviews)
  booking/[influencerId]/ # Collaboration request form (UMKM-only guard)
  review/[bookingId]/     # Two-way rating & review form (after DONE booking)
  insights/               # Market price insights per category
  dashboard/              # UMKM dashboard (+ auto recommendations) & creator dashboard
  login/                  # Login / signup pages (Supabase Auth, see §9)
components/               # Navbar, Footer, InfluencerCard, StarRating, etc.
lib/
  supabase/
    client.ts             # Browser client (createBrowserClient) — "use client" only
    server.ts             # Server client (createServerClient + cookies) — Server Components/Actions
    database.types.ts     # Generated types (npm run db:types). Replaces hand-written types where applicable
  data.ts                 # Query functions (incl. recommendations & price stats) — ported to Supabase client
  auth.ts                 # Session/role helpers on top of supabase.auth.getUser() (replaces cookie mock)
  format.ts               # Rupiah / number / date formatting
  types.ts                # Shared TypeScript types
middleware.ts             # Auth session refresh (updateSession) + route guards
supabase/
  migrations/             # Versioned SQL schema, e.g. 0001_init.sql (replaces CREATE TABLE in lib/db.ts)
scripts/seed.ts           # CLI seeder using the SERVICE-ROLE key — never the publishable key
```

Key client snippets (per current Supabase docs, `@supabase/ssr`):

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — session refresh is handled by middleware.
          }
        },
      },
    }
  );
}
```

```ts
// middleware.ts — refreshes the session cookie on every request.
// Without this, users get randomly logged out.
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: Request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

> Do not create the server client once globally and reuse it — always create a new client per request.

## 7. Routes

| Route | Description | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/influencers` | Creator list + search/filter/sort | Public |
| `/influencers/[id]` | Creator profile, packages, UMKM reviews | Public |
| `/booking/[influencerId]` | Submit collaboration request | Supabase session + `umkm` role |
| `/dashboard` | UMKM dashboard + auto creator recommendations | Supabase session + `umkm` role |
| `/dashboard/influencer` | Creator dashboard (accept/reject/complete) | Supabase session + `influencer` role |
| `/review/[bookingId]` | Two-way rating after DONE booking | Involved party only |
| `/insights` | Market price standards per category (min/avg/max) | Public |
| `/login` | Login (Supabase Auth) | Public (redirects away if already signed in) |
| `/signup` | Signup (Supabase Auth) | Public (redirects away if already signed in) |
| `/onboarding` | Role picker + business/creator details (creates `profiles` row) | Signed-in users without a profile |
| `/auth/callback` | OAuth code-exchange callback (no UI) | Public |

Guards move from parsing the mock cookie to `supabase.auth.getUser()` in Server Components/Actions plus middleware redirects.

## 8. Database Schema (Postgres)

The schema lives in versioned migrations (`supabase/migrations/0001_init.sql`), not in app code. Postgres port of the current tables, plus a new `profiles` table linking logins to business/creator rows:

```sql
create table if not exists influencers (
  id          bigint generated always as identity primary key,
  name        text not null,
  handle      text not null unique,
  niche       text not null,
  city        text not null,
  followers   integer not null,
  base_price  integer not null,
  rating      numeric not null default 0,
  review_count integer not null default 0,
  verified    boolean not null default false,
  bio         text not null default '',
  color       text not null default 'from-indigo-500 to-violet-500'
);

create table if not exists packages (
  id            bigint generated always as identity primary key,
  influencer_id bigint not null references influencers(id) on delete cascade,
  name          text not null,
  price         integer not null,
  summary       text not null default '',
  includes      jsonb not null default '[]'
);

create table if not exists umkms (
  id       bigint generated always as identity primary key,
  name     text not null,
  owner    text not null,
  category text not null,
  city     text not null
);

create table if not exists bookings (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  influencer_id bigint not null references influencers(id),
  umkm_id       bigint not null references umkms(id),
  package_name  text not null,
  amount        integer not null,
  message       text not null default '',
  status        text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'DONE')),
  created_at    timestamptz not null default now()
);

create table if not exists reviews (
  id            bigint generated always as identity primary key,
  booking_id    bigint not null references bookings(id) on delete cascade,
  reviewer_role text not null check (reviewer_role in ('umkm', 'influencer')),
  reviewer_id   bigint not null,
  reviewee_type text not null check (reviewee_type in ('influencer', 'umkm')),
  reviewee_id   bigint not null,
  rating        integer not null check (rating between 1 and 5),
  comment       text not null default '',
  created_at    timestamptz not null default now(),
  unique (booking_id, reviewer_role)
);

-- One login per UMKM / creator. Links Supabase Auth users to domain rows.
create table if not exists profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('umkm', 'influencer')),
  umkm_id       bigint references umkms(id) on delete cascade,
  influencer_id bigint references influencers(id) on delete cascade,
  created_at    timestamptz not null default now(),
  check (
    (role = 'umkm'       and umkm_id is not null       and influencer_id is null) or
    (role = 'influencer' and influencer_id is not null and umkm_id is null)
  )
);
```

Type differences from SQLite to be aware of when porting `lib/data.ts`:

- `INTEGER PRIMARY KEY AUTOINCREMENT` → `bigint generated always as identity primary key`
- `verified INTEGER 0/1` → `boolean`
- `includes TEXT` (JSON string) → `jsonb`
- `created_at TEXT` (ISO string) → `timestamptz default now()`
- `rating REAL` → `numeric` (comes back from PostgREST as a string — cast with `Number()`)

### Row Level Security (RLS)

Enable RLS on every table and start with this baseline (competition-friendly, tighten later):

```sql
alter table influencers enable row level security;
alter table packages     enable row level security;
alter table umkms        enable row level security;
alter table bookings     enable row level security;
alter table reviews      enable row level security;
alter table profiles     enable row level security;

-- Catalog tables: public read, no direct writes (writes go through Server Actions).
create policy "public read" on influencers for select using (true);
create policy "public read" on packages     for select using (true);
create policy "public read" on umkms        for select using (true);
```

Recommended write model: **all writes go through Server Actions using a service-role client** (server-only, bypasses RLS). This keeps the demo simple and secure by default — the publishable key effectively becomes read-only for catalog data. For production hardening, replace service-role writes with per-user RLS policies matching `auth.uid()` against `profiles` (e.g. a UMKM may insert bookings only for its own `umkm_id`, a creator may update only its own bookings).

Influencer `rating` / `review_count` stay denormalized — update them in the same Server Action that inserts a UMKM review (or via a Postgres trigger).

## 9. Auth — Supabase Auth (decided)

**Decision: Supabase Auth.** No extra vendor — it ships with the database, and its JWTs plug directly into RLS policies.

### Methods

| Method | Status | Notes |
| --- | --- | --- |
| Email + password | Primary | `signUp` / `signInWithPassword` in Server Actions. Zero config |
| Google OAuth | Primary | `signInWithOAuth({ provider: "google" })` + `/auth/callback` code exchange |
| Magic link / email OTP | Deferred | Revisit post-launch; depends on email deliverability |
| Phone OTP (SMS) | Out of scope | Per-message SMS cost — unjustified for this project |

### Data model: `profiles`

One login per UMKM / creator. `profiles.user_id → auth.users(id)` carries the `role` plus exactly one of `umkm_id` / `influencer_id` (schema in §8). Rows are created by an **onboarding Server Action** (service-role client), never by the browser:

1. User signs up / signs in (either method) → auth user exists, no profile yet.
2. Middleware sees the missing profile → forces `/onboarding`.
3. User picks a role and fills in business/creator details → Server Action inserts the `umkms`/`influencers` row, then the `profiles` row linking `auth.uid()`.
4. Redirect to the role dashboard.

Baseline RLS — a user may read only their own profile (all writes go through Server Actions):

```sql
create policy "own profile read" on profiles
  for select using (auth.uid() = user_id);
```

Phase-2 hardening (replace service-role writes with per-user policies), e.g. a UMKM inserts bookings only for itself:

```sql
create policy "umkm creates own bookings" on bookings
  for insert with check (
    umkm_id = (select umkm_id from profiles where user_id = auth.uid())
  );
```

### Flows

- **Email signup** — `/signup` form (name, email, password) → Server Action `signUp` → confirm email (disabled in dev, enabled in prod) → `/onboarding` (no profile yet).
- **Email login** — `/login` form → `signInWithPassword` → `revalidatePath("/", "layout")` → redirect by role (`/dashboard` for UMKM, `/dashboard/influencer` for creators).
- **Google OAuth** — button → `signInWithOAuth` with `redirectTo: <origin>/auth/callback` → callback route exchanges the code for a session → `/onboarding` or dashboard depending on profile presence.
- **Logout** — Server Action `supabase.auth.signOut()` → redirect `/`.
- **Role checks** — helper `requireRole("umkm" | "influencer")` in `lib/auth.ts`: `getUser()` → read `profiles` row → scope every query by the linked `umkm_id`/`influencer_id`. Never trust a role sent from the client.

### Route protection (middleware)

- Public: `/`, `/influencers*`, `/insights`, `/login`, `/signup`, `/auth/*`.
- `updateSession` refresh runs on every non-static request.
- Unauthenticated users are redirected away from `/dashboard*`, `/booking*`, `/review/[bookingId]`, `/onboarding`; authenticated users with a profile are redirected away from `/login`/`/signup`; authenticated users without one are forced to `/onboarding`.

### Supabase dashboard setup (auth)

1. Authentication → Sign In/Up: enable the **Email** and **Google** providers. Dev project: "Confirm email" OFF; prod: ON.
2. Google provider: create an OAuth client in Google Cloud Console, paste the client ID/secret into Supabase; allowlist `https://<project-ref>.supabase.co/auth/v1/callback` on the Google side.
3. Authentication → URL Configuration: `SITE_URL` = deployed domain; Redirect URLs include `http://localhost:3000/**` (dev) and the prod domain (for `/auth/callback`).
4. Translate the auth email templates to Bahasa Indonesia.
5. Demo accounts: create `umkm-demo@kolab.id` / `kreator-demo@kolab.id` (linked to seeded rows via `profiles`) in the Dashboard or a service-role script. A one-click demo-login button is allowed in dev only.

### Migrating off the mock

1. Delete the `kolab_session` cookie logic in `lib/auth.ts`; rewrite helpers on `getUser()` + `profiles`.
2. Replace the `/login` account picker with real login/signup forms plus `/onboarding` (role + details).
3. Add `middleware.ts` (session refresh + guards) and the `/auth/callback` route.
4. Remove the demo-login backdoor before any prod deploy.

## 10. Rendering & Data Fetching Notes

- Keep `export const dynamic = "force-dynamic"` on DB-backed pages initially — same as before. Add per-page caching deliberately later, not by accident.
- Server Components and Server Actions must use the per-request server client (`lib/supabase/server.ts`), never a module-level singleton.
- PostgREST returns `numeric` columns as strings — cast ratings/amounts with `Number()` at the boundary (e.g. in `lib/data.ts`).
- Currency formatting still uses `lib/format.ts` (IDR/Rupiah helpers).

## 11. Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| Queries return zero rows with no error | RLS policy missing/deny. Check policies in Dashboard → Authentication → Policies, or test with the service-role key to confirm it's RLS, not the query |
| Users randomly logged out | `middleware.ts` session refresh missing or matcher excluding routes. Ensure `updateSession` runs on every non-static request |
| `NEXT_PUBLIC_SUPABASE_* is undefined` | `.env.local` missing or dev server not restarted after editing it |
| Seed/auth-admin calls fail with 401/403 | Publishable key used where the secret key is required (or vice versa). Seeding and user-admin scripts must use `SUPABASE_SERVICE_ROLE_KEY`, server-side only |
| Signup succeeds but user can't log in | "Confirm email" is on and the inbox wasn't confirmed. Turn it off for the dev project or confirm the user in the Dashboard |
| Google OAuth loops back to login | Redirect/callback URL not allowlisted in Supabase URL Configuration, or `SITE_URL` still points at localhost in prod |
| `numeric` rating arrives as `"4.8"` (string) | Expected PostgREST behavior — cast with `Number()` |
| Old SQLite errors (`database is locked`, `node:sqlite` missing) | Leftover from the pre-Supabase code. Upgrading Node isn't the fix anymore — finish the migration in §6/§8 |

## 12. Deployment Checklist

1. Supabase **prod** project: migrations applied, RLS policies on, seed/demo data replaced with real (or clearly-marked demo) data.
2. Auth configured: `SITE_URL` + redirect URLs set to the prod domain, Google OAuth client wired, email templates translated to Bahasa Indonesia, "Confirm email" set per launch policy.
3. Host (Vercel recommended): set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. `npm run build` passes; smoke-test login → booking → review flows for both roles.
5. Mock-auth cleanup done: no `kolab_session` code paths, no one-click demo backdoor in prod.
6. Backups: Supabase daily backups are on free-tier-daily / PITR on paid — verify before launch.
