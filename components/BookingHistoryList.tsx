import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, Star } from "lucide-react";
import { Avatar } from "./Avatar";
import { StarRating } from "./StarRating";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatRupiah } from "@/lib/format";
import type { BookingWithInfluencer, Review } from "@/lib/types";

export function BookingHistoryList({
  bookings,
  reviews,
}: {
  bookings: BookingWithInfluencer[];
  reviews: Map<number, Review>;
}) {
  if (bookings.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Handshake className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          Belum ada kolaborasi
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Yuk mulai gandeng kreator pertama UMKM-mu. Pilih dari daftar kreator
          yang sudah terkurasi.
        </p>
        <Link
          href="/influencers"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Cari Kreator <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
        >
          <Link
            href={`/influencers/${b.influencerId}`}
            className="flex min-w-0 flex-1 items-center gap-4"
          >
            <Avatar
              name={b.influencerName}
              color={b.influencerColor}
              size="md"
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 hover:text-indigo-700">
                {b.influencerName}
                <BadgeCheck className="h-4 w-4 shrink-0 text-slate-400" />
              </p>
              <p className="truncate text-xs text-slate-500">
                {b.influencerHandle} · {b.influencerCity} · {b.niche}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {b.packageName} · {formatDate(b.createdAt)}
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
            <p className="text-sm font-extrabold text-slate-900">
              {formatRupiah(b.amount)}
            </p>
            <StatusBadge status={b.status} />
            {b.status === "DONE" &&
              (reviews.get(b.id) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  <StarRating rating={reviews.get(b.id)!.rating} size="h-3 w-3" />
                  Sudah dinilai
                </span>
              ) : (
                <Link
                  href={`/review/${b.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110"
                >
                  <Star className="h-3.5 w-3.5" /> Beri Ulasan
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
