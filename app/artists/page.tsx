import { createSupabaseServerClient } from "../../lib/supabaseClient";
import {
  applyHomeFeaturedOrdering,
  applyCategoryFeaturedOrdering,
} from "../../lib/featuredOrdering";
import { ArtistCard } from "../../components/ArtistCard";
import { SearchBar } from "../../components/SearchBar";

const PAGE_SIZE = 12;

type SearchParams = {
  q?: string;
  categoryId?: string;
  page?: string;
};

export default async function ArtistsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = await createSupabaseServerClient();

  const currentPage = Math.max(
    1,
    Number.isNaN(Number(searchParams?.page))
      ? 1
      : Number(searchParams?.page || 1)
  );
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let artistsQuery = supabase
    .from("artists")
    .select("id, slug, name, city, avatar_url, home_featured_rank, category_featured_rank, categories ( id, name )", {
      count: "exact"
    })
    .eq("status", "approved"); // Only show approved artists publicly

  // Apply category filter before ordering (for category-specific featured ordering)
  if (searchParams?.categoryId) {
    artistsQuery = artistsQuery.eq("category_id", searchParams.categoryId);
  }

  // ==========================================================================
  // GLOBAL SEARCH: Match artist name OR category name
  // ==========================================================================
  // Users think in terms of intent, not database fields.
  // Typing "dj" should show artists in DJ category, not just artists with "dj" in name.
  //
  // Implementation:
  // 1. Find category IDs matching the query
  // 2. Use .or() to match artist name OR category_id in matching IDs
  // ==========================================================================
  if (searchParams?.q) {
    const likePattern = `%${searchParams.q}%`;

    // Find category IDs that match the query
    const { data: matchingCategories } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", likePattern);

    const matchingCategoryIds = (matchingCategories ?? []).map((c) => c.id);

    // Build OR filter: artist name OR category_id in matching IDs
    if (matchingCategoryIds.length > 0) {
      artistsQuery = artistsQuery.or(
        `name.ilike.%${searchParams.q}%,category_id.in.(${matchingCategoryIds.join(",")})`
      );
    } else {
      // No matching categories, only search by artist name
      artistsQuery = artistsQuery.ilike("name", likePattern);
    }
  }

  // Apply featured ordering based on context:
  // - Category filter active: use category ordering (home_featured > category_featured > created_at)
  // - No category filter: use home ordering (home_featured > created_at)
  if (searchParams?.categoryId) {
    artistsQuery = applyCategoryFeaturedOrdering(artistsQuery);
  } else {
    artistsQuery = applyHomeFeaturedOrdering(artistsQuery);
  }

  // Apply pagination
  artistsQuery = artistsQuery.range(from, to);

  const { data: artists, count } = await artistsQuery;

  const totalArtists = count ?? 0;
  const totalPages =
    totalArtists === 0 ? 1 : Math.max(1, Math.ceil(totalArtists / PAGE_SIZE));

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <>
      {/* HERO EDITORIAL */}
      <section className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-black text-white mt-6">

        <div className="mx-auto max-w-6xl px-4 pt-16 pb-24 text-center">

          {/* LOGO */}
          <div className="flex justify-center mb-6">
            <img
              src="https://xvrzlrgzcamromyxawiz.supabase.co/storage/v1/object/public/artists/Logo%201000%20tr.png"
              alt="1000Artistas"
              className="h-14 sm:h-16 md:h-20 object-contain"
            />
          </div>

          {/* TITULO */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Explora artistas increíbles
          </h1>

          {/* SUBTITULO */}
          <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
            Descubre talento profesional, compara perfiles y encuentra el artista perfecto para tu evento.
          </p>

        </div>

      </section>

      {/* CONTENIDO ORIGINAL */}
      <div className="mx-auto flex min-w-0 flex-col gap-6 px-[6px] pb-10 pt-2 sm:px-4 lg:px-6 max-w-7xl">

        <section className="mx-auto w-full max-w-6xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm mt-8 sm:mt-10 sm:p-5">
          <SearchBar
            categories={categories ?? []}
            initialQuery={searchParams?.q}
            initialCategoryId={searchParams?.categoryId}
            basePath="/artists"
          />
        </section>

        <section className="mx-auto w-full max-w-6xl space-y-4">
          {artists && artists.length > 0 ? (
            <>
              <div id="results">
                <div className="columns-2 gap-[4px] sm:columns-none sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
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
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-neutral-600 sm:text-sm">
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    {hasPreviousPage && (
                      <a
                        href={`/artists?${new URLSearchParams({
                          ...(searchParams?.q ? { q: searchParams.q } : {}),
                          ...(searchParams?.categoryId
                            ? { categoryId: searchParams.categoryId }
                            : {}),
                          page: String(currentPage - 1)
                        }).toString()}`}
                        className="btn-ghost px-3 py-1 text-xs sm:text-sm"
                      >
                        Anterior
                      </a>
                    )}
                    {hasNextPage && (
                      <a
                        href={`/artists?${new URLSearchParams({
                          ...(searchParams?.q ? { q: searchParams.q } : {}),
                          ...(searchParams?.categoryId
                            ? { categoryId: searchParams.categoryId }
                            : {}),
                          page: String(currentPage + 1)
                        }).toString()}`}
                        className="btn-ghost px-3 py-1 text-xs sm:text-sm"
                      >
                        Siguiente
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <p className="text-sm font-medium text-neutral-700">
                No se encontraron artistas
              </p>
              <p className="text-xs text-neutral-500">
                Intenta buscar por nombre de artista o categoría.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

