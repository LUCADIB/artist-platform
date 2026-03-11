import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { artistId, name, phone, eventDate, eventTime, city, message } = body;

  if (!artistId || !name || !phone || !eventDate || !eventTime || !city) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("booking_requests").insert({
    artist_id: artistId,
    client_name: name,
    client_phone: phone,
    event_date: eventDate,
    event_time: eventTime,
    city,
    message,
    status: "pending"
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create booking request" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
