import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode } from "react";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { getCities, getInfluencers, getNiches } from "@/lib/data";
import { InfluencerCard } from "@/components/InfluencerCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cari Kreator",
  description:
    "Jelajahi daftar content creator untuk kolaborasi UMKM. Filter berdasarkan kategori, kota, harga per video, dan peringkat.",
};

const MAX_PRICES = [
  { value: "", label: "Semua harga" },
  { value: "500000", label: "≤ Rp 500 rb" },
  { value: "1000000", label: "≤ Rp 1 jt" },
  { value: "2000000", label: "≤ Rp 2 jt" },
  { value: "5000000", label: "≤ Rp 5 jt" },
];

const SORTS = [
  { value: "", label: "Terpopuler" },
  { value: "termurah", label: "Termurah" },
  { value: "rating", label: "Rating tertinggi" },
];

// Komponen kecil murni-server agar tidak mengubah tanda tangan page
function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default async function InfluencersPage(props: PageProps<"/influencers">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const niche = typeof params.niche === "string" ? params.niche : "";
  const city = typeof params.city === "string" ? params.city : "";
  const maxPrice = Number(
    typeof params.maxPrice === "string" && params.maxPrice !== ""
      ? params.maxPrice
      : 0,
  );
  const sort = typeof params.sort === "string" ? params.sort : "";

  const influencers = getInfluencers({
    q: q || undefined,
    niche: niche || undefined,
    city: city || undefined,
    maxPrice: maxPrice || undefined,
    sort: (sort as "terpopuler" | "termurah" | "rating") || undefined,
  });

  const niches = getNiches();
  const cities = getCities();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Cari Kreator
          </h1>
          <p className="mt-1.5 text-slate-600">
            {influencers.length} kreator ditemukan untuk UMKM-mu
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          Gunakan filter untuk mempersempit pencarian
        </div>
      </div>

      {/* Filter bar */}
      <form
        method="GET"
        action="/influencers"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FilterField label="Cari nama / kota / kategori">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Misal: kuliner Bandung…"
                className={inputCls}
              />
            </FilterField>
          </div>
          <FilterField label="Kategori">
            <select name="niche" defaultValue={niche} className={inputCls}>
              <option value="">Semua kategori</option>
              {niches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Kota">
            <select name="city" defaultValue={city} className={inputCls}>
              <option value="">Semua kota</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Harga / video">
            <select
              name="maxPrice"
              defaultValue={
                maxPrice ? String(maxPrice) : "" // sertakan nilai kustom jika ada
              }
              className={inputCls}
            >
              {MAX_PRICES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Urutkan">
            <select name="sort" defaultValue={sort} className={inputCls}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FilterField>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Harga per video adalah rata-rata paket paling murah tiap kreator.
          </p>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:brightness-110"
          >
            Terapkan Filter
          </button>
        </div>
      </form>

      {/* Hasil */}
      {influencers.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf) => (
            <InfluencerCard key={inf.id} influencer={inf} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <SearchX className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            Tidak ada kreator yang cocok
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Coba perlonggar filter atau ubah kata kunci pencarianmu.
          </p>
          <Link
            href="/influencers"
            className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
          >
            Reset Filter
          </Link>
        </div>
      )}
    </div>
  );
}