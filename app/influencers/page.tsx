import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { getCities, getInfluencers, getNiches } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { UmkmShell } from "@/components/UmkmShell";
import { CreatorCard } from "@/components/CreatorCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";

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

export default async function InfluencersPage(props: PageProps<"/influencers">) {
  const session = await getSession();
  const isUmkm = session?.role === "umkm";

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

  // Pertahankan filter lain saat chip niche di-toggle (semantik GET sama
  // dengan form; hanya mempermudah pemilihan kategori).
  const preserved = new URLSearchParams();
  if (q) preserved.set("q", q);
  if (city) preserved.set("city", city);
  if (maxPrice) preserved.set("maxPrice", String(maxPrice));
  if (sort) preserved.set("sort", sort);
  const chipHref = (n: string) => {
    const sp = new URLSearchParams(preserved);
    if (n) sp.set("niche", n);
    else sp.delete("niche");
    const s = sp.toString();
    return s ? `/influencers?${s}` : "/influencers";
  };

  const chipCls = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm ${
      active
        ? "border-primary-500 bg-primary-50 text-primary-700"
        : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
    }`;

  // Same content renders in both contexts — UMKM sees it inside the
  // dashboard sidebar + header (UmkmShell provides the page container),
  // guests/public keep the standalone centered container.
  const body = (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
            Cari Kreator
          </h1>
          <p className="mt-1.5 text-neutral-600">
            {influencers.length} kreator ditemukan untuk UMKM-mu
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-500">
          <SlidersHorizontal className="h-4 w-4 text-primary-600" />
          Gunakan filter untuk mempersempit pencarian
        </div>
      </div>

      {/* Chip kategori */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={chipHref("")} className={chipCls(niche === "")}>
          Semua kategori
        </Link>
        {niches.map((n) => (
          <Link key={n} href={chipHref(n)} className={chipCls(niche === n)}>
            {n}
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <form
        method="GET"
        action="/influencers"
        className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Misal: kuliner Bandung…"
              label="Cari nama / kota / kategori"
            />
          </div>
          <Select name="niche" defaultValue={niche} label="Kategori">
            <option value="">Semua kategori</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <Select name="city" defaultValue={city} label="Kota">
            <option value="">Semua kota</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            name="maxPrice"
            defaultValue={maxPrice ? String(maxPrice) : ""}
            label="Harga / video"
          >
            {MAX_PRICES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={sort} label="Urutkan">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            Harga per video adalah rata-rata paket paling murah tiap kreator.
          </p>
          <Button type="submit" variant="primary">
            Terapkan Filter
          </Button>
        </div>
      </form>

      {/* Hasil */}
      {influencers.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {influencers.map((inf) => (
            <CreatorCard key={inf.id} influencer={inf} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={SearchX}
            title="Tidak ada kreator yang cocok"
            description="Coba perlonggar filter atau ubah kata kunci pencarianmu."
            action={
              <Link
                href="/influencers"
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700"
              >
                Reset Filter
              </Link>
            }
          />
        </div>
      )}
    </>
  );

  if (isUmkm) return <UmkmShell>{body}</UmkmShell>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{body}</div>
  );
}