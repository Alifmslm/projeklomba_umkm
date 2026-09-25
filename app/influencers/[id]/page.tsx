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
} from "lucide-react";
import {
  getInfluencerById,
  getPackagesByInfluencer,
  getRelatedInfluencers,
} from "@/lib/data";
import { formatFollowers, formatRupiah } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { InfluencerCard } from "@/components/InfluencerCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/influencers/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const inf = getInfluencerById(Number(id));
  return {
    title: inf ? `${inf.name} · ${inf.niche}` : "Kreator",
    description: inf?.bio,
  };
}

export default async function InfluencerDetailPage(
  props: PageProps<"/influencers/[id]">,
) {
  const { id } = await props.params;
  const inf = getInfluencerById(Number(id));
  if (!inf) notFound();

  const packages = getPackagesByInfluencer(inf.id);
  const related = getRelatedInfluencers(inf.niche, inf.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/influencers" className="hover:text-indigo-700">
          Kreator
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-700">{inf.name}</span>
      </nav>

      {/* Header profil */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar name={inf.name} color={inf.color} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    {inf.name}
                  </h1>
                  {inf.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Terverifikasi
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-slate-500">
                  {inf.handle}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {inf.niche}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <MapPin className="h-3 w-3" /> {inf.city}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-4 text-center">
              {[
                {
                  icon: Users,
                  value: formatFollowers(inf.followers),
                  label: "Followers",
                },
                {
                  icon: Star,
                  value: `${inf.rating.toFixed(1)} / 5`,
                  label: `${inf.reviewCount} ulasan`,
                },
                {
                  icon: MessageSquare,
                  value: `${packages.length} paket`,
                  label: "ketersediaan",
                },
              ].map((s, i) => (
                <div key={i}>
                  <p className="flex items-center justify-center gap-1.5 text-lg font-extrabold text-slate-900">
                    <s.icon className="h-4 w-4 text-indigo-600" />
                    {s.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                Tentang kreator
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {inf.bio}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <h3 className="text-sm font-bold text-indigo-900">
                Kenapa UMKM gandeng {inf.name.split(" ")[0]}?
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  `Audien ${inf.niche.toLowerCase()} yang aktif & engagement tinggi`,
                  `Rating ${inf.rating.toFixed(1)} dari ${inf.reviewCount} kolaborasi terdahulu`,
                  `Audiens mayoritas di ${inf.city} & sekitarnya`,
                  "Komunikasi cepat dan jadwal tayang jelas",
                ].map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Paket (sidebar sticky) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">
              Pilih paket kolaborasi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Semua harga sudah final, tanpa negosiasi bertele-tele.
            </p>

            <div className="mt-5 space-y-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-slate-200 p-4 transition-colors hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {pkg.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {pkg.summary}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold text-indigo-700">
                      {formatRupiah(pkg.price)}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {pkg.includes.map((inc) => (
                      <li
                        key={inc}
                        className="flex items-start gap-1.5 text-xs text-slate-600"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/booking/${inf.id}?paket=${pkg.id}`}
                    className="mt-3 block w-full rounded-xl bg-slate-900 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                  >
                    Ajukan Kolaborasi
                  </Link>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
              Demo: pembayaran disimulasikan. Pembayaran asli akan dikelola
              escrow demi keamanan dua pihak.
            </p>
          </div>
        </aside>
      </div>

      {/* Kreator serupa */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Kreator {inf.niche} lainnya
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Masih ragu? Bandingkan dulu sebelum kolaborasi.
              </p>
            </div>
            <Link
              href={`/influencers?niche=${encodeURIComponent(inf.niche)}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <InfluencerCard key={r.id} influencer={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}