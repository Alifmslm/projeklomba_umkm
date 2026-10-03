import type { ChatMessage } from "./types";

/**
 * MessageBubble (DESIGN_SYSTEM §10.7): balon pesan — milik sendiri
 * primary (biru brand), milik lawan netral.
 */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.side === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs ${
          mine
            ? "rounded-br-md bg-primary-500 text-neutral-0"
            : "rounded-bl-md bg-neutral-100 text-neutral-900"
        }`}
      >
        {!mine && (
          <p className="mb-0.5 text-[11px] font-semibold text-neutral-500">
            {message.senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.text}
        </p>
        <p
          className={`mt-1 text-right text-[10px] ${
            mine ? "text-primary-100" : "text-neutral-400"
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}