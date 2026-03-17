import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * ============================================================================
 * PATCH /api/artists/featured
 * ============================================================================
 *
 * Updates an artist's featured ranking for homepage and/or category pages.
 * Manager/admin only endpoint.
 *
 * ----------------------------------------------------------------------------
 * FEATURED RANKING SYSTEM OVERVIEW
 * ----------------------------------------------------------------------------
 *
 * This API manages TWO independent featured ranking systems:
 *
 * 1. HOME FEATURED (home_featured_rank)
 *    - Global homepage positioning
 *    - Valid range: 1-10 (1 = hero position)
 *    - Artists appear on homepage in rank order
 *    - Unique across ALL artists (database constraint)
 *    - Rank 1 = "Hero Artist" - receives special visual treatment
 *
 * 2. CATEGORY FEATURED (category_featured_rank)
 *    - Per-category page positioning
 *    - Valid range: 1-6 (max 6 featured per category)
 *    - Artists appear at top of their category page
 *    - Unique per category (database constraint)
 *    - Independent from home featured (can have both)
 *
 * ----------------------------------------------------------------------------
 * RANKING PRIORITY ON CATEGORY PAGES
 * ----------------------------------------------------------------------------
 *
 * When viewing a category page, artists are ordered by:
 *   1. home_featured_rank ASC (global stars first)
 *   2. category_featured_rank ASC (category stars next)
 *   3. created_at DESC (newest first)
 *
 * This means a globally featured artist (home_featured_rank = 3) will appear
 * ABOVE a category-only featured artist (category_featured_rank = 1) on
 * the category page.
 *
 * ----------------------------------------------------------------------------
 * REQUEST BODY
 * ----------------------------------------------------------------------------
 *
 * {
 *   artistId: string,           // Required - the artist to update
 *
 *   // Home featured (global homepage position)
 *   homeRank?: number | null,   // 1-10 or null to remove
 *                               // Backward compat: "rank" also accepted
 *
 *   // Category featured (category page position)
 *   categoryRank?: number | null  // 1-6 or null to remove
 * }
 *
 * Note: Both homeRank and categoryRank can be set in a single request.
 * If neither is provided, returns 400 error.
 *
 * ----------------------------------------------------------------------------
 * VALIDATION RULES
 * ----------------------------------------------------------------------------
 *
 * Home Featured:
 *   - Range: 1-10 or null
 *   - Must be unique (database enforces)
 *   - Returns 409 if rank already assigned to another artist
 *
 * Category Featured:
 *   - Range: 1-6 or null
 *   - Must be unique within the artist's category
 *   - Artist must have a category_id
 *   - Returns 409 if rank already assigned in same category
 *   - Returns 400 if artist has no category
 *
 * ----------------------------------------------------------------------------
 * BACKWARD COMPATIBILITY
 * ----------------------------------------------------------------------------
 *
 * The legacy "rank" field is still supported and maps to homeRank.
 * This allows existing manager dashboard to continue working.
 *
 * ============================================================================
 */

// Constants for validation
const HOME_RANK_MIN = 1;
const HOME_RANK_MAX = 10;
const CATEGORY_RANK_MIN = 1;
const CATEGORY_RANK_MAX = 6;

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // ==========================================================================
    // STEP 1: Authentication
    // ==========================================================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      );
    }

    // ==========================================================================
    // STEP 2: Authorization - Check manager/admin role
    // ==========================================================================
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Featured PATCH] Profile lookup error:", profileError);
      return NextResponse.json(
        { error: "Error verifying user profile." },
        { status: 500 }
      );
    }

    const role = profile?.role as string | undefined;
    const isManager = role === "manager" || role === "admin";

    if (!isManager) {
      return NextResponse.json(
        { error: "Only managers can update featured status." },
        { status: 403 }
      );
    }

    // ==========================================================================
    // STEP 3: Parse and validate request body
    // ==========================================================================
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { artistId, rank, homeRank, categoryRank } = body;

    // Validate artistId is provided
    if (!artistId) {
      return NextResponse.json(
        { error: "artistId is required." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // Backward compatibility: "rank" maps to homeRank if homeRank not provided
    // -------------------------------------------------------------------------
    const effectiveHomeRank = homeRank !== undefined ? homeRank : rank;
    const effectiveCategoryRank = categoryRank;

    // Ensure at least one rank is being updated
    if (effectiveHomeRank === undefined && effectiveCategoryRank === undefined) {
      return NextResponse.json(
        { error: "At least one of homeRank or categoryRank must be provided." },
        { status: 400 }
      );
    }

    // ==========================================================================
    // STEP 4: Validate home featured rank
    // ==========================================================================
    if (effectiveHomeRank !== undefined && effectiveHomeRank !== null) {
      const homeRankNum = Number(effectiveHomeRank);
      if (isNaN(homeRankNum) || homeRankNum < HOME_RANK_MIN || homeRankNum > HOME_RANK_MAX) {
        return NextResponse.json(
          { error: `Home rank must be between ${HOME_RANK_MIN} and ${HOME_RANK_MAX}, or null.` },
          { status: 400 }
        );
      }
    }

    // ==========================================================================
    // STEP 5: Validate category featured rank
    // ==========================================================================
    const serviceClient = getServiceClient();

    // Fetch the artist to get their category_id for category rank validation
    const { data: artist, error: artistFetchError } = await serviceClient
      .from("artists")
      .select("id, name, category_id, home_featured_rank, category_featured_rank")
      .eq("id", artistId)
      .maybeSingle();

    if (artistFetchError) {
      console.error("[Featured PATCH] Artist fetch error:", artistFetchError);
      return NextResponse.json(
        { error: "Error fetching artist." },
        { status: 500 }
      );
    }

    if (!artist) {
      return NextResponse.json(
        { error: "Artist not found." },
        { status: 404 }
      );
    }

    // Validate category rank
    if (effectiveCategoryRank !== undefined && effectiveCategoryRank !== null) {
      const categoryRankNum = Number(effectiveCategoryRank);

      // Check valid range
      if (isNaN(categoryRankNum) || categoryRankNum < CATEGORY_RANK_MIN || categoryRankNum > CATEGORY_RANK_MAX) {
        return NextResponse.json(
          { error: `Category rank must be between ${CATEGORY_RANK_MIN} and ${CATEGORY_RANK_MAX}, or null.` },
          { status: 400 }
        );
      }

      // Artist must have a category to be category-featured
      if (!artist.category_id) {
        return NextResponse.json(
          { error: "Artist must have a category assigned before setting category featured rank." },
          { status: 400 }
        );
      }

      // Check for duplicate category rank in same category
      const { data: existingCategoryFeatured, error: categoryCheckError } = await serviceClient
        .from("artists")
        .select("id, name")
        .eq("category_id", artist.category_id)
        .eq("category_featured_rank", categoryRankNum)
        .neq("id", artistId) // Exclude the current artist
        .maybeSingle();

      if (categoryCheckError) {
        console.error("[Featured PATCH] Category rank check error:", categoryCheckError);
        return NextResponse.json(
          { error: "Error checking category rank availability." },
          { status: 500 }
        );
      }

      if (existingCategoryFeatured) {
        return NextResponse.json(
          {
            error: `Category rank ${categoryRankNum} is already assigned to "${existingCategoryFeatured.name}" in this category.`,
            conflict: {
              type: "category_rank",
              artistId: existingCategoryFeatured.id,
              artistName: existingCategoryFeatured.name,
            }
          },
          { status: 409 }
        );
      }
    }

    // ==========================================================================
    // STEP 6: Check for duplicate home rank (if setting home rank)
    // ==========================================================================
    if (effectiveHomeRank !== undefined && effectiveHomeRank !== null) {
      const { data: existingHomeFeatured, error: homeCheckError } = await serviceClient
        .from("artists")
        .select("id, name")
        .eq("home_featured_rank", effectiveHomeRank)
        .neq("id", artistId) // Exclude the current artist
        .maybeSingle();

      if (homeCheckError) {
        console.error("[Featured PATCH] Home rank check error:", homeCheckError);
        return NextResponse.json(
          { error: "Error checking home rank availability." },
          { status: 500 }
        );
      }

      if (existingHomeFeatured) {
        return NextResponse.json(
          {
            error: `Home rank ${effectiveHomeRank} is already assigned to "${existingHomeFeatured.name}".`,
            conflict: {
              type: "home_rank",
              artistId: existingHomeFeatured.id,
              artistName: existingHomeFeatured.name,
            }
          },
          { status: 409 }
        );
      }
    }

    // ==========================================================================
    // STEP 7: Build update object
    // ==========================================================================
    const updateData: Record<string, number | null> = {};

    if (effectiveHomeRank !== undefined) {
      updateData.home_featured_rank = effectiveHomeRank;
    }

    if (effectiveCategoryRank !== undefined) {
      updateData.category_featured_rank = effectiveCategoryRank;
    }

    // ==========================================================================
    // STEP 8: Perform update
    // ==========================================================================
    const { data: updatedArtist, error: updateError } = await serviceClient
      .from("artists")
      .update(updateData)
      .eq("id", artistId)
      .select("id, name, slug, category_id, home_featured_rank, category_featured_rank, categories ( id, name )")
      .single();

    if (updateError) {
      console.error("[Featured PATCH] Update error:", updateError);

      // Handle unique constraint violations (race condition)
      if (updateError.code === "23505") {
        return NextResponse.json(
          {
            error: "Rank already assigned to another artist. Please refresh and try again.",
            code: "UNIQUE_VIOLATION"
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update featured rank." },
        { status: 500 }
      );
    }

    // ==========================================================================
    // STEP 9: Return success response
    // ==========================================================================
    return NextResponse.json({
      success: true,
      artist: updatedArtist,
      changes: {
        homeRank: effectiveHomeRank !== undefined ? {
          from: artist.home_featured_rank,
          to: effectiveHomeRank
        } : undefined,
        categoryRank: effectiveCategoryRank !== undefined ? {
          from: artist.category_featured_rank,
          to: effectiveCategoryRank
        } : undefined,
      }
    });

  } catch (error) {
    console.error("[Featured PATCH] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
