import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";
import { Logo } from "./Logo";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/influencers", label: "Cari Kreator" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
];

export async function Navbar() {
  const session = await getSession();
  const dashHref =
    session?.role === "umkm" ? "/dashboard" : "/dashboard/influencer";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="Kolab.id - Beranda"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <Link
                href={dashHref}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                {session.name}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:shadow-lg hover:brightness-110"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}