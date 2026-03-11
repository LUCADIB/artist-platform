import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { ArtistManagementTable } from "../../../../components/ArtistManagementTable";

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

interface Category {
  id: string;
  name: string;
}

export default async function ArtistsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: artistsData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, slug, city, bio, avatar_url, category_id, categories ( id, name )")
      .order("name", { ascending: true }),
    supabase.from("categories").select("id, name").order("name", { ascending: true }),
  ]);

  const artists = (artistsData ?? []) as unknown as Artist[];
  const categories = (categoriesData ?? []) as Category[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Gestión de artistas
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Crea, edita y elimina artistas de la plataforma.
        </p>
      </div>

      <ArtistManagementTable artists={artists} categories={categories} />
    </div>
  );
}
