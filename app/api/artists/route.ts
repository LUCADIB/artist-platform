import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * GET /api/artists
 * Fetches all artists (for manager dashboard).
 * Note: Public queries should filter by status='approved'
 */
export async function GET() {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("artists")
    .select(
      "id, name, slug, city, bio, avatar_url, category_id, status, rejection_reason, created_at, created_by_admin, profile_id, categories ( id, name )"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch artists" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/artists
 * Creates a new artist (manager/admin only).
 * - status defaults to 'draft'
 * - created_by_admin defaults to true
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, slug, city, bio, avatar_url, category_id, whatsapp, status } =
    body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Manager-created artists start as draft by default
  const artistStatus = status || "draft";

  const { data, error } = await supabase
    .from("artists")
    .insert({
      name,
      slug,
      city: city || null,
      bio: bio || null,
      avatar_url: avatar_url || null,
      category_id: category_id || null,
      whatsapp: whatsapp || null,
      status: artistStatus,
      created_by_admin: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
