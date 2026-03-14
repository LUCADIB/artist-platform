import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { ArtistRequestsList } from "../../../../components/ArtistRequestsList";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistRequestsPage() {
  const supabase = await createSupabaseServerClient();

  // Use getUser() instead of getSession() for reliable server-side auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the artist record associated with this user
  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("id, name")
    .eq("profile_id", user.id)
    .single();

  if (artistError) {
    console.error("[Artist Requests] Error fetching artist:", artistError);
  }

  if (!artist) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            Solicitudes de reserva
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Revisa las solicitudes que has recibido.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-700">
            No tienes un perfil de artista asociado a tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  

  // Fetch booking requests for this artist
  // RLS policy allows artists to read their own requests
  const { data: requests, error: requestsError } = await supabase
  .from("booking_requests")
  .select(
    "id, artist_id, client_name, client_phone, event_date, event_time, city, message, status, created_at"
  )
  .eq("artist_id", artist.id)
  .order("created_at", { ascending: false });
  if (requestsError) {
    console.error("[Artist Requests] Error fetching requests:", requestsError);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Solicitudes de reserva
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Revisa las solicitudes que has recibido.
        </p>
      </div>

      <ArtistRequestsList requests={requests ?? []} />
    </div>
  );
}
