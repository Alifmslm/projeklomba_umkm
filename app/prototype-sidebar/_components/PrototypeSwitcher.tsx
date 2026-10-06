// THROWAWAY PROTOTYPE — floating variant switcher (hidden in production).
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";

export const SIDEBAR_VARIANTS = [
  { key: "A", name: "List fill" },
  { key: "B", name: "Icon rail" },
  { key: "C", name: "Grouped tab" },
] as const;

export function PrototypeSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const idx = Math.max(
    0,
    SIDEBAR_VARIANTS.findIndex((v) => v.key === current),
  );

  const go = useCallback(
    (dir: 1 | -1) => {
      const next =
        SIDEBAR_VARIANTS[
          (idx + dir + SIDEBAR_VARIANTS.length) % SIDEBAR_VARIANTS.length
        ];
      router.replace(`${pathname}?variant=${next.key}`, { scroll: false });
    },
    [idx, pathname, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      aria-label="Prototype variant switcher"
      className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-neutral-900 py-1.5 pl-3 pr-1.5 text-white shadow-lg"
    >
      <FlaskConical className="h-3.5 w-3.5 text-secondary-400" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
        Proto
      </span>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous variant"
        className="rounded-full p-1.5 transition-colors hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-36 text-center text-xs font-semibold">
        {SIDEBAR_VARIANTS[idx].key} · {SIDEBAR_VARIANTS[idx].name}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next variant"
        className="rounded-full p-1.5 transition-colors hover:bg-white/10"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
