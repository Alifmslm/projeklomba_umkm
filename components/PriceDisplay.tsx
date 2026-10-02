import { formatRupiah } from "@/lib/format";

const SIZES = {
  sm: { price: "text-lg", unit: "text-xs" },
  md: { price: "text-2xl", unit: "text-sm" },
  lg: { price: "text-3xl", unit: "text-base" },
} as const;

/**
 * PriceDisplay (DESIGN_SYSTEM §10.3): harga harus langsung terbaca —
 * angka tebal 20-24px, satuan "/ video", label pendukung kecil.
 * Warna tidak dipakai sendirian untuk menandai mahal/murah.
 */
export function PriceDisplay({
  price,
  unit = "video",
  prefix = "Mulai dari",
  size = "md",
  className = "",
}: {
  price: number;
  unit?: string;
  prefix?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div className={className}>
      <p className="text-xs font-medium text-neutral-500">{prefix}</p>
      <p className={`font-head font-bold tracking-[-0.02em] text-neutral-900 ${s.price}`}>
        {formatRupiah(price)}
        <span className={`font-medium text-neutral-500 ${s.unit}`}> / {unit}</span>
      </p>
    </div>
  );
}