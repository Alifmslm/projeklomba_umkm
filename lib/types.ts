/**
 * Domain types.
 *
 * These shapes are what Postgres returns after `catalog-and-booking`, not what the
 * SQLite prototype happened to hold. Three differences are load-bearing and are
 * worth naming, because they look like regressions if you meet them without the
 * story:
 *
 *  - `niche` is gone. SQLite stored it as free text; Postgres has
 *    `influencers.category_id` referencing `categories`. So a creator carries both
 *    `categorySlug` (for palette and filters) and `category` (the display name),
 *    read from the embedded category row. There is no free-text niche to fall back
 *    to, which is the point: two spellings of one category used to be two
 *    different filters.
 *  - `basePrice` is now `startingPrice`, the database column's real name. It is
 *    maintained by the `maintain_starting_price` trigger, and **0 means the creator
 *    has no active package** rather than being free. Anything that treats it as a
 *    number has to exclude it explicitly.
 *  - `BookingStatus` carries all nine states of the `booking_status` enum, not the
 *    four the prototype invented. The prototype's `APPROVED`/`DONE` do not exist in
 *    the database, so a status literal that is not in this union cannot be stored.
 */

/** A catalog category. `slug` is the stable key; `name` is what the UI shows. */
export type Category = {
  id: number;
  slug: string;
  name: string;
};

export type Influencer = {
  id: number;
  name: string;
  /** Stored with the leading `@`, as `@raranadia`. */
  handle: string;
  categoryId: number;
  categorySlug: string;
  /** Category display name, from the embedded `categories` row. */
  category: string;
  city: string;
  followers: number;
  /** rasio interaksi untuk estimasi jangkauan (0.03 = 3%) */
  engagementRate: number;
  /**
   * Cheapest active package, in rupiah. **0 means there is no active package.**
   * Kept in sync by the `maintain_starting_price` trigger, never written by hand.
   */
  startingPrice: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  bio: string;
  /**
   * Every package, active or not. The embed is unfiltered so the package
   * management screen can show a deactivated package; public pages filter on
   * `isActive` themselves rather than receiving a pre-filtered list.
   */
  packages: Package[];
};

export type Package = {
  id: number;
  influencerId: number;
  name: string;
  price: number;
  /** ringkasan deliverable, contoh: "1 video 30-60 detik" */
  summary: string;
  includes: string[];
  revisionQuota: number;
  estimatedDays: number;
  isActive: boolean;
};

export type Umkm = {
  id: number;
  name: string;
  owner: string;
  categoryId: number;
  categorySlug: string;
  category: string;
  city: string;
};

/** Every state of the `booking_status` enum. Nothing outside this union is storable. */
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "FUNDED"
  | "SUBMITTED"
  | "REVISION"
  | "DISPUTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

/** States a booking can still be acted on in, for the transition map. */
export const TERMINAL_STATUSES: readonly BookingStatus[] = [
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

/** Who made a change. `system` is reserved for a future clock; nothing writes it here. */
export type ActorRole = "umkm" | "influencer" | "admin" | "system";

/** The two sides of a booking. `disputes.opened_by` is narrower than `actor_role`. */
export type PartyRole = "umkm" | "influencer";

/** Every state of the `payment_status` enum. */
export type PaymentStatus =
  | "UNPAID"
  | "HELD"
  | "RELEASED"
  | "REFUNDED"
  | "SPLIT";

/**
 * Accepted brief length, in characters. Shared so the form's hint, the client
 * attribute, and the Server Action's refusal all quote the same bounds instead
 * of three numbers that drift.
 */
export const BRIEF_MIN = 20;
export const BRIEF_MAX = 500;

export type Booking = {
  id: number;
  code: string;
  umkmId: number;
  influencerId: number;
  packageId: number;
  /**
   * Snapshotted from the package at submission time. Deliberately a copy rather
   * than a join: a creator renaming or repricing a package must not rewrite what a
   * signed booking agreed to.
   */
  packageName: string;
  /** Snapshotted alongside the name: what the package included at submission. */
  packageIncludes: string[];
  amount: number;
  revisionQuota: number;
  estimatedDays: number;
  /** The request text. Named `brief` in the database. */
  brief: string;
  status: BookingStatus;
  revisionsUsed: number;
  reviewExtended: boolean;
  createdAt: string;
  /**
   * Milestone timestamps, one per move that records one. Null until that move
   * happens. `paymentDueAt`, `deadlineAt`, and `reviewDueAt` are displayed only:
   * nothing in the app reads them to change a state (booking-lifecycle decision 9).
   */
  briefLockedAt: string | null;
  acceptedAt: string | null;
  paymentDueAt: string | null;
  fundedAt: string | null;
  deadlineAt: string | null;
  submittedAt: string | null;
  reviewDueAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  /**
   * The payment's state, carried on the list row so a dashboard can derive
   * earnings and held amounts from payment records rather than guessing from
   * `status` (escrow-payments). Null for a request that was never accepted, so
   * no payment record exists. The full record is on `BookingDetail`.
   */
  paymentStatus: PaymentStatus | null;
  /**
   * The amounts from that same payment stub. `paymentCreatorAmount` is the full
   * total once `RELEASED`, the negotiated creator share when `SPLIT`, and zero
   * before settlement; `paymentUmkmRefundAmount` is the refunded share when
   * `SPLIT`/`REFUNDED`. Both are zero when there is no payment row.
   */
  paymentCreatorAmount: number;
  paymentUmkmRefundAmount: number;
};

/** Exactly one payment record per booking; `payments.booking_id` is unique. */
export type Payment = {
  id: number;
  bookingId: number;
  totalAmount: number;
  /** Zero until release, and the full total at release. */
  creatorAmount: number;
  umkmRefundAmount: number;
  status: PaymentStatus;
  heldAt: string | null;
  settledAt: string | null;
};

/** The three settlement steps of the ladder an offer can carry (ARCHITECTURE §2.6). */
export type OfferType = "EXTRA_REVISION" | "DISCOUNT" | "CANCELLATION";

/** Every state of the `offer_status` enum. `EXPIRED` is also derived lazily on read. */
export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

/**
 * One settlement offer on a booking. At most one is `PENDING` at a time (partial
 * unique index); `value` is type-dependent: a count for `EXTRA_REVISION`, the
 * creator's accepted amount for `DISCOUNT`, the refund for `CANCELLATION`.
 */
export type Offer = {
  id: number;
  bookingId: number;
  offeredBy: PartyRole;
  type: OfferType;
  value: number;
  fee: number;
  note: string | null;
  status: OfferStatus;
  expiresAt: string;
  respondedAt: string | null;
  escalatedAt: string | null;
  createdAt: string;
};

/** One version the creator submitted. `contentUrl` is required; the note is not. */
export type Delivery = {
  id: number;
  bookingId: number;
  round: number;
  contentUrl: string;
  note: string | null;
  submittedAt: string;
};

/**
 * One revision request, naming one delivered round and one section.
 * `deliveryId` is unique, so each round can be asked about once.
 */
export type RevisionRequest = {
  id: number;
  bookingId: number;
  deliveryId: number;
  round: number;
  section: string;
  note: string;
  /** A request outside the brief is recorded but does not consume quota. */
  withinBrief: boolean;
  createdAt: string;
};

/** One entry on a booking's timeline. Written only by the transition function. */
export type BookingEvent = {
  id: number;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorRole: ActorRole;
  actorId: string | null;
  note: string | null;
  createdAt: string;
};

/**
 * Everything the detail page reads for one booking: the row, its payment, the
 * delivered rounds, the revision requests, and the timeline. Assembled from
 * party-scoped reads, so a caller who is not a party gets null instead.
 */
export type BookingDetail = Booking & {
  payment: Payment | null;
  deliveries: Delivery[];
  revisions: RevisionRequest[];
  events: BookingEvent[];
  /** Every offer on this booking, newest first. At most one is `PENDING`. */
  offers: Offer[];
};

/** Booking joined with the creator, for the UMKM dashboard. */
export type BookingWithInfluencer = Booking & {
  influencerName: string;
  influencerHandle: string;
  influencerCategorySlug: string;
  influencerCity: string;
  influencerCategory: string;
};

/** Booking joined with the business, for the creator dashboard. */
export type BookingWithUmkm = Booking & {
  umkmName: string;
  umkmOwner: string;
  umkmCity: string;
  umkmCategory: string;
  umkmCategorySlug: string;
};

/* ------------------------------------------------------------------ */
/* Review & rating 2 arah (fitur pembeda)                              */
/* ------------------------------------------------------------------ */

export type Review = {
  id: number;
  bookingId: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerRole: "umkm" | "influencer";
  /** Exactly one of these two is set - `reviews_reviewee_chk` guarantees it. */
  revieweeUmkmId: number | null;
  revieweeInfluencerId: number | null;
};

/**
 * Review with its author attached.
 *
 * The author's category slug is carried rather than a colour class, so the palette
 * is looked up from `lib/data/palette.ts` at render time. See that file for why a
 * class string cannot come from the database.
 */
export type ReviewWithAuthor = Review & {
  authorName: string;
  authorHandle: string;
  authorCategorySlug: string;
  packageName: string;
};

/** Statistik harga per kategori untuk halaman Wawasan Harga */
export type PriceStat = {
  categoryId: number;
  categorySlug: string;
  category: string;
  /** Creators in this category that actually have an active package. */
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

/* ------------------------------------------------------------------ */
/* Notifikasi UMKM (diturunkan dari status booking, tanpa tabel baru)  */
/* ------------------------------------------------------------------ */

export type UmkmNotificationKind =
  | "pending"
  | "accepted"
  | "rejected"
  | "review";

export interface UmkmNotification {
  key: string;
  kind: UmkmNotificationKind;
  title: string;
  desc: string;
  href: string;
}