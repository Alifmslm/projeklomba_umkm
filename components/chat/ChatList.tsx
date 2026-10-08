"use client";

import { MessageSquare } from "lucide-react";
import type { ChatConversation } from "./types";

/**
 * ChatList (ARCHITECTURE §2.7): daftar percakapan di kiri dengan badge
 * unread dan penanda state (terbuka / read-only / tertutup).
 */
export function ChatList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600">
          <MessageSquare className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-neutral-900">Belum ada chat</p>
        <p className="text-xs text-neutral-500">
          Percakapan dibuat otomatis saat kolaborasi diajukan.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {conversations.map((c) => {
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-standard hover:bg-neutral-50 ${
                active ? "bg-primary-50/70" : "bg-transparent"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-neutral-0">
                {c.partnerInitial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-neutral-900">
                    {c.partnerName}
                  </span>
                  <span className="shrink-0 text-[11px] text-neutral-400">
                    {c.time}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-xs ${
                      c.unread > 0
                        ? "font-semibold text-neutral-900"
                        : "text-neutral-500"
                    }`}
                  >
                    {c.lastMessage}
                  </span>
                  {c.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-neutral-0">
                      {c.unread > 9 ? "9+" : c.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}