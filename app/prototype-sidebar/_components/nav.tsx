// THROWAWAY PROTOTYPE — not production code.
// Question: "Which sidebar layout + active navlink indicator? Three variants
// (A: list fill [current], B: icon rail pill, C: grouped side-tab),
// switchable via ?variant=, on throwaway /prototype-sidebar route."
// Sub-shape B because dashboard layouts (which render the real Sidebar)
// cannot read searchParams, so variants can't mount on live routes.
// Same nav data + click-to-preview active state in all variants.
import {
  History,
  LayoutDashboard,
  MessageCircle,
  Search,
  type LucideIcon,
} from "lucide-react";

export type PreviewNavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  badge?: number;
};

export const PREVIEW_NAV: PreviewNavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/influencers", label: "Cari Kreator", short: "Kreator", icon: Search },
  {
    href: "/dashboard/riwayat",
    label: "Riwayat Kolaborasi",
    short: "Riwayat",
    icon: History,
  },
  {
    href: "/dashboard/chat",
    label: "Chat",
    short: "Chat",
    icon: MessageCircle,
    badge: 3,
  },
];

export function Badge({ count }: { count: number }) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-neutral-0">
      {count > 9 ? "9+" : count}
    </span>
  );
}
