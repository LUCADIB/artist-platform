import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { AvailabilityManager } from "../../../../components/AvailabilityManager";

interface Artist {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  category_id: string | null;
  categories: { id: string; name: string } | null;
}

interface AvailabilityBlock {
  id: string;
  artist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  artists: { name: string } | null;
}

export default async function AvailabilityPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: artistsData }, { data: blocksData }] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, slug, city, bio, avatar_url, category_id, categories ( id, name )")
      .order("name", { ascending: true }),
    supabase
      .from("availability")
      .select(`
        id,
        artist_id,
        date,
        start_time,
        end_time,
        status,
        artists(name)
      `)
      .order("date", { ascending: true }),
  ]);

  const artists = (artistsData ?? []) as unknown as Artist[];
  const blocks = (blocksData ?? []) as unknown as AvailabilityBlock[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Disponibilidad de artistas
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bloquea y gestiona los horarios no disponibles de los artistas.
        </p>
      </div>

      <AvailabilityManager artists={artists} initialBlocks={blocks} />
    </div>
  );
}
