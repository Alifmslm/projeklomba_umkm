import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBookingsByInfluencer } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";
import { InfluencerShell } from "@/components/InfluencerShell";
import type { ChatConversation, ChatMessage, ChatState } from "@/components/chat";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description: "Diskusi langsung dengan UMKM di Kolab.id.",
};

/** State chat per status booking (ARCHITECTURE §2.7). */
function chatStateOf(status: string): ChatState {
  switch (status) {
    case "DONE":
      return "readonly";
    case "REJECTED":
      return "closed";
    default:
      return "open"; // PENDING..DISPUTED
  }
}

export default async function InfluencerChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "influencer") redirect("/dashboard");

  const bookings = getBookingsByInfluencer(session.subjectId);

  // Satu percakapan per booking (§2.7) dengan pihak lawan = UMKM.
  // Pesan difixture deterministik dari brief; kirim pesan hanya
  // memengaruhi state lokal prototipe.
  const conversations: ChatConversation[] = bookings.map((b) => ({
    id: `booking-${b.id}`,
    partnerName: b.umkmName,
    partnerInitial: initials(b.umkmName),
    lastMessage: b.message,
    time: formatDate(b.createdAt),
    unread: b.status === "PENDING" || b.status === "APPROVED" ? 1 : 0,
    state: chatStateOf(b.status),
  }));

  const messages: Record<string, ChatMessage[]> = {};
  for (const b of bookings) {
    const id = `booking-${b.id}`;
    const brief: ChatMessage = {
      id: `${id}-brief`,
      side: "other",
      senderName: b.umkmName,
      text: b.message,
      time: formatDate(b.createdAt),
    };
    const reply: ChatMessage = {
      id: `${id}-reply`,
      side: "me",
      senderName: session.name,
      text:
        b.status === "DONE"
          ? "Konten sudah saya kirim — terima kasih atas kolaborasinya! 🙌"
          : b.status === "REJECTED"
            ? "Mohon maaf, jadwal saya penuh untuk periode ini."
            : "Siap, brief-nya jelas. Saya konfirmasi lewat dashboard dan mulai garap ya.",
      time: formatDate(b.createdAt),
    };
    messages[id] = [brief, reply];
  }

  return (
    <InfluencerShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Chat
        </p>
        <h1 className="mt-1 font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Chat dengan UMKM
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Diskusi brief dan progres langsung di satu tempat.
        </p>
      </div>

      <div className="mt-8">
        <ChatClient
          conversations={conversations}
          messages={messages}
          userName={session.name}
        />
      </div>
    </InfluencerShell>
  );
}