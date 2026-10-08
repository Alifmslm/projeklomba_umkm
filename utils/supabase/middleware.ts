import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Refresh the session cookie and report who is signed in.
 *
 * getUser() rather than getSession(): only getUser() revalidates the access token
 * with the auth server, so a cookie that has been tampered with or has expired
 * fails here instead of being believed. That costs a round trip to the auth
 * server, which is why this runs once per request and the result is handed back
 * rather than recomputed.
 *
 * Deliberately does not read the database. The proxy only needs to know whether a
 * session exists; whether that session has a profile, and which role it holds,
 * are answered by `requireUser` / `requireRole` in lib/auth.ts, where a decision
 * that can lock a person out of their own account belongs behind a real query
 * rather than a cached guess on every route.
 */
export async function resolveSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  // Start from a response that carries the request headers through, so a page
  // that reads them still sees what was sent.
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Rebuilt rather than mutated: a NextResponse is immutable once handed
        // back, and the refresh has to be on the response that leaves.
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}