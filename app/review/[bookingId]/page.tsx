import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Fragment } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Star,
  Store,
  PartyPopper,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  getBookingById,
  getInfluencerById,
  getReviewForBookingRole,
  getUmkmById,
} from "@/lib/data";
import { formatDate, formatRupiah } from "@/lib/format";
import { submitReview } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beri Rating",
  description:
    "Nilai pengalaman berkolaborasi di Kolab.id — rating dua arah antara UMKM dan kreator.",
};

export default async function ReviewPage(
  props: PageProps<"/review/[bookingId]">,
) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { bookingId } = await props.params;
  const searchParams = await props.searchParams;
  const gagal = searchParams.gagal === "1";

  const booking = getBookingById(Number(bookingId));
  if (!booking || booking.status !== "DONE") {
    redirect(session.role === "umkm" ? "/dashboard" : "/dashboard/influencer");
  }

  const isUmkm = session.role === "umkm";
  if (isUmkm && booking.umkmId !== session.subjectId) redirect("/dashboard");
  if (!isUmkm && booking.influencerId !== session.subjectId) {
    redirect("/dashboard/influencer");
  }

  const counterpart = isUmkm
    ? getInfluencerById(booking.influencerId)
    : getUmkmById(booking.umkmId);
  if (!counterpart) {
    redirect(isUmkm ? "/dashboard" : "/dashboard/influencer");
  }

  const existing = getReviewForBookingRole(booking.id, session.role);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link
          href={isUmkm ? "/dashboard" : "/dashboard/influencer"}
          className="hover:text-indigo-700"
        >
          {isUmkm ? "Dashboard UMKM" : "Dashboard Kreator"}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-700">Beri Rating</span>
      </nav>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
        Bagaimana kolaborasimu?
      </h1>
      <p className="mt-1.5 text-slate-600">
        Rating dua arah ini membantu UMKM lain memilih kreator yang tepat —
        dan kreator tahu UMKM mana yang enak diajak kerja sama.
      </p>

      {/* Ringkasan kolaborasi */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            name={counterpart.name}
            color={"color" in counterpart ? counterpart.color : "from-slate-500 to-slate-700"}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-base font-bold text-slate-900">
              {counterpart.name}
              {"verified" in counterpart && counterpart.verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-indigo-600" />
              )}
            </p>
            <p className="flex items-center gap-1 truncate text-sm text-slate-500">
              {"handle" in counterpart ? (
                <>
                  {counterpart.handle} · {counterpart.niche} · {counterpart.city}
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
            <p className="text-lg font-extrabold text-slate-900">
              {formatRupiah(booking.amount)}
            </p>
            <p className="text-xs text-slate-500">
              {booking.packageName} · {booking.code}
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          Kolaborasi selesai pada {formatDate(booking.createdAt)}. Kamu menilai{" "}
          {isUmkm ? "kreator" : "UMKM"} ini untuk paket {booking.packageName}.
        </p>
      </div>

      {gagal && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Pilih dulu rating 1–5 bintang</p>
            <p className="mt-0.5">Komentar boleh dikosongkan.</p>
          </div>
        </div>
      )}

      {existing ? (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <PartyPopper className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-emerald-900">Ulasanmu sudah terkirim</p>
              <p className="text-sm text-emerald-700">
                Terima kasih sudah berbagi pengalamanmu. Rating tidak bisa
                diubah setelah dikirim.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4">
            <StarRating rating={existing.rating} size="h-6 w-6" />
            <p className="text-sm text-slate-600">“{existing.comment}”</p>
          </div>
          <Link
            href={isUmkm ? "/dashboard" : "/dashboard/influencer"}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <form
          action={submitReview}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <input type="hidden" name="bookingId" value={booking.id} />

          <fieldset>
            <legend className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Rating kamu
            </legend>
            <p className="mt-1 text-xs text-slate-500">
              Klik bintang untuk memilih (1 = buruk, 5 = luar biasa).
            </p>
            <div className="rating-input mt-4">
              {[5, 4, 3, 2, 1].map((n) => (
                <Fragment key={n}>
                  <input
                    id={`rating-${n}`}
                    type="radio"
                    name="rating"
                    value={n}
                    required={n === 1}
                    className="sr-only"
                  />
                  <label htmlFor={`rating-${n}`} title={`${n} bintang`}>
                    <Star className="h-10 w-10" />
                  </label>
                </Fragment>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Komentar (opsional, maks 300 karakter)
            </legend>
            <textarea
              name="comment"
              rows={4}
              maxLength={300}
              placeholder={
                isUmkm
                  ? "Contoh: komunikasi cepat, kontennya bagus, dan hasilnya terasa di penjualan…"
                  : "Contoh: brief jelas, kooperatif, pembayaran sesuai kesepakatan…"
              }
              className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </fieldset>

          <button
            type="submit"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:brightness-110"
          >
            <CheckCircle2 className="h-4 w-4" /> Kirim Rating & Ulasan
          </button>
        </form>
      )}
    </div>
  );
}