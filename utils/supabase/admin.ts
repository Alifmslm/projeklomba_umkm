import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client: bypasses RLS entirely.
 *
 * Every write in this app goes through Server Actions using this client, because
 * `rls-access-control` deliberately creates no write policy anywhere - the
 * publishable key can read the catalog and nothing more.
 *
 * That makes this the most privileged credential in the repository. Three guards,
 * in order of how badly they hurt if they fail:
 *
 *  1. `import "server-only"` fails the build if any Client Component or other
 *     client-side module reaches this file. Without it a stray import would
 *     inline the key into a bundle and ship it to the browser.
 *  2. The variable has no `NEXT_PUBLIC_` prefix, so Next never inlines it into a
 *     client bundle even if the guard above were removed.
 *  3. Missing credentials throw at module load rather than deferring the failure
 *     to the first query, so a misconfigured deploy fails loudly at startup.
 *
 * Authorization is not delegated to RLS here and must not be: because this client
 * bypasses it, every caller of a function that returns one of these has already
 * proved it may act on the row it is about to touch. Party membership is checked
 * by reading the row through the caller's own session first - see
 * `apply_booking_transition` in `booking-lifecycle` for that pattern.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase service-role client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix on the key).",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // Never let the admin client hold or persist a user session. It acts as the
      // service role, so any session attached to it would be misleading.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}