import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeAlert,
  Banknote,
  Clock,
  FileCheck2,
  Film,
  Lock,
  Package,
  Repeat2,
  Timer,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/Avatar";
import {
  RevisionCounter,
  SectionCard,
  Timeline,
  type TimelineItem,
} from "@/components/booking";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type {
  BookingDetail,
  BookingStatus,
  PartyRole,
  Payment,
} from "@/lib/types";

/**
 * The read-only half of one booking's detail page, shared by both parties.
 *
 * It renders the same facts to the business and the creator - the brief as
 * submitted, the package terms and amounts as recorded, every delivered round,
 * every revision request with its within/outside flag, the payment state, and
 * the full timeline. The action panel is passed in as `children`, because which
 * actions are offered differs by role while what is shown does not.
 */

const STATUS_TEXT: Record<BookingStatus, string> = {
  PENDING: "Menunggu konfirmasi kreator",
  ACCEPTED: "Diterima, menunggu pembayaran",
  FUNDED: "Dana ditahan, konten dikerjakan",
  SUBMITTED: "Konten dikirim, menunggu review",
  REVISION: "Revisi diminta",
  DISPUTED: "Sengketa dibuka",
  COMPLETED: "Selesai, dana dirilis",
  REJECTED: "Ditolak kreator",
  CANCELLED: "Dibatalkan",
};

const ACTOR_TEXT: Record<string, string> = {
  umkm: "oleh UMKM",
  influencer: "oleh kreator",
  admin: "oleh admin",
  system: "otomatis",
};

export function BookingDetailView({
  perspective,
  booking,
  counterpart,
  children,
}: {
  perspective: PartyRole;
  booking: BookingDetail;
  counterpart: {
    name: string;
    handle?: string;
    categorySlug: string;
    category?: string;
    city: string;
    href?: string;
  } | null;
  children?: ReactNode;
}) {
  const iAmBusiness = perspective === "umkm";
  const revisionByDelivery = new Map(
    booking.revisions.map((r) => [r.deliveryId, r]),
  );

  const timelineItems: TimelineItem[] = booking.events.map((event) => ({
    label: event.fromStatus
      ? `${STATUS_TEXT[event.fromStatus]} → ${STATUS_TEXT[event.toStatus]}`
      : STATUS_TEXT[event.toStatus],
    time: `${formatDateTime(event.createdAt)} · ${ACTOR_TEXT[event.actorRole] ?? event.actorRole}`,
    tone:
      event.toStatus === "COMPLETED"
        ? "success"
        : event.toStatus === "REJECTED" || event.toStatus === "DISPUTED"
          ? "error"
          : event.toStatus === "PENDING"
            ? "default"
            : "primary",
  }));

  return (
    <div className="space-y-5">
      {children}

      {counterpart && (
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs sm:flex-row sm:items-center">
          <Avatar
            name={counterpart.name}
            category={counterpart.categorySlug}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="font-head text-lg font-extrabold tracking-[-0.02em] text-neutral-900">
              {counterpart.name}
            </p>
            <p className="truncate text-sm text-neutral-500">
              {[counterpart.handle, counterpart.category, counterpart.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {counterpart.href && (
            <Link
              href={counterpart.href}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-neutral-0 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors duration-150 ease-standard hover:border-primary-400 hover:bg-primary-50"
            >
              <Users className="h-4 w-4" /> Lihat Profil
            </Link>
          )}
        </div>
      )}

      <SectionCard title="Brief Terkunci" icon={Lock}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {iAmBusiness ? "Brief yang kamu kirim" : "Pesan dari UMKM"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-800">
              {booking.brief}
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              {booking.briefLockedAt
                ? `Dikunci saat diterima · ${formatDateTime(booking.briefLockedAt)}`
                : "Terkunci begitu kreator menerima pengajuan."}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Paket & Nominal" icon={Package}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-neutral-900">
              {booking.packageName}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Estimasi {booking.estimatedDays} hari · {booking.code}
            </p>
          </div>
          <p className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
            {formatRupiah(booking.amount)}
          </p>
        </div>

        {booking.packageIncludes.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {booking.packageIncludes.map((item) => (
              <li
                key={item}
                className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-inset ring-neutral-200"
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <RevisionCounter
            used={booking.revisionsUsed}
            total={booking.revisionQuota}
          />
          {booking.status === "REVISION" &&
            booking.revisionsUsed >= booking.revisionQuota && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning-50 px-3 py-2 text-xs font-semibold text-warning-700 ring-1 ring-inset ring-warning-200">
                <Repeat2 className="h-4 w-4" /> Kuota revisi habis
              </span>
            )}
        </div>

        <PaymentSummary booking={booking} />
      </SectionCard>

      <SectionCard title="Konten Terkirim" icon={Film}>
        {booking.deliveries.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Belum ada konten terkirim — setiap ronde akan muncul di sini.
          </p>
        ) : (
          <ol className="space-y-4">
            {booking.deliveries.map((delivery) => {
              const revision = revisionByDelivery.get(delivery.id);
              return (
                <li
                  key={delivery.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                      Ronde {delivery.round}
                    </span>
                    <a
                      href={delivery.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      {delivery.contentUrl}
                    </a>
                    <span className="text-xs text-neutral-400">
                      {formatDateTime(delivery.submittedAt)}
                    </span>
                  </div>
                  {delivery.note && (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                      {delivery.note}
                    </p>
                  )}
                  {revision && (
                    <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50/70 px-3 py-2">
                      <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-warning-800">
                        Revisi · {revision.section}
                        <span className="rounded-full bg-neutral-0 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 ring-1 ring-inset ring-neutral-200">
                          {revision.withinBrief
                            ? "Dalam brief"
                            : "Di luar brief"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-neutral-700">
                        {revision.note}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </SectionCard>

      <SectionCard title="Timeline" icon={Timer}>
        {timelineItems.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum ada perubahan.</p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </SectionCard>
    </div>
  );
}

function PaymentSummary({ booking }: { booking: BookingDetail }) {
  const payment: Payment | null = booking.payment;
  if (!payment) return null;

  const cancelledWithHold =
    booking.status === "CANCELLED" && payment.status === "HELD";

  return (
    <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        <Banknote className="h-4 w-4 text-primary-600" /> Pembayaran
      </p>
      <PaymentLine payment={payment} booking={booking} />
      {cancelledWithHold && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-warning-700">
          <BadgeAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Dana masih tercatat ditahan di platform dan belum diselesaikan (tidak
          ada rilis maupun refund). Ini dilaporkan apa adanya.
        </p>
      )}
    </div>
  );
}

function PaymentLine({
  payment,
  booking,
}: {
  payment: Payment;
  booking: BookingDetail;
}) {
  if (payment.status === "UNPAID") {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-800">
        <Clock className="h-4 w-4 text-neutral-400" />
        Belum dibayar
        {booking.paymentDueAt && (
          <span className="text-xs text-neutral-500">
            · diperkirakan dibayar sebelum{" "}
            {formatDateTime(booking.paymentDueAt)}
          </span>
        )}
      </p>
    );
  }

  if (payment.status === "HELD") {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-800">
        <Lock className="h-4 w-4 text-primary-600" />
        {formatRupiah(payment.totalAmount)} ditahan di platform
        {payment.heldAt && (
          <span className="text-xs text-neutral-500">
            · sejak {formatDateTime(payment.heldAt)}
          </span>
        )}
        {booking.deadlineAt && (
          <span className="text-xs text-neutral-500">
            · target tayang {formatDateTime(booking.deadlineAt)}
          </span>
        )}
      </p>
    );
  }

  if (payment.status === "RELEASED") {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-800">
        <Banknote className="h-4 w-4 text-success-600" />
        {formatRupiah(payment.creatorAmount)} dirilis ke kreator
        {payment.settledAt && (
          <span className="text-xs text-neutral-500">
            · {formatDateTime(payment.settledAt)}
          </span>
        )}
      </p>
    );
  }

  return (
    <p className="mt-1 text-sm text-neutral-800">
      Status pembayaran: {payment.status}
    </p>
  );
}