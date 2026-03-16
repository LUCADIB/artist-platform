import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseClient";
import { getServiceClient } from "@/lib/serviceClient";

// Safety window: 80 minutes in milliseconds
const SAFETY_WINDOW_MS = 80 * 60 * 1000;
// Event duration: 90 minutes
const EVENT_DURATION_MS = 90 * 60 * 1000;

function timeToMs(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return ((h * 60 + m) * 60 + (s || 0)) * 1000;
}

function msToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/**
 * POST /api/availability
 *
 * Securely creates a new availability block after verifying:
 * 1. User is authenticated
 * 2. User is either:
 *    - A manager/admin (can block any artist)
 *    - An artist (can only block their own calendar)
 *
 * Authorization flow:
 * - Get session from cookies (SSR)
 * - Fetch user profile to check role
 * - For artists: resolve artist_id from their profile (ignore frontend value)
 * - For managers: use provided artist_id
 * - Validate date, time, and overlap rules
 * - Only then perform insert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId: providedArtistId, date, startTime } = body;

    // Step 1: Validate required fields (except artistId - will be resolved securely)
    if (!date || !startTime) {
      return NextResponse.json(
        { error: "Fecha y hora de inicio son requeridos." },
        { status: 400 }
      );
    }

    // Step 2: Get authenticated session
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

    // Step 3: Get user profile and role
    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Availability POST] Profile lookup error:", profileError);
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

    // Step 4: Resolve artist_id securely based on role
    let artistId: string;
    let createdByRole: "admin" | "artist";

    if (isManager) {
      // Managers/admins can block any artist - use provided artistId
      if (!providedArtistId) {
        return NextResponse.json(
          { error: "artistId es requerido para managers." },
          { status: 400 }
        );
      }

      // Verify the artist exists
      const { data: artistExists, error: artistCheckError } = await serviceClient
        .from("artists")
        .select("id")
        .eq("id", providedArtistId)
        .maybeSingle();

      if (artistCheckError) {
        console.error("[Availability POST] Artist verification error:", artistCheckError);
        return NextResponse.json(
          { error: "Error al verificar el artista." },
          { status: 500 }
        );
      }

      if (!artistExists) {
        return NextResponse.json(
          { error: "Artista no encontrado." },
          { status: 404 }
        );
      }

      artistId = providedArtistId;
      createdByRole = "admin";

    } else if (userRole === "artist") {
      // Artists can only block their own calendar - resolve artist_id from profile
      const { data: artistProfile, error: artistError } = await serviceClient
        .from("artists")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (artistError) {
        console.error("[Availability POST] Artist lookup error:", artistError);
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

      // Securely override artist_id - ignore any frontend value
      artistId = artistProfile.id;
      createdByRole = "artist";

    } else {
      // Unknown role - deny access
      return NextResponse.json(
        { error: "No tienes permiso para realizar esta acción." },
        { status: 403 }
      );
    }

    // Step 5: Validate time format (HH:00)
    const [hour, minute] = startTime.split(":").map(Number);

    if (minute !== 0) {
      return NextResponse.json(
        { error: "Solo puedes bloquear horarios en horas exactas, ejemplo: 19:00." },
        { status: 400 }
      );
    }

    // Step 6: Fetch existing availability records for same artist + date
    const { data: existing, error: fetchError } = await serviceClient
      .from("availability")
      .select("id, start_time, end_time, status")
      .eq("artist_id", artistId)
      .eq("date", date);

    if (fetchError) {
      console.error("[Availability POST] Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Error al verificar disponibilidad." },
        { status: 500 }
      );
    }

    // Step 7: Check for duplicate time slot
    for (const slot of existing ?? []) {
      if (slot.start_time === startTime) {
        return NextResponse.json(
          { error: "Este horario ya está ocupado." },
          { status: 409 }
        );
      }
    }

    // Step 8: Calculate end time
    const newStartMs = timeToMs(startTime);
    const endTimeMs = newStartMs + EVENT_DURATION_MS;
    const endTime = msToTime(endTimeMs);

    // Step 9: Perform insert (authorization and validation passed)
    const { data: inserted, error: insertError } = await serviceClient
      .from("availability")
      .insert({
        artist_id: artistId,
        date,
        start_time: startTime,
        end_time: endTime,
        status: "blocked",
        created_by_role: createdByRole,
      })
      .select("id, artist_id, date, start_time, end_time, status, created_by_role, artists(name)")
      .single();

    if (insertError) {
      console.error("[Availability POST] Insert error:", insertError);
      return NextResponse.json(
        { error: "Error al guardar el bloqueo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, block: inserted }, { status: 201 });

  } catch (error) {
    console.error("[Availability POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
