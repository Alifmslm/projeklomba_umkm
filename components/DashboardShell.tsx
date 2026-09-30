"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { logout } from "@/app/actions";
import type { UmkmNotification } from "@/lib/data";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencers", label: "Cari Kreator", icon: Search },
  { href: "/dashboard/riwayat", label: "Riwayat Kolaborasi", icon: History },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/riwayat": "Riwayat Kolaborasi",
  "/dashboard/profile": "Profile",
  "/dashboard/chat": "Chat",
};

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-8 space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/dashboard" onClick={onNavigate} aria-label="Kolab.id - Dashboard">
        <Logo />
      </Link>

      <NavItems onNavigate={onNavigate} />

      <div className="mt-auto pt-6">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export function DashboardShell({
  userName,
  notifications,
  attentionCount,
  children,
}: {
  userName: string;
  notifications: UmkmNotification[];
  attentionCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Dashboard";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarBody />
      </aside>

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/dashboard"
              className="shrink-0 lg:hidden"
              aria-label="Kolab.id - Dashboard"
            >
              <Logo />
            </Link>
            <h1 className="hidden min-w-0 flex-1 truncate text-lg font-extrabold text-slate-900 lg:block">
              {title}
            </h1>
            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <NotificationBell
                items={notifications}
                attentionCount={attentionCount}
              />
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-indigo-200 sm:pr-3.5"
                aria-label="Profile usaha"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-extrabold text-white">
                  {initial}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-bold text-slate-800 sm:block">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600"
              aria-label="Tutup menu"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
