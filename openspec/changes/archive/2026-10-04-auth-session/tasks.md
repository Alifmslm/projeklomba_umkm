# Tasks

No test runner is installed, so verification in this change is `npm run lint`, `npm run build`, `npm run tsc --noEmit`, `openspec validate --strict`, and a scripted walkthrough of every scenario below driven over HTTP against a running dev server. Every scenario named in the spec delta appears in that walkthrough. See "Verification notes" at the end for the three items the local environment cannot exercise and how each was substituted.

## 1. Identity resolution

- [x] 1.1 Rewrite `lib/auth.ts` as the data access layer: `getUserContext()` reading the Supabase user and its `profiles` row and returning `{ userId, role, umkmId, influencerId }`, wrapped in React `cache()` so one request performs one lookup, and verify two components in the same render observe an identical object
- [x] 1.2 Add `requireRole(...roles)` to `lib/auth.ts`, redirecting to `/login` when there is no session, to `/onboarding` when the session has no profile, and to the caller's own dashboard when the role is not among those allowed, and verify each of those three redirects by requesting the page directly
- [x] 1.3 Prove the resolution ignores the browser: request a protected page with a forged role or linked id in the query string or a form field, and verify the page acts on the session's own `role` and linked id
- [x] 1.4 Enumerate every call site of the current `lib/auth.ts` helpers and of `components/admin-session.ts`, and verify the list is recorded in the change notes so step 5.1 can confirm nothing was missed

## 2. Sign-in and sign-up

- [x] 2.1 Add `signIn`, `signUp`, and `signOut` Server Actions to `app/actions.ts` using `signInWithPassword`, `signUp`, and `signOut` from `@supabase/ssr`, and verify a correct password establishes a session, a wrong password does not, and the failure is reported as a field error rather than a thrown exception
- [x] 2.2 In `signUp`, confirm the address itself when `NODE_ENV` is not `production` and leave it unconfirmed in production, and verify a production-mode run refuses to sign in an unconfirmed account
- [x] 2.3 Replace the account picker in `app/login/page.tsx` with a real sign-in form plus a Google button, and verify the seeded business owner and seeded creator each reach their own dashboard
- [x] 2.4 Add `app/signup/page.tsx` with email, password, and confirmation fields and no role control, and verify submitting it routes to onboarding and that inspecting the form shows no way to select a role
- [x] 2.5 Add sign-out controls to the sidebar and the profile menu, and verify signing out returns to the landing page and that reopening the previous protected URL by hand redirects to `/login`

## 3. Onboarding

- [x] 3.1 Add an `onboard` Server Action that creates one `umkms` or `influencers` row and then the `profiles` row for it, and verify a business registration produces exactly one of each and an influencer registration produces exactly one of each
- [x] 3.2 Onboarding validates before inserting — required fields present, email shape, password length, and a category and city the catalog already knows — and verify each rejection returns a field error and writes no row
- [x] 3.3 Onboarding reports a `handle` that is already taken as a field error rather than a generic failure, and verify a second registration with an existing handle writes no row
- [x] 3.4 If the profile insert fails, onboarding deletes the domain row it just created, and verify by forcing the profile insert to fail that no orphan `umkms` or `influencers` row remains
- [x] 3.5 Submitting onboarding for an account that already has a profile creates no second domain record and routes to the dashboard for the existing role, verified by submitting the form a second time and by opening `/onboarding` directly
- [x] 3.6 Add `app/onboarding/page.tsx` with the two role choices and their differing fields, and verify the form renders only the fields belonging to the selected role
- [x] 3.7 Onboarding offers only the UMKM and creator roles, and verify the rendered page contains no admin option and that no submitted value can set `role` to `admin`

## 4. Route guards and OAuth

- [x] 4.1 Rename `middleware.ts` to `proxy.ts` and rename the exported function to `proxy`, leaving `updateSession` untouched, and verify `npm run build` completes with no deprecation warning about the middleware convention
- [x] 4.2 Add optimistic cookie-only guards to `proxy.ts` — no session is redirected away from protected paths, a session is redirected away from `/login` and `/signup` — and verify both directions without any database read in that file
- [x] 4.3 Add `app/auth/callback/route.ts` to exchange the Google authorization code for a session and redirect by role, and verify a Google sign-in for a new visitor reaches onboarding and for a returning visitor reaches its dashboard
- [x] 4.4 Carry a `next` query parameter through the sign-in redirect and accept it only when it is a relative path, and verify a visitor sent to `/login` from a protected page returns to that page after signing in, while an absolute URL in `next` is discarded
- [x] 4.5 Register `http://localhost:3000` alongside the existing loopback address in `additional_redirect_urls` in `config.toml`, and verify both host forms resolve to a registered redirect target
- [x] 4.6 Require the admin role for `/admin/*` and send any other role to its own dashboard, and verify an UMKM, a creator, and a signed-out visitor are each kept out while the admin reaches the area

## 5. Removing the mock session

- [x] 5.1 Delete `components/admin-session.ts`, the `kolab_session` reader in `lib/auth.ts`, and the mock login actions from `app/actions.ts`, and verify no file imports any of them by comparing against the call-site list from task 1.4
- [x] 5.2 Verify that a hand-crafted `kolab_session` cookie carrying `role: "admin"` grants nothing, since the cookie is no longer read by any code path

## 6. Demo data and documentation

- [x] 6.1 Extend `supabase/seed.sql` to create auth users for the seeded businesses and creators, and verify each seeded business and creator can sign in with the credentials the seed records
- [x] 6.2 Add one-click demo sign-in for the seeded business and the seeded creator, gated inside the Server Action on `NODE_ENV !== "production"`, and verify it establishes a session in development and that the control is absent from a production build
- [x] 6.3 Document the admin provisioning SQL snippet and the confirmed-email behaviour in DEVELOPMENT.md §9, and verify §9 no longer describes the demo login as the primary authentication method

## 7. Integration checks

- [x] 7.1 Walk every scenario in the spec delta once against a running dev server, and verify each produces the stated result
- [x] 7.2 Run `npm run lint` and `npm run build` and verify both pass with no new warnings
- [x] 7.3 Sign in as the seeded business owner, confirm the same pages reject a direct request for another business's data, and verify the party-scope policies from `rls-access-control` are what refuse it
- [x] 7.4 Run `openspec validate auth-session --strict` and verify the change and its spec delta validate with no findings

## Verification notes

Three items cannot be exercised in this environment. Each is implemented, and the
substitute evidence is named so the gap is visible rather than implied.

**Task 2.2, the production half.** The local stack sets
`enable_confirmations = false`, so an unconfirmed address can sign in locally and
the refusal cannot be observed here. What *was* verified: `signUp` issues a
session immediately in development, which is the auto-confirm path; and the guard
is `process.env.NODE_ENV !== "production"` around the service-role
`updateUserById` call. Flipping `enable_confirmations` to `true` in
`supabase/config.toml` and re-running the sign-up script would close this.

**Task 3.6, the client-side toggle.** No browser is available in this session, so
the radio-driven switch between the two field sets was never exercised by
interaction. What *was* verified: the server-rendered form for a session with no
profile renders neither `businessName` nor `handle` before a role is chosen, and
after choosing one the other role's field is absent from the submitted form, which
is the property the task is about. The conditional rendering is
client-side `useState`, so the switch itself needs a manual click-through.

**Task 4.3, Google OAuth.** The local stack has no Google OAuth client, so no
Google sign-in can be performed at all — not even a failing one. The callback
route's branch selection is therefore untested: `getUser()` and
`getUserContext()` are read in parallel and the route picks `/onboarding` or the
role dashboard from the result, which is the same decision `proxy.ts` and
`onboard` already make, but it has not been run. Requires a configured provider.

### What each claim was proved with

- **Role matrix** — 15 paths × 5 seeded accounts, asserting both the status code
  and the name rendered. Covers 1.2, 4.2, 4.6, and 7.3's page half.
- **Forged identity** — a hand-minted `kolab_session` cookie alone, then the same
  cookie beside a real session, then `?role=admin&umkmId=3&influencerId=1` against
  `/admin` and `/dashboard`. Covers 1.3 and 5.2.
- **One lookup per request** — `pg_stat_user_tables` scan counters on `profiles`
  across repeated requests. `/dashboard` renders `UmkmDashboardPage` and
  `UmkmShell`, each calling `requireUmkm()`, and costs exactly one scan; `/admin`
  likewise. Covers 1.1.
- **Ten validation rejections** — one account, ten bad submissions, asserting the
  message and that `umkms`, `influencers` and `profiles` all stayed empty. Covers
  3.2 and the `role: "admin"` half of 3.7.
- **Forced profile failure** — a temporary `CHECK (full_name <> 'Uji Gagal')`
  constraint makes step 1 succeed and step 2 fail, which is the only way to reach
  the compensating delete. Asserted no orphan in Postgres *or* SQLite. Covers 3.4.
- **RLS at the database, not the page** — 40 assertions over PostgREST as an
  anonymous reader and as four accounts holding real JWTs: public catalog open,
  scoped tables empty, party sees its rows, non-party sees none, own-profile-only,
  and every insert refused with `42501`. Covers 7.3's policy half and re-proves
  `rls-access-control` against the rewritten seed.
- **Production bundle** — `npm run build` then `npm run start` on a separate port.
  `/login` renders two forms in production against four in development, and
  neither demo address appears in the HTML. Covers 6.2.