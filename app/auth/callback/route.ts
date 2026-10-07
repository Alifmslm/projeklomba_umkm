import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_BY_ROLE, getUser, getUserContext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * Where an OAuth or emailed confirmation link lands.
 *
 * The provider returns here with a `code`, which is exchanged for a session
 * before anyone is redirected on. Redirecting first and resolving later would
 * show the dashboard of a session that does not exist yet.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  // Same-origin paths only, for the same reason the sign-in form checks: a
  // `//host` value here is a protocol-relative URL and would carry the freshly
  // minted session cookie off-site.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : null;

  const fail = (): NextResponse => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("gagal", "1");
    return NextResponse.redirect(url);
  };

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail();
  }

  // A Google account that has never used Kolab has a session but no profile, so
  // it lands in onboarding exactly like a local sign-up does.
  const [user, context] = await Promise.all([getUser(), getUserContext()]);
  if (!user) return fail();

  const url = request.nextUrl.clone();
  url.pathname = next ?? (context ? DASHBOARD_BY_ROLE[context.role] : "/onboarding");
  // The provider's own query parameters (`code`, `state`, `next`) are dropped
  // rather than carried into the destination, where they would mean nothing and
  // would leak into the address bar.
  url.search = "";
  return NextResponse.redirect(url);
}