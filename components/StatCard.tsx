import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "indigo",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "violet";
}) {
  const accents = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accents[accent]}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}