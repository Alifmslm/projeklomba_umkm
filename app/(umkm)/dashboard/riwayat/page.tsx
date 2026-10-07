import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBookingsByUmkm, getReviewForBookingRole } from "@/lib/data";
import { RiwayatClient } from "./riwayat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Kolaborasi",
  description: "Semua pengajuan kolaborasi UMKM-mu di Kolab.id.",
};

export default async function RiwayatPage(
  props: PageProps<"/dashboard/riwayat">,
) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const searchParams = await props.searchParams;
  const filter =
    typeof searchParams.filter === "string" ? searchParams.filter : "semua";

  const bookings = getBookingsByUmkm(session.subjectId);

  // Ulasan yang sudah diberikan UMKM ini (untuk kolom aksi "Beri Ulasan")
  const reviewRatings: Record<number, number> = {};
  for (const b of bookings) {
    if (b.status === "DONE") {
      const review = getReviewForBookingRole(b.id, "umkm");
      if (review) reviewRatings[b.id] = review.rating;
    }
  }

  return (
    <>
      <div>
        <p className="type-table-head uppercase text-primary-700">
          Riwayat Kolaborasi
        </p>
        <h1 className="mt-1 font-head type-page-title text-neutral-900">
          Riwayat Kolaborasi
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Semua pengajuan, dari menunggu konfirmasi sampai selesai.
        </p>
      </div>

      <div className="mt-6">
        <RiwayatClient
          bookings={bookings}
          reviewRatings={reviewRatings}
          initialFilter={filter}
        />
      </div>
    </>
  );
}