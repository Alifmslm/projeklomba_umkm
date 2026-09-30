import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, MessageCircle } from "lucide-react";
import { UmkmShell } from "@/components/UmkmShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description: "Diskusi langsung dengan kreator di Kolab.id.",
};

export default async function ChatPage() {
  return (
    <UmkmShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
          Chat
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Chat dengan Kreator
        </h1>
        <p className="mt-1.5 text-slate-600">
          Diskusi brief dan progres langsung di satu tempat.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <MessageCircle className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Fitur Chat segera hadir
        </h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Saat ini konfirmasi dan pembaruan kolaborasi berjalan lewat
          dashboard dan riwayat. Chat langsung sedang disiapkan.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <LayoutDashboard className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
          <Link
            href="/dashboard/riwayat"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          >
            Lihat Riwayat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </UmkmShell>
  );
}
