import { getUmkmNotifications } from "@/lib/data/bookings";
import type { ReactNode } from "react";
import { requireUmkm } from "@/lib/auth";

import { DashboardShell } from "./DashboardShell";

/**
 * Server wrapper yang menjaga route khusus UMKM, memuat feed notifikasi,
 * dan merender frame sidebar + header di sekitar konten.
 */
export async function UmkmShell({ children }: { children: ReactNode }) {
  const account = await requireUmkm();

  const { items, attentionCount } = await getUmkmNotifications(account.umkmId);

  return (
    <DashboardShell
      role="umkm"
      userName={account.fullName}
      notifications={items}
      attentionCount={attentionCount}
    >
      {children}
    </DashboardShell>
  );
}