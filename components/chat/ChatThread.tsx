import { Lock, X } from "lucide-react";
import { CHAT_STATE_LABEL, type ChatMessage, type ChatState } from "./types";
import { MessageBubble } from "./MessageBubble";

/**
 * ChatThread (ARCHITECTURE §2.7): area pesan. State-aware:
 * - open: obrolan aktif
 * - readonly (COMPLETED/CANCELLED): banner read-only, pesan tetap terlihat
 * - closed (REJECTED): banner tertutup
 */
export function ChatThread({
  messages,
  state,
}: {
  messages: ChatMessage[];
  state: ChatState;
}) {
  const readonly = state === "readonly";
  const closed = state === "closed";

  return (
    <div className="flex min-h-96 flex-col">
      {readonly && (
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-600">
          <Lock className="h-3.5 w-3.5" />
          Kolaborasi selesai — chat dibaca saja
        </div>
      )}
      {closed && (
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-700">
          <X className="h-3.5 w-3.5" />
          Permintaan ditolak — chat ditutup
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-500">
            Belum ada pesan. Buka percakapan dengan{" "}
            {CHAT_STATE_LABEL[state].toLowerCase()}.
          </p>
        )}
      </div>
    </div>
  );
}