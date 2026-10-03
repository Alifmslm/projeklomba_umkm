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
 * atau kasus, urut waktu, titik berwarna semantik. Kolom kiri memakai
 * spacing token (w-4 = --space-4) dan konektor vertikal mengalir dalam
 * dokumen — tanpa nilai piksel off-grid.
 */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={`${item.label}-${i}`} className="flex items-start gap-3 pb-5 last:pb-0">
            <span
              aria-hidden
              className="flex w-4 shrink-0 flex-col items-center self-stretch"
            >
              <span
                className={`mt-1 h-3 w-3 rounded-full ring-4 ring-neutral-0 ${DOT[item.tone ?? "default"]}`}
              />
              {!isLast && <span className="mt-1 w-px flex-1 bg-neutral-100" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{item.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}