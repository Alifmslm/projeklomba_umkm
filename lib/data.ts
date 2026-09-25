import { db } from "@/lib/db";
import type {
  Booking,
  BookingStatus,
  BookingWithInfluencer,
  BookingWithUmkm,
  Influencer,
  Package,
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