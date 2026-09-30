"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { logout } from "@/app/actions";
import { Logo } from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencers", label: "Cari Kreator", icon: Search },
  { href: "/dashboard/riwayat", label: "Riwayat Kolaborasi", icon: History },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

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

function SidebarBody({
  userName,
  onNavigate,
}: {
  userName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/dashboard" onClick={onNavigate} aria-label="Kolab.id - Dashboard">
        <Logo />
      </Link>

      <NavItems onNavigate={onNavigate} />

      <div className="mt-auto space-y-3 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-extrabold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">Akun UMKM</p>
          </div>
        </div>
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
  children,
}: {
  userName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarBody userName={userName} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" aria-label="Kolab.id - Dashboard">
          <Logo />
        </Link>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-extrabold text-white">
          {userName.charAt(0).toUpperCase()}
        </span>
      </header>

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
            <SidebarBody userName={userName} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
