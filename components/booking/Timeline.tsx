export type TimelineTone = "default" | "primary" | "success" | "warning" | "error";

export type TimelineItem = {
  label: string;
  time: string;
  tone?: TimelineTone;
};

const DOT: Record<TimelineTone, string> = {
  default: "bg-neutral-300",
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

/**
 * Timeline (ARCHITECTURE §2.2/§5.7): riwayat perubahan status kolaborasi
 * atau kasus, urut waktu, titik berwarna semantik.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-neutral-100 pl-5">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[26.5px] top-1 h-3 w-3 rounded-full ring-4 ring-neutral-0 ${DOT[item.tone ?? "default"]}`}
          />
          <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{item.time}</p>
        </li>
      ))}
    </ol>
  );
}