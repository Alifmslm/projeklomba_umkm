"use client";

import { Handshake } from "lucide-react";
import { Button } from "../Button";
import { StatusBadge, type StatusKey } from "../StatusBadge";

export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

const RESULT: Record<OfferStatus, StatusKey> = {
  PENDING: "PENDING",
  ACCEPTED: "COMPLETED",
  DECLINED: "REJECTED",
  EXPIRED: "CANCELLED",
};

/**
 * OfferCard (ARCHITECTURE §2.6/langkah 3-5): tawaran penyelesaian dari
 * kreator (revisi tambahan / potongan harga / pembatalan). Saat PENDING
 * menampilkan aksi Terima/Tolak; setelah diputuskan tampil status hasil.
 * Periode kedaluwarsa (EXPIRED) ditentukan halaman/aksi, bukan komponen.
 */
export function OfferCard({
  title,
  description,
  amount,
  status = "PENDING",
  onAccept,
  onReject,
}: {
  title: string;
  description: string;
  amount?: string;
  status?: OfferStatus;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const pending = status === "PENDING";
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
            {amount && (
              <p className="mt-1 text-sm font-extrabold text-neutral-900">
                {amount}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={RESULT[status]} />
      </div>

      {pending && (onAccept || onReject) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onAccept && (
            <Button variant="primary" size="sm" onClick={onAccept}>
              Terima
            </Button>
          )}
          {onReject && (
            <Button variant="secondary" size="sm" onClick={onReject}>
              Tolak
            </Button>
          )}
        </div>
      )}
    </div>
  );
}