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
    <div className="flex h-full flex-col px-5 py-6">
      <Link href={logoHref} onClick={onNavigate} aria-label="Kolab.id - Dashboard">
        <Logo />
      </Link>

      <nav className="mt-8 space-y-1" aria-label="Navigasi utama">
        {items.map((item) => {
          const isActive = active === item.href;
          const count = item.badge === "chat" ? unreadChatCount : openCasesCount;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-standard ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-neutral-0">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}