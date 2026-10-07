import { getLandingStats, getPriceStats } from "@/lib/data/catalog";
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

import { formatRupiah } from "@/lib/format";
import type { PriceStat } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wawasan Harga Pasar",
  description:
    "Bandingkan harga per video antar kategori kreator di Kolab.id — transparan, tanpa nego.",
};

export default async function InsightsPage() {
  const stats = await getPriceStats();
  const landing = await getLandingStats();
  const hasData = stats.length > 0;
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
            {landing.categoryCount} kategori — biar UMKM tahu budget yang realistis.
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
            value: String(landing.categoryCount),
            note: "kategori kreator berbeda",
            color: "bg-primary-50 text-primary-700",
          },
          {
            icon: BarChart3,
            label: "Rata-rata harga/video",
            value: hasData
              ? formatRupiah(
                  Math.round(
                    stats.reduce((s, p) => s + p.avgPrice, 0) / stats.length,
                  ),
                )
              : "—",
            note: hasData ? "antar semua kategori" : "belum ada paket aktif",
            color: "bg-success-50 text-success-700",
          },
          {
            icon: TrendingDown,
            label: "Termurah di pasar",
            value: hasData ? formatRupiah(minPrice) : "—",
            note: hasData ? "mulai dari budget kecil" : "belum ada paket aktif",
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
          Harga = paket aktif termurah tiap kreator. Urut dari rata-rata
          termurah. Kreator tanpa paket aktif tidak dihitung.
        </p>

        {!hasData && (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-neutral-400" />
            <p className="mt-3 font-head text-base font-bold text-neutral-800">
              Belum ada data harga
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Belum ada kreator dengan paket aktif di kategori mana pun. Angka
              pasar akan muncul begitu ada kreator memasang paket.
            </p>
          </div>
        )}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((p: PriceStat) => {
            const width = Math.max(6, Math.round((p.avgPrice / maxAvg) * 100));
            return (
              <div
                key={p.category}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-sm hover:shadow-primary-500/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
                      {p.category}
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
            dipangkas seenaknya. Angka di atas adalah paket aktif{" "}
            <em>termurah</em> tiap kreator; paket lain di profilnya memakai
            harga masing-masing.
          </p>
        </div>
      </section>
    </div>
  );
}