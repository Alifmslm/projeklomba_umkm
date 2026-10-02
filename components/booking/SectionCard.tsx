import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * SectionCard (detail booking / kasus): kartu bertajuk untuk tiap bagian
 * bukti (Brief Terkunci, Konten Terkirim, Riwayat Revisi, Riwayat Chat,
 * Timeline, dsb. — ARCHITECTURE §2.4/§5.7).
 */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          {Icon && <Icon className="h-4.5 w-4.5 text-primary-600" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}