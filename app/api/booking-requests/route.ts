import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingEmailToArtist } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
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

    // 🔥 Insert booking
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
      console.error("Insert booking error:", error);
      return NextResponse.json(
        { error: "Failed to create booking request" },
        { status: 500 }
      );
    }

    // 🔥 Buscar artista
    const { data: artist } = await supabase
      .from("artists")
      .select("name, profile_id")
      .eq("id", artistId)
      .single();

    let artistEmail: string | null = null;

    // 🔥 Obtener email desde auth.users
    if (artist?.profile_id) {
      const { data } = await supabase.auth.admin.getUserById(
        artist.profile_id
      );

      artistEmail = data?.user?.email ?? null;
    }

    // 🔥 Enviar correo
    if (artistEmail) {
      await sendBookingEmailToArtist({
        artistEmail,
        artistName: artist?.name ?? "Artista",
        clientName: name,
        clientPhone: phone,
        eventDate,
        eventTime,
        city,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error("Booking route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}