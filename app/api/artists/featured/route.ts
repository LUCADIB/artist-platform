import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * PATCH /api/artists/featured
 * Updates an artist's home_featured_rank (manager/admin only).
 *
 * Body: { artistId: string, rank: number | null }
 * - rank: 1-10 for featured position, null to remove from featured
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has manager/admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const isManager = role === "manager" || role === "admin";

  if (!isManager) {
    return NextResponse.json(
      { error: "Only managers can update featured status" },
      { status: 403 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { artistId, rank } = body;

  if (!artistId) {
    return NextResponse.json(
      { error: "artistId is required" },
      { status: 400 }
    );
  }

  // Validate rank: must be null or 1-10
  if (rank !== null) {
    const rankNum = Number(rank);
    if (isNaN(rankNum) || rankNum < 1 || rankNum > 10) {
      return NextResponse.json(
        { error: "Rank must be between 1 and 10, or null" },
        { status: 400 }
      );
    }
  }

  // Update artist using service client (bypasses RLS)
  const serviceClient = getServiceClient();

  const { data, error } = await serviceClient
    .from("artists")
    .update({ home_featured_rank: rank })
    .eq("id", artistId)
    .select()
    .single();

  if (error) {
    console.error("[Featured PATCH] Database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update featured rank" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, artist: data });
}
