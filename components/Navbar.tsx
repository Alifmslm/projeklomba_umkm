import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import { DASHBOARD_BY_ROLE, getUserContext } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { Logo } from "./Logo";
import { NavbarLinks } from "./NavbarLinks";

const links = [
  { href: "/#beranda", label: "Beranda" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#faq", label: "FAQ" },
];

export async function Navbar() {
  const account = await getUserContext();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-neutral-0/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="Kolab.id - Beranda"
        >
          <Logo />
        </Link>

        <NavbarLinks links={links} />

        <div className="hidden items-center gap-3 md:flex">
          {account ? (
            <>
              <Link
                href={DASHBOARD_BY_ROLE[account.role]}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-0 px-3.5 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-200 hover:text-primary-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                {account.fullName}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-600"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 text-sm font-semibold text-neutral-0 shadow-md shadow-primary-500/25 transition-all hover:shadow-lg hover:brightness-110"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}