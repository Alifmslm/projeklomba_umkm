export type Influencer = {
  id: number;
  name: string;
  handle: string;
  niche: string;
  city: string;
  followers: number;
  /** rasio interaksi untuk estimasi jangkauan (0.03 = 3%) */
  engagementRate: number;
  /** harga terendah per video (Rp) */
  basePrice: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  bio: string;
  /** gradient classes untuk avatar, contoh: "from-violet-500 to-fuchsia-500" */
  color: string;
};

export type Package = {
  id: number;
  influencerId: number;
  name: string;
  price: number;
  /** ringkasan deliverable, contoh: "1 video 30-60 detik" */
  summary: string;
  includes: string[];
};

export type Umkm = {
  id: number;
  name: string;
  owner: string;
  category: string;
  city: string;
};

export type BookingStatus = "PENDING" | "APPROVED" | "DONE" | "REJECTED";

export type Booking = {
  id: number;
  code: string;
  influencerId: number;
  umkmId: number;
  packageName: string;
  amount: number;
  message: string;
  status: BookingStatus;
  createdAt: string;
};

/** Booking yang sudah di-join dengan data influencer (untuk dashboard UMKM) */
export type BookingWithInfluencer = Booking & {
  influencerName: string;
  influencerHandle: string;
  influencerColor: string;
  influencerCity: string;
  niche: string;
};

/** Booking yang sudah di-join dengan data UMKM (untuk dashboard influencer) */
export type BookingWithUmkm = Booking & {
  umkmName: string;
  umkmOwner: string;
  umkmCity: string;
  umkmCategory: string;
};

export type Session = {
  role: "umkm" | "influencer";
  subjectId: number;
  name: string;
};

/* ------------------------------------------------------------------ */
/* Review & rating 2 arah (fitur pembeda)                              */
/* ------------------------------------------------------------------ */

export type Review = {
  id: number;
  bookingId: number;
  /** siapa yang menulis ulasan */
  reviewerRole: "umkm" | "influencer";
  reviewerId: number;
  /** siapa yang dinilai */
  revieweeType: "influencer" | "umkm";
  revieweeId: number;
  rating: number;
  comment: string;
  createdAt: string;
};

/** Review yang sudah digabung dengan data penulis untuk ditampilkan */
export type ReviewWithAuthor = Review & {
  authorName: string;
  authorColor: string;
  authorHandle: string;
  packageName: string;
};

/** Statistik harga per niche untuk halaman Wawasan Harga */
export type PriceStat = {
  niche: string;
  count: number;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
};

/** Kreator hasil matchmaking sederhana untuk dashboard UMKM */
export type RecommendedInfluencer = Influencer & {
  score: number;
  matchReasons: string[];
};
