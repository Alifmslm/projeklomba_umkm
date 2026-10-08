import { createClient } from "@/utils/supabase/server";
import { mapIncludes } from "@/lib/data/catalog";
import { getOffersForBooking } from "@/lib/data/offers";
import { formatRupiah } from "@/lib/format";
import type {
  Booking,
  BookingDetail,
  BookingEvent,
  BookingStatus,
  BookingWithInfluencer,
  BookingWithUmkm,
  Delivery,
  Payment,
  PaymentStatus,
  RevisionRequest,
  UmkmNotification,
} from "@/lib/types";

/**
 * Booking reads, on Postgres.
 *
 * These are the first reads in the app that are *party-scoped* rather than public.
 * `rls-access-control` put the policy on `bookings` as an EXISTS over the caller's
 * own `profiles.umkm_id` / `profiles.influencer_id`, so every function here reads
 * through the user-scoped client and lets that policy decide.
 *
 * That is why these functions take an id and do not resolve the caller themselves.
 * The argument is not a filter the caller gets to choose freely - it is the id the
 * caller's own session proved, and the RLS policy then refuses the query if it does
 * not belong to them. Reading through the service role would make the argument the
 * only thing standing between one business and another's bookings, which is not a
 * boundary worth having.
 *
 * Note for readers: an RLS-hidden row is an empty `200`, not a `403`. A booking that
 * does not belong to the caller comes back as "not found", never as "forbidden".
 */

type CategoryRow = { id: number; slug: string; name: string };

type InfluencerJoin = {
  id: number;
  name: string;
  handle: string;
  city: string;
  category_id: number;
  categories: CategoryRow | CategoryRow[] | null;
};

type UmkmJoin = {
  id: number;
  name: string;
  owner: string;
  city: string;
  category_id: number;
  categories: CategoryRow | CategoryRow[] | null;
};

type PaymentStub = {
  status: PaymentStatus;
  creator_amount: number;
  umkm_refund_amount: number;
};

type BookingRow = {
  id: number;
  code: string;
  umkm_id: number;
  influencer_id: number;
  package_id: number;
  package_name: string;
  package_includes: unknown;
  amount: number;
  revision_quota: number;
  estimated_days: number;
  brief: string;
  status: BookingStatus;
  revisions_used: number;
  review_extended: boolean;
  created_at: string;
  brief_locked_at: string | null;
  accepted_at: string | null;
  payment_due_at: string | null;
  funded_at: string | null;
  deadline_at: string | null;
  submitted_at: string | null;
  review_due_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  payments: PaymentStub | PaymentStub[] | null;
  influencers: InfluencerJoin | InfluencerJoin[] | null;
  umkms: UmkmJoin | UmkmJoin[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function categoryOf(embed: CategoryRow | CategoryRow[] | null | undefined) {
  const category = one(embed ?? null);
  return { slug: category?.slug ?? "", name: category?.name ?? "" };
}

function mapBooking(row: BookingRow): Booking {
  const payment = one(row.payments);
  return {
    id: row.id,
    code: row.code,
    umkmId: row.umkm_id,
    influencerId: row.influencer_id,
    packageId: row.package_id,
    packageName: row.package_name,
    packageIncludes: mapIncludes(row.package_includes),
    amount: row.amount,
    revisionQuota: row.revision_quota,
    estimatedDays: row.estimated_days,
    brief: row.brief,
    status: row.status,
    revisionsUsed: row.revisions_used,
    reviewExtended: row.review_extended,
    createdAt: row.created_at,
    briefLockedAt: row.brief_locked_at,
    acceptedAt: row.accepted_at,
    paymentDueAt: row.payment_due_at,
    fundedAt: row.funded_at,
    deadlineAt: row.deadline_at,
    submittedAt: row.submitted_at,
    reviewDueAt: row.review_due_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    // At most one payment row exists per booking, and the embed is a stub, so
    // `one` unwraps the array an embed of a "many" side would produce.
    paymentStatus: payment?.status ?? null,
    paymentCreatorAmount: payment?.creator_amount ?? 0,
    paymentUmkmRefundAmount: payment?.umkm_refund_amount ?? 0,
  };
}

type PaymentRow = {
  id: number;
  booking_id: number;
  total_amount: number;
  creator_amount: number;
  umkm_refund_amount: number;
  status: PaymentStatus;
  held_at: string | null;
  settled_at: string | null;
};

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    totalAmount: row.total_amount,
    creatorAmount: row.creator_amount,
    umkmRefundAmount: row.umkm_refund_amount,
    status: row.status,
    heldAt: row.held_at,
    settledAt: row.settled_at,
  };
}

function failed(source: string, error: { message: string } | null): null {
  if (error) console.error(`[bookings] ${source} failed: ${error.message}`);
  return null;
}

const CREATOR_JOIN = "influencers(*, categories(*))";
const BUSINESS_JOIN = "umkms(*, categories(*))";
// A stub of the payment row; at most one exists per booking. The list and
// dashboard derive held/earned amounts from this rather than from `status`.
const PAYMENT_STUB = "payments(status, creator_amount, umkm_refund_amount)";

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */

export async function getBookingsByUmkm(
  umkmId: number,
): Promise<BookingWithInfluencer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`*, ${CREATOR_JOIN}, ${PAYMENT_STUB}`)
    .eq("umkm_id", umkmId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) return failed("getBookingsByUmkm", error) ?? [];

  return (data as unknown as BookingRow[]).map((row) => {
    const creator = one(row.influencers);
    const category = categoryOf(creator?.categories);
    return {
      ...mapBooking(row),
      influencerName: creator?.name ?? "",
      influencerHandle: creator?.handle ?? "",
      influencerCategorySlug: category.slug,
      influencerCity: creator?.city ?? "",
      influencerCategory: category.name,
    };
  });
}

export async function getBookingsByInfluencer(
  influencerId: number,
): Promise<BookingWithUmkm[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`*, ${BUSINESS_JOIN}, ${PAYMENT_STUB}`)
    .eq("influencer_id", influencerId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) return failed("getBookingsByInfluencer", error) ?? [];

  return (data as unknown as BookingRow[]).map((row) => {
    const business = one(row.umkms);
    const category = categoryOf(business?.categories);
    return {
      ...mapBooking(row),
      umkmName: business?.name ?? "",
      umkmOwner: business?.owner ?? "",
      umkmCity: business?.city ?? "",
      umkmCategory: category.name,
      umkmCategorySlug: category.slug,
    };
  });
}

/**
 * One booking, or null when the caller is not a party to it.
 *
 * `maybeSingle` rather than `single`: an RLS-filtered row yields an empty result,
 * and asking for a single row out of nothing is an error in supabase-js. Either way
 * the caller cannot distinguish "does not exist" from "not yours", which is the point.
 */
export async function getBookingById(id: number): Promise<Booking | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, influencers(*, categories(*)), umkms(*, categories(*)), payments(status, creator_amount, umkm_refund_amount)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return failed("getBookingById", error);
  return data ? mapBooking(data as unknown as BookingRow) : null;
}

/* ------------------------------------------------------------------ */
/* One booking, in full                                                 */
/*                                                                      */
/* The four child reads below are each party-scoped by their own policy, */
/* so a caller who is not a party gets an empty list here for the same   */
/* reason `getBookingById` returns null: the policy refuses, not a filter. */
/* ------------------------------------------------------------------ */

export async function getPaymentForBooking(
  bookingId: number,
): Promise<Payment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, booking_id, total_amount, creator_amount, umkm_refund_amount, status, held_at, settled_at",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) return failed("getPaymentForBooking", error);
  return data ? mapPayment(data as PaymentRow) : null;
}

type DeliveryRow = {
  id: number;
  booking_id: number;
  round: number;
  content_url: string;
  note: string | null;
  submitted_at: string;
};

export async function getDeliveries(bookingId: number): Promise<Delivery[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .select("id, booking_id, round, content_url, note, submitted_at")
    .eq("booking_id", bookingId)
    .order("round", { ascending: true });

  if (error) return failed("getDeliveries", error) ?? [];

  return (data as DeliveryRow[]).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    round: row.round,
    contentUrl: row.content_url,
    note: row.note,
    submittedAt: row.submitted_at,
  }));
}

type RevisionRow = {
  id: number;
  booking_id: number;
  delivery_id: number;
  round: number;
  section: string;
  note: string;
  within_brief: boolean;
  created_at: string;
};

export async function getRevisionRequests(
  bookingId: number,
): Promise<RevisionRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("revision_requests")
    .select(
      "id, booking_id, delivery_id, round, section, note, within_brief, created_at",
    )
    .eq("booking_id", bookingId)
    .order("round", { ascending: true });

  if (error) return failed("getRevisionRequests", error) ?? [];

  return (data as RevisionRow[]).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    deliveryId: row.delivery_id,
    round: row.round,
    section: row.section,
    note: row.note,
    withinBrief: row.within_brief,
    createdAt: row.created_at,
  }));
}

type EventRow = {
  id: number;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor_role: BookingEvent["actorRole"];
  actor_id: string | null;
  note: string | null;
  created_at: string;
};

export async function getBookingTimeline(
  bookingId: number,
): Promise<BookingEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("booking_events")
    .select("id, from_status, to_status, actor_role, actor_id, note, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) return failed("getBookingTimeline", error) ?? [];

  return (data as EventRow[]).map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    note: row.note,
    createdAt: row.created_at,
  }));
}

/** Everything one detail page needs, or null when the caller is not a party. */
export async function getBookingDetail(
  id: number,
): Promise<BookingDetail | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;

  const [payment, deliveries, revisions, events, offers] = await Promise.all([
    getPaymentForBooking(id),
    getDeliveries(id),
    getRevisionRequests(id),
    getBookingTimeline(id),
    getOffersForBooking(id),
  ]);

  return { ...booking, payment, deliveries, revisions, events, offers };
}

/* ------------------------------------------------------------------ */
/* Derived notification strip                                           */
/* ------------------------------------------------------------------ */

/**
 * Recent activity for the notification bell, plus a count of what needs attention.
 *
 * Derived from booking status rather than from the `notifications` table, which
 * exists but is unread and unwritten: `rls-access-control` gave it no policy at all.
 * Notifications are a deferred capability, and inventing rows here would mean
 * inventing them without a reader.
 */
export async function getUmkmNotifications(
  umkmId: number,
  limit = 5,
): Promise<{ items: UmkmNotification[]; attentionCount: number }> {
  const bookings = await getBookingsByUmkm(umkmId);
  const items: UmkmNotification[] = [];
  let attentionCount = 0;

  // Only the newest few can need a message, so the review check only runs for those.
  const candidates = bookings.slice(0, 12);

  const reviewed = await getReviewedBookingIds(
    candidates.map((b) => b.id),
  );

  for (const booking of candidates) {
    const desc = `${booking.packageName} · ${formatRupiah(booking.amount)}`;
    const push = (notification: UmkmNotification) => {
      if (items.length < limit) items.push(notification);
    };

    switch (booking.status) {
      case "PENDING":
        attentionCount += 1;
        push({
          key: `pending-${booking.id}`,
          kind: "pending",
          title: `Menunggu respons ${booking.influencerName}`,
          desc,
          href: "/dashboard/riwayat",
        });
        break;
      case "ACCEPTED":
        push({
          key: `accepted-${booking.id}`,
          kind: "accepted",
          title: `${booking.influencerName} menerima kolaborasi`,
          desc,
          href: "/dashboard/riwayat",
        });
        break;
      case "REJECTED":
        push({
          key: `rejected-${booking.id}`,
          kind: "rejected",
          title: `Pengajuan ke ${booking.influencerName} ditolak`,
          desc,
          href: "/dashboard/riwayat",
        });
        break;
      case "COMPLETED":
        if (!reviewed.has(booking.id)) {
          attentionCount += 1;
          push({
            key: `review-${booking.id}`,
            kind: "review",
            title: `Beri ulasan untuk ${booking.influencerName}`,
            desc,
            href: `/review/${booking.id}`,
          });
        }
        break;
      default:
        // FUNDED, SUBMITTED, REVISION, DISPUTED, CANCELLED need no prompt from the
        // business. The lifecycle change owns what they show; nothing here guesses.
        break;
    }
  }

  return { items, attentionCount };
}

/** Which of these bookings this business has already reviewed. */
async function getReviewedBookingIds(
  bookingIds: number[],
): Promise<Set<number>> {
  if (bookingIds.length === 0) return new Set();
  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("reviewer_role", "umkm")
    .in("booking_id", bookingIds);

  return new Set((data ?? []).map((row) => row.booking_id));
}

/* ------------------------------------------------------------------ */
/* One side's review of a booking                                       */
/* ------------------------------------------------------------------ */

export type ReviewerRole = "umkm" | "influencer";

/**
 * What one side of a booking has already written about it, or null.
 *
 * `reviews_booking_id_reviewer_role_key` makes the pair unique, so this is a single
 * row or nothing. The booking pages ask it to decide whether to offer the review
 * form; writing the review is a later change.
 *
 * Read through the user-scoped client even though `reviews` is publicly readable:
 * a review carries the comment text, and deciding what to show should not depend on
 * a policy that may tighten later.
 */
export async function getReviewForBookingRole(
  bookingId: number,
  reviewerRole: ReviewerRole,
): Promise<{ id: number; rating: number; comment: string | null } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("booking_id", bookingId)
    .eq("reviewer_role", reviewerRole)
    .maybeSingle();

  if (error) return failed("getReviewForBookingRole", error);
  return data
    ? { id: data.id, rating: data.rating, comment: data.comment }
    : null;
}

export async function hasReviewed(
  bookingId: number,
  reviewerRole: ReviewerRole,
): Promise<boolean> {
  return (await getReviewForBookingRole(bookingId, reviewerRole)) !== null;
}