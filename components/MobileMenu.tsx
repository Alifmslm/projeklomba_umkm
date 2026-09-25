"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import type { Session } from "@/lib/types";
import { logout } from "@/app/actions";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/influencers", label: "Cari Kreator" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/login", label: "Masuk" },
];

export function MobileMenu({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);
  const dashHref =
    session?.role === "umkm" ? "/dashboard" : "/dashboard/influencer";

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          {session && (
            <>
              <Link
                href={dashHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                Dashboard
              </Link>
              <form
                action={async () => {
                  setOpen(false);
                  await logout();
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar · {session.name}
                </button>
              </form>
            </>
          )}
          {!session && (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
          )}
        </div>
      )}
    </div>
  );
}