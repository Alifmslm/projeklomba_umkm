/**
 * Metadata paket (kuota revisi + estimasi pengerjaan) — ARCHITECTURE §4.6.
 *
 * Data layer mock belum punya kolom `revision_quota`/`estimated_days`
 * (change ini tidak menyentuh lib/*), jadi nilai default diturunkan dari
 * NAMA paket lewat fixture deterministik ini. Dipakai oleh halaman
 * `/dashboard/influencer/paket` (kelola) dan `/booking/[influencerId]`
 * (pilih paket) agar selalu konsisten.
 */

export type PackageMeta = {
  /** kuota revisi 1–5 */
  quota: number;
  /** estimasi pengerjaan dalam hari */
  days: number;
};

const DEFAULT_META: PackageMeta = { quota: 2, days: 5 };

const META_BY_NAME: Record<string, PackageMeta> = {
  "Review Video": { quota: 2, days: 5 },
  "Unboxing & Story": { quota: 1, days: 3 },
  "Kampanye Komplit": { quota: 3, days: 7 },
};

export function packageMeta(name: string): PackageMeta {
  return META_BY_NAME[name] ?? DEFAULT_META;
}