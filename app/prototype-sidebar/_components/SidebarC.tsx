// THROWAWAY PROTOTYPE — Variant C: grouped sections + side-tab indicator.
// Active = left edge bar + tinted icon tile + bold primary text (no row fill).
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge, PREVIEW_NAV, type PreviewNavItem } from "./nav";

const GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "Menu", hrefs: ["/dashboard", "/influencers"] },
  { title: "Aktivitas", hrefs: ["/dashboard/riwayat", "/dashboard/chat"] },
];

function Row({
  item,
  isActive,
  onSelect,
}: {
  item: PreviewNavItem;
  isActive: boolean;
  onSelect: (href: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.href)}
      aria-current={isActive ? "page" : undefined}
      className="relative flex w-full items-center gap-3 rounded-r-xl py-2.5 pr-4 pl-5 text-sm transition-colors duration-150"
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-full bg-primary-600 transition-all duration-200 ${
          isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
        }`}
      />
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors duration-150 ${
          isActive
            ? "bg-primary-50 text-primary-700"
            : "bg-neutral-100 text-neutral-500"
        }`}
      >
        <item.icon className="h-4 w-4" />
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-left ${
          isActive
            ? "font-bold text-primary-700"
            : "font-medium text-neutral-600"
        }`}
      >
        {item.label}
      </span>
      {item.badge ? <Badge count={item.badge} /> : null}
    </button>
  );
}

export function SidebarC({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (href: string) => void;
}) {
  const byHref = new Map(PREVIEW_NAV.map((i) => [i.href, i]));
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Logo />
      <nav className="mt-8 space-y-6" aria-label="Navigasi utama">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1 px-5 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
              {g.title}
            </p>
            <div className="space-y-0.5">
              {g.hrefs.map((href) => {
                const item = byHref.get(href)!;
                return (
                  <Row
                    key={href}
                    item={item}
                    isActive={active === href}
                    onSelect={onSelect}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
