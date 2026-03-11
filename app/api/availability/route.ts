import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { artistId, date, startTime } = body;

  if (!artistId || !date || !startTime) {
    return NextResponse.json(
      { error: "Faltan campos requeridos." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch existing availability records for same artist + date
  const { data: existing, error: fetchError } = await supabase
    .from("availability")
    .select("id, start_time, end_time, status")
    .eq("artist_id", artistId)
    .eq("date", date);

  if (fetchError) {
    return NextResponse.json(
      { error: "Error al verificar disponibilidad." },
      { status: 500 }
    );
  }

  const newStartMs = timeToMs(startTime);

  // Enforce 80-minute safety window around every existing slot
  for (const slot of existing ?? []) {
    const slotStartMs = timeToMs(slot.start_time);

    const windowStart = slotStartMs - SAFETY_WINDOW_MS;
    const windowEnd = slotStartMs + SAFETY_WINDOW_MS;

    if (newStartMs > windowStart && newStartMs < windowEnd) {
      return NextResponse.json(
        { error: "Este horario está demasiado cerca de otro evento." },
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
    })
    .select("id, artist_id, date, start_time, end_time, status, artists(name)")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Error al guardar el bloqueo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, block: inserted }, { status: 201 });
}
