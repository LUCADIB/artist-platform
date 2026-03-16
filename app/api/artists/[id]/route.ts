import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";
import { sendArtistApprovedEmail } from "@/lib/emails";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseClient";

/**
 * PUT /api/artists/[id]
 * Updates artist profile or manager approval status.
 *
 * When status becomes "approved", sends a transactional email
 * to notify the artist that their profile is now active.
 *
 * When managed_by_admin is set, securely resolves the manager's
 * profile ID from the authenticated session (not from frontend).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error("[Artist PUT] Failed to parse body:", err);
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

  /**
   * 🔒 Secure handling of managed_by_admin
   *
   * When a manager toggles management mode:
   * - If enabling: resolve manager's profile ID from session and store in manager_profile_id
   * - If disabling: clear manager_profile_id to null
   *
   * We NEVER trust the frontend for the manager ID - always resolve from auth.
   *
   * IMPORTANT: Using getUser() instead of getSession() for reliable server-side auth.
   * getUser() validates the JWT with Supabase Auth server, making it more secure.
   */
  if (managed_by_admin !== undefined) {
    updateData.managed_by_admin = managed_by_admin;

    if (managed_by_admin === true) {
      try {
        // Create route handler client with proper cookie handling
        // IMPORTANT: cookies() must be awaited in Next.js App Router route handlers
        const supabaseAuth = await createSupabaseRouteHandlerClient();

        // Use getUser() for reliable server-side auth detection
        // getUser() validates the JWT with Supabase Auth server
        const {
          data: { user },
          error: authError,
        } = await supabaseAuth.auth.getUser();

        if (authError) {
          console.error("[Artist PUT] Auth error:", authError);
          return NextResponse.json(
            { error: "Authentication error" },
            { status: 401 }
          );
        }

        if (!user?.id) {
          console.error("[Artist PUT] No user found in session");
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }

        // Verify the user is a manager/admin using service client (bypasses RLS)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("[Artist PUT] Profile lookup error:", profileError);
          return NextResponse.json(
            { error: "Failed to verify user role" },
            { status: 500 }
          );
        }

        if (profile?.role !== "manager" && profile?.role !== "admin") {
          return NextResponse.json(
            { error: "Only managers can manage artists" },
            { status: 403 }
          );
        }

        // Securely set manager_profile_id from authenticated user
        updateData.manager_profile_id = user.id;
       
      } catch (err) {
        console.error("[Artist PUT] Unexpected auth error:", err);
        return NextResponse.json(
          { error: "Failed to verify authentication" },
          { status: 500 }
        );
      }
    } else {
      // Clear manager_profile_id when management is disabled
      updateData.manager_profile_id = null;
    }
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
 *
 * Securely deletes an artist after verifying:
 * 1. User is authenticated
 * 2. User is either:
 *    - A manager/admin (can delete any artist)
 *    - An artist who owns this profile
 *
 * Authorization flow:
 * - Get session from cookies (SSR)
 * - Fetch user profile to check role
 * - Fetch artist to verify ownership (for artists)
 * - Only then perform delete
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de artista requerido." },
        { status: 400 }
      );
    }

    // Step 1: Get authenticated session
    const supabaseAuth = await createSupabaseRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Inicia sesión para continuar." },
        { status: 401 }
      );
    }

    // Step 2: Get user profile and role
    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Artist DELETE] Profile lookup error:", profileError);
      return NextResponse.json(
        { error: "Error al verificar el perfil del usuario." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado." },
        { status: 403 }
      );
    }

    // Step 3: Fetch the artist to verify existence and ownership
    const { data: artist, error: fetchError } = await serviceClient
      .from("artists")
      .select("id, name, profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[Artist DELETE] Artist fetch error:", fetchError);
      return NextResponse.json(
        { error: "Error al buscar el artista." },
        { status: 500 }
      );
    }

    if (!artist) {
      return NextResponse.json(
        { error: "Artista no encontrado." },
        { status: 404 }
      );
    }

    // Step 4: Authorization check
    const userRole = profile.role;
    const isManager = userRole === "manager" || userRole === "admin";

    if (isManager) {
      // Managers/admins can delete any artist
      // Proceed to delete
    } else if (userRole === "artist") {
      // Artists can only delete their own profile
      if (artist.profile_id !== user.id) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este perfil de artista." },
          { status: 403 }
        );
      }
      // Ownership verified, proceed to delete
    } else {
      // Unknown role - deny access
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción." },
        { status: 403 }
      );
    }

    // Step 5: Perform the delete (authorization passed)
    const { error: deleteError } = await serviceClient
      .from("artists")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Artist DELETE] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el artista." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Artist DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
