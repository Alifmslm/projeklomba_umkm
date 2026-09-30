"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Star,
  XCircle,
} from "lucide-react";
import type { UmkmNotification } from "@/lib/data";

const KIND_STYLE = {
  pending: { icon: Clock, className: "bg-amber-50 text-amber-600" },
  approved: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  rejected: { icon: XCircle, className: "bg-rose-50 text-rose-600" },
  review: { icon: Star, className: "bg-indigo-50 text-indigo-600" },
} as const;

export function NotificationBell({
  items,
  attentionCount,
}: {
  items: UmkmNotification[];
  attentionCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {attentionCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {attentionCount > 9 ? "9+" : attentionCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <p className="border-b border-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900">
              Notifikasi
            </p>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                Belum ada aktivitas.
                <br />
                Pengajuan dan pembaruan kolaborasi akan muncul di sini.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {items.map((n) => {
                  const style = KIND_STYLE[n.kind];
                  return (
                    <li key={n.key}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.className}`}
                        >
                          <style.icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-900">
                            {n.title}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {n.desc}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href="/dashboard/riwayat"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Riwayat Kolaborasi
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
