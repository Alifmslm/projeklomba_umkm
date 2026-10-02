import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileCheck2,
  Film,
  Lock,
  MessageSquareText,
  Package,
  Timer,
  Users,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  getBookingById,
  getInfluencerById,
  getReviewForBookingRole,
} from "@/lib/data";
import { formatDate, formatRupiah, initials } from "@/lib/format";
import { UmkmShell } from "@/components/UmkmShell";
import { Avatar } from "@/components/Avatar";
import { StatusBadge, type StatusKey } from "@/components/StatusBadge";
import { SectionCard, RevisionCounter, Timeline, type TimelineItem } from "@/components/booking";
import { MessageBubble } from "@/components/chat";
import { DetailActions } from "./detail-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Kolaborasi",
  description: "Rincian pengajuan kolaborasi UMKM di Kolab.id.",
};

const TOKEN: Record<"PENDING" | "APPROVED" | "DONE" | "REJECTED", StatusKey> = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DONE: "DONE",
  REJECTED: "REJECTED",
};

export default async function BookingDetailPage(
  props: PageProps<"/dashboard/riwayat/[id]">,
) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const params = await props.params;
  const id = Number(params.id);
  if (!Number.isFinite(id)) redirect("/dashboard/riwayat");

  const booking = getBookingById(id);
  if (!booking || booking.umkmId !== session.subjectId) {
    redirect("/dashboard/riwayat");
  }

  const influencer = getInfluencerById(booking.influencerId);
  const reviewed = Boolean(getReviewForBookingRole(booking.id, "umkm"));

  // Fixture deterministik tingkat halaman (data layer tak punya kolom
  // revisi/konten/timeline/chat — lihat frontend-end-to-end design)
  const revisionUsed = booking.status === "DONE" ? 1 : 0;
  const revisionTotal = 2;

  const timelineItems: TimelineItem[] = [
    {
      label: "Pengajuan dibuat",
      time: formatDate(booking.createdAt),
      tone: "default",
    },
  ];
  if (booking.status === "APPROVED" || booking.status === "DONE") {
    timelineItems.push({
      label: "Kreator mengonfirmasi",
      time: formatDate(booking.createdAt),
      tone: "primary",
    });
  }
  if (booking.status === "DONE") {
    timelineItems.push({
      label: "Konten dikirim & selesai",
      time: formatDate(booking.createdAt),
      tone: "success",
    });
  }
  if (booking.status === "REJECTED") {
    timelineItems.push({
      label: "Pengajuan ditolak",
      time: formatDate(booking.createdAt),
      tone: "error",
    });
  }

  const delivered =
    booking.status === "DONE"
      ? [
          { name: "Video review utama", note: "30–60 detik, sesuai brief", done: true },
          { name: "Cuplikan feed untuk story", note: "3 potongan 15 detik", done: true },
        ]
      : [];

  return (
    <UmkmShell>
      <div>
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-700">
          <Link href="/dashboard/riwayat" className="hover:text-primary-800">
            Riwayat
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-mono normal-case tracking-normal text-neutral-700">
            {booking.code}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
            Detail Kolaborasi
          </h1>
          <StatusBadge status={TOKEN[booking.status]} />
        </div>
        <p className="mt-1.5 text-neutral-600">
          Brief, paket, progres, dan aksi untuk kolaborasi ini.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {/* Ringkasan kreator */}
        {influencer && (
          <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs sm:flex-row sm:items-center">
            <Avatar name={influencer.name} color={influencer.color} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-head text-lg font-extrabold tracking-[-0.02em] text-neutral-900">
                {influencer.name}
              </p>
              <p className="truncate text-sm text-neutral-500">
                {influencer.handle} · {influencer.niche} · {influencer.city}
              </p>
            </div>
            <Link
              href={`/influencers/${influencer.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-neutral-0 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors duration-150 ease-standard hover:border-primary-400 hover:bg-primary-50"
            >
              <Users className="h-4 w-4" /> Lihat Profil
            </Link>
          </div>
        )}

        {/* Brief Terkunci */}
        <SectionCard title="Brief Terkunci" icon={Lock}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Pesan dari UMKM
              </p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-800">
                {booking.message}
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Terkunci saat pengajuan — tidak bisa diubah setelah dikirim.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Paket & Harga */}
        <SectionCard title="Paket & Harga" icon={Package}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-neutral-900">
                {booking.packageName}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Diajukan {formatDate(booking.createdAt)}
              </p>
            </div>
            <p className="font-head text-2xl font-extrabold tracking-[-0.02em] text-primary-700">
              {formatRupiah(booking.amount)}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
            <RevisionCounter used={revisionUsed} total={revisionTotal} />
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <Timer className="h-4 w-4" /> Estimasi 3–7 hari kerja
            </span>
          </div>
        </SectionCard>

        {/* Konten Terkirim */}
        <SectionCard title="Konten Terkirim" icon={Film}>
          {delivered.length > 0 ? (
            <ul className="space-y-3">
              {delivered.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success-50 text-success-600">
                    <Film className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900">{d.name}</p>
                    <p className="truncate text-xs text-neutral-500">{d.note}</p>
                  </div>
                  <span className="rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-700 ring-1 ring-inset ring-success-200">
                    Terkirim
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              Belum ada konten terkirim — progres akan muncul di sini.
            </p>
          )}
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Timeline" icon={Timer}>
          <Timeline items={timelineItems} />
        </SectionCard>

        {/* Riwayat Chat (mock tingkat halaman) */}
        <SectionCard
          title="Riwayat Chat"
          icon={MessageSquareText}
          action={
            <Link
              href="/dashboard/chat"
              className="text-xs font-semibold text-primary-700 hover:text-primary-800"
            >
              Buka Chat Penuh →
            </Link>
          }
        >
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            <MessageBubble
              message={{
                id: `b${booking.id}-1`,
                side: "me",
                senderName: session.name,
                text: booking.message,
                time: formatDate(booking.createdAt),
              }}
            />
            {booking.status !== "REJECTED" && (
              <MessageBubble
                message={{
                  id: `b${booking.id}-2`,
                  side: "other",
                  senderName: influencer?.name ?? initials("Kreator"),
                  text:
                    booking.status === "DONE"
                      ? "Konten sudah saya kirim — terima kasih atas kolaborasinya! 🙌"
                      : "Siap, brief-nya jelas. Saya konfirmasi lewat dashboard dan mulai garap ya.",
                  time: formatDate(booking.createdAt),
                }}
              />
            )}
          </div>
        </SectionCard>

        {/* Aksi per status + tawaran */}
        <SectionCard
          title="Aksi"
          icon={Users}
          action={<StatusBadge status={TOKEN[booking.status]} />}
        >
          <DetailActions
            status={booking.status}
            bookingId={booking.id}
            hasReviewed={reviewed}
          />
        </SectionCard>
      </div>
    </UmkmShell>
  );
}