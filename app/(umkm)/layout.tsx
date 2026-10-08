import type { ReactNode } from "react";
import { UmkmShell } from "@/components/UmkmShell";

/**
 * All UMKM dashboard routes (`/dashboard*` in this group) render inside
 * UmkmShell — sidebar + header — and WITHOUT the global navbar + footer
 * (hidden by the root layout for `/dashboard*` and `/`). URL paths are
 * unaffected by the route group.
 */
export default function UmkmGroupLayout({ children }: { children: ReactNode }) {
  return <UmkmShell>{children}</UmkmShell>;
}
