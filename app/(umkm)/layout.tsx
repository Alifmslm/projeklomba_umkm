import type { ReactNode } from "react";

/**
 * UMKM dashboard routes live in the (umkm) route group so they render
 * WITHOUT the global navbar + footer — they use DashboardShell
 * (sidebar + header) instead. URL paths are unaffected by the group.
 */
export default function UmkmGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
