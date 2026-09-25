import { initials } from "@/lib/format";

const sizes = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl",
};

export function Avatar({
  name,
  color,
  size = "md",
  className = "",
}: {
  name: string;
  color: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${color} font-bold text-white shadow-sm ring-2 ring-white ${sizes[size]} ${className}`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
