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

    // 🔥 Fetch artist with management info
    const { data: artist } = await supabase
      .from("artists")
      .select("name, profile_id, managed_by_admin, manager_profile_id")
      .eq("id", artistId)
      .single();

    let contactEmail: string | null = null;
    let contactName: string | null = null;

    /**
     * 📧 Booking routing logic:
     *
     * If artist.managed_by_admin === true:
     *   - Use manager's email (via manager_profile_id)
     *   - Use manager's phone for WhatsApp (from profiles.phone)
     * Else:
     *   - Use artist's email (via profile_id)
     *   - Use artist's whatsapp
     */
    if (artist?.managed_by_admin && artist?.manager_profile_id) {
      // Artist is managed - route to manager
      const { data: managerData } = await supabase.auth.admin.getUserById(
        artist.manager_profile_id
      );
      contactEmail = managerData?.user?.email ?? null;
      contactName = "QuitoShows (Gestor)";

      // Also fetch manager's phone for reference
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", artist.manager_profile_id)
        .single();

      // Log manager phone for debugging (not used in email currently)
      if (managerProfile?.phone) {
        console.log(`[Booking] Manager phone: ${managerProfile.phone}`);
      }
    } else if (artist?.profile_id) {
      // Artist is self-managed - route to artist
      const { data } = await supabase.auth.admin.getUserById(
        artist.profile_id
      );
      contactEmail = data?.user?.email ?? null;
      contactName = artist?.name ?? "Artista";
    }

    // 🔥 Enviar correo
    if (contactEmail) {
      await sendBookingEmailToArtist({
        artistEmail: contactEmail,
        artistName: contactName || artist?.name || "Artista",
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