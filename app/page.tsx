import { createSupabaseServerClient } from "../lib/supabaseClient";
import { ArtistCard } from "../components/ArtistCard";
import { HeroSection } from "../components/HeroSection";

export default async function HomePage({
  searchParams
}: {
  searchParams?: { q?: string; categoryId?: string };
}) {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("artists")
    .select("id, slug, name, city, avatar_url, categories ( name )")
    .eq("status", "approved") // Only show approved artists publicly
    .order("created_at", { ascending: false });

  if (searchParams?.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }
  if (searchParams?.categoryId) {
    query = query.eq("category_id", searchParams.categoryId);
  }

  const { data: artists } = await query;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <HeroSection
        categories={categories ?? []}
        initialQuery={searchParams?.q}
        initialCategoryId={searchParams?.categoryId}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
              Artistas destacados
            </h2>
            <p className="text-xs text-neutral-500 sm:text-sm">
              Explora el catálogo y filtra por categoría para encontrar el match perfecto.
            </p>
          </div>
          <a
            href="/artists"
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Ver todos los artistas
          </a>
        </div>
        {artists && artists.length > 0 ? (
          <div id="results">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
              {artists.map((artist: any) => (
                <ArtistCard
                  key={artist.id}
                  id={artist.id}
                  slug={artist.slug}
                  name={artist.name}
                  city={artist.city}
                  categoryName={artist.categories?.name}
                  avatarUrl={artist.avatar_url}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-neutral-700">
              No se encontraron artistas
            </p>
            <p className="text-xs text-neutral-500">
              Intenta buscar por nombre o categoría.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

