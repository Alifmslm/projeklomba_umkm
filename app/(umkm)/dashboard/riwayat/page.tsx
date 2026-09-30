import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getBookingsByUmkm,
  getReviewForBookingRole,
} from "@/lib/data";
import type { Review } from "@/lib/types";
import { UmkmShell } from "@/components/UmkmShell";
import { BookingHistoryList } from "@/components/BookingHistoryList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Kolaborasi",
  description: "Semua pengajuan kolaborasi UMKM-mu di Kolab.id.",
};

export default async function RiwayatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const bookings = getBookingsByUmkm(session.subjectId);

  const myReviews = new Map<number, Review>();
  for (const b of bookings) {
    if (b.status === "DONE") {
      const review = getReviewForBookingRole(b.id, "umkm");
      if (review) myReviews.set(b.id, review);
    }
  }

  return (
    <UmkmShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
          Riwayat Kolaborasi
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Semua Pengajuan
        </h1>
        <p className="mt-1.5 text-slate-600">
          {bookings.length} pengajuan tercatat. Klik kreator untuk melihat
          profil lengkap.
        </p>
      </div>

      <BookingHistoryList bookings={bookings} reviews={myReviews} />
    </UmkmShell>
  );
}
