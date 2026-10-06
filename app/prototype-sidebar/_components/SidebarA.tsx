// THROWAWAY PROTOTYPE — Variant A: current list layout (baseline).
// Active = soft primary fill behind the whole row.
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge, PREVIEW_NAV } from "./nav";

export function SidebarA({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (href: string) => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Logo />
      <nav className="mt-8 space-y-1" aria-label="Navigasi utama">
        {PREVIEW_NAV.map((item) => {
          const isActive = active === item.href;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onSelect(item.href)}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>
              {item.badge ? <Badge count={item.badge} /> : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-neutral-0"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
