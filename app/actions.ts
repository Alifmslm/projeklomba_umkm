"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, getSession, setSession } from "@/lib/auth";
import {
  createBooking,
  getBookingById,
  getInfluencerById,
  getPackageById,
  getUmkmById,
  updateBookingStatus,
} from "@/lib/data";
import type { BookingStatus, Session } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Mock login (demo lomba, tanpa password)                             */
/* ------------------------------------------------------------------ */

export async function loginAsUmkm(): Promise<void> {
  const session: Session = {
    role: "umkm",
    subjectId: 1, // Warung Kopi Senja
    name: "Warung Kopi Senja",
  };
  await setSession(session);
  redirect("/dashboard");
}

export async function loginAsInfluencer(): Promise<void> {
  const session: Session = {
    role: "influencer",
    subjectId: 1, // Rara Nadia
    name: "Rara Nadia",
  };
  await setSession(session);
  redirect("/dashboard/influencer");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* Booking                                                             */
/* ------------------------------------------------------------------ */

export async function submitBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "umkm") redirect("/login");

  const influencerId = Number(formData.get("influencerId"));
  const packageId = Number(formData.get("packageId"));
  const message = String(formData.get("message") ?? "").trim().slice(0, 500);

  const influencer = getInfluencerById(influencerId);
  const pkg = getPackageById(packageId);
  const umkm = getUmkmById(session.subjectId);

  if (!influencer || !pkg || pkg.influencerId !== influencerId || !umkm) {
    redirect(`/booking/${influencerId}?gagal=1`);
  }

  createBooking({
    influencerId,
    umkmId: umkm.id,
    packageName: pkg.name,
    amount: pkg.price,
    message,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/influencer");
  redirect("/dashboard?status=baru");
}

/* ------------------------------------------------------------------ */
/* Konfirmasi kolaborasi oleh influencer                               */
/* ------------------------------------------------------------------ */

export async function setBookingStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "influencer") redirect("/login");

  const bookingId = Number(formData.get("bookingId"));
  const status = String(formData.get("status")) as BookingStatus;

  if (!["APPROVED", "REJECTED", "DONE"].includes(status)) {
    redirect("/dashboard/influencer");
  }

  const booking = getBookingById(bookingId);
  if (!booking || booking.influencerId !== session.subjectId) {
    redirect("/dashboard/influencer");
  }

  updateBookingStatus(booking.id, status);
  revalidatePath("/dashboard/influencer");
  revalidatePath("/dashboard");
}