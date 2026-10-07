import { createClient } from "@/utils/supabase/server";
import type { Offer, OfferStatus, OfferType, PartyRole } from "@/lib/types";

/**
 * Offer reads, on Postgres.
 *
 * `resolution_offers` carries `resolution_offers_party_read`, the same
 * EXISTS-over-the-booking policy as `bookings`, so this function reads through the
 * caller's user-scoped client and lets the policy decide. A booking that is not
 * theirs comes back as no rows, never as an error - an RLS-hidden row is an empty
 * `200`.
 *
 * Expiry is lazy: there is no scheduler, so a `PENDING` row whose `expires_at` has
 * passed is presented as `EXPIRED` here. The stored row is only rewritten to
 * `EXPIRED` when `create_offer` clears an overdue sibling or when a decision is
 * attempted.
 */

type OfferRow = {
  id: number;
  booking_id: number;
  offered_by: PartyRole;
  type: OfferType;
  value: number;
  fee: number;
  note: string | null;
  status: OfferStatus;
  expires_at: string;
  responded_at: string | null;
  escalated_at: string | null;
  created_at: string;
};

function mapOffer(row: OfferRow): Offer {
  const status: OfferStatus =
    row.status === "PENDING" &&
    new Date(row.expires_at).getTime() <= Date.now()
      ? "EXPIRED"
      : row.status;

  return {
    id: row.id,
    bookingId: row.booking_id,
    offeredBy: row.offered_by,
    type: row.type,
    value: row.value,
    fee: row.fee,
    note: row.note,
    status,
    expiresAt: row.expires_at,
    respondedAt: row.responded_at,
    escalatedAt: row.escalated_at,
    createdAt: row.created_at,
  };
}

export async function getOffersForBooking(bookingId: number): Promise<Offer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("resolution_offers")
    .select(
      "id, booking_id, offered_by, type, value, fee, note, status, expires_at, responded_at, escalated_at, created_at",
    )
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error(`[offers] getOffersForBooking failed: ${error.message}`);
    return [];
  }

  return (data as unknown as OfferRow[]).map(mapOffer);
}