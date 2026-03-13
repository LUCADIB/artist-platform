import { NextRequest, NextResponse } from "next/server";
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
 * Creates a new availability block.
 *
 * Parameters:
 * - artistId: The artist ID
 * - date: The date (YYYY-MM-DD)
 * - startTime: The start time (HH:MM)
 * - createdByRole: 'admin' or 'artist' (default: 'admin')
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { artistId, date, startTime, createdByRole } = body;

  if (!artistId || !date || !startTime) {
    return NextResponse.json(
      { error: "Faltan campos requeridos." },
      { status: 400 }
    );
  }

  // Validate createdByRole
  const role = createdByRole === "artist" ? "artist" : "admin";

  const supabase = getServiceClient();

  // Fetch existing availability records for same artist + date
  const { data: existing, error: fetchError } = await supabase
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

  const newStartMs = timeToMs(startTime);

  // Force availability only on exact hours (HH:00)
const [hour, minute] = startTime.split(":").map(Number);

if (minute !== 0) {
  return NextResponse.json(
    { error: "Solo puedes bloquear horarios en horas exactas, ejemplo: 19:00." },
    { status: 400 }
  );
}
  // Only block if same start_time already exists
for (const slot of existing ?? []) {
  if (slot.start_time === startTime) {
    return NextResponse.json(
      { error: "Este horario ya está ocupado." },
      { status: 409 }
    );
  }
}

  const endTimeMs = newStartMs + EVENT_DURATION_MS;
  const endTime = msToTime(endTimeMs);

  const { data: inserted, error: insertError } = await supabase
    .from("availability")
    .insert({
      artist_id: artistId,
      date,
      start_time: startTime,
      end_time: endTime,
      status: "blocked",
      created_by_role: role,
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
}
