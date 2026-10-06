// THROWAWAY PROTOTYPE — preview shell: holds click-to-preview active
// state (memory only) and renders the chosen sidebar beside mock content.
"use client";

import { useState } from "react";
import { SidebarA } from "./SidebarA";
import { SidebarB } from "./SidebarB";
import { SidebarC } from "./SidebarC";

export function PreviewShell({ variant }: { variant: string }) {
  const [active, setActive] = useState("/dashboard");

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <aside className="sticky top-0 h-dvh shrink-0 border-r border-neutral-200 bg-white">
        {variant === "B" ? (
          <SidebarB active={active} onSelect={setActive} />
        ) : variant === "C" ? (
          <div className="h-full w-72">
            <SidebarC active={active} onSelect={setActive} />
          </div>
        ) : (
          <div className="h-full w-72">
            <SidebarA active={active} onSelect={setActive} />
          </div>
        )}
      </aside>
      {/* Mock content — placeholder only, not part of the design under test. */}
      <main className="min-w-0 flex-1 px-8 py-10">
        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
          Mock konten dashboard
        </p>
        <h1 className="font-head mt-2 text-3xl font-extrabold text-neutral-900">
          Klik item sidebar untuk preview active indicator
        </h1>
        <div className="mt-6 max-w-lg space-y-3">
          <div className="h-4 rounded bg-neutral-200" />
          <div className="h-4 w-5/6 rounded bg-neutral-200" />
          <div className="h-4 w-4/6 rounded bg-neutral-200" />
        </div>
        <p className="mt-6 font-mono text-xs text-neutral-500">
          activeHref = {active}
        </p>
      </main>
    </div>
  );
}
