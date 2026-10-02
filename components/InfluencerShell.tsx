import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import {
  getBookingsByInfluencer,
  getReviewForBookingRole,
  type UmkmNotification,
} from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import type { BookingWithUmkm } from "@/lib/types";
import { DashboardShell } from "./DashboardShell";

/**
 * Notifikasi kreator — diturunkan langsung dari status booking (mirip
 * getUmkmNotifications, tapi page-local di shell agar lib/data.ts tetap
 * utuh). Kinds memakai 4 mapping ikon yang sama dengan bell UMKM.
 */
function getInfluencerNotifications(
  bookings: BookingWithUmkm[],
  limit = 5,
): { items: UmkmNotification[]; attentionCount: number } {
  const items: UmkmNotification[] = [];
  let attentionCount = 0;

  for (const b of bookings) {
    const desc = `${b.packageName} · ${formatRupiah(b.amount)}`;
    if (b.status === "PENDING") {
      attentionCount++;
      if (items.length < limit) {
        items.push({
          key: `request-${b.id}`,
          kind: "pending",
          title: `Permintaan kolaborasi baru dari ${b.umkmName}`,
          desc,
          href: "/dashboard/influencer/riwayat",
        });
      }
    } else if (b.status === "APPROVED") {
      if (items.length < limit) {
        items.push({
          key: `paid-${b.id}`,
          kind: "approved",
          title: `${b.umkmName} sudah membayar. Dana ditahan, silakan mulai`,
          desc,
          href: "/dashboard/influencer/riwayat",
        });
      }
    } else if (b.status === "DONE") {
      if (!getReviewForBookingRole(b.id, "influencer")) {
        attentionCount++;
        if (items.length < limit) {
          items.push({
            key: `review-${b.id}`,
            kind: "review",
            title: `Beri ulasan untuk ${b.umkmName}`,
            desc,
            href: `/review/${b.id}`,
          });
        }
      }
    }
  }

  return { items, attentionCount };
}

/**
 * Server wrapper untuk route khusus kreator (ARCHITECTURE §4): guard role,
 * feed notifikasi, dan frame sidebar + header DashboardShell. Profil mengarah
 * ke profil publik kreator — belum ada halaman pengaturan kreator di MVP.
 */
export async function InfluencerShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "influencer") redirect("/dashboard");

  const bookings = getBookingsByInfluencer(session.subjectId);
  const { items, attentionCount } = getInfluencerNotifications(bookings);
  const unreadChatCount = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "APPROVED",
  ).length;

  return (
    <DashboardShell
      role="influencer"
      userName={session.name}
      notifications={items}
      attentionCount={attentionCount}
      unreadChatCount={unreadChatCount}
      profileHref={`/influencers/${session.subjectId}`}
      notificationHref="/dashboard/influencer/riwayat"
    >
      {children}
    </DashboardShell>
  );
}