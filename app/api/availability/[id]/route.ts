import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseClient";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * DELETE /api/availability/[id]
 *
 * Securely deletes an availability block after verifying:
 * 1. User is authenticated
 * 2. User is either:
 *    - A manager/admin (can delete any block)
 *    - An artist who owns this availability block
 *
 * Authorization flow:
 * - Get session from cookies (SSR)
 * - Fetch user profile to check role
 * - Fetch availability block to check artist_id
 * - Validate ownership or elevated role
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
        { error: "ID requerido." },
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
      console.error("[Availability DELETE] Profile lookup error:", profileError);
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

    const userRole = profile.role;
    const isManager = userRole === "manager" || userRole === "admin";

    // Step 3: Fetch the availability block to check ownership
    const { data: availabilityBlock, error: fetchError } = await serviceClient
      .from("availability")
      .select("id, artist_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[Availability DELETE] Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Error al buscar el bloqueo de disponibilidad." },
        { status: 500 }
      );
    }

    if (!availabilityBlock) {
      return NextResponse.json(
        { error: "Bloqueo de disponibilidad no encontrado." },
        { status: 404 }
      );
    }

    // Step 4: Authorization check
    if (isManager) {
      // Managers/admins can delete any availability block
      // Proceed to delete
    } else if (userRole === "artist") {
      // Artists can only delete their own availability blocks
      // Get the artist profile for this user
      const { data: artistProfile, error: artistError } = await serviceClient
        .from("artists")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (artistError) {
        console.error("[Availability DELETE] Artist lookup error:", artistError);
        return NextResponse.json(
          { error: "Error al verificar el perfil de artista." },
          { status: 500 }
        );
      }

      if (!artistProfile) {
        return NextResponse.json(
          { error: "No tienes un perfil de artista asociado." },
          { status: 403 }
        );
      }

      // Check if the availability block belongs to this artist
      if (availabilityBlock.artist_id !== artistProfile.id) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este bloqueo de disponibilidad." },
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
      .from("availability")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Availability DELETE] Delete error:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar el bloqueo de disponibilidad." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Availability DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
