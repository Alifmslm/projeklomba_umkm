import { Handshake } from "lucide-react";

import { respondToOffer } from "@/app/actions";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { Offer, OfferStatus } from "@/lib/types";
import { Button } from "../Button";
import { StatusBadge, type StatusKey } from "../StatusBadge";

const RESULT: Record<OfferStatus, StatusKey> = {
  PENDING: "PENDING",
  ACCEPTED: "COMPLETED",
  DECLINED: "REJECTED",
  EXPIRED: "CANCELLED",
};

const OFFERER_TEXT: Record<Offer["offeredBy"], string> = {
  umkm: "UMKM",
  influencer: "kreator",
};

/** Title, description and amount line for one offer, per its type. */
function describe(offer: Offer): {
  title: string;
  description: string;
  amount: string;
} {
  switch (offer.type) {
    case "EXTRA_REVISION":
      return {
        title: "Revisi tambahan",
        description:
          "Kreator menawarkan revisi tambahan tanpa biaya, di luar kuota paket.",
        amount: `${offer.value} revisi tambahan`,
      };
    case "DISCOUNT":
      return {
        title: "Potongan harga",
        description:
          "Kreator menerima bayaran lebih kecil; sisanya dikembalikan ke UMKM.",
        amount: `${formatRupiah(offer.value)} untuk kreator`,
      };
    case "CANCELLATION":
      return {
        title: "Pembatalan & refund",
        description:
          "Kolaborasi dibatalkan dan sebagian dana dikembalikan ke UMKM.",
        amount: `${formatRupiah(offer.value)} dikembalikan`,
      };
  }
}

/**
 * OfferCard (ARCHITECTURE §2.6/langkah 3-5): satu tawaran penyelesaian.
 *
 * Read-only untuk semua pihak; `Terima`/`Tolak` hanya dirender untuk pihak yang
 * bukan pengaju (`canRespond`). Kedaluwarsa diputuskan pembacaan data, bukan
 * komponen ini.
 */
export function OfferCard({
  offer,
  canRespond,
  next,
}: {
  offer: Offer;
  canRespond: boolean;
  next: string;
}) {
  const { title, description, amount } = describe(offer);
  const pending = offer.status === "PENDING";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <Handshake className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900">{title}</p>
            <p className="mt-0.5 text-xs text-neutral-600">{description}</p>
            <p className="mt-1 text-sm font-extrabold text-neutral-900">
              {amount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Diajukan oleh {OFFERER_TEXT[offer.offeredBy]}
              {pending && offer.expiresAt
                ? ` · berlaku sampai ${formatDateTime(offer.expiresAt)}`
                : ""}
            </p>
            {offer.note && (
              <p className="mt-2 rounded-xl bg-neutral-0 px-3 py-2 text-xs leading-relaxed text-neutral-600 ring-1 ring-inset ring-neutral-200">
                {offer.note}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={RESULT[offer.status]} />
      </div>

      {pending && canRespond && (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={respondToOffer}>
            <input type="hidden" name="bookingId" value={offer.bookingId} />
            <input type="hidden" name="offerId" value={offer.id} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="accept" value="1" />
            <Button type="submit" size="sm">
              Terima
            </Button>
          </form>
          <form action={respondToOffer}>
            <input type="hidden" name="bookingId" value={offer.bookingId} />
            <input type="hidden" name="offerId" value={offer.id} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="accept" value="0" />
            <Button type="submit" size="sm" variant="secondary">
              Tolak
            </Button>
          </form>
        </div>
      )}

      {pending && !canRespond && (
        <p className="mt-3 text-xs text-neutral-500">
          Menunggu keputusan pihak lain.
        </p>
      )}
    </div>
  );
}