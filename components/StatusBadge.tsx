import type { BookingStatus } from "@/lib/types";

const styles: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  APPROVED: {
    label: "Disetujui",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  DONE: {
    label: "Selesai",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = styles[status] ?? styles.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}
