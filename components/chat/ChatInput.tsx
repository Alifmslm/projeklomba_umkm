"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import type { ChatState } from "./types";

/**
 * ChatInput (ARCHITECTURE §2.7): input + tombol kirim, state-aware.
 * Read-only saat kolaborasi COMPLETED/CANCELLED, tertutup saat REJECTED —
 * di kedua state tersebut input nonaktif dan tidak bisa dipakai.
 */
export function ChatInput({
  state,
  placeholder = "Tulis pesan…",
  onSubmit,
}: {
  state: ChatState;
  placeholder?: string;
  onSubmit?: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const disabled = state !== "open";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSubmit?.(trimmed);
        setText("");
      }}
      className="flex items-end gap-2 border-t border-neutral-100 p-3"
    >
      <label htmlFor="chat-input" className="sr-only">
        Pesan baru
      </label>
      <textarea
        id="chat-input"
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
        placeholder={disabled ? "Chat tidak tersedia" : placeholder}
        disabled={disabled}
        className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-0 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Kirim pesan"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-500 text-neutral-0 transition-colors duration-150 ease-standard hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        <Send className="h-4.5 w-4.5" />
      </button>
    </form>
  );
}