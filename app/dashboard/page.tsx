import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Handshake,
  PartyPopper,
  Search,
  Wallet,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getBookingsByUmkm } from "@/lib/data";
import { formatDate, formatRupiah } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard UMKM",
  description: "Pantau kolaborasi UMKM-mu di Kolab.id.",
};

export default async function UmkmDashboardPage(
  props: PageProps<"/dashboard">,
) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const searchParams = await props.searchParams;
  const baru = searchParams.status === "baru";
  const bookings = getBookingsByUmkm(session.subjectId);

  const total = bookings.length;
  const aktif = bookings.filter((b) => b.status === "APPROVED").length;
  const menunggu = bookings.filter((b) => b.status === "PENDING").length;
  const anggaran = bookings
    .filter((b) => b.status !== "REJECTED")
    .reduce((sum, b) => sum + b.amount, 0);
  const selesai = bookings.filter((b) => b.status === "DONE").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Dashboard UMKM
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Halo, {session.name}! 👋
          </h1>
          <p className="mt-1.5 text-slate-600">
            Ini ringkasan semua kolaborasi dengan kreator.
          </p>
        </div>
        <Link
          href="/influencers"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:brightness-110"
        >
          <Search className="h-4 w-4" /> Cari Kreator Baru
        </Link>
      </div>

      {/* Banner sukses booking baru */}
      {baru && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Pengajuan terkirim!</p>
            <p className="mt-0.5">
              Kreator akan mengonfirmasi lewat dashboard-nya. Statusnya bisa
              kamu pantau di bawah.
            </p>
          </div>
        </div>
      )}

      {/* Statistik */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Handshake}
          label="Total Kolaborasi"
          value={String(total)}
          hint={`${selesai} selesai`}
          accent="indigo"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sedang Berjalan"
          value={String(aktif)}
          hint="konten sedang diproduksi"
          accent="emerald"
        />
        <StatCard
          icon={Clock}
          label="Menunggu"
          value={String(menunggu)}
          hint="konfirmasi kreator"
          accent="amber"
        />
        <StatCard
          icon={Wallet}
          label="Total Anggaran"
          value={formatRupiah(anggaran)}
          hint="paket aktif & selesai"
          accent="violet"
        />
      </div>

      {/* Daftar kolaborasi */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Riwayat Kolaborasi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {bookings.length} pengajuan tercatat. Klik kreator untuk melihat
              profil lengkap.
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Handshake className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Belum ada kolaborasi
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Yuk mulai gandeng kreator pertama UMKM-mu. Pilih dari daftar
              kreator yang sudah terkurasi.
            </p>
            <Link
              href="/influencers"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Cari Kreator <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
              >
                <Link
                  href={`/influencers/${b.influencerId}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <Avatar
                    name={b.influencerName}
                    color={b.influencerColor}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 hover:text-indigo-700">
                      {b.influencerName}
                      <BadgeCheck className="h-4 w-4 shrink-0 text-slate-400" />
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {b.influencerHandle} · {b.influencerCity} · {b.niche}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {b.packageName} · {formatDate(b.createdAt)}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatRupiah(b.amount)}
                  </p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}