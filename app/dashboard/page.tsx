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
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  getBookingsByUmkm,
  getRecommendedInfluencers,
  getReviewForBookingRole,
  getUmkmById,
} from "@/lib/data";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Review } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";

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
  const reviewSent = searchParams.review === "1";
  const bookings = getBookingsByUmkm(session.subjectId);

  const umkm = getUmkmById(session.subjectId);
  const recommended = umkm ? getRecommendedInfluencers(umkm, 3) : [];

  // Ulasan yang sudah diberikan UMKM ini untuk booking yang DONE
  const myReviews = new Map<number, Review>();
  for (const b of bookings) {
    if (b.status === "DONE") {
      const review = getReviewForBookingRole(b.id, "umkm");
      if (review) myReviews.set(b.id, review);
    }
  }

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

      {/* Banner sukses mengirim rating */}
      {reviewSent && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          <Star className="mt-0.5 h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
          <div>
            <p className="font-bold">Ulasan terkirim!</p>
            <p className="mt-0.5">
              Terima kasih sudah berbagi pengalamanmu. Rating-mu membantu UMKM
              lain memilih kreator yang tepat.
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

      {/* Matchmaking: kreator yang cocok */}
      {recommended.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-indigo-600">
                <Sparkles className="h-4 w-4" /> Rekomendasi untukmu
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                Kreator yang cocok dengan {session.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dicocokkan otomatis dari kategori usaha, kota, dan budget-mu.
              </p>
            </div>
            <Link
              href="/influencers"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat semua kreator <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <Link
                  href={`/influencers/${rec.id}`}
                  className="group flex items-center gap-3"
                >
                  <Avatar name={rec.name} color={rec.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 group-hover:text-indigo-700">
                      {rec.name}
                      {rec.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-indigo-600" />
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {rec.handle} · {rec.niche} · {rec.city}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rec.rating.toFixed(1)} · {rec.reviewCount} ulasan
                    </p>
                  </div>
                </Link>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rec.matchReasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700"
                    >
                      <Sparkles className="h-3 w-3" /> {reason}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[11px] text-slate-500">Mulai dari</p>
                    <p className="text-base font-extrabold text-indigo-700">
                      {formatRupiah(rec.basePrice)}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        / video
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/booking/${rec.id}`}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-600"
                  >
                    Ajukan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
                  {b.status === "DONE" &&
                    (myReviews.get(b.id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        <StarRating
                          rating={myReviews.get(b.id)!.rating}
                          size="h-3 w-3"
                        />
                        Sudah dinilai
                      </span>
                    ) : (
                      <Link
                        href={`/review/${b.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                      >
                        <Star className="h-3.5 w-3.5" /> Beri Ulasan
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}