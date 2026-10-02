import { Repeat2 } from "lucide-react";

/**
 * RevisionCounter (ARCHITECTURE §2.4): klaim revisi terpakai vs kuota,
 * tampil sebagai `Revisi 1 dari 2`; permintaan di luar brief tidak
 * menghabiskan kuota (logika tetap di halaman/aksi).
 */
export function RevisionCounter({
  used,
  total,
}: {
  used: number;
  total: number;
}) {
  const remaining = Math.max(total - used, 0);
  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
      <Repeat2 className="h-4 w-4 text-primary-600" />
      <span className="font-semibold text-neutral-900">
        Revisi {used} dari {total}
      </span>
      <span className="text-xs text-neutral-500">· {remaining} tersisa</span>
    </div>
  );
}