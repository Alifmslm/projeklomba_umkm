"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitReview } from "@/app/actions";
import { Button } from "@/components/Button";
import { RatingInput } from "@/components/RatingInput";
import { Textarea } from "@/components/Textarea";

/**
 * ReviewForm (ARCHITECTURE §2.8 review 2 arah): bintang interaktif
 * (RatingInput — sesuai DESIGN_SYSTEM §10.4) + komentar opsional.
 * Hidden input `bookingId` + aksi `submitReview` tidak berubah.
 */
export function ReviewForm({
  bookingId,
  isUmkm,
}: {
  bookingId: number;
  isUmkm: boolean;
}) {
  const [rating, setRating] = useState(0);

  return (
    <form
      action={submitReview}
      className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs sm:p-8"
    >
      <input type="hidden" name="bookingId" value={bookingId} />

      <RatingInput
        label="Rating kamu"
        name="rating"
        value={rating}
        onChange={setRating}
      />
      <p className="mt-1 text-xs text-neutral-500">
        Klik bintang untuk memilih (1 = buruk, 5 = luar biasa).
      </p>

      <div className="mt-8">
        <Textarea
          name="comment"
          label="Komentar (opsional, maks 300 karakter)"
          rows={4}
          maxLength={300}
          placeholder={
            isUmkm
              ? "Contoh: komunikasi cepat, kontennya bagus, dan hasilnya terasa di penjualan…"
              : "Contoh: brief jelas, kooperatif, pembayaran sesuai kesepakatan…"
          }
        />
      </div>

      <Button type="submit" className="mt-8">
        <CheckCircle2 className="h-4 w-4" /> Kirim Rating & Ulasan
      </Button>
    </form>
  );
}