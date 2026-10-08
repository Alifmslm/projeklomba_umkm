import { getBookingsByUmkm } from "@/lib/data/bookings";
import type { Metadata } from "next";
import { requireUmkm } from "@/lib/auth";

import { formatDate, initials } from "@/lib/format";
import type { ChatConversation, ChatMessage, ChatState } from "@/components/chat";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description: "Diskusi langsung dengan kreator di Kolab.id.",
};

/** State chat per status booking (ARCHITECTURE §2.7). */
function chatStateOf(status: string): ChatState {
  switch (status) {
    case "COMPLETED":
      return "readonly";
    case "REJECTED":
      return "closed";
    default:
      return "open"; // PENDING..DISPUTED
  }
}

export default async function ChatPage() {
  const account = await requireUmkm();

  const bookings = await getBookingsByUmkm(account.umkmId);

  // Satu percakapan per booking (§2.7). Pesan lain difixture deterministik
  // dari brief; kirim pesan hanya memengaruhi state lokal prototipe.
  const conversations: ChatConversation[] = bookings.map((b) => ({
    id: `booking-${b.id}`,
    partnerName: b.influencerName,
    partnerInitial: initials(b.influencerName),
    lastMessage: b.brief,
    time: formatDate(b.createdAt),
    unread: b.status === "PENDING" || b.status === "ACCEPTED" ? 1 : 0,
    state: chatStateOf(b.status),
  }));

  const messages: Record<string, ChatMessage[]> = {};
  for (const b of bookings) {
    const id = `booking-${b.id}`;
    const brief: ChatMessage = {
      id: `${id}-brief`,
      side: "me",
      senderName: account.fullName,
      text: b.brief,
      time: formatDate(b.createdAt),
    };
    const reply: ChatMessage = {
      id: `${id}-reply`,
      side: "other",
      senderName: b.influencerName,
      text:
        b.status === "COMPLETED"
          ? "Konten sudah saya kirim — terima kasih atas kolaborasinya! 🙌"
          : b.status === "REJECTED"
            ? "Mohon maaf, jadwal saya penuh untuk periode ini."
            : "Siap, brief-nya jelas. Saya konfirmasi lewat dashboard dan mulai garap ya.",
      time: formatDate(b.createdAt),
    };
    messages[id] = [brief, reply];
  }

  return (
    <>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Chat
        </p>
        <h1 className="mt-1 font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Chat dengan Kreator
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Diskusi brief dan progres langsung di satu tempat.
        </p>
      </div>

      <div className="mt-8">
        <ChatClient
          conversations={conversations}
          messages={messages}
          userName={account.fullName}
        />
      </div>
    </>
  );
}