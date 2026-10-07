import { Percent, PlusCircle, Undo2 } from "lucide-react";

import { createOffer } from "@/app/actions";
import { Button } from "@/components/Button";
import { formatRupiah } from "@/lib/format";
import type { BookingDetail, PartyRole } from "@/lib/types";

/**
 * The offer composer both parties use (ARCHITECTURE §2.6/langkah 3-5).
 *
 * Which offers are legal differs by role and state; this renders one `details`
 * block per legal offer and lets the database function be the guard. It hides
 * itself when a `PENDING` offer already exists, because the one-open-offer index
 * would refuse a second one anyway.
 */
export function OfferComposer({
  booking,
  role,
}: {
  booking: BookingDetail;
  role: PartyRole;
}) {
  const hasOpenOffer = booking.offers.some((o) => o.status === "PENDING");
  const active = ["ACCEPTED", "FUNDED", "SUBMITTED", "REVISION"].includes(
    booking.status,
  );
  if (hasOpenOffer || !active) return null;

  const canExtraRevision =
    role === "influencer" &&
    (booking.status === "SUBMITTED" || booking.status === "REVISION");
  const canDiscount = role === "influencer" && booking.status === "SUBMITTED";
  const next =
    role === "umkm"
      ? `/dashboard/riwayat/${booking.id}`
      : `/dashboard/influencer/riwayat/${booking.id}`;

  const noteField = (
    <textarea
      name="note"
      rows={2}
      maxLength={300}
      placeholder="Catatan (opsional)"
      className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
    />
  );

  return (
    <details className="rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
        Ajukan tawaran penyelesaian
      </summary>
      <div className="mt-3 space-y-3">
        {canExtraRevision && (
          <form action={createOffer} className="space-y-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="type" value="EXTRA_REVISION" />
            <label className="block text-xs font-semibold text-neutral-600">
              Revisi tambahan tanpa biaya
              <input
                type="number"
                name="value"
                min={1}
                max={10}
                defaultValue={1}
                required
                className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="block text-xs font-semibold text-neutral-600">
              Catatan
              {noteField}
            </label>
            <Button type="submit" size="sm" variant="secondary">
              <PlusCircle className="h-3.5 w-3.5" /> Tawarkan revisi tambahan
            </Button>
          </form>
        )}

        {canDiscount && (
          <form action={createOffer} className="space-y-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="type" value="DISCOUNT" />
            <label className="block text-xs font-semibold text-neutral-600">
              Jumlah diterima kreator (kurang dari {formatRupiah(booking.amount)})
              <input
                type="number"
                name="value"
                min={1}
                max={booking.amount - 1}
                placeholder={String(booking.amount - 1)}
                required
                className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="block text-xs font-semibold text-neutral-600">
              Catatan
              {noteField}
            </label>
            <Button type="submit" size="sm" variant="secondary">
              <Percent className="h-3.5 w-3.5" /> Tawarkan potongan harga
            </Button>
          </form>
        )}

        <form action={createOffer} className="space-y-2">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="type" value="CANCELLATION" />
          <label className="block text-xs font-semibold text-neutral-600">
            Jumlah dikembalikan ke UMKM (maksimal {formatRupiah(booking.amount)})
            <input
              type="number"
              name="value"
              min={1}
              max={booking.amount}
              defaultValue={booking.amount}
              required
              className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-600">
            Catatan
            {noteField}
          </label>
          <Button type="submit" size="sm" variant="secondary">
            <Undo2 className="h-3.5 w-3.5" /> Tawarkan pembatalan
          </Button>
        </form>
      </div>
    </details>
  );
}