const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1200000 -> "Rp 1.200.000" */
export function formatRupiah(value: number): string {
  return rupiah.format(value);
}

/** 245000 -> "245 rb", 1500000 -> "1,5 jt" */
export function formatFollowers(value: number): string {
  return compact.format(value).replace(" ribu", " rb");
}

/** "Rara Nadia" -> "RN" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Tanggal ISO -> "12 Sep 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
