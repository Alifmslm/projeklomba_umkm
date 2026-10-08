import {
  Banknote,
  CheckCircle2,
  Clock,
  Repeat2,
  ShieldAlert,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/Button";
import { OfferComposer } from "./OfferComposer";
import {
  extendReviewWindow,
  openDispute,
  payBooking,
  approveBooking,
  requestRevision,
  cancelBooking,
} from "@/app/actions";
import type { BookingDetail } from "@/lib/types";

/**
 * What the sending business may do, per state.
 *
 * Every button is a plain form posting to a Server Action, so the page stays a
 * server component. Which actions appear is decided here; whether they are
 * legal is decided by the database function, and whether the caller may act is
 * decided by the action's own read-through-the-session. A hidden button is a
 * convenience, not the guard.
 */
export function UmkmActions({ booking }: { booking: BookingDetail }) {
  const next = `/dashboard/riwayat/${booking.id}`;
  const composer = <OfferComposer booking={booking} role="umkm" />;
  const quotaUsedUp = booking.revisionsUsed >= booking.revisionQuota;
  const lastDelivery = booking.deliveries.at(-1) ?? null;

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

  switch (booking.status) {
    case "PENDING":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="h-4 w-4 text-neutral-400" />
            Menunggu kreator menerima atau menolak pengajuan.
          </p>
          {cancelForm}
        </div>
      );

    case "ACCEPTED":
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Kreator menerima. Bayar untuk menahan dana di platform dan memulai
            pengerjaan.
          </p>
          {composer}
          <div className="flex flex-wrap gap-2">
            <form action={payBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="next" value={next} />
              <Button type="submit">
                <Banknote className="h-4 w-4" /> Bayar & tahan dana
              </Button>
            </form>
            {cancelForm}
          </div>
        </div>
      );

    case "FUNDED":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            Dana sudah ditahan. Menunggu kreator mengirim konten.
          </p>
          {composer}
          {cancelForm}
        </div>
      );

    case "SUBMITTED":
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Konten terbaru menunggu keputusanmu.
          </p>
          {composer}
          <div className="flex flex-wrap gap-2">
            <form action={approveBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="next" value={next} />
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4" /> Setujui & rilis dana
              </Button>
            </form>
            {!booking.reviewExtended && (
              <form action={extendReviewWindow}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="next" value={next} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-neutral-0 px-3.5 py-2 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
                >
                  <Clock className="h-4 w-4" /> Perpanjang waktu review
                </button>
              </form>
            )}
            {cancelForm}
          </div>

          <details className="rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
              Minta revisi
            </summary>
            <form action={requestRevision} className="mt-3 space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="next" value={next} />
              <label className="block text-xs font-semibold text-neutral-600">
                Ronde yang direvisi
                <select
                  name="deliveryId"
                  required
                  defaultValue={lastDelivery ? String(lastDelivery.id) : ""}
                  className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
                >
                  {booking.deliveries.map((delivery) => (
                    <option key={delivery.id} value={delivery.id}>
                      Ronde {delivery.round}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-neutral-600">
                Bagian yang direvisi
                <input
                  name="section"
                  required
                  maxLength={80}
                  placeholder="cth. Caption"
                  className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
                />
              </label>
              <label className="block text-xs font-semibold text-neutral-600">
                Catatan revisi
                <textarea
                  name="note"
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Apa yang perlu diubah?"
                  className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  name="withinBrief"
                  value="1"
                  defaultChecked
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Masih dalam brief (menghabiskan kuota revisi)
              </label>
              {quotaUsedUp && (
                <p className="text-xs text-warning-700">
                  Kuota revisi habis. Revisi di luar brief tetap diterima;
                  untuk perubahan di dalam brief, ajukan sengketa.
                </p>
              )}
              <Button type="submit" size="sm">
                <Repeat2 className="h-3.5 w-3.5" /> Kirim permintaan revisi
              </Button>
            </form>
          </details>

          {quotaUsedUp && (
            <details className="rounded-xl border border-error-200 bg-error-50/60 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-error-800">
                Buka sengketa
              </summary>
              <form action={openDispute} className="mt-3 space-y-3">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="next" value={next} />
                <label className="block text-xs font-semibold text-neutral-600">
                  Alasan sengketa
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="Jelaskan masalahnya"
                    className="mt-1 block w-full rounded-xl border border-neutral-300 bg-neutral-0 px-3 py-2 text-sm text-neutral-900"
                  />
                </label>
                <Button type="submit" size="sm" variant="secondary">
                  <ShieldAlert className="h-3.5 w-3.5" /> Buka sengketa
                </Button>
              </form>
            </details>
          )}
        </div>
      );

    case "REVISION":
      return (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-neutral-600">
            <Repeat2 className="h-4 w-4 text-warning-500" />
            Revisi diminta. Menunggu kreator mengirim ulang.
          </p>
          {cancelForm}
          {composer}
        </div>
      );

    case "DISPUTED":
      return (
        <p className="flex items-start gap-2 text-sm text-neutral-600">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-error-500" />
          Sengketa sedang menunggu keputusan. Tidak ada aksi lain yang tersedia.
        </p>
      );

    case "COMPLETED":
      return (
        <p className="text-sm text-neutral-600">
          Kolaborasi selesai dan dana sudah dirilis. Berikan ulasan lewat tombol
          di bawah.
        </p>
      );

    case "REJECTED":
      return (
        <p className="text-sm text-neutral-500">
          Pengajuan ditolak kreator — tidak ada aksi lanjutan.
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