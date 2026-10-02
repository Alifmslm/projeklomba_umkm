import type { Metadata } from "next";
import { Scale, SearchX } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/Button";
import { DataTable, type TableColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  kasusList,
  type Kasus,
} from "@/components/kasus-fixture";
import { KasusClient } from "./kasus-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Antrian Kasus",
  description:
    "Antrian kasus sengketa Kolab.id — urutkan berdasarkan batas keputusan terdekat.",
};

const FILTERS = [
  "semua",
  "dibuka",
  "menunggu-info",
  "terlambat",
  "diputuskan",
] as const;
type FilterKey = (typeof FILTERS)[number];

function applyFilter(cases: Kasus[], filter: FilterKey): Kasus[] {
  const sorted = [...cases].sort(
    (a, b) =>
      new Date(a.batasKeputusan).getTime() -
      new Date(b.batasKeputusan).getTime(),
  );
  switch (filter) {
    case "dibuka":
      return sorted.filter((k) => k.status === "OPEN");
    case "menunggu-info":
      return sorted.filter((k) => k.status === "NEED_INFO");
    case "terlambat":
      return sorted.filter((k) => k.status !== "RESOLVED" && k.terlambat);
    case "diputuskan":
      return sorted.filter((k) => k.status === "RESOLVED");
    default:
      return sorted;
  }
}

const COLUMNS: TableColumn<Kasus>[] = [
  {
    key: "kode",
    header: "Kode Booking",
    cell: (k) => (
      <span className="font-semibold text-neutral-900">{k.bookingKode}</span>
    ),
  },
  {
    key: "umkm",
    header: "UMKM",
    cell: (k) => <span className="text-neutral-700">{k.umkm}</span>,
  },
  {
    key: "kreator",
    header: "Kreator",
    cell: (k) => <span className="text-neutral-700">{k.kreator}</span>,
  },
  {
    key: "nominal",
    header: "Nominal",
    cell: (k) => (
      <span className="font-medium text-neutral-900">
        {formatRupiah(k.nominal)}
      </span>
    ),
  },
  {
    key: "dibuka-oleh",
    header: "Dibuka Oleh",
    cell: (k) => <span className="text-neutral-600">{k.dibukaOleh}</span>,
  },
  {
    key: "dibuka-pada",
    header: "Dibuka Pada",
    cell: (k) => (
      <span className="text-neutral-600">{formatDate(k.dibukaPada)}</span>
    ),
  },
  {
    key: "batas",
    header: "Batas Keputusan",
    cell: (k) => (
      <span className="text-neutral-600">{formatDate(k.batasKeputusan)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (k) => (
      <span className="inline-flex items-center gap-2">
        <StatusBadge status={k.status} />
        {k.terlambat && k.status !== "RESOLVED" && (
          <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-error-700">
            Terlambat
          </span>
        )}
      </span>
    ),
  },
  {
    key: "aksi",
    header: "",
    cell: (k) => (
      <Button href={`/admin/kasus/${k.id}`} variant="secondary" size="sm">
        Buka Kasus
      </Button>
    ),
  },
];

export default async function AdminKasusPage(
  props: PageProps<"/admin/kasus">,
) {
  const searchParams = await props.searchParams;
  const rawFilter = searchParams.filter;
  const filter: FilterKey = FILTERS.includes(rawFilter as FilterKey)
    ? (rawFilter as FilterKey)
    : "semua";

  const rows = applyFilter(kasusList, filter);

  return (
    <AdminShell>
      <div>
        <h2 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Antrian Kasus
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Urut berdasarkan batas keputusan terdekat — kasus{" "}
          <span className="font-semibold text-error-700">Terlambat</span>{" "}
          ditandai dan paling butuh perhatian.
        </p>
      </div>

      <div className="mt-5">
        <KasusClient active={filter} />
      </div>

      <div className="mt-5">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          keyOf={(k) => k.id}
          isLate={(k) => k.terlambat && k.status !== "RESOLVED"}
          emptyIcon={SearchX}
          emptyTitle="Tidak ada kasus dengan filter ini"
          emptyDescription="Kasus sengketa baru akan muncul di sini setelah diajukan oleh UMKM atau kreator."
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        <Scale className="mr-1 inline h-3.5 w-3.5 align-middle" />
        Batas keputusan = 3 hari kerja sejak kasus dibuka; jam berhenti selama
        kasus Menunggu Info.
      </p>
    </AdminShell>
  );
}