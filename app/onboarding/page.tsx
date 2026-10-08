import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DASHBOARD_BY_ROLE, getUser, getUserContext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lengkapi profil",
  description: "Lengkapi profil usaha atau kreator kamu di Kolab.id.",
};

export default async function OnboardingPage() {
  const account = await getUserContext();
  // A profile is one per account and `profiles.umkm_id` is UNIQUE, so there is
  // nothing to add here for somebody who already has one.
  if (account) redirect(DASHBOARD_BY_ROLE[account.role]);

  const user = await getUser();
  if (!user) redirect("/login");

  // A public catalog table, readable with the publishable key, so this needs no
  // service-role client. The categories are also what the action validates the
  // submitted id against.
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("id");

  return (
    <div className="hero-glow">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
            Satu langkah lagi,{" "}
            <span className="text-gradient-brand">lengkapi profilmu</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-neutral-600">
            Ini yang membuat kreator bisa menemukanmu, atau membuat UMKM bisa
            mempercayai konten yang kamu buat. Bisa diganti nanti.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-7">
          <OnboardingForm
            email={user.email ?? ""}
            categories={categories ?? []}
          />
        </div>
      </div>
    </div>
  );
}