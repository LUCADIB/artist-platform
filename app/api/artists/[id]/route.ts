import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * PUT /api/artists/[id]
 * Updates an artist record.
 *
 * For manager updates: can change status, rejection_reason (name not required)
 * For artist self-updates: name is required, should not change status/slug
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    name,
    slug,
    city,
    bio,
    avatar_url,
    category_id,
    whatsapp,
    status,
    rejection_reason,
    managed_by_admin,
  } = body;

  // Check if this is a status-only update (manager approval/rejection)
  const isPartialManagerUpdate =
  status !== undefined ||
  managed_by_admin !== undefined ||
  rejection_reason !== undefined;

  // For non-status updates, name is required
  if (!isPartialManagerUpdate && !name) {
    return NextResponse.json(
      { error: "Name is required for profile updates" },
      { status: 400 }
    );
  }

  console.log("[Artist PUT] Updating artist:", id);
  console.log("[Artist PUT] Request body:", JSON.stringify(body, null, 2));

  const supabase = getServiceClient();

  // Build update object - only include fields that are provided
  const updateData: Record<string, unknown> = {};

  // Only include these fields if provided (for full profile updates)
  if (name !== undefined) {
    updateData.name = name;
  }
  if (slug !== undefined) {
    updateData.slug = slug;
  }
  if (city !== undefined) {
    updateData.city = city || null;
  }
  if (bio !== undefined) {
    updateData.bio = bio || null;
  }
  if (avatar_url !== undefined) {
    updateData.avatar_url = avatar_url || null;
  }
  if (category_id !== undefined) {
    updateData.category_id = category_id || null;
  }
  if (whatsapp !== undefined) {
    updateData.whatsapp = whatsapp || null;
  }

  // Status and rejection_reason are manager-only fields
  if (status !== undefined) {
    updateData.status = status;
    console.log("[Artist PUT] Setting status to:", status);

    // When approving, set approved_at timestamp
    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
      console.log("[Artist PUT] Setting approved_at:", updateData.approved_at);
    } else {
      // Reset approved_at if status changes from approved
      updateData.approved_at = null;
    }
  }

  if (rejection_reason !== undefined) {
    updateData.rejection_reason = rejection_reason || null;
  }

  // managed_by_admin is a manager-only field for hybrid workflow
  if (managed_by_admin !== undefined) {
    updateData.managed_by_admin = managed_by_admin;
    console.log("[Artist PUT] Setting managed_by_admin to:", managed_by_admin);
  }

  console.log("[Artist PUT] Update data:", JSON.stringify(updateData, null, 2));

  const { data, error } = await supabase
    .from("artists")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Artist PUT] Database error:", error);
    console.error("[Artist PUT] Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || "Database update failed" },
      { status: 500 }
    );
  }

  if (!data) {
    console.error("[Artist PUT] No data returned, artist may not exist:", id);
    return NextResponse.json(
      { error: "Artist not found" },
      { status: 404 }
    );
  }

  console.log("[Artist PUT] Update successful:", data.id, "status:", data.status);

  return NextResponse.json(data);
}

/**
 * DELETE /api/artists/[id]
 * Deletes an artist record (manager only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log("[Artist DELETE] Deleting artist:", id);

  const supabase = getServiceClient();

  const { error } = await supabase.from("artists").delete().eq("id", id);

  if (error) {
    console.error("[Artist DELETE] Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[Artist DELETE] Delete successful:", id);
  return NextResponse.json({ success: true });
}
