# Design

## Context

See `proposal.md` — Why. Current state, verified against the repo:

- `lib/auth.ts` decodes a base64 `kolab_session` cookie and returns whatever `role` string it finds. `components/admin-session.ts` duplicates that decode because `lib/auth.ts` only recognises two roles. Nothing verifies a signature, so the cookie is both unauthenticated and self-asserted.
- `app/login/page.tsx` renders an account picker. The Server Actions behind it hardcode `subjectId: 1`, so every demo visitor is both "Warung Kopi Senja" and "Rara Nadia".
- `@supabase/ssr` `^0.12.7`, `@supabase/supabase-js` `^2.117.2`, and the `supabase` CLI `^2.119.0` are installed. `utils/supabase/{server,client,middleware}.ts` exist. No code in `app/` imports them; `lib/data.ts` reads SQLite instead.
- `middleware.ts` currently exports `middleware()` and does nothing but call `updateSession(request)` to refresh the Supabase session cookie.
- `next` is `16.3.6`. In that version the `middleware` file convention is **deprecated and renamed to `proxy`** — the file must be `proxy.ts` exporting `proxy` or a default function, and a codemod exists at `npx @next/codemod@canary middleware-to-proxy .`. Proxy runs on every route including prefetched ones, and the framework's own authentication guide directs that it read the session from the cookie only and avoid database checks.
- The schema is already sufficient: `profiles.user_id` is the primary key, `profiles.role` is a `user_role`, `profiles_role_link_chk` enforces that the role agrees with exactly one of `umkm_id` / `influencer_id`, and `influencers.handle` is already `UNIQUE`.
- No validation library is installed. `zod` is not a dependency, so form validation has to be explicit checks plus database constraints.
- No auth users exist in any seed, and the seeded businesses and creators have no accounts to sign in as.

## Goals / Non-Goals

**Goals:**
- Every request resolves to a real account, a role, and one linked business or creator record.
- No page or Server Action can act on an identity the browser chose.
- One resolution helper, so a page and a Server Action cannot disagree about who the caller is.
- Keep the SQLite data layer untouched until a later change ports it.

**Non-Goals:**
- No booking, catalog, review, or payment behaviour. Those are changes 3 through 5.
- No schema change. `profiles`, `umkms`, and `influencers` already hold what onboarding needs.
- No password reset, email change, or account deletion. A new account that mistypes its email is not recoverable, which is acceptable for a competition and cheap to add later.
- No social sign-in beyond Google.
- No per-user write policies. Writes stay behind service-role Server Actions and the database keeps refusing the browser key, exactly as `rls-access-control` established.

## Decisions

1. **Both sign-in methods are driven from Server Actions; only the Google code exchange needs a route handler.**
   `signInWithPassword`, `signUp`, and `signOut` all return a session the `@supabase/ssr` cookie adapter can persist, so they belong in Server Actions where form errors and `redirect()` are available. Google returns a `code` that must be exchanged at a URL the provider is allowed to redirect to, which is what `app/auth/callback/route.ts` is for.
   *Alternative:* calling `supabase.auth.signInWithOAuth` from a client component and letting the browser navigate — rejected, it splits one sign-in path across two environments and makes the failure modes harder to see.

2. **`lib/auth.ts` becomes the Data Access Layer, and it is the only place identity is resolved.**
   ```ts
   getUserContext(): Promise<UserContext | null>   // cached per request
   requireRole(...roles): Promise<UserContext>     // redirects when absent or wrong role
   ```
   `UserContext` carries `userId`, `role`, and the one linked id. Pages call `requireRole()` before fetching; Server Actions call it before writing. Wrapping the lookup in React `cache()` keeps a single database read per request even when a layout, a page, and three components all ask.
   Every future Server Action in changes 3 through 5 depends on this one helper, so it is written to be the whole authorization surface rather than one page's worth of it.
   *Alternative:* a hook, or reading the profile inside each component — rejected, either way lets two components in the same render disagree about the caller's role.

3. **`middleware.ts` becomes `proxy.ts`, and it does optimistic cookie checks only.**
   The rename is required by Next 16, and the file convention now exports `proxy`. The framework guide is explicit that because proxy runs on every route including prefetches, it should read the session from the cookie and avoid database work. So `proxy.ts` answers two questions only: is there a session, and is this a route that requires one. It redirects a sessionless visitor away from protected paths and a signed-in visitor away from `/login` and `/signup`.
   The role check and the profile-existence check deliberately stay out of it. They need a database read, and a redirect based on them would run on prefetches.
   *Alternative:* keep the file named `middleware.ts` — rejected, deprecated and it emits a warning on every build. *Alternative:* do the role check in proxy now that it defaults to the Node.js runtime — rejected, it is the same per-request database read on every prefetched route, and the DAL already covers the paths that matter.

4. **Authorization is layered: proxy for presence, the DAL for identity, Postgres for ownership.**
   A visitor who reaches a protected page has already passed the proxy check, but the page still calls `requireRole()` before it reads anything, and the party-scope policies from `rls-access-control` independently refuse rows the caller is not party to. All three layers fail closed, and none of them trusts the browser.
   The proxy check being optimistic is therefore not a hole: it can only decide whether to render a shell, never whether to return data.
   *Alternative:* treat the proxy redirect as sufficient — rejected, that is exactly the check a copied cookie would pass.

5. **Onboarding writes the domain row first and the profile second, and compensates if the second write fails.**
   `profiles_role_link_chk` requires the profile to carry a non-null linked id, so the id has to exist before the profile is written and the order cannot be reversed. Two writes cannot be made atomic from a Server Action, because the service-role client issues them as separate statements.
   If the profile insert fails, the action deletes the domain row it just created and rethrows. At the failure rates of a two-statement insert this is proportionate; leaving an orphan business record behind is not acceptable, because a later retry would collide with it on the unique handle and report a misleading error.
   *Alternative:* a Postgres `onboard_umkm()` function doing both inserts in one transaction — more robust, but it adds a schema change and an RPC surface for a failure window of a single statement. Worth revisiting if onboarding ever grows more than two fields.
   *Alternative:* insert the profile with a null linked id and fill it in afterwards — rejected, the check constraint forbids exactly that intermediate state.

6. **Repeat submissions are resolved by the primary key, and reported as success rather than an error.**
   `profiles.user_id` is the primary key, so a second onboarding submit violates uniqueness. The action checks for an existing profile first for a clean redirect, and additionally catches the unique violation as a fallback for two concurrent submits. Either way the visitor lands on the dashboard for the role it already has, and no second business or creator row appears.
   A unique violation on `influencers.handle` during a genuine first submit is treated differently: it is surfaced as a "handle already taken" field error, because the constraint is already in the schema and the message costs nothing.

7. **`app/auth/callback/route.ts` exchanges the Google code and redirects by role, carrying a validated relative `next`.**
   The callback needs the auth user and its profile to know where to send the visitor, which is one `profiles` read on a route that runs rarely.
   `config.toml` currently lists only `https://127.0.0.1:3000` under `additional_redirect_urls`; `http://localhost:3000` is missing and is added, since developers and judges reach the app both ways and a mismatch fails silently at the provider.
   A `next` parameter is carried through the sign-in redirect so a deep link survives, and it is accepted only when it is a relative path. An absolute URL from a query parameter would be an open redirect.
   *Alternative:* always redirect to a fixed dashboard — rejected, a visitor sent to `/login` from a booking page would land somewhere unrelated to what they asked for.

8. **Demo sign-in is gated on the server and signs in as a real seeded account.**
   The gate is `process.env.NODE_ENV !== "production"` evaluated inside the Server Action, so the control is absent from a production build regardless of what the client bundle contains. The action calls the same `signInWithPassword` a real form would, using credentials created by the seed, so there is no second authentication path to keep correct.
   A production guard on a client component is rejected: it hides the button but leaves the action callable.
   The seed has to create these auth users. `supabase/seed.sql` runs as the `postgres` role and can insert into `auth.users`, so the demo accounts are created the same way as the rest of the demo data.

9. **Validation is explicit checks in the actions, with the database as the backstop.**
   `zod` is not a dependency and adding it for two forms is not worth the supply-chain and version surface. Each action checks that the required fields are present, that the email looks like an email, that the password meets a minimum length, and that `category` and `city` name values the catalog already knows. Everything that survives is still subject to `NOT NULL`, the `handle` unique constraint, and `profiles_role_link_chk`.
   *Alternative:* add `zod` — rejected as above. *Alternative:* trust the client form — rejected, forms are not a boundary.

10. **The mock cookie path is deleted outright, with no compatibility shim.**
    `components/admin-session.ts` is removed, the `kolab_session` reader in `lib/auth.ts` is removed, and the mock login Server Actions are removed. A shim that fell back to the old cookie would keep the unauthenticated bypass alive behind a flag nobody remembers to turn off, which is the specific failure this change exists to remove.
    Every call site of the old helpers is enumerated in the tasks so the removal cannot leave a page silently unprotected.

11. **Admin is provisioned by a documented SQL snippet and has no interface.**
    An admin is an auth user plus a `profiles` row with `role = 'admin'`, both null on `umkm_id` and `influencer_id` as `profiles_role_link_chk` requires. The snippet goes into DEVELOPMENT.md rather than into a script, because a script that can mint an admin is a script that eventually runs somewhere it should not.
    *Alternative:* a hidden onboarding code — rejected, it is an admin path reachable from a public form.

## Risks / Trade-offs

- [The proxy check is optimistic, so a stale cookie can briefly render a protected shell] → The proxy only chooses whether to render; every page calls `requireRole()` before it reads, and `rls-access-control`'s party-scope policies refuse rows the caller is not party to. No data can reach the browser on the strength of the proxy check alone.
- [Google sign-in cannot work until the provider and redirect URL are configured in the Supabase dashboard, which is not reachable from this checkout] → Email and password is the primary method and is fully functional on its own; Google is additive. The redirect URL is added to `config.toml` in this change so only the dashboard toggle remains.
- [Email confirmation would block a walkthrough on a device that never receives mail] → Confirmation is required only in production. Outside production the sign-up action confirms the address itself, which is stated in the spec as depending on the current environment rather than being unconditional.
- [Deleting the mock session breaks any page that read it directly] → `lib/auth.ts` and `components/admin-session.ts` are enumerated for call sites in the tasks, and the build plus a route sweep verify nothing still imports them.
- [The compensation delete in decision 5 is best-effort] → A failure between the two inserts leaves an orphan only if the delete also fails, which means the database is already rejecting writes. Acceptable at this scale; the Postgres function alternative is recorded above.
- [Demo credentials in the repository are a real credential if deployed carelessly] → They are seeded development accounts against a project that holds no real data, and the sign-in action refuses to run in production, so the same credentials cannot reach a production deployment.

## Migration Plan

1. Rename `middleware.ts` to `proxy.ts` with the export renamed, keeping `updateSession` exactly as it is so the session refresh behaviour does not change in the same step as the guards.
2. Rewrite `lib/auth.ts` as the data access layer, delete `components/admin-session.ts`, and remove the mock login actions from `app/actions.ts`.
3. Add the sign-in, sign-up, sign-out, and onboarding actions plus their pages, and register `localhost:3000` in `config.toml`.
4. Extend `supabase/seed.sql` to create auth users for the seeded businesses and creators, so demo sign-in and the walkthrough have accounts to use.
5. Add the route guards to `proxy.ts` and document the admin provisioning snippet in DEVELOPMENT.md §9.
6. Rollback is a revert of steps 1 through 5. Nothing is destructive: no schema change is made, and the only data written is auth users and profiles, which can be deleted without affecting the seeded catalog.

## Call-site inventory

Recorded for task 1.4, and the list task 5.1 is checked against. Nothing outside
this list resolves identity.

**Pages (15)**

| File | Call |
| --- | --- |
| `app/(umkm)/dashboard/page.tsx` | `requireUmkm()` |
| `app/(umkm)/dashboard/profile/page.tsx` | `requireUmkm()` |
| `app/(umkm)/dashboard/riwayat/page.tsx` | `requireUmkm()` |
| `app/(umkm)/dashboard/riwayat/[id]/page.tsx` | `requireUmkm()` |
| `app/(umkm)/dashboard/chat/page.tsx` | `requireUmkm()` |
| `app/dashboard/influencer/page.tsx` | `requireInfluencer()` |
| `app/dashboard/influencer/riwayat/page.tsx` | `requireInfluencer()` |
| `app/dashboard/influencer/chat/page.tsx` | `requireInfluencer()` |
| `app/dashboard/influencer/paket/page.tsx` | `requireInfluencer()` |
| `app/booking/[influencerId]/page.tsx` | `requireUmkm()` |
| `app/review/[bookingId]/page.tsx` | `requireParty()` |
| `app/admin/profile/page.tsx` | `requireRole("admin")` |
| `app/login/page.tsx` | `getUserContext()` |
| `app/signup/page.tsx` | `getUserContext()` |
| `app/onboarding/page.tsx` | `getUserContext()` + `getUser()` |

**Components (4)**

| File | Call |
| --- | --- |
| `components/UmkmShell.tsx` | `requireUmkm()` |
| `components/InfluencerShell.tsx` | `requireInfluencer()` |
| `components/AdminShell.tsx` | `requireRole("admin")` |
| `components/Navbar.tsx` | `getUserContext()` |

**Other (2)**

| File | Call |
| --- | --- |
| `app/actions.ts` | `getUser()` + `getUserContext()` in `onboard`; `requireUmkm()` ×2, `requireInfluencer()`, `requireParty()` in the domain actions |
| `app/auth/callback/route.ts` | `getUser()` + `getUserContext()` in parallel, to pick onboarding or dashboard |

Two deliberate absences:

- `app/admin/page.tsx` calls nothing itself. `/admin` is guarded by
  `AdminShell`, which every admin page renders, so the guard cannot be forgotten
  by adding a page under `/admin` — but it does mean the guard is one level below
  the route.
- `proxy.ts` calls `getUser()` only, via `utils/supabase/middleware.ts`. It never
  asks for the role, so a session's identity is decided in exactly one place.

**The mock-era readers that no longer exist**, and what replaced each:

| Removed | Replaced by |
| --- | --- |
| `components/admin-session.ts` | `components/AdminShell.tsx` calling `requireRole("admin")` |
| `kolab_session` decode in `lib/auth.ts` | `getUser()` + the session's `profiles` row |
| `subjectId: 1` hardcoded in the `/login` actions | `signIn` / `signUp` / `demoSignIn` against real accounts |

## Open Questions

- Should the seeded demo accounts be recreated on every `supabase db reset`, or kept stable so a bookmarked session survives a reset? A reset already destroys every auth user, so the default is recreation; keeping them stable would mean provisioning them outside the seed, which is more machinery than a walkthrough needs.
- Should a creator be allowed to change their handle after onboarding? The unique constraint makes the collision case easy to report, but the decision about whether to allow the change at all belongs to the profile-editing capability, which is not part of the current scope.
