import { db } from "@/lib/db";
import type {
  Booking,
  BookingStatus,
  BookingWithInfluencer,
  BookingWithUmkm,
  Influencer,
  Package,
  PriceStat,
  RecommendedInfluencer,
  Review,
  ReviewWithAuthor,
  Umkm,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Helper row mappers                                                  */
/* ------------------------------------------------------------------ */

function parseJsonArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function mapInfluencer(row: Record<string, unknown>): Influencer {
  return {
    id: Number(row.id),
    name: String(row.name),
    handle: String(row.handle),
    niche: String(row.niche),
    city: String(row.city),
    followers: Number(row.followers),
    basePrice: Number(row.base_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    verified: Number(row.verified) === 1,
    bio: String(row.bio),
    color: String(row.color),
  };
}

function mapPackage(row: Record<string, unknown>): Package {
  return {
    id: Number(row.id),
    influencerId: Number(row.influencer_id),
    name: String(row.name),
    price: Number(row.price),
    summary: String(row.summary),
    includes: parseJsonArray(row.includes),
  };
}

function mapUmkm(row: Record<string, unknown>): Umkm {
  return {
    id: Number(row.id),
    name: String(row.name),
    owner: String(row.owner),
    category: String(row.category),
    city: String(row.city),
  };
}

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: Number(row.id),
    code: String(row.code),
    influencerId: Number(row.influencer_id),
    umkmId: Number(row.umkm_id),
    packageName: String(row.package_name),
    amount: Number(row.amount),
    message: String(row.message),
    status: String(row.status) as BookingStatus,
    createdAt: String(row.created_at),
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: Number(row.id),
    bookingId: Number(row.booking_id),
    reviewerRole: String(row.reviewer_role) as Review["reviewerRole"],
    reviewerId: Number(row.reviewer_id),
    revieweeType: String(row.reviewee_type) as Review["revieweeType"],
    revieweeId: Number(row.reviewee_id),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: String(row.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* Influencer                                                          */
/* ------------------------------------------------------------------ */

export type InfluencerFilter = {
  q?: string;
  niche?: string;
  city?: string;
  maxPrice?: number;
  sort?: "terpopuler" | "termurah" | "rating";
};

export function getInfluencers(filter: InfluencerFilter = {}): Influencer[] {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filter.q) {
    where.push(
      "(name LIKE ? OR handle LIKE ? OR city LIKE ? OR niche LIKE ?)",
    );
    const like = `%${filter.q}%`;
    params.push(like, like, like, like);
  }
  if (filter.niche) {
    where.push("niche = ?");
    params.push(filter.niche);
  }
  if (filter.city) {
    where.push("city = ?");
    params.push(filter.city);
  }
  if (filter.maxPrice && filter.maxPrice > 0) {
    where.push("base_price <= ?");
    params.push(filter.maxPrice);
  }

  const orderBy =
    filter.sort === "termurah"
      ? "base_price ASC"
      : filter.sort === "rating"
        ? "rating DESC, review_count DESC"
        : "followers DESC";

  const sql = `SELECT * FROM influencers ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY ${orderBy}`;

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(mapInfluencer);
}

export function getInfluencerById(id: number): Influencer | null {
  const row = db
    .prepare("SELECT * FROM influencers WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapInfluencer(row) : null;
}

export function getPackagesByInfluencer(id: number): Package[] {
  const rows = db
    .prepare("SELECT * FROM packages WHERE influencer_id = ? ORDER BY price ASC")
    .all(id) as Record<string, unknown>[];
  return rows.map(mapPackage);
}

export function getPackageById(id: number): Package | null {
  const row = db
    .prepare("SELECT * FROM packages WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapPackage(row) : null;
}

export function getFeaturedInfluencers(limit = 4): Influencer[] {
  const rows = db
    .prepare(
      `SELECT * FROM influencers
       WHERE verified = 1
       ORDER BY rating DESC, review_count DESC
       LIMIT ?`,
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map(mapInfluencer);
}

export function getRelatedInfluencers(niche: string, excludeId: number, limit = 4): Influencer[] {
  const rows = db
    .prepare(
      `SELECT * FROM influencers
       WHERE niche = ? AND id != ?
       ORDER BY followers DESC
       LIMIT ?`,
    )
    .all(niche, excludeId, limit) as Record<string, unknown>[];
  return rows.map(mapInfluencer);
}

export function getNiches(): string[] {
  const rows = db
    .prepare("SELECT DISTINCT niche FROM influencers ORDER BY niche")
    .all() as Record<string, unknown>[];
  return rows.map((r) => String(r.niche));
}

export function getCities(): string[] {
  const rows = db
    .prepare("SELECT DISTINCT city FROM influencers ORDER BY city")
    .all() as Record<string, unknown>[];
  return rows.map((r) => String(r.city));
}

/* ------------------------------------------------------------------ */
/* UMKM                                                                */
/* ------------------------------------------------------------------ */

export function getUmkmById(id: number): Umkm | null {
  const row = db
    .prepare("SELECT * FROM umkms WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapUmkm(row) : null;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

export function getBookingsByUmkm(umkmId: number): BookingWithInfluencer[] {
  const rows = db
    .prepare(
      `SELECT b.*,
              i.name  AS influencer_name,
              i.handle AS influencer_handle,
              i.color AS influencer_color,
              i.city  AS influencer_city,
              i.niche AS niche
       FROM bookings b
       JOIN influencers i ON i.id = b.influencer_id
       WHERE b.umkm_id = ?
       ORDER BY b.created_at DESC, b.id DESC`,
    )
    .all(umkmId) as Record<string, unknown>[];
  return rows.map((row) => ({
    ...mapBooking(row),
    influencerName: String(row.influencer_name),
    influencerHandle: String(row.influencer_handle),
    influencerColor: String(row.influencer_color),
    influencerCity: String(row.influencer_city),
    niche: String(row.niche),
  }));
}

export function getBookingsByInfluencer(
  influencerId: number,
): BookingWithUmkm[] {
  const rows = db
    .prepare(
      `SELECT b.*,
              u.name     AS umkm_name,
              u.owner    AS umkm_owner,
              u.city     AS umkm_city,
              u.category AS umkm_category
       FROM bookings b
       JOIN umkms u ON u.id = b.umkm_id
       WHERE b.influencer_id = ?
       ORDER BY b.created_at DESC, b.id DESC`,
    )
    .all(influencerId) as Record<string, unknown>[];
  return rows.map((row) => ({
    ...mapBooking(row),
    umkmName: String(row.umkm_name),
    umkmOwner: String(row.umkm_owner),
    umkmCity: String(row.umkm_city),
    umkmCategory: String(row.umkm_category),
  }));
}

export function getBookingById(id: number): Booking | null {
  const row = db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapBooking(row) : null;
}

export function createBooking(input: {
  influencerId: number;
  umkmId: number;
  packageName: string;
  amount: number;
  message: string;
}): Booking {
  const year = new Date().getFullYear();
  // Placeholder unik dulu, baru diganti kode cantik setelah id terbentuk
  const placeholder = `CLB-${year}-${Date.now().toString(36).toUpperCase()}`;
  const result = db
    .prepare(
      `INSERT INTO bookings
         (code, influencer_id, umkm_id, package_name, amount, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
    )
    .run(
      placeholder,
      input.influencerId,
      input.umkmId,
      input.packageName,
      input.amount,
      input.message,
      new Date().toISOString(),
    );

  const id = Number(result.lastInsertRowid);
  const code = `CLB-${year}-${String(id).padStart(4, "0")}`;
  db.prepare("UPDATE bookings SET code = ? WHERE id = ?").run(code, id);

  const booking = getBookingById(id);
  if (!booking) throw new Error("Gagal membuat booking");
  return booking;
}

export function updateBookingStatus(
  bookingId: number,
  status: BookingStatus,
): void {
  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(
    status,
    bookingId,
  );
}

/* ------------------------------------------------------------------ */
/* Statistik (untuk landing page)                                      */
/* ------------------------------------------------------------------ */

export function getLandingStats() {
  const scalar = (sql: string) =>
    Number((db.prepare(sql).get() as Record<string, unknown>).c ?? 0);

  return {
    influencerCount: scalar("SELECT COUNT(*) AS c FROM influencers"),
    verifiedCount: scalar(
      "SELECT COUNT(*) AS c FROM influencers WHERE verified = 1",
    ),
    doneCount: scalar(
      "SELECT COUNT(*) AS c FROM bookings WHERE status = 'DONE'",
    ),
    umkmCount: scalar("SELECT COUNT(*) AS c FROM umkms"),
    cityCount: scalar("SELECT COUNT(DISTINCT city) AS c FROM influencers"),
    nicheCount: scalar("SELECT COUNT(DISTINCT niche) AS c FROM influencers"),
    totalReach: scalar("SELECT SUM(followers) AS c FROM influencers"),
    avgRating: Number(
      (db.prepare("SELECT AVG(rating) AS c FROM influencers").get() as Record<
        string,
        unknown
      >).c ?? 0,
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Review & rating 2 arah                                              */
/* ------------------------------------------------------------------ */

/** Review milik satu sisi (umkm/influencer) untuk sebuah booking, null jika belum. */
export function getReviewForBookingRole(
  bookingId: number,
  reviewerRole: Review["reviewerRole"],
): Review | null {
  const row = db
    .prepare(
      "SELECT * FROM reviews WHERE booking_id = ? AND reviewer_role = ?",
    )
    .get(bookingId, reviewerRole) as Record<string, unknown> | undefined;
  return row ? mapReview(row) : null;
}

export function hasReviewed(
  bookingId: number,
  reviewerRole: Review["reviewerRole"],
): boolean {
  return getReviewForBookingRole(bookingId, reviewerRole) !== null;
}

/** Rating rata-rata UMKM (dihitung langsung dari ulasan kreator). */
export function getUmkmRating(umkmId: number): {
  avg: number;
  count: number;
} {
  const row = db
    .prepare(
      `SELECT ROUND(AVG(rating), 2) AS avg, COUNT(*) AS count
       FROM reviews WHERE reviewee_type = 'umkm' AND reviewee_id = ?`,
    )
    .get(umkmId) as Record<string, unknown>;
  return {
    avg: Number(row.avg ?? 0),
    count: Number(row.count ?? 0),
  };
}

export function createReview(input: {
  bookingId: number;
  reviewerRole: Review["reviewerRole"];
  reviewerId: number;
  revieweeType: Review["revieweeType"];
  revieweeId: number;
  rating: number;
  comment: string;
}): Review {
  db.prepare(
    `INSERT INTO reviews
       (booking_id, reviewer_role, reviewer_id, reviewee_type, reviewee_id, rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
      input.bookingId,
      input.reviewerRole,
      input.reviewerId,
      input.revieweeType,
      input.revieweeId,
      input.rating,
      input.comment,
      new Date().toISOString(),
    );

  // Kalau kreator yang dinilai, perbarui rating & jumlah ulasannya
  // (rata-rata tertimbang dengan data historis yang sudah ada).
  if (input.revieweeType === "influencer") {
    const inf = getInfluencerById(input.revieweeId);
    if (inf) {
      const newCount = inf.reviewCount + 1;
      const newRating =
        (inf.rating * inf.reviewCount + input.rating) / newCount;
      db.prepare(
        "UPDATE influencers SET rating = ROUND(?, 2), review_count = ? WHERE id = ?",
      ).run(newRating, newCount, inf.id);
    }
  }

  const review = getReviewForBookingRole(input.bookingId, input.reviewerRole);
  if (!review) throw new Error("Gagal membuat review");
  return review;
}

/** Ulasan yang diterima seorang kreator (ditulis oleh UMKM). */
export function getReviewsForInfluencer(
  influencerId: number,
  limit?: number,
): ReviewWithAuthor[] {
  const rows = db
    .prepare(
      `SELECT r.*,
              u.name     AS author_name,
              u.owner    AS author_handle,
              'from-slate-500 to-slate-700' AS author_color,
              b.package_name AS package_name
       FROM reviews r
       JOIN umkms u ON u.id = r.reviewer_id AND r.reviewer_role = 'umkm'
       JOIN bookings b ON b.id = r.booking_id
       WHERE r.reviewee_type = 'influencer' AND r.reviewee_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       ${limit ? "LIMIT ?" : ""}`,
    )
    .all(...(limit ? [influencerId, limit] : [influencerId])) as Record<
    string,
    unknown
  >[];
  return rows.map((row) => ({
    ...mapReview(row),
    authorName: String(row.author_name),
    authorColor: String(row.author_color),
    authorHandle: String(row.author_handle),
    packageName: String(row.package_name),
  }));
}

/** Ulasan yang diterima sebuah UMKM (ditulis oleh kreator). */
export function getReviewsForUmkm(umkmId: number): ReviewWithAuthor[] {
  const rows = db
    .prepare(
      `SELECT r.*,
              i.name     AS author_name,
              i.handle   AS author_handle,
              i.color    AS author_color,
              b.package_name AS package_name
       FROM reviews r
       JOIN influencers i ON i.id = r.reviewer_id AND r.reviewer_role = 'influencer'
       JOIN bookings b ON b.id = r.booking_id
       WHERE r.reviewee_type = 'umkm' AND r.reviewee_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
    )
    .all(umkmId) as Record<string, unknown>[];
  return rows.map((row) => ({
    ...mapReview(row),
    authorName: String(row.author_name),
    authorColor: String(row.author_color),
    authorHandle: String(row.author_handle),
    packageName: String(row.package_name),
  }));
}

/* ------------------------------------------------------------------ */
/* Matchmaking sederhana (dashboard UMKM)                              */
/* ------------------------------------------------------------------ */

/**
 * Rekomendasi kreator untuk sebuah UMKM berdasarkan kesamaan sederhana:
 * - kategori usaha == niche kreator  (+3)
 * - kota usaha == kota kreator       (+2)
 * - harga paket masih terjangkau     (+1)
 */
export function getRecommendedInfluencers(
  umkm: Umkm,
  limit = 3,
): RecommendedInfluencer[] {
  const all = getInfluencers();
  const scored = all
    .map((inf) => {
      const reasons: string[] = [];
      let score = 0;
      if (inf.niche === umkm.category) {
        score += 3;
        reasons.push("Kategori sama dengan usahamu");
      }
      if (inf.city === umkm.city) {
        score += 2;
        reasons.push("Satu kota dengan usahamu");
      }
      if (inf.basePrice <= 1_500_000) {
        score += 1;
        reasons.push("Harga di bawah Rp 1,5 jt/video");
      }
      return { ...inf, score, matchReasons: reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.rating - a.rating || b.followers - a.followers,
    );
  return scored.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Wawasan harga pasar per niche (halaman /insights)                   */
/* ------------------------------------------------------------------ */

export function getPriceStats(): PriceStat[] {
  const rows = db
    .prepare(
      `SELECT niche,
              COUNT(*)      AS count,
              MIN(base_price) AS min_price,
              ROUND(AVG(base_price)) AS avg_price,
              MAX(base_price) AS max_price
       FROM influencers
       GROUP BY niche
       ORDER BY avg_price ASC`,
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => ({
    niche: String(row.niche),
    count: Number(row.count),
    minPrice: Number(row.min_price),
    avgPrice: Number(row.avg_price),
    maxPrice: Number(row.max_price),
  }));
}