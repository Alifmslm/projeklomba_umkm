"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Scale,
  Search,
} from "lucide-react";
import { logout } from "@/app/actions";
import { Logo } from "./Logo";

export type SidebarRole = "umkm" | "influencer" | "admin";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** badge berupa jumlah (chat unread / kasus terbuka) */
  badge?: "chat" | "cases";
};

const NAV: Record<SidebarRole, NavItem[]> = {
  umkm: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/influencers", label: "Cari Kreator", icon: Search },
    { href: "/dashboard/riwayat", label: "Riwayat Kolaborasi", icon: History },
    { href: "/dashboard/chat", label: "Chat", icon: MessageCircle, badge: "chat" },
  ],
  influencer: [
    { href: "/dashboard/influencer", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/dashboard/influencer/riwayat",
      label: "Riwayat Kolaborasi",
      icon: History,
    },
    {
      href: "/dashboard/influencer/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: "chat",
    },
    {
      href: "/dashboard/influencer/paket",
      label: "Paket & Harga",
      icon: Package,
    },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kasus", label: "Antrian Kasus", icon: Scale, badge: "cases" },
  ],
};

/** Pengelompokan nav per role (label seksi + urutan href). */
const GROUPS: Record<SidebarRole, { title: string; hrefs: string[] }[]> = {
  umkm: [
    { title: "Menu", hrefs: ["/dashboard", "/influencers"] },
    { title: "Aktivitas", hrefs: ["/dashboard/riwayat", "/dashboard/chat"] },
  ],
  influencer: [
    { title: "Menu", hrefs: ["/dashboard/influencer"] },
    { title: "Toko", hrefs: ["/dashboard/influencer/paket"] },
    {
      title: "Aktivitas",
      hrefs: ["/dashboard/influencer/riwayat", "/dashboard/influencer/chat"],
    },
  ],
  admin: [{ title: "Menu", hrefs: ["/admin", "/admin/kasus"] }],
};

/** Item aktif = prefix terpanjang yang cocok (biar /dashboard/riwayat/[id]
 *  tetap menyorot "Riwayat Kolaborasi", bukan "Dashboard"). */
function activeHref(pathname: string, items: NavItem[]): string | null {
  const matches = items
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + "/"),
    )
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? null;
}

/**
 * Sidebar per-role (ARCHITECTURE §3.2/§4.2/§5.4): item navigasi dari token,
 * badge unread chat / kasus terbuka, dan Logout di bagian bawah.
 */
export function Sidebar({
  role,
  unreadChatCount = 0,
  openCasesCount = 0,
  onNavigate,
}: {
  role: SidebarRole;
  unreadChatCount?: number;
  openCasesCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV[role];
  const active = activeHref(pathname, items);
  const logoHref =
    role === "umkm" ? "/dashboard" : role === "influencer" ? "/dashboard/influencer" : "/admin";

  return (
    <div className="flex h-full flex-col px-3 pb-3">
      <Link
        href={logoHref}
        onClick={onNavigate}
        aria-label="Kolab.id - Dashboard"
        className="flex h-16 shrink-0 items-center px-2"
      >
        <Logo />
      </Link>

      <nav className="flex flex-1 flex-col gap-6 pt-2" aria-label="Navigasi utama">
        {GROUPS[role].map((group) => (
          <div key={group.title}>
            <p className="pb-1 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
              {group.title}
            </p>
            <div className="flex flex-col gap-1">
              {group.hrefs.map((href) => {
                const item = items.find((i) => i.href === href);
                if (!item) return null;
                const isActive = active === item.href;
                const count =
                  item.badge === "chat" ? unreadChatCount : openCasesCount;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-[13px] transition-colors duration-150 ${
                      isActive
                        ? "bg-primary-100 font-bold text-primary-700"
                        : "font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-primary-700"
                      />
                    )}
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {item.label}
                    </span>
                    {count > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-neutral-0">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="pt-6">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}