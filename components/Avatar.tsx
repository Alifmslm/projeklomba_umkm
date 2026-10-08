import { initials } from "@/lib/format";
import { paletteForCategory } from "@/lib/data/palette";

const sizes = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl",
};

/**
 * Takes a category *slug*, not a colour.
 *
 * The lookup happens here so no caller can pass a class string that Tailwind never
 * saw. An earlier version took `color: string` and callers fed it a value out of the
 * database, which meant the gradient silently did not exist in the compiled CSS -
 * see the note in `lib/data/palette.ts`. Passing the slug makes the wrong thing
 * unrepresentable rather than merely discouraged.
 */
export function Avatar({
  name,
  category,
  size = "md",
  className = "",
}: {
  name: string;
  /** `categories.slug`, e.g. `food-beverage`. Unknown or missing gets the fallback. */
  category: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${paletteForCategory(category)} font-bold text-white shadow-sm ring-2 ring-white ${sizes[size]} ${className}`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
