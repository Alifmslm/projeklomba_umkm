"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { UmkmNotification } from "@/lib/types";
import { DashboardHeader } from "./DashboardHeader";
import { Sidebar, type SidebarRole } from "./Sidebar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/riwayat": "Riwayat Kolaborasi",
  "/dashboard/riwayat/[id]": "Detail Kolaborasi",
  "/dashboard/profile": "Profile",
  "/dashboard/chat": "Chat",
  "/influencers": "Cari Kreator",
  "/influencers/[id]": "Detail Kreator",
  "/dashboard/influencer": "Dashboard",
  "/dashboard/influencer/riwayat": "Riwayat Kolaborasi",
  "/dashboard/influencer/chat": "Chat",
  "/dashboard/influencer/paket": "Paket & Harga",
  "/admin": "Dashboard",
  "/admin/kasus": "Antrian Kasus",
  "/admin/kasus/[id]": "Detail Kasus",
  "/admin/profile": "Profile",
};

/** Judul halaman: kecocokan tepat dulu, lalu prefix terpanjang (untuk
 *  route dinamis seperti `/admin/kasus/[id]`). */
function resolveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.entries(TITLES)
    .filter(
      ([key]) =>
        key.endsWith("/[id]") && pathname.startsWith(key.slice(0, -5)),
    )
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? "Dashboard";
}

const PROFILE_HREF: Record<SidebarRole, string> = {
  umkm: "/dashboard/profile",
  influencer: "/dashboard/influencer/profile",
  admin: "/admin/profile",
};

const LOGO_HREF: Record<SidebarRole, string> = {
  umkm: "/dashboard",
  influencer: "/dashboard/influencer",
  admin: "/admin",
};

/**
 * DashboardShell — frame bersama (ARCHITECTURE §1.2): Sidebar per-role +
 * DashboardHeader (judul, bell, profile) + konten + drawer mobile.
 * Seluruh region berasal dari komponen bersama; fetching & guard tetap
 * di halaman.
 */
export function DashboardShell({
  role,
  userName,
  notifications,
  attentionCount,
  unreadChatCount = 0,
  openCasesCount = 0,
  profileHref,
  logoHref,
  notificationHref,
  notificationFooterLabel,
  children,
}: {
  role: SidebarRole;
  userName: string;
  notifications: UmkmNotification[];
  attentionCount: number;
  unreadChatCount?: number;
  openCasesCount?: number;
  profileHref?: string;
  logoHref?: string;
  notificationHref?: string;
  /** label tautan footer bell notifikasi (berbeda per role) */
  notificationFooterLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  const resolvedProfile = profileHref ?? PROFILE_HREF[role];
  const resolvedLogo = logoHref ?? LOGO_HREF[role];
  const resolvedBell = notificationHref ?? "/dashboard/riwayat";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-neutral-200 bg-neutral-0 lg:block">
        <Sidebar
          role={role}
          unreadChatCount={unreadChatCount}
          openCasesCount={openCasesCount}
        />
      </aside>

      <div className="lg:pl-60">
        <DashboardHeader
          title={title}
          userName={userName}
          notifications={notifications}
          attentionCount={attentionCount}
          profileHref={resolvedProfile}
          logoHref={resolvedLogo}
          notificationHref={resolvedBell}
          notificationFooterLabel={notificationFooterLabel}
          onOpenMenu={() => setOpen(true)}
        />

        {/* Content */}
        <div className="flex justify-center">
          <div className="mx-6 flex-1 py-6 lg:py-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-950/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-neutral-0 shadow-md">
            <Sidebar
              role={role}
              unreadChatCount={unreadChatCount}
              openCasesCount={openCasesCount}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}