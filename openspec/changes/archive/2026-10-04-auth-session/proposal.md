# Proposal

## Why

Every protected surface in Kolab.id currently trusts a base64 cookie. `lib/auth.ts` decodes `kolab_session` and accepts whatever `role` string it finds inside it, and `components/admin-session.ts` re-implements the same decode for the admin pages because `lib/auth.ts` only recognises two roles. There is no account and no password: `/login` is an account picker whose actions hardcode `subjectId: 1`, so every visitor is simultaneously "Warung Kopi Senja" and "Rara Nadia". Nothing behind `rls-access-control` can be written until a caller resolves to a specific account and a role, so this is the change that unblocks the rest of the backend.

## What Changes

- Replace the mock cookie session with Supabase Auth: email and password as the primary method, Google OAuth alongside it, both driven from Server Actions.
- Add `/signup`, `/onboarding`, and `/auth/callback`. Onboarding captures a role plus business or creator details and creates exactly one `umkms` or `influencers` row together with the `profiles` row that links it to the account.
- Rewrite `lib/auth.ts` around `getUser()` plus the caller's `profiles` row, and add a `requireRole()` helper that resolves an account to its role and its linked business or creator id, so pages and actions can scope every query.
- Move route protection into `middleware.ts`: signed-out visitors are redirected away from protected areas, signed-in users away from `/login` and `/signup`, and accounts without a profile to `/onboarding`. `/admin/*` additionally requires the admin role and sends other roles to their own dashboard.
- Delete the mock login actions from `app/actions.ts` and the parallel cookie reader in `components/admin-session.ts`, and replace the `/login` account picker with real forms.
- Keep a one-click demo sign-in for the seeded UMKM and creator outside production only, as DEVELOPMENT.md §9 permits, so a competition walkthrough does not depend on typing credentials.
- Leave the admin role unreachable from every in-product flow: an admin is provisioned manually as an auth user plus a `profiles` row, and neither signup nor onboarding can produce one.

## Capabilities

### New Capabilities

- `auth-session`: how an account is created, how a session is established and ended, how a new account becomes an UMKM or creator record, and how each area of the app decides who may enter it.

### Modified Capabilities

- None. `rls-access-control` already specifies that a user reads only their own profile and that a booking is readable only by its two parties, and those requirements are unchanged. This change supplies the identity that its party-scope policies resolve through `profiles`; that dependency belongs in `design.md`, not in a spec delta.

## Impact

- `lib/auth.ts` — rewritten around `getUser()` and `profiles`; all `kolab_session` cookie logic deleted
- `components/admin-session.ts` — deleted
- `app/actions.ts` — mock login actions removed; sign-in, sign-up, sign-out, and onboarding actions added
- `app/login/page.tsx` — account picker replaced with a real sign-in form plus a Google button
- `app/signup/page.tsx`, `app/onboarding/page.tsx`, `app/auth/callback/route.ts` — new
- `middleware.ts` — guards added alongside the existing session refresh
- `utils/supabase/server.ts` — the per-request client becomes the only path by which a page or action learns who the caller is
- No schema change: `profiles` already carries `role` plus the link check tying it to `umkm_id` or `influencer_id`, so onboarding only inserts rows.
- No change to any existing page URL, and no change to the seeded demo content.