import { getServiceClient } from "./serviceClient";

/**
 * Converts a name string into a URL-friendly slug.
 * - Lowercase
 * - Spaces become hyphens
 * - Removes special characters (keeps a-z, 0-9, hyphens)
 * - Collapses multiple hyphens into one
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/[^a-z0-9-]/g, "") // remove special chars
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim hyphens from edges
}

/**
 * Generates a unique slug for an artist.
 * If the base slug exists, appends incremental suffix (-2, -3, etc.)
 *
 * @param name - The artist name to generate slug from
 * @param excludeId - Optional artist ID to exclude from uniqueness check (for updates)
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const supabase = getServiceClient();
  const baseSlug = nameToSlug(name);

  if (!baseSlug) {
    // Fallback if name produces empty slug
    return `artist-${Date.now()}`;
  }

  try {
    // Check if base slug exists
    let query = supabase
      .from("artists")
      .select("slug")
      .eq("slug", baseSlug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data: existing, error: queryError } = await query.maybeSingle();

    if (queryError) {
      console.error("[SlugGenerator] Query error:", queryError);
      // Return a unique slug with timestamp as fallback
      return `${baseSlug}-${Date.now()}`;
    }

    // If no conflict, return base slug
    if (!existing) {
      return baseSlug;
    }

    // Find next available suffix
    let suffix = 2;
    const maxAttempts = 100; // Safety limit

    while (suffix < maxAttempts) {
      const candidateSlug = `${baseSlug}-${suffix}`;

      let suffixQuery = supabase
        .from("artists")
        .select("slug")
        .eq("slug", candidateSlug);

      if (excludeId) {
        suffixQuery = suffixQuery.neq("id", excludeId);
      }

      const { data: conflict, error: suffixError } = await suffixQuery.maybeSingle();

      if (suffixError) {
        console.error("[SlugGenerator] Suffix query error:", suffixError);
        // Return with timestamp as fallback
        return `${baseSlug}-${Date.now()}`;
      }

      if (!conflict) {
        return candidateSlug;
      }

      suffix++;
    }

    // Fallback if we hit the limit
    return `${baseSlug}-${Date.now()}`;
  } catch (error) {
    console.error("[SlugGenerator] Unexpected error:", error);
    // Return a unique slug with timestamp as fallback
    return `${baseSlug}-${Date.now()}`;
  }
}
