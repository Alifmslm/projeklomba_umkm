"use client";

import { useMemo, useState } from "react";
import { ChatList, ChatThread, ChatInput } from "@/components/chat";
import type { ChatConversation, ChatMessage, ChatState } from "@/components/chat";

/**
 * ChatClient — halaman chat kreator (ARCHITECTURE §2.7). Satu percakapan per
 * booking; state per status: open (PENDING..DISPUTED), readonly
 * (COMPLETED/CANCELLED), closed (REJECTED). Kirim pesan hanya saat open,
 * append lokal (prototipe).
 */
export function ChatClient({
  conversations,
  messages,
  userName,
}: {
  conversations: ChatConversation[];
  /** kunci = conversation.id → isi pesan */
  messages: Record<string, ChatMessage[]>;
  userName: string;
}) {
  const [activeId, setActiveId] = useState(
    conversations[0]?.id ?? "",
  );
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(
    messages,
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  const activeMessages = active ? threads[active.id] ?? [] : [];
  const state: ChatState = active?.state ?? "closed";

  const send = (text: string) => {
    if (!active) return;
    const message: ChatMessage = {
      id: `${active.id}-${Date.now()}`,
      side: "me",
      senderName: userName,
      text,
      time: "Baru saja",
    };
    setThreads((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), message],
    }));
  };

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 shadow-xs lg:grid-cols-[320px_1fr]">
      <div className="border-b border-neutral-100 lg:border-b-0 lg:border-r">
        <ChatList
          conversations={conversations}
          activeId={active?.id}
          onSelect={setActiveId}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-bold text-neutral-0">
                {active.partnerInitial}
              </span>
              <div className="min-w-0">
                <p className="truncate type-card-title text-neutral-900">
                  {active.partnerName}
                </p>
                <p className="type-caption text-neutral-500">
                  {active.unread > 0
                    ? `${active.unread} pesan belum dibaca`
                    : "Percakapan kolaborasi"}
                </p>
              </div>
            </div>
            <ChatThread messages={activeMessages} state={state} />
            <ChatInput
              state={state}
              onSubmit={send}
              placeholder="Tulis pesan untuk UMKM…"
            />
          </>
        ) : (
          <p className="p-10 text-center type-table text-neutral-500">
            Pilih percakapan untuk mulai.
          </p>
        )}
      </div>
    </div>
  );
}