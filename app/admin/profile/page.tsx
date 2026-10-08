import type { Metadata } from "next";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { signOut } from "@/app/actions";
import { AdminShell } from "@/components/AdminShell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Profile admin Kolab.id.",
};

export default async function AdminProfilePage() {
  const admin = await requireRole("admin");
  const initial = admin.fullName.charAt(0).toUpperCase();

  return (
    <AdminShell>
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-600 text-xl font-extrabold text-neutral-0">
              {initial}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-head text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
                {admin.fullName}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                <ShieldCheck className="h-4 w-4 text-primary-600" /> Admin
                Kolab.id
              </p>
            </div>
          </div>
          <dl className="mt-6 space-y-4 border-t border-neutral-100 pt-5 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-neutral-700">
                <Mail className="h-4 w-4 text-neutral-400" /> {admin.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Peran
              </dt>
              <dd className="mt-1 text-neutral-700">
                Menyelesaikan sengketa kolaborasi (hanya dapat dipicu manual).
              </dd>
            </div>
          </dl>
          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-600"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}