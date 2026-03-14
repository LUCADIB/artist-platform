import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

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
 */
export function applyFeaturedOrdering(
  query: PostgrestFilterBuilder<any, any, any, any, any>
): PostgrestFilterBuilder<any, any, any, any, any> {
  return query
    .order("home_featured_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
}
