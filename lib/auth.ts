import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

/**
 * Identity resolution.
 *
 * This module is the single answer to "who is asking?". Everything that acts on
 * behalf of a person - pages, Server Actions, the shells - resolves through
 * here, and the answer is derived only from the Supabase session. No role, no
 * linked id, and no name is ever read from a query string, a form field, or a
 * cookie this app wrote itself.
 *
 * The old implementation decoded a base64 `kolab_session` cookie and returned
 * whatever `role` string it found. That cookie was unsigned, so anyone could
 * mint one. `components/admin-session.ts` decoded the same cookie a second time
 * because this module only recognised two roles.
 *
 * ## Why getUser() and not getSession()
 *
 * `supabase.auth.getSession()` reads the cookie and trusts it. On its own it
 * performs no validation, so a forged cookie survives it. `getUser()` revalidates
 * the access token against the auth server on every call. That costs one network
 * round trip, which is why both reads below are wrapped in React `cache()`: a
 * single request performs at most one of each no matter how many components ask.
 */

export type UserRole = "umkm" | "influencer" | "admin";

export type UserContext = {
  /** The `auth.users` id. Stable, and the foreign key `profiles.user_id` points at. */
  userId: string;
  email: string;
  role: UserRole;
  /**
   * Exactly one of these is set, except for `admin` where both are null.
   * Enforced by `profiles_role_link_chk`, not by this module.
   */
  umkmId: number | null;
  influencerId: number | null;
  /** Always a usable display string: profile name, else address, else a constant. */
  fullName: string;
};

export type UmkmContext = UserContext & { role: "umkm"; umkmId: number };
export type InfluencerContext = UserContext & {
  role: "influencer";
  influencerId: number;
};
export type PartyContext = UserContext & { role: "umkm" | "influencer" };

/** Where each role belongs. The redirect target for a role that is not allowed. */
export const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  umkm: "/dashboard",
  influencer: "/dashboard/influencer",
  admin: "/admin",
};

const FALLBACK_NAME = "Pengguna Kolab";

/**
 * The signed-in Supabase user, or null.
 *
 * Separated from `getUserContext` because "nobody is signed in" and "signed in
 * but the account has no profile yet" are different situations that lead to
 * different redirects: `/login` versus `/onboarding`. Collapsing them into one
 * null would send a new account to a sign-in form it has already passed.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * The signed-in account and the record it owns, or null when either is missing.
 *
 * A failure to read the profile row lands here too, because `null` is also what
 * "no profile" produces. That collapses in the safe direction: an account that
 * cannot prove it owns a record is sent to onboarding rather than admitted to a
 * dashboard.
 *
 * The select goes through the caller's own session, so it is subject to the
 * `profiles` own-row read policy. That policy admits exactly this row and denies
 * every other, which is why this is the only account query in the app that needs
 * no service-role client.
 */
export const getUserContext = cache(async (): Promise<UserContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, umkm_id, influencer_id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role,
    umkmId: profile.umkm_id,
    influencerId: profile.influencer_id,
    fullName: profile.full_name || user.email || FALLBACK_NAME,
  };
});

/**
 * The caller's account, or a redirect.
 *
 * Anonymous goes to `/login`; signed in without a profile goes to `/onboarding`.
 * Nothing else is refused here - role is `requireRole`'s business.
 */
export async function requireUser(): Promise<UserContext> {
  const context = await getUserContext();
  if (context) return context;

  // `redirect` throws, so the null never reaches the caller.
  redirect((await getUser()) ? "/onboarding" : "/login");
}

/**
 * The caller's account, admitted only if its role is one of `roles`.
 *
 * A signed-in caller whose role is not allowed goes to its own dashboard rather
 * than being shown a refusal, which is the same behaviour the parallel
 * `components/admin-session.ts` reader had and the one task 1.2 pins down.
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<UserContext> {
  const context = await requireUser();
  if (!roles.includes(context.role)) redirect(DASHBOARD_BY_ROLE[context.role]);
  return context;
}

/**
 * `requireRole("umkm")` with both the role and the linked business id narrowed.
 *
 * Worth having because the narrowing is exactly what the SQLite-backed pages
 * need: they take `umkmId` straight into `getUmkmById`. Written as an explicit
 * comparison rather than through `requireRole` because the comparison is what
 * narrows `role`, and the guard below is what narrows the id - neither can be
 * delegated to a caller that only filters.
 */
export async function requireUmkm(): Promise<UmkmContext> {
  const context = await requireUser();
  if (context.role !== "umkm") redirect(DASHBOARD_BY_ROLE[context.role]);
  // Unreachable: profiles_role_link_chk forbids role 'umkm' with a null umkm_id.
  if (context.umkmId === null) redirect("/onboarding");
  return { ...context, role: "umkm", umkmId: context.umkmId };
}

/** `requireRole("influencer")` with the linked creator id narrowed to a number. */
export async function requireInfluencer(): Promise<InfluencerContext> {
  const context = await requireUser();
  if (context.role !== "influencer") redirect(DASHBOARD_BY_ROLE[context.role]);
  // Unreachable for the same reason as requireUmkm.
  if (context.influencerId === null) redirect("/onboarding");
  return { ...context, role: "influencer", influencerId: context.influencerId };
}

/**
 * The caller's account when it holds one of the two collaborating roles.
 *
 * The two-sided pages - the review form, and anything else that reads "which
 * side am I" - need the role narrowed to `umkm | influencer`, and an operator is
 * a party to no booking, so it belongs nowhere near them. Written as an explicit
 * two-value comparison rather than through `requireRole` on purpose: the
 * comparison is what narrows the type, with no assertion needed to convince
 * TypeScript of something the code has just checked.
 */
export async function requireParty(): Promise<PartyContext> {
  const context = await requireUser();
  if (context.role !== "umkm" && context.role !== "influencer") {
    redirect(DASHBOARD_BY_ROLE[context.role]);
  }
  return { ...context, role: context.role };
}