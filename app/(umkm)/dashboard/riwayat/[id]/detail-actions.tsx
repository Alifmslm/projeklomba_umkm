"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/Button";
import { OfferCard, type OfferStatus } from "@/components/booking";

/**
 * Aksi per status (ARCHITECTURE §3.5) + tawaran kreator. Client wrapper
 * untuk interaksi prototipe: `Bayar` disimulasikan (state lokal, tidak
 * menulis ke data), `Terima`/`Tolak` offer juga state lokal.
 */
export function DetailActions({
  status,
  bookingId,
  hasReviewed,
}: {
  status: "PENDING" | "APPROVED" | "DONE" | "REJECTED";
  bookingId: number;
  hasReviewed: boolean;
}) {
  const [paid, setPaid] = useState(false);
  const [offer, setOffer] = useState<OfferStatus>("PENDING");

  const showOffer = status === "PENDING" || status === "APPROVED";

  return (
    <div className="space-y-5">
      {/* Tawaran kreator (satu-satunya sumber Terima/Tolak di detail) */}
      {showOffer && (
        <OfferCard
          title="Tawaran dari kreator"
          description="Kreator menawarkan 1 revisi tambahan gratis di luar kuota brief."
          amount={undefined}
          status={offer}
          onAccept={() => setOffer("ACCEPTED")}
          onReject={() => setOffer("DECLINED")}
        />
      )}

      {/* Action rows per §3.5 */}
      {status === "APPROVED" && (
        <div className="flex flex-wrap items-center gap-2">
          {paid ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-success-50 px-3.5 py-2 text-sm font-semibold text-success-700 ring-1 ring-inset ring-success-200">
              <CheckCircle2 className="h-4 w-4" /> Dana ditahan escrow (simulasi)
            </span>
          ) : (
            <Button
              variant="primary"
              onClick={() => setPaid(true)}
              className="items-center"
            >
              <Banknote className="h-4 w-4" /> Bayar
            </Button>
          )}
          <Button variant="secondary" href="/dashboard/chat">
            <MessageCircle className="h-4 w-4" /> Buka Chat
          </Button>
        </div>
      )}

      {status === "PENDING" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" href="/dashboard/chat">
            <MessageCircle className="h-4 w-4" /> Buka Chat
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-50 px-3.5 py-2 text-xs font-semibold text-neutral-500">
            <ShieldCheck className="h-4 w-4" /> Menunggu konfirmasi kreator
          </span>
        </div>
      )}

      {status === "DONE" && (
        <div className="flex flex-wrap items-center gap-2">
          {hasReviewed ? (
            <Button variant="secondary" href={`/review/${bookingId}`}>
              <Star className="h-4 w-4" /> Lihat Ulasan
            </Button>
          ) : (
            <Button variant="primary" href={`/review/${bookingId}`}>
              <Star className="h-4 w-4" /> Beri Ulasan
            </Button>
          )}
          <Button variant="secondary" href="/dashboard/chat">
            <MessageCircle className="h-4 w-4" /> Buka Chat (read-only)
          </Button>
        </div>
      )}

      {status === "REJECTED" && (
        <p className="text-sm text-neutral-500">
          Pengajuan ini ditolak oleh kreator — tidak ada aksi lanjutan.
        </p>
      )}

      {/* Pintu Kembali ke riwayat */}
      <Link
        href="/dashboard/riwayat"
        className="inline-block text-sm font-semibold text-primary-700 hover:text-primary-800"
      >
        ← Kembali ke Riwayat
      </Link>
    </div>
  );
}