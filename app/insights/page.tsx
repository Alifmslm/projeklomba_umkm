import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Info,
  LineChart,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react";
import { getLandingStats, getPriceStats } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import type { PriceStat } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wawasan Harga Pasar",
  description:
    "Bandingkan harga per video antar kategori kreator di Kolab.id — transparan, tanpa nego.",
};

export default async function InsightsPage() {
  const stats = getPriceStats();
  const landing = getLandingStats();
  const maxAvg = Math.max(...stats.map((s) => s.avgPrice), 1);
  const minPrice = Math.min(...stats.map((s) => s.minPrice), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-primary-600">
            <LineChart className="h-4 w-4" /> Wawasan Harga
          </p>
          <h1 className="font-head mt-1 text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
            Standar harga kreator per kategori
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Harga per video di Kolab.id transparan dan tidak bisa dimanipulasi.
            Ini gambaran pasar dari {landing.influencerCount} kreator di{" "}
            {landing.nicheCount} kategori — biar UMKM tahu budget yang realistis.
          </p>
        </div>
        <Link
          href="/influencers"
          className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/25 transition-all hover:brightness-110"
        >
          Lihat Kreator <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Ringkasan */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Store,
            label: "Kreator di pasar",
            value: String(landing.influencerCount),
            note: "dari 10+ kota di Indonesia",
            color: "bg-primary-50 text-primary-700",
          },
          {
            icon: Tag,
            label: "Kategori terlayani",
            value: String(landing.nicheCount),
            note: "niche kreator berbeda",
            color: "bg-primary-50 text-primary-700",
          },
          {
            icon: BarChart3,
            label: "Rata-rata harga/video",
            value: formatRupiah(
              Math.round(
                stats.reduce((s, p) => s + p.avgPrice, 0) /
                  (stats.length || 1),
              ),
            ),
            note: "antar semua kategori",
            color: "bg-success-50 text-success-700",
          },
          {
            icon: TrendingDown,
            label: "Termurah di pasar",
            value: formatRupiah(minPrice),
            note: "mulai dari budget kecil",
            color: "bg-warning-50 text-warning-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {s.label}
              </p>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="font-head mt-3 text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
              {s.value}
            </p>
            {s.note && <p className="mt-1 text-xs text-neutral-500">{s.note}</p>}
          </div>
        ))}
      </div>

      {/* Per kategori */}
      <section className="mt-10">
        <h2 className="font-head text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Harga per kategori
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Harga = paket Review Video (terjangkau) tiap kreator. Urut dari rata-rata
          termurah.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((p: PriceStat) => {
            const width = Math.max(6, Math.round((p.avgPrice / maxAvg) * 100));
            return (
              <div
                key={p.niche}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-sm hover:shadow-primary-500/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
                      {p.niche}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {p.count} kreator tersedia
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700 ring-1 ring-inset ring-success-200">
                    mulai {formatRupiah(p.minPrice)}
                  </span>
                </div>

                {/* Bar perbandingan (data-viz memakai token brand) */}
                <div className="mt-4">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-neutral-400">
                    rata-rata{" "}
                    <strong className="text-neutral-600">
                      {formatRupiah(p.avgPrice)}
                    </strong>{" "}
                    / video
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
                  <span className="text-neutral-500">
                    Termurah{" "}
                    <strong className="text-neutral-700">
                      {formatRupiah(p.minPrice)}
                    </strong>
                  </span>
                  <span className="text-neutral-500">
                    Termahal{" "}
                    <strong className="text-neutral-700">
                      {formatRupiah(p.maxPrice)}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/50 p-5 text-sm text-primary-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
          <p className="leading-relaxed">
            Di Kolab.id harga per video <strong>dikunci di server</strong> —
            UMKM tidak perlu nego di DM, dan kreator tidak perlu takut harga
            dipangkas seenaknya. Harga di atas adalah harga paket{" "}
            <em>Review Video</em>; paket lain (Unboxing &amp; Story, Kampanye
            Komplit) dihitung proporsional di profil kreator.
          </p>
        </div>
      </section>
    </div>
  );
}