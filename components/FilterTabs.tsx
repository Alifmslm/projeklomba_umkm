"use client";

export type FilterTab = { key: string; label: string };

/** Tab filter riwayat kolaborasi (ARCHITECTURE §3.6/§4.6). */
export const BOOKING_FILTER_TABS: FilterTab[] = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Menunggu" },
  { key: "berjalan", label: "Berjalan" },
  { key: "sengketa", label: "Sengketa" },
  { key: "selesai", label: "Selesai" },
  { key: "batal", label: "Batal" },
];

/** Tab filter antrian kasus admin (ARCHITECTURE §5.7). */
export const ADMIN_CASE_FILTER_TABS: FilterTab[] = [
  { key: "semua", label: "Semua" },
  { key: "dibuka", label: "Dibuka" },
  { key: "menunggu-info", label: "Menunggu Info" },
  { key: "terlambat", label: "Terlambat" },
  { key: "diputuskan", label: "Diputuskan" },
];

/**
 * FilterTabs (DESIGN_SYSTEM §10.6): chips terpilih = primary-50 +
 * border primary-300 + teks primary-700; default = netral.
 */
export function FilterTabs({
  tabs,
  active,
  onSelect,
  className = "",
}: {
  tabs: FilterTab[];
  active: string;
  onSelect: (key: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tab.key)}
            className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
              selected
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-200 bg-neutral-0 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}