import { getInfluencerById, getUmkmById } from "@/lib/data/catalog";
import { getBookingById, getReviewForBookingRole } from "@/lib/data/bookings";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  PartyPopper,
  Star,
  Store,
} from "lucide-react";
import { requireParty } from "@/lib/auth";

import { formatDate, formatRupiah } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beri Rating",
  description:
    "Nilai pengalaman berkolaborasi di Kolab.id — rating dua arah antara UMKM dan kreator.",
};

export default async function ReviewPage(
  props: PageProps<"/review/[bookingId]">,
) {
  const account = await requireParty();

  const { bookingId } = await props.params;
  const searchParams = await props.searchParams;
  const gagal = searchParams.gagal === "1";

  const isUmkm = account.role === "umkm";
  const dashHref = isUmkm ? "/dashboard" : "/dashboard/influencer";

  const booking = await getBookingById(Number(bookingId));
  if (!booking || booking.status !== "COMPLETED") {
    redirect(dashHref);
  }

  // Hanya pihak yang terlibat dalam booking yang boleh menilai
  const isParty = isUmkm
    ? booking.umkmId === account.umkmId
    : booking.influencerId === account.influencerId;
  if (!isParty) redirect(dashHref);

  const counterpart = isUmkm
    ? await getInfluencerById(booking.influencerId)
    : await getUmkmById(booking.umkmId);
  if (!counterpart) {
    redirect(dashHref);
  }

  // Satu kolaborasi dinilai sekali per sisi — kalau sudah, tampilkan hasilnya
  const existing = await getReviewForBookingRole(booking.id, account.role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-500">
        <Link href={dashHref} className="hover:text-primary-700">
          {isUmkm ? "Dashboard UMKM" : "Dashboard Kreator"}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-neutral-700">Beri Rating</span>
      </nav>

      <h1 className="mt-6 font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
        Bagaimana kolaborasimu?
      </h1>
      <p className="mt-1.5 text-neutral-600">
        Rating dua arah ini membantu UMKM lain memilih kreator yang tepat —
        dan kreator tahu UMKM mana yang enak diajak kerja sama.
      </p>

      {/* Ringkasan kolaborasi */}
      <div className="mt-8 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            name={counterpart.name}
            category={counterpart.categorySlug}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-base font-bold text-neutral-900">
              {counterpart.name}
              {"verified" in counterpart && counterpart.verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary-600" />
              )}
            </p>
            <p className="flex items-center gap-1 truncate text-sm text-neutral-500">
              {"handle" in counterpart ? (
                <>
                  {counterpart.handle} · {counterpart.category} · {counterpart.city}
                </>
              ) : (
                <>
                  <Store className="h-3.5 w-3.5" /> {counterpart.category} ·{" "}
                  {counterpart.city}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="font-head text-lg font-extrabold tracking-[-0.02em] text-neutral-900">
              {formatRupiah(booking.amount)}
            </p>
            <p className="text-xs text-neutral-500">
              {booking.packageName} · {booking.code}
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          Kolaborasi selesai pada {formatDate(booking.createdAt)}. Kamu menilai{" "}
          {isUmkm ? "kreator" : "UMKM"} ini untuk paket {booking.packageName}.
        </p>
      </div>

      {gagal && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Pilih dulu rating 1–5 bintang</p>
            <p className="mt-0.5">Komentar boleh dikosongkan.</p>
          </div>
        </div>
      )}

      {existing ? (
        <div className="mt-6 rounded-3xl border border-success-200 bg-success-50/60 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-100 text-success-600">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-success-900">
                Ulasanmu sudah terkirim
              </p>
              <p className="text-sm text-success-700">
                Terima kasih sudah berbagi pengalamanmu. Rating tidak bisa
                diubah setelah dikirim.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-0 p-4">
            <StarRating rating={existing.rating} size="h-6 w-6" />
            {existing.comment && (
              <p className="text-sm text-neutral-600">“{existing.comment}”</p>
            )}
          </div>
          <Button href={dashHref} variant="secondary" className="mt-5">
            <Star className="h-4 w-4" /> Kembali ke Dashboard
          </Button>
        </div>
      ) : (
        <ReviewForm bookingId={booking.id} isUmkm={isUmkm} />
      )}
    </div>
  );
}