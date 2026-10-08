import { type NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/utils/supabase/middleware";

/**
 * Route protection.
 *
 * The framework renamed `middleware` to `proxy`; the file must export a single
 * function and `config.matcher` still selects the paths. Nothing here decides
 * anything about *who* the caller is beyond "is there a session" - role and
 * profile live behind `requireRole` in lib/auth.ts, and duplicating that
 * decision here would give two answers to one question.
 *
 * Redirecting on session presence rather than letting every page guard itself is
 * still worth it: the answers here are cached per request by resolveSession, so
 * they cost one auth call no matter how many nested layouts and shells a route
 * mounts, and a protected route cannot be shipped unprotected by forgetting a
 * line in the page.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Expose the pathname to server components: the root layout hides the global
  // Navbar/Footer on dashboard, admin, and UMKM-influencer routes.
  request.headers.set("x-pathname", pathname);
  const { response, user } = await resolveSession(request);
  response.headers.set("x-pathname", pathname);

  const signInUrl = (): URL => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Carry the original destination so the form can return to it. The action
    // re-validates this before honouring it.
    url.searchParams.set("next", `${pathname}${search}`);
    return url;
  };

  // An account with no profile yet is still a session, and belongs in onboarding
  // rather than on a dashboard it has no data for. The proxy cannot tell the two
  // apart without a database read, so it sends the session to /dashboard and
  // lets requireUser route it the rest of the way.
  if (!user && isProtected(pathname)) {
    return NextResponse.redirect(signInUrl());
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Areas that require a session.
 *
 * Prefix matches, so a new page under /dashboard or /admin is covered by
 * default instead of needing to be remembered here. `/onboarding` is
 * deliberately absent: it is the destination for a session that has no profile,
 * and guarding it against sessions would lock those accounts out of it. The
 * page itself sends a profiled account to its own dashboard.
 */
function isProtected(pathname: string): boolean {
  return ["/dashboard", "/booking", "/review", "/admin"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};