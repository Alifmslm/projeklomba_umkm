// THROWAWAY PROTOTYPE — Variant B: icon rail.
// Narrow column, icon + micro-label stacked; active = solid primary pill.
import { LogOut } from "lucide-react";
import { Badge, PREVIEW_NAV } from "./nav";

export function SidebarB({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (href: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center px-3 py-6">
      <span
        aria-hidden="true"
        className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-600 text-lg font-extrabold text-white"
      >
        K
      </span>
      <nav
        className="mt-8 flex flex-col items-center gap-1.5"
        aria-label="Navigasi utama"
      >
        {PREVIEW_NAV.map((item) => {
          const isActive = active === item.href;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onSelect(item.href)}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={`relative flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-colors duration-150 ${
                isActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/30"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-[10px] leading-tight font-semibold">
                {item.short}
              </span>
              {item.badge ? (
                <span className="absolute -top-1 -right-1">
                  <Badge count={item.badge} />
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <button
          type="button"
          aria-label="Logout"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-neutral-900 text-neutral-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
