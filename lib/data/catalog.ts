import { createClient } from "@/utils/supabase/server";
import { paletteForCategory } from "@/lib/data/palette";
import type {
  Category,
  Influencer,
  Package,
  PriceStat,
  RecommendedInfluencer,
  ReviewWithAuthor,
  Umkm,
} from "@/lib/types";

/**
 * Catalog reads, on Postgres.
 *
 * Every function here goes through the *user-scoped* server client, never the
 * service-role one. That is the whole point of the port: the policies written by
 * `rls-access-control` are supposed to be on the real request path, not only in a
 * test. A read through the service role would be shorter to write and would
 * silently return rows the visitor may not see, with no error to notice it by.
 *
 * Writes are the other half of the rule and live in `app/actions.ts`: the publishable
 * key has no write policy anywhere, so only the service role can write, and therefore
 * every write action is the authorization point. See `DEVELOPMENT.md`.
 */

/** Hard ceiling on a catalog query, applied after filtering. */
const CATALOG_CAP = 200;

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

/**
 * PostgREST returns embedded resources as nested objects. The generated
 * `database.types.ts` describes the tables but not the shape of an arbitrary
 * `select`, so the embed is declared here once rather than cast at each call site.
 */
type CategoryRow = { id: number; slug: string; name: string };

type PackageRow = {
  id: number;
  influencer_id: number;
  name: string;
  price: number;
  summary: string | null;
  includes: unknown;
  revision_quota: number;
  estimated_days: number;
  is_active: boolean;
};

type InfluencerRow = {
  id: number;
  name: string;
  handle: string;
  category_id: number;
  city: string;
  followers: number;
  engagement_rate: number;
  starting_price: number;
  rating: number | string;
  review_count: number;
  verified: boolean;
  bio: string | null;
  categories: CategoryRow | CategoryRow[] | null;
  packages: PackageRow[] | null;
};

type UmkmRow = {
  id: number;
  name: string;
  owner: string;
  category_id: number;
  city: string;
  categories: CategoryRow | CategoryRow[] | null;
};

/**
 * A row of the `influencer_reviews` view. The view already resolves the author
 * (the review only knows the booking, which is party-scoped) and is defined in
 * `supabase/migrations/20261007120000_reviews.sql`.
 */
type InfluencerReviewRow = {
  review_id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_role: "umkm" | "influencer";
  reviewee_umkm_id: number | null;
  influencer_id: number;
  author_name: string;
  author_owner: string | null;
  author_category_slug: string | null;
  author_city: string | null;
  package_name: string | null;
};

/** The embed, in one place, so every creator read gets category and packages. */
const CREATOR_SELECT = "*, categories(*), packages(*)";

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

/** PostgREST nests a to-one embed as an object, but a left join can hand back null. */
function one<T>(value: T | T[] | null): T | null {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCategory(row: CategoryRow | null): Category {
  return {
    id: row?.id ?? 0,
    slug: row?.slug ?? "",
    name: row?.name ?? "",
  };
}

/**
 * `includes` is jsonb, so it arrives already parsed - but a value written by
 * something other than this app could be a string or a number, and `includes` is
 * rendered as a list of strings. Anything that is not an array of non-empty strings
 * is dropped rather than rendered as `[object Object]`.
 */
export function mapIncludes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }
  if (typeof value === "string") {
    // A jsonb column holding a JSON string arrives as the string itself.
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((i): i is string => typeof i === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapPackage(row: PackageRow): Package {
  return {
    id: row.id,
    influencerId: row.influencer_id,
    name: row.name,
    price: row.price,
    summary: row.summary ?? "",
    includes: mapIncludes(row.includes),
    revisionQuota: row.revision_quota,
    estimatedDays: row.estimated_days,
    isActive: row.is_active,
  };
}

/**
 * `rating` is `numeric`, which PostgREST hands back as a string to avoid losing
 * precision. It is a 1-5 average here, so Number() is safe, and leaving it as a
 * string would make every comparison and every render quietly wrong.
 */
function mapInfluencer(row: InfluencerRow): Influencer {
  const category = one(row.categories);
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    categoryId: row.category_id,
    categorySlug: category?.slug ?? "",
    category: category?.name ?? "",
    city: row.city,
    followers: row.followers,
    engagementRate: Number(row.engagement_rate ?? 0.035),
    startingPrice: row.starting_price,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count,
    verified: row.verified,
    bio: row.bio ?? "",
    packages: (row.packages ?? []).map(mapPackage),
  };
}

function mapUmkm(row: UmkmRow): Umkm {
  const category = one(row.categories);
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    categoryId: row.category_id,
    categorySlug: category?.slug ?? "",
    category: category?.name ?? "",
    city: row.city,
  };
}

/** A PostgREST error is returned, not thrown; treat it as "no rows" plus a log. */
function failed(source: string, error: { message: string } | null): null {
  if (error) {
    console.error(`[catalog] ${source} failed: ${error.message}`);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Search escaping                                                     */
/* ------------------------------------------------------------------ */

/**
 * Escape a search term for a PostgREST `ilike` pattern.
 *
 * Two separate hazards, handled differently:
 *
 *  1. Wildcards. In PostgREST's `or=(col.ilike.*term*)` form, both `*` (PostgREST's
 *     alias for SQL `%`) and a bare `%` or `_` would let a visitor type something
 *     that matches rows they did not search for. Verified against the local
 *     PostgREST: `ilike.Rar*` returns "Rara Nadia", while `ilike.Rar\*` returns
 *     nothing, and `ilike.*Rar_*` returns a row while `ilike.*Rar\_*` returns none.
 *     So a backslash before each of `\`, `%`, `_`, `*` is what makes the match
 *     literal. Backslash goes first or the others get escaped by it.
 *
 *  2. Grammar. A comma separates clauses inside `or=(...)`, so a term containing one
 *     does not match the wrong rows - it fails to parse and PostgREST answers HTTP
 *     400 `PGRST100`, taking the whole page with it. Double-quoting the value is
 *     the documented escape and does not help here: the quotes are consumed before
 *     the request is parsed. So the character is removed instead. A creator search
 *     term containing a comma is not a real case, and a 400 is a much worse
 *     outcome than a silently missing comma.
 */
function escapeSearchTerm(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/[,"()]/g, "");
}

/* ------------------------------------------------------------------ */
/* Categories and cities                                                */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("name");

  if (error) return failed("getCategories", error) ?? [];
  return (data ?? []).map((row) => mapCategory(row as CategoryRow));
}

/**
 * Filter options come straight from `SELECT DISTINCT city` over creators.
 *
 * Compared exactly, with no case folding or trimming: `influencers.city` and
 * `umkms.city` are both free text with no reference table, so "Bandung" and
 * "bandung" really are two different values in the data. Normalising would fix
 * case while leaving abbreviations and stray whitespace splitting buckets just the
 * same, and would look like the data was clean. Promoting `city` to a reference
 * table is the real fix and is an open question in the change's design.
 */
export async function getCities(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("influencers").select("city");

  if (error) return failed("getCities", error) ?? [];
  return [...new Set((data ?? []).map((row) => row.city))].sort((a, b) =>
    a.localeCompare(b, "id"),
  );
}

/* ------------------------------------------------------------------ */
/* Creators                                                            */
/* ------------------------------------------------------------------ */

export type InfluencerFilter = {
  q?: string;
  /** A category *slug*, e.g. `food-beverage`. */
  category?: string;
  city?: string;
  maxPrice?: number;
  sort?: "terpopuler" | "termurah" | "rating";
};

/**
 * The creator list.
 *
 * Filters combine with AND, the cap is applied last, and no filter that matches
 * nothing is an error - it is an empty list, and the page renders its empty state.
 *
 * `maxPrice` and the `termurah` order both exclude `starting_price = 0`. That is the
 * sentinel for "no active package", and leaving it in would let a creator with
 * nothing on offer sort first as the cheapest option and pass every price ceiling.
 */
export async function getInfluencers(
  filter: InfluencerFilter = {},
): Promise<Influencer[]> {
  const supabase = createClient();

  let query = supabase.from("influencers").select(CREATOR_SELECT);

  if (filter.q) {
    const term = escapeSearchTerm(filter.q.trim());
    if (term !== "") {
      query = query.or(
        `name.ilike.*${term}*,handle.ilike.*${term}*`,
      );
    }
  }

  if (filter.category) {
    // Filtering on the category *name* through the embedded table rather than
    // resolving the slug to an id first, so one query covers both.
    query = query.eq("categories.slug", filter.category);
  }

  if (filter.city) {
    query = query.eq("city", filter.city);
  }

  if (filter.maxPrice !== undefined && filter.maxPrice > 0) {
    query = query.gt("starting_price", 0).lte("starting_price", filter.maxPrice);
  }

  if (filter.sort === "termurah") {
    query = query.gt("starting_price", 0).order("starting_price", { ascending: true });
  } else if (filter.sort === "rating") {
    // `rating desc` already sorts unrated creators (0) last, because 0 is the
    // lowest possible value. `review_count` then `followers` only break ties, so
    // two creators on 5.0 order by how much evidence sits behind the 5.0.
    query = query
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .order("followers", { ascending: false });
  } else {
    query = query.order("followers", { ascending: false });
  }

  // Applied last on purpose: the cap must never change *which* creators match,
  // only how many come back at once.
  const { data, error } = await query.limit(CATALOG_CAP);

  if (error) return failed("getInfluencers", error) ?? [];
  return (data as unknown as InfluencerRow[]).map(mapInfluencer);
}

export async function getInfluencerById(id: number): Promise<Influencer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("influencers")
    .select(CREATOR_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return failed("getInfluencerById", error);
  return data ? mapInfluencer(data as unknown as InfluencerRow) : null;
}

export async function getFeaturedInfluencers(limit = 4): Promise<Influencer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("influencers")
    .select(CREATOR_SELECT)
    .eq("verified", true)
    .order("rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error) return failed("getFeaturedInfluencers", error) ?? [];
  return (data as unknown as InfluencerRow[]).map(mapInfluencer);
}

/** Other creators in the same category, by id rather than by name. */
export async function getRelatedInfluencers(
  categoryId: number,
  excludeId: number,
  limit = 4,
): Promise<Influencer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("influencers")
    .select(CREATOR_SELECT)
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("followers", { ascending: false })
    .limit(limit);

  if (error) return failed("getRelatedInfluencers", error) ?? [];
  return (data as unknown as InfluencerRow[]).map(mapInfluencer);
}

/** Active packages only, cheapest first - the order the booking form lists them in. */
export async function getPackagesByInfluencer(id: number): Promise<Package[]> {
  const creator = await getInfluencerById(id);
  if (!creator) return [];
  return creator.packages
    .filter((pkg) => pkg.isActive)
    .sort((a, b) => a.price - b.price);
}

/** Every package including deactivated ones, for the creator's own management screen. */
export async function getAllPackagesByInfluencer(
  id: number,
): Promise<Package[]> {
  const creator = await getInfluencerById(id);
  if (!creator) return [];
  return [...creator.packages].sort((a, b) => a.price - b.price);
}

export async function getPackageById(id: number): Promise<Package | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return failed("getPackageById", error);
  if (!data) return null;
  return mapPackage(data as unknown as PackageRow);
}

/* ------------------------------------------------------------------ */
/* Reviews for a creator                                                */
/* ------------------------------------------------------------------ */

/**
 * A creator's reviews, with the name of the business that wrote each one.
 *
 * This reads `influencer_reviews`, a read-only view created by the reviews
 * migration. The view exists because the author of a review is only recorded on
 * `bookings`, which is party-scoped: reading `reviews` directly gives the rating
 * and comment but leaves a public creator page unable to name the author, and
 * joining `bookings` returns nothing for a signed-out visitor. The view resolves
 * that link once, and exposes only public fields.
 *
 * The count of the rows returned is the same number `influencers.review_count`
 * reports, because both are exactly "the reviews naming this creator".
 */
export async function getReviewsForInfluencer(
  influencerId: number,
  limit?: number,
): Promise<ReviewWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("influencer_reviews")
    .select("*")
    .eq("influencer_id", influencerId)
    .order("created_at", { ascending: false });

  if (error) return failed("getReviewsForInfluencer", error) ?? [];

  const rows: ReviewWithAuthor[] = (
    data as unknown as InfluencerReviewRow[]
  ).map((row) => ({
    id: row.review_id,
    bookingId: row.booking_id,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at,
    reviewerRole: row.reviewer_role,
    revieweeUmkmId: row.reviewee_umkm_id,
    revieweeInfluencerId: row.influencer_id,
    authorName: row.author_name,
    authorHandle: row.author_owner ?? "",
    authorCategorySlug: row.author_category_slug ?? "",
    packageName: row.package_name ?? "",
  }));

  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

/* ------------------------------------------------------------------ */
/* Businesses                                                           */
/* ------------------------------------------------------------------ */

export async function getUmkmById(id: number): Promise<Umkm | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("umkms")
    .select("*, categories(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return failed("getUmkmById", error);
  return data ? mapUmkm(data as unknown as UmkmRow) : null;
}

/* ------------------------------------------------------------------ */
/* Price insight                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lowest / average / highest starting price per category.
 *
 * One fetch of the `(category_id, starting_price)` pairs, reduced here. Three
 * aggregate queries would be three round trips for arithmetic, and a SQL view would
 * be a second definition of the rule below - which is the rule worth having exactly
 * once.
 *
 * Creators with `starting_price = 0` are excluded: they have no active package, so
 * including them would drag the minimum to zero and report a creator with nothing on
 * offer as the cheapest in its category. A category where every creator is in that
 * state reports no data instead of zeros, because a minimum of 0 across a category
 * is not a price anybody can act on.
 */
export async function getPriceStats(): Promise<PriceStat[]> {
  const supabase = createClient();

  const [pairsResult, categoriesResult] = await Promise.all([
    supabase
      .from("influencers")
      .select("category_id, starting_price")
      .gt("starting_price", 0),
    supabase.from("categories").select("id, slug, name").order("name"),
  ]);

  if (pairsResult.error) return failed("getPriceStats", pairsResult.error) ?? [];
  if (categoriesResult.error) {
    return failed("getPriceStats", categoriesResult.error) ?? [];
  }

  const categories = (categoriesResult.data ?? []).map((row) =>
    mapCategory(row as CategoryRow),
  );
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const grouped = new Map<
    number,
    { count: number; sum: number; min: number; max: number }
  >();

  for (const row of pairsResult.data ?? []) {
    const entry = grouped.get(row.category_id) ?? {
      count: 0,
      sum: 0,
      min: Number.POSITIVE_INFINITY,
      max: 0,
    };
    entry.count += 1;
    entry.sum += row.starting_price;
    entry.min = Math.min(entry.min, row.starting_price);
    entry.max = Math.max(entry.max, row.starting_price);
    grouped.set(row.category_id, entry);
  }

  return [...grouped.entries()]
    .map(([categoryId, entry]) => {
      const category = categoryById.get(categoryId);
      return {
        categoryId,
        categorySlug: category?.slug ?? "",
        category: category?.name ?? "",
        count: entry.count,
        minPrice: entry.min,
        // Rounded here rather than in SQL so the number the page shows is the number
        // that was actually computed from the rows on screen.
        avgPrice: Math.round(entry.sum / entry.count),
        maxPrice: entry.max,
      };
    })
    .sort((a, b) => a.avgPrice - b.avgPrice);
}

/* ------------------------------------------------------------------ */
/* Recommendations                                                      */
/* ------------------------------------------------------------------ */

/**
 * Creators to suggest to a business, each labelled with why it was suggested.
 *
 * Two queries - creators in the business's category, creators in its city - merged
 * in application code by creator id with the category match preferred, ordered by
 * rating then followers. SQL could return both sets, but not attach the reason
 * string to each row, and the reason is the part that has to be shown.
 *
 * A creator in neither is not recommended: "no reason to show this" is not a reason.
 */
export async function getRecommendedInfluencers(
  umkm: Umkm,
  limit = 3,
): Promise<RecommendedInfluencer[]> {
  const supabase = createClient();

  const [sameCategory, sameCity] = await Promise.all([
    supabase
      .from("influencers")
      .select(CREATOR_SELECT)
      .eq("category_id", umkm.categoryId)
      .order("rating", { ascending: false })
      .order("followers", { ascending: false }),
    supabase
      .from("influencers")
      .select(CREATOR_SELECT)
      .eq("city", umkm.city)
      .order("rating", { ascending: false })
      .order("followers", { ascending: false }),
  ]);

  if (sameCategory.error) {
    failed("getRecommendedInfluencers(category)", sameCategory.error);
  }
  if (sameCity.error) failed("getRecommendedInfluencers(city)", sameCity.error);

  const merged = new Map<number, RecommendedInfluencer>();

  const add = (
    rows: unknown[],
    reason: string,
    weight: number,
  ): void => {
    for (const row of rows as InfluencerRow[]) {
      const creator = mapInfluencer(row);
      const existing = merged.get(creator.id);
      if (existing) {
        // In both sets. The category match is the stronger reason, so it wins the
        // label, and both reasons are kept.
        if (!existing.matchReasons.includes(reason)) {
          existing.matchReasons.push(reason);
        }
        existing.score = Math.max(existing.score, weight);
        return;
      }
      merged.set(creator.id, {
        ...creator,
        score: weight,
        matchReasons: [reason],
      });
    }
  };

  add(sameCategory.data ?? [], "Kategori sama dengan usahamu", 3);
  add(sameCity.data ?? [], "Satu kota dengan usahamu", 2);

  return [...merged.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.rating - a.rating ||
        b.followers - a.followers,
    )
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Landing page statistics                                              */
/* ------------------------------------------------------------------ */

/**
 * The counters on the public landing page.
 *
 * One fetch of the columns they are computed from, reduced here. Counting each in
 * its own `head: true` request would be seven round trips to render one strip of
 * numbers, and the `categories` are already needed for the palette.
 */
export async function getLandingStats() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("influencers")
    .select("city, category_id, followers, rating, verified");

  if (error) {
    failed("getLandingStats", error);
    return {
      influencerCount: 0,
      verifiedCount: 0,
      completedCount: 0,
      umkmCount: 0,
      cityCount: 0,
      categoryCount: 0,
      totalReach: 0,
      avgRating: 0,
    };
  }

  const rows = data ?? [];
  const bookings = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "COMPLETED");
  const umkms = await supabase
    .from("umkms")
    .select("id", { count: "exact", head: true });

  const cities = new Set(rows.map((r) => r.city));
  const categories = new Set(rows.map((r) => r.category_id));
  const totalFollowers = rows.reduce((sum, r) => sum + r.followers, 0);
  const ratingSum = rows.reduce((sum, r) => sum + Number(r.rating ?? 0), 0);

  return {
    influencerCount: rows.length,
    verifiedCount: rows.filter((r) => r.verified).length,
    completedCount: bookings.count ?? 0,
    umkmCount: umkms.count ?? 0,
    cityCount: cities.size,
    categoryCount: categories.size,
    totalReach: totalFollowers,
    avgRating: rows.length > 0 ? Number((ratingSum / rows.length).toFixed(2)) : 0,
  };
}

/** Re-exported so callers that only need an avatar colour import one module. */
export { paletteForCategory };