import {
  CheckCircle2,
  Clock,
  Film,
  Repeat2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/Button";
import { OfferComposer } from "./OfferComposer";
import {
  acceptBooking,
  declineBooking,
  submitDelivery,
  cancelBooking,
} from "@/app/actions";
import type { BookingDetail } from "@/lib/types";

/**
 * What the addressed creator may do, per state.
 *
 * The mirror of `UmkmActions`: plain forms to Server Actions, with the state
 * machine still the thing that decides legality. Submitting content and
 * submitting a revision are the same action, because both write a new round and
 * move the request to the submitted state.
 */
export function CreatorActions({ booking }: { booking: BookingDetail }) {
  const next = `/dashboard/influencer/riwayat/${booking.id}`;

  const composer = <OfferComposer booking={booking} role="influencer" />;

  const cancelForm = (
    <form action={cancelBooking}>
      <input type="hidden" name="bookingId" value={booking.id} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-neutral-0 px-3.5 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
      >
        <Undo2 className="h-4 w-4" /> Batalkan kolaborasi
      </button>
    </form>
  );

  const deliveryForm = (
    <details
      className="rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3"
      open={booking.status === "FUNDED" || booking.status === "REVISION"}
    >
      <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
        {booking.status === "REVISION" ? "Kirim revisi" : "Kirim konten"}
      </summary>
      <form action={submitDelivery} className="mt-3 space-y-3">
        <input type="hidden" name="bookingId" value={booking.id} />
        <input type="hidden" name="next" value={next} />
        <label className="block text-xs font-semibold text-neutral-600">
          Link konten
          <input
            name="contentUrl"
            required
            type="url"
            placeholder="https://..."
            className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="block text-xs font-semibold text-neutral-600">
          Catatan (opsional)
          <textarea
            name="note"
            rows={2}
            maxLength={500}
            placeholder="Catatan untuk UMKM"
            className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <Button type="submit" size="sm">
          <Film className="h-3.5 w-3.5" /> Kirim
        </Button>
      </form>
    </details>
  );

  switch (booking.status) {
    case "PENDING":
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            UMKM mengajukan kolaborasi ini. Terima untuk mulai, atau tolak
            dengan sopan.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={acceptBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="next" value={next} />
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4" /> Terima
              </Button>
            </form>
            <form action={declineBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-error-200 bg-error-50 px-3.5 py-2 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100"
              >
                Tolak
              </button>
            </form>
          </div>
        </div>
      );

    case "ACCEPTED":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="h-4 w-4 text-neutral-400" />
            Sudah diterima. Menunggu UMKM menahan dana sebelum mulai bekerja.
          </p>
          {cancelForm}
          {composer}
        </div>
      );

    case "FUNDED":
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Dana sudah ditahan. Kirim link konten kalau sudah siap.
          </p>
          {deliveryForm}
          {cancelForm}
          {composer}
        </div>
      );

    case "REVISION":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <Repeat2 className="h-4 w-4 text-warning-500" />
            UMKM meminta revisi. Kirim versi barunya sebagai ronde berikutnya.
          </p>
          {deliveryForm}
          {cancelForm}
          {composer}
        </div>
      );

    case "SUBMITTED":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            Konten terkirim dan menunggu keputusan UMKM.
          </p>
          {cancelForm}
          {composer}
        </div>
      );

    case "DISPUTED":
      return (
        <p className="text-sm text-neutral-600">
          Sengketa sedang menunggu keputusan.
        </p>
      );

    case "COMPLETED":
      return (
        <p className="text-sm text-neutral-600">
          Kolaborasi selesai dan dana sudah dirilis.
        </p>
      );

    case "REJECTED":
      return (
        <p className="text-sm text-neutral-500">
          Kamu menolak pengajuan ini.
        </p>
      );

    case "CANCELLED":
      return (
        <p className="text-sm text-neutral-500">
          Kolaborasi dibatalkan — tidak ada aksi lanjutan.
        </p>
      );
  }
}