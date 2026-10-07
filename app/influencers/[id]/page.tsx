import { getInfluencerById, getPackagesByInfluencer, getRelatedInfluencers, getReviewsForInfluencer } from "@/lib/data/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Check,
  MapPin,
  Star,
  Users,
  MessageSquare,
  ArrowRight,
  Radar,
  TrendingUp,
} from "lucide-react";

import { formatFollowers, formatRupiah } from "@/lib/format";
import {
  estimateReach,
  estimateRoi,
  CONVERSION_RATE,
  AVG_BASKET_RP,
} from "@/lib/estimate";
import { Avatar } from "@/components/Avatar";
import { CreatorCard } from "@/components/CreatorCard";
import { PackageCard } from "@/components/PackageCard";
import { ReviewCard } from "@/components/ReviewCard";
import { getUserContext } from "@/lib/auth";
import { UmkmShell } from "@/components/UmkmShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/influencers/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const inf = await getInfluencerById(Number(id));
  return {
    title: inf ? `${inf.name} · ${inf.category}` : "Kreator",
    description: inf?.bio,
  };
}

export default async function InfluencerDetailPage(
  props: PageProps<"/influencers/[id]">,
) {
  const { id } = await props.params;
  const inf = await getInfluencerById(Number(id));
  if (!inf) notFound();

const account = await getUserContext();
  const isUmkm = account?.role === "umkm";

  const packages = await getPackagesByInfluencer(inf.id);
  const reachEstimate = estimateReach(inf.followers, inf.engagementRate);
  const related = await getRelatedInfluencers(inf.categoryId, inf.id);
  const reviews = await getReviewsForInfluencer(inf.id);

  // Same content renders in both contexts — UMKM sees it inside the
  // dashboard sidebar + header (UmkmShell provides the page container),
  // guests/public keep the standalone centered container.
  const body = (
    <>
      <nav className="text-sm text-neutral-500">
        <Link href="/influencers" className="hover:text-primary-700">
          Kreator
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-neutral-700">{inf.name}</span>
      </nav>

      {/* Header profil */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar name={inf.name} category={inf.categorySlug} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-3xl">
                    {inf.name}
                  </h1>
                  {inf.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Terverifikasi
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-neutral-500">
                  {inf.handle}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                    {inf.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    <MapPin className="h-3 w-3" /> {inf.city}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 divide-x divide-neutral-100 rounded-2xl bg-neutral-50 py-4 text-center sm:grid-cols-4">
              {[
                {
                  icon: Users,
                  value: formatFollowers(inf.followers),
                  label: "Followers",
                },
                {
                  icon: Star,
                  // A creator with no reviews has no rating: its column default
                  // (0.0) must not read as a real score.
                  value:
                    inf.reviewCount > 0 ? `${inf.rating.toFixed(1)} / 5` : "—",
                  label:
                    inf.reviewCount > 0
                      ? `${inf.reviewCount} ulasan`
                      : "Belum ada ulasan",
                },
                {
                  icon: MessageSquare,
                  value: `${packages.length} paket`,
                  label: "ketersediaan",
                },
                {
                  icon: Radar,
                  value: `≈ ${formatFollowers(Math.round(reachEstimate))}`,
                  label: "tersentuh/video",
                },
              ].map((s, i) => (
                <div key={i}>
                  <p className="flex items-center justify-center gap-1.5 font-head text-lg font-extrabold text-neutral-900">
                    <s.icon className="h-4 w-4 text-primary-600" />
                    {s.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="font-head text-sm font-bold uppercase tracking-wide text-neutral-900">
                Tentang kreator
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {inf.bio}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
              <h3 className="font-head text-sm font-bold text-primary-900">
                Kenapa UMKM gandeng {inf.name.split(" ")[0]}?
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  `Audien ${inf.category.toLowerCase()} yang aktif & engagement tinggi`,
                  ...(inf.reviewCount > 0
                    ? [
                        `Rating ${inf.rating.toFixed(1)} dari ${inf.reviewCount} kolaborasi terdahulu`,
                      ]
                    : []),
                  `Audiens mayoritas di ${inf.city} & sekitarnya`,
                  "Komunikasi cepat dan jadwal tayang jelas",
                ].map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 text-sm text-neutral-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Paket (sidebar sticky) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="font-head text-lg font-extrabold tracking-[-0.02em] text-neutral-900">
              Pilih paket kolaborasi
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Semua harga sudah final, tanpa negosiasi bertele-tele.
            </p>

            <div className="mt-5 space-y-4">
              {packages.map((pkg) => {
                const roi = estimateRoi(pkg.price, reachEstimate);
                const roiHealthy = roi >= 1;
                return (
                  <div key={pkg.id} className="space-y-2">
                    <PackageCard
                      packageData={pkg}
                      href={`/booking/${inf.id}?paket=${pkg.id}`}
                    />
                    <div
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        roiHealthy
                          ? "bg-success-50 text-success-700"
                          : "bg-warning-50 text-warning-700"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Est. ROI
                      </span>
                      <span className="text-xs font-bold">
                        {roiHealthy
                          ? `× ${roi.toFixed(1)} balik modal`
                          : `× ${roi.toFixed(1)} di bawah balik modal`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-500">
              *Estimasi jangkauan dihitung dari followers × engagement rate;
              ROI memakai asumsi konversi {CONVERSION_RATE * 100}% dan nilai
              transaksi rata-rata {formatRupiah(AVG_BASKET_RP)}. Angka ini
              perkiraan kasar, bukan jaminan hasil nyata.
            </p>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">
              Demo: pembayaran disimulasikan. Pembayaran asli akan dikelola
              escrow demi keamanan dua pihak.
            </p>
          </div>
        </aside>
      </div>

      {/* Ulasan dari UMKM partner */}
      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-head text-xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-2xl">
              Ulasan dari UMKM partner
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Rating dua arah — begini pengalaman UMKM yang sudah
              berkolaborasi dengan {inf.name.split(" ")[0]}.
            </p>
          </div>
          {inf.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1.5 text-sm font-bold text-warning-700 ring-1 ring-inset ring-warning-100">
              <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
              {inf.rating.toFixed(1)} · {inf.reviewCount} ulasan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-500">
              Belum ada ulasan
            </span>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          // An empty section reads as a broken page. Say plainly that there are
          // no reviews yet instead.
          <p className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            {inf.name.split(" ")[0]} belum menerima ulasan. Ulasan muncul
            setelah kolaborasi pertama selesai dan dinilai oleh UMKM.
          </p>
        )}
      </section>

      {/* Kreator serupa */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-head text-xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-2xl">
                Kreator {inf.category} lainnya
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Masih ragu? Bandingkan dulu sebelum kolaborasi.
              </p>
            </div>
            <Link
              href={`/influencers?niche=${encodeURIComponent(inf.category)}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
            >
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <CreatorCard key={r.id} influencer={r} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isUmkm) return <UmkmShell>{body}</UmkmShell>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{body}</div>
  );
}