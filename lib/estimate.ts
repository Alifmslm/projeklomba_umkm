/**
 * Engine estimasi jangkauan & ROI untuk kreator (fitur pembeda).
 *
 * SEMUA angka di file ini adalah ASUMSI untuk membantu UMKM memberi gambaran
 * kasar, BUKAN jaminan hasil nyata. Asumsi dipusatkan di sini supaya mudah
 * dibaca dan diubah, dan konsisten antara kartu kreator & halaman detail.
 */

/** Rasio interaksi default kalau nilai kreator tidak tersedia (3.5%) */
export const DEFAULT_ENGAGEMENT_RATE = 0.035;

/** Asumsi: persentase audiens yang tersentuh lalu bertransaksi (2%) */
export const CONVERSION_RATE = 0.02;

/** Asumsi: nilai transaksi rata-rata per pelanggan baru (Rp) */
export const AVG_BASKET_RP = 50_000;

/**
 * Perkiraan jumlah audiens yang tersentuh per video.
 * Rumus: followers × engagement rate.
 */
export function estimateReach(
  followers: number,
  engagementRate: number = DEFAULT_ENGAGEMENT_RATE,
): number {
  return followers * engagementRate;
}

/**
 * Perkiraan ROI paket (berapa kali balik modal).
 * Rumus: (jangkauan × konversi × nilai transaksi) / harga paket.
 * Menerima `reach` yang sudah dihitung agar tetap pure & bisa diuji per tahap.
 */
export function estimateRoi(packagePrice: number, reach: number): number {
  if (packagePrice <= 0) return 0;
  const potentialRevenue = reach * CONVERSION_RATE * AVG_BASKET_RP;
  return potentialRevenue / packagePrice;
}