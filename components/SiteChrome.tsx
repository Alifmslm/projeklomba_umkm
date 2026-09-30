"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * UMKM dashboard routes render inside DashboardShell (own sidebar),
 * so the global navbar + footer are hidden there.
 * The creator dashboard keeps the global chrome (unchanged).
 *
 * Navbar/Footer are received as props from the server layout so they
 * stay server components (they use next/headers).
 */
const CHROMELESS_PREFIXES = ["/dashboard/riwayat", "/dashboard/profile"];

export function SiteChrome({
  navbar,
  footer,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const chromeless =
    pathname === "/dashboard" ||
    CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));

  if (chromeless) return <>{children}</>;

  return (
    <>
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
