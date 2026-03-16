import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Applies homepage featured ordering to a Supabase artists query.
 *
 * Ordering priority:
 * 1. Featured artists (home_featured_rank not null) appear first, ordered by rank ascending
 * 2. Non-featured artists appear after, ordered by creation date descending
 *
 * Use for: Homepage, general artist listings without category filter
 *
 * @param query - The Supabase query builder for artists
 * @returns The query builder with ordering applied
 *
 * @example
 * ```ts
 * let query = supabase
 *   .from("artists")
 *   .select("*")
 *   .eq("status", "approved");
 *
 * query = applyHomeFeaturedOrdering(query);
 * ```
 */
export function applyHomeFeaturedOrdering(
  query: PostgrestFilterBuilder<any, any, any, any, any>
): PostgrestFilterBuilder<any, any, any, any, any> {
  return query
    .order("home_featured_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
}

/**
 * Applies category page featured ordering to a Supabase artists query.
 *
 * Ordering priority:
 * 1. Artists with home_featured_rank (global stars) - ordered by rank ascending
 * 2. Artists with category_featured_rank (category stars) - ordered by rank ascending
 * 3. Normal artists - ordered by creation date descending
 *
 * This ensures that globally featured artists appear at the top of category pages,
 * followed by category-specific featured artists, then regular artists.
 *
 * Use for: Category-filtered pages, category detail views
 *
 * @param query - The Supabase query builder for artists
 * @returns The query builder with ordering applied
 *
 * @example
 * ```ts
 * let query = supabase
 *   .from("artists")
 *   .select("*")
 *   .eq("status", "approved")
 *   .eq("category_id", categoryId);
 *
 * query = applyCategoryFeaturedOrdering(query);
 * ```
 */
export function applyCategoryFeaturedOrdering(
  query: PostgrestFilterBuilder<any, any, any, any, any>
): PostgrestFilterBuilder<any, any, any, any, any> {
  return query
    .order("home_featured_rank", { ascending: true, nullsFirst: false })
    .order("category_featured_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
}

/**
 * Applies featured artist ordering to a Supabase artists query.
 *
 * Featured artists (home_featured_rank not null) appear first,
 * ordered by their rank (1-10). Non-featured artists appear after,
 * ordered by creation date (newest first).
 *
 * @param query - The Supabase query builder for artists
 * @returns The query builder with ordering applied
 *
 * @example
 * ```ts
 * let query = supabase
 *   .from("artists")
 *   .select("*")
 *   .eq("status", "approved");
 *
 * query = applyFeaturedOrdering(query);
 * ```
 *
 * @deprecated Use `applyHomeFeaturedOrdering` for homepage/general listings
 *             or `applyCategoryFeaturedOrdering` for category-filtered pages.
 *             This function is maintained for backward compatibility and
 *             internally calls `applyHomeFeaturedOrdering`.
 */
export function applyFeaturedOrdering(
  query: PostgrestFilterBuilder<any, any, any, any, any>
): PostgrestFilterBuilder<any, any, any, any, any> {
  // Backward compatibility: delegates to home featured ordering
  return applyHomeFeaturedOrdering(query);
}
