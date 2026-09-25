import { cookies } from "next/headers";
import type { Session } from "@/lib/types";

const COOKIE_NAME = "kolab_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

/**
 * Auth sederhana untuk demo lomba: sesi disimpan sebagai cookie base64.
 * Di aplikasi produksi, gunakan penyimpanan yang ter-sign (mis. jose JWT)
 * dan password asli.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Session;
    if (parsed.role !== "umkm" && parsed.role !== "influencer") return null;
    if (typeof parsed.subjectId !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  const value = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
