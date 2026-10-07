/**
 * Creator palette: category -> Tailwind classes.
 *
 * Why this is a source file and not a database column
 * ----------------------------------------------------
 * The SQLite prototype had `influencers.color text` holding a class string such as
 * `from-violet-500 to-fuchsia-500`, and it never rendered. Tailwind scans source
 * files for class names and generates only what it finds there; a class that exists
 * solely inside a database row is never generated, so the avatar came out with no
 * background at all. Postgres has no such column, and that absence is the correct
 * design rather than a gap to fill in.
 *
 * So the classes live here, as literals, where the scanner can see them. Every entry
 * below is a real class name in a real source file, which is the entire reason the
 * avatar has colour.
 *
 * The symptom is easy to misread. Someone optimising the avatar sees an unstyled
 * circle, adds a `color` column back, ships it, and the circle is still unstyled -
 * because the class is still only in the database. If a class here ever stops
 * working, check that the literal is still written out in full in this file before
 * suspecting the build.
 *
 * Keyed by category rather than by creator id, so creators in one niche share a
 * colour family and the grouping means something. An id hash would also work and
 * would look deliberate while carrying no information.
 */

/** Avatar gradient. Keyed by `categories.slug`. */
const GRADIENTS: Record<string, string> = {
  "food-beverage": "from-orange-500 to-amber-500",
  fashion: "from-pink-500 to-rose-500",
  beauty: "from-violet-500 to-fuchsia-500",
  technology: "from-sky-500 to-cyan-500",
  "health-fitness": "from-emerald-500 to-teal-500",
};

/** Soft fill + readable text, for the small icon chips that sit beside a category. */
const TINTS: Record<string, string> = {
  "food-beverage": "bg-orange-100 text-orange-700",
  fashion: "bg-pink-100 text-pink-700",
  beauty: "bg-violet-100 text-violet-700",
  technology: "bg-sky-100 text-sky-700",
  "health-fitness": "bg-emerald-100 text-emerald-700",
};

/**
 * Used when a category is unknown, which is reachable: a creator can be created
 * through the service role with a category that no longer resolves to a row, and a
 * new category will be added before its colour is. Grey is the honest answer -
 * visibly unassigned rather than accidentally claiming to be one of the five.
 */
const FALLBACK_GRADIENT = "from-slate-500 to-slate-700";
const FALLBACK_TINT = "bg-slate-100 text-slate-700";

export function paletteForCategory(slug: string | null | undefined): string {
  if (!slug) return FALLBACK_GRADIENT;
  return GRADIENTS[slug] ?? FALLBACK_GRADIENT;
}

export function tintForCategory(slug: string | null | undefined): string {
  if (!slug) return FALLBACK_TINT;
  return TINTS[slug] ?? FALLBACK_TINT;
}

/** Every slug the palette knows, for the price-insight rows that key by category. */
export function knownCategorySlugs(): string[] {
  return Object.keys(GRADIENTS);
}