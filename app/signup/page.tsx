import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DASHBOARD_BY_ROLE, getUser, getUserContext } from "@/lib/auth";
import { SignUpForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Kolab.id sebagai UMKM atau kreator.",
};

export default async function SignUpPage() {
  // Two separate questions, and the difference matters: an account that already
  // has a profile belongs in its dashboard, while one without belongs in
  // onboarding. Collapsing both into "is anybody signed in" would send a new
  // account to a sign-in form it has already passed.
  const account = await getUserContext();
  if (account) redirect(DASHBOARD_BY_ROLE[account.role]);

  const user = await getUser();
  if (user) redirect("/onboarding");

  return (
    <div className="hero-glow">
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="font-head text-center text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
          Buat akun <span className="text-gradient-brand">Kolab.id</span>
        </h1>
        <p className="mt-3 text-center text-neutral-600">
          Satu akun untuk UMKM dan kreator. Setelah daftar, kamu memilih mau
          Collaborasi sebagai usaha atau sebagai kreator.
        </p>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-7">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}