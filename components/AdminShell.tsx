import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import {
  adminNotifications,
  ADMIN_ATTENTION_COUNT,
  jumlahKasusTerbuka,
} from "./kasus-fixture";
import { DashboardShell } from "./DashboardShell";

/**
 * AdminShell (ARCHITECTURE §5): frame dashboard admin — guard role admin,
 * notifikasi kasus & badge antrian dari fixture, sidebar + header yang sama.
 * Profil mengarah ke /admin/profile (Profile Saya + Logout).
 */
export async function AdminShell({ children }: { children: ReactNode }) {
  const admin = await requireRole("admin");

  return (
    <DashboardShell
      role="admin"
      userName={admin.fullName}
      notifications={adminNotifications}
      attentionCount={ADMIN_ATTENTION_COUNT}
      openCasesCount={jumlahKasusTerbuka()}
      profileHref="/admin/profile"
      notificationHref="/admin/kasus"
      notificationFooterLabel="Lihat Antrian Kasus"
    >
      {children}
    </DashboardShell>
  );
}