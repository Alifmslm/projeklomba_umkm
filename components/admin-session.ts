import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "kolab_session";

export type AdminSession = {
  role: "admin";
  name: string;
  email: string;
};

/**
 * Sesi admin — guard page-local untuk /admin/* (ARCHITECTURE §5.2).
 *
 * `lib/auth.ts` sengaja tidak disentuh (hanya mengakui role umkm/influencer),
 * jadi sesi admin dibaca langsung dari cookie base64 yang sama, dan role lain
 * dialihkan ke dashboard masing-masing, persis perilaku requireRole("admin").
 */
export async function requireAdmin(): Promise<AdminSession> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  let parsed: Record<string, unknown> | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(
        Buffer.from(raw, "base64url").toString("utf8"),
      ) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (parsed?.role === "admin") {
    return {
      role: "admin",
      name:
        typeof parsed.name === "string" && parsed.name
          ? parsed.name
          : "Admin Kolab",
      email:
        typeof parsed.email === "string" && parsed.email
          ? parsed.email
          : "admin@kolab.id",
    };
  }

  // REDIRECT jangan dibungkus try/catch — ia melempar NEXT_REDIRECT.
  if (parsed?.role === "umkm") redirect("/dashboard");
  if (parsed?.role === "influencer") redirect("/dashboard/influencer");
  redirect("/login");
}