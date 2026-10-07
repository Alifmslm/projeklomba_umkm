import { getBookingsByInfluencer, getReviewForBookingRole } from "@/lib/data/bookings";
import type { ReactNode } from "react";
import { requireInfluencer } from "@/lib/auth";

import { formatRupiah } from "@/lib/format";
import type { BookingWithUmkm, UmkmNotification } from "@/lib/types";
import { DashboardShell } from "./DashboardShell";

/**
 * Notifikasi kreator — diturunkan langsung dari status booking (mirip
 * getUmkmNotifications, tapi page-local di shell agar data layer booking tetap
 * utuh). Kinds memakai 4 mapping ikon yang sama dengan bell UMKM.
 */
async function getInfluencerNotifications(
  bookings: BookingWithUmkm[],
  limit = 5,
): Promise<{ items: UmkmNotification[]; attentionCount: number }> {
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
    } else if (b.status === "ACCEPTED") {
      if (items.length < limit) {
        items.push({
          key: `paid-${b.id}`,
          kind: "accepted",
          title: `${b.umkmName} sudah membayar. Dana ditahan, silakan mulai`,
          desc,
          href: "/dashboard/influencer/riwayat",
        });
      }
    } else if (b.status === "COMPLETED") {
      if (!(await getReviewForBookingRole(b.id, "influencer"))) {
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
  const account = await requireInfluencer();

  const bookings = await getBookingsByInfluencer(account.influencerId);
  const { items, attentionCount } = await getInfluencerNotifications(bookings);
  const unreadChatCount = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "ACCEPTED",
  ).length;

  return (
    <DashboardShell
      role="influencer"
      userName={account.fullName}
      notifications={items}
      attentionCount={attentionCount}
      unreadChatCount={unreadChatCount}
      profileHref={`/influencers/${account.influencerId}`}
      notificationHref="/dashboard/influencer/riwayat"
    >
      {children}
    </DashboardShell>
  );
}