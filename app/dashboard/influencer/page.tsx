import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Handshake,
  Star,
  Store,
  Wallet,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getBookingsByInfluencer, getInfluencerById } from "@/lib/data";
import { formatDate, formatRupiah } from "@/lib/format";
import { setBookingStatus } from "@/app/actions";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Kreator",
  description: "Kelola permintaan kolaborasi dari UMKM di Kolab.id.",
};

export default async function InfluencerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "influencer") redirect("/dashboard");

  const profile = getInfluencerById(session.subjectId);
  if (!profile) redirect("/");

  const bookings = getBookingsByInfluencer(session.subjectId);

  const pemasukan = bookings
    .filter((b) => b.status === "APPROVED" || b.status === "DONE")
    .reduce((sum, b) => sum + b.amount, 0);
  const selesai = bookings.filter((b) => b.status === "DONE").length;
  const menunggu = bookings.filter((b) => b.status === "PENDING").length;
  const berjalan = bookings.filter((b) => b.status === "APPROVED").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Dashboard Kreator
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Halo, {profile.name}! 🎬
          </h1>
          <p className="mt-1.5 text-slate-600">
            Konfirmasi permintaan dari UMKM sebelum batas jadwal tayang.
          </p>
        </div>
        <Link
          href={`/influencers/${profile.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          Lihat Profil Publik <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Profil singkat */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <Avatar name={profile.name} color={profile.color} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            {profile.name}
            {profile.verified && <BadgeCheck className="h-4 w-4 text-indigo-600" />}
          </p>
          <p className="truncate text-xs text-slate-500">
            {profile.handle} · {profile.niche} · {profile.city}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {profile.rating.toFixed(1)} ({profile.reviewCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-indigo-600" /> mulai{" "}
            {formatRupiah(profile.basePrice)}/video
          </span>
        </div>
      </div>

      {/* Statistik */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Pemasukan"
          value={formatRupiah(pemasukan)}
          hint="dari paket disetujui & selesai"
          accent="emerald"
        />
        <StatCard
          icon={Handshake}
          label="Kolaborasi"
          value={String(bookings.length)}
          hint={`${berjalan} sedang berjalan`}
          accent="indigo"
        />
        <StatCard
          icon={Clock}
          label="Perlu Respon"
          value={String(menunggu)}
          hint="permintaan baru masuk"
          accent="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Selesai"
          value={String(selesai)}
          hint="konten sudah tayang"
          accent="violet"
        />
      </div>

      {/* Permintaan kolaborasi */}
      <div className="mt-10">
        <h2 className="text-xl font-extrabold text-slate-900">
          Permintaan Kolaborasi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {bookings.length} permintaan dari UMKM partner.
        </p>

        {bookings.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Handshake className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Belum ada permintaan
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Masih sepi? Pastikan profil publikmu lengkap biar UMKM mudah
              menemukanmu.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Avatar
                      name={b.umkmName}
                      color="from-slate-500 to-slate-700"
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {b.umkmName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {b.umkmOwner} · {b.umkmCategory} · {b.umkmCity}
                      </p>
                      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                        <span className="font-semibold text-slate-700">
                          Brief:
                        </span>{" "}
                        {b.message || "—"}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Paket <strong className="text-slate-600">
                          {b.packageName}
                        </strong>{" "}
                        · {b.code} · {formatDate(b.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="text-lg font-extrabold text-slate-900">
                        {formatRupiah(b.amount)}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>

                    {b.status === "PENDING" && (
                      <div className="flex gap-2">
                        <form action={setBookingStatus}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <button
                            type="submit"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                          >
                            Tolak
                          </button>
                        </form>
                        <form action={setBookingStatus}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <button
                            type="submit"
                            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-110"
                          >
                            Setujui
                          </button>
                        </form>
                      </div>
                    )}

                    {b.status === "APPROVED" && (
                      <form action={setBookingStatus}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="status" value="DONE" />
                        <button
                          type="submit"
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          Tandai Konten Sudah Tayang
                        </button>
                      </form>
                    )}

                    {b.status === "REJECTED" && (
                      <p className="text-xs text-slate-400">
                        Ditolak — tidak ada biaya dipotong.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}