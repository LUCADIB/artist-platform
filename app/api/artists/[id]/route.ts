import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";
import { sendArtistApprovedEmail } from "@/lib/emails";

/**
 * PUT /api/artists/[id]
 * Updates artist profile or manager approval status.
 *
 * When status becomes "approved", sends a transactional email
 * to notify the artist that their profile is now active.
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

  const isPartialManagerUpdate =
    status !== undefined ||
    managed_by_admin !== undefined ||
    rejection_reason !== undefined;

  if (!isPartialManagerUpdate && !name) {
    return NextResponse.json(
      { error: "Name is required for profile updates" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (city !== undefined) updateData.city = city || null;
  if (bio !== undefined) updateData.bio = bio || null;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null;
  if (category_id !== undefined) updateData.category_id = category_id || null;
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null;

  if (status !== undefined) {
    updateData.status = status;

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.approved_at = null;
    }
  }

  if (rejection_reason !== undefined) {
    updateData.rejection_reason = rejection_reason || null;
  }

  if (managed_by_admin !== undefined) {
    updateData.managed_by_admin = managed_by_admin;
  }

  const { data, error } = await supabase
    .from("artists")
    .update(updateData)
    .eq("id", id)
    .select("id, name, profile_id, status")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Database update failed" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Artist not found" },
      { status: 404 }
    );
  }

  /**
   * 🔥 Send approval email when artist becomes approved
   */
  if (status === "approved" && data.profile_id) {
    try {
      const { data: userData } =
        await supabase.auth.admin.getUserById(data.profile_id);

      const artistEmail = userData?.user?.email;

      if (artistEmail) {
        await sendArtistApprovedEmail({
          artistEmail,
          artistName: data.name ?? "Artista",
        });
      }
    } catch (mailError) {
      console.error("Approval email error:", mailError);
    }
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/artists/[id]
 * Deletes an artist (manager only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const supabase = getServiceClient();

  const { error } = await supabase.from("artists").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}