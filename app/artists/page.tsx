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
    <div className="mx-auto flex min-w-0 flex-col gap-6 px-2 pb-10 pt-8 sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Explora todos los artistas
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
          Filtra por nombre y categoría para encontrar el artista perfecto para
          tu próximo evento.
        </p>
      </header>

      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
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
              <div className="columns-2 gap-2 sm:columns-none sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
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
  );
}

