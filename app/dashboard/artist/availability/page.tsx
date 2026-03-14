import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { ArtistAvailabilityManager } from "../../../../components/ArtistAvailabilityManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistAvailabilityPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch the artist record associated with this user
  const { data: artistData } = await supabase
  .from("artists")
  .select("id, name")
  .eq("profile_id", session.user.id)
  .limit(1);

const artist = artistData?.[0];

  if (!artist) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            Disponibilidad
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gestiona los días en los que estás disponible para eventos.
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

  // Fetch existing availability blocks for this artist (all records, no role filter)
  const { data: availabilityBlocks, error } = await supabase
  .from("availability")
  .select("id, date, start_time, end_time, status, notes")
  .eq("artist_id", artist.id)
  .order("date", { ascending: true })
  .order("start_time", { ascending: true });


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Disponibilidad
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestiona los días en los que estás disponible para eventos.
        </p>
      </div>

      <ArtistAvailabilityManager
        artistId={artist.id}
        initialBlocks={availabilityBlocks ?? []}
      />
    </div>
  );
}
