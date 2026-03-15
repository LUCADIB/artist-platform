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
    const { data: artist, error: artistError } = await supabase
      .from("artists")
      .select("name, profile_id, managed_by_admin, manager_profile_id")
      .eq("id", artistId)
      .single();

    if (artistError) {
      console.error("[Booking] Artist lookup error:", artistError);
    }

    let contactEmail: string | null = null;
    let contactName: string | null = null;
    let contactPhone: string | null = null;

    /**
     * 📧 Booking routing logic:
     *
     * If artist.managed_by_admin === true AND manager_profile_id exists:
     *   - Use manager's email (via manager_profile_id → auth.users.email)
     *   - Use manager's phone for WhatsApp (from profiles.phone)
     * Else:
     *   - Use artist's email (via profile_id → auth.users.email)
     *   - Use artist's whatsapp
     *
     * Fallbacks:
     *   - If manager_profile_id is null but managed_by_admin is true → fallback to artist
     *   - If manager phone is null → hide WhatsApp button
     */
    if (artist?.managed_by_admin && artist?.manager_profile_id) {
      // Artist is managed - route to manager
      console.log(`[Booking] Artist ${artist.name} is managed by profile: ${artist.manager_profile_id}`);

      const { data: managerData, error: managerError } = await supabase.auth.admin.getUserById(
        artist.manager_profile_id
      );

      if (managerError) {
        console.error("[Booking] Manager auth lookup error:", managerError);
      }

      contactEmail = managerData?.user?.email ?? null;
      contactName = "QuitoShows (Gestor)";

      // Fetch manager's phone from profiles table
      const { data: managerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", artist.manager_profile_id)
        .single();

      if (profileError) {
        console.error("[Booking] Manager profile lookup error:", profileError);
      }

      contactPhone = managerProfile?.phone ?? null;

      console.log(`[Booking] Manager email: ${contactEmail}, phone: ${contactPhone}`);

      // Fallback: If no manager email, try artist email
      if (!contactEmail && artist?.profile_id) {
        console.log("[Booking] No manager email, falling back to artist email");
        const { data: artistAuth } = await supabase.auth.admin.getUserById(artist.profile_id);
        contactEmail = artistAuth?.user?.email ?? null;
        contactName = artist?.name ?? "Artista";
      }
    } else if (artist?.profile_id) {
      // Artist is self-managed - route to artist
      console.log(`[Booking] Artist ${artist.name} is self-managed`);

      const { data, error: artistAuthError } = await supabase.auth.admin.getUserById(
        artist.profile_id
      );

      if (artistAuthError) {
        console.error("[Booking] Artist auth lookup error:", artistAuthError);
      }

      contactEmail = data?.user?.email ?? null;
      contactName = artist?.name ?? "Artista";
      contactPhone = null; // Artist's whatsapp is in artists table, not profiles

      console.log(`[Booking] Artist email: ${contactEmail}`);
    }

    // 🔥 Send email notification
    if (contactEmail) {
      const emailResult = await sendBookingEmailToArtist({
        artistEmail: contactEmail,
        artistName: contactName || artist?.name || "Artista",
        clientName: name,
        clientPhone: phone,
        eventDate,
        eventTime,
        city,
      });

      if (!emailResult.success) {
        console.error("[Booking] Email send failed:", emailResult.error);
      }
    } else {
      console.warn("[Booking] No contact email found - notification not sent");
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