import { createSupabaseServerClient } from "../lib/supabaseClient";
import { applyHomeFeaturedOrdering } from "../lib/featuredOrdering";
import { ArtistCard } from "../components/ArtistCard";
import { HeroSection } from "../components/HeroSection";
import Link from "next/link";

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

  // Determine if user is performing a search
  const isSearching = !!(searchParams?.q || searchParams?.categoryId);

  let artists;

  if (isSearching) {
    // When searching: query ALL approved artists, apply filters and featured ordering
    let searchQuery = supabase
      .from("artists")
      .select("id, slug, name, city, avatar_url, home_featured_rank, categories ( id, name )")
      .eq("status", "approved");

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
        searchQuery = searchQuery.or(
          `name.ilike.%${searchParams.q}%,category_id.in.(${matchingCategoryIds.join(",")})`
        );
      } else {
        // No matching categories, only search by artist name
        searchQuery = searchQuery.ilike("name", likePattern);
      }
    }

    // Apply category filter if provided (works alongside text search)
    if (searchParams?.categoryId) {
      searchQuery = searchQuery.eq("category_id", searchParams.categoryId);
    }

    // Apply featured ordering (featured artists first)
    // Fetch 9 to detect if there are more than 8 results
    searchQuery = applyHomeFeaturedOrdering(searchQuery).limit(9);

    const { data } = await searchQuery;
    artists = data;
  } else {
    // When not searching: show ONLY featured artists, limited to 10
    let featuredQuery = supabase
      .from("artists")
      .select("id, slug, name, city, avatar_url, home_featured_rank, categories ( name )")
      .eq("status", "approved")
      .not("home_featured_rank", "is", null);

    featuredQuery = applyHomeFeaturedOrdering(featuredQuery).limit(10);

    const { data } = await featuredQuery;
    artists = data;
  }

  // ==========================================================================
  // HERO DETECTION (Phase 1 - Preparation)
  // ==========================================================================
  // The hero artist is the globally featured artist with rank 1.
  // This artist will receive special visual treatment in future phases.
  // Currently only detecting - no UI changes yet.
  //
  // Note: Due to unique index on home_featured_rank, there can only be
  // one artist with rank 1, so find() returns the hero or undefined.
  // ==========================================================================
  const heroArtist = artists?.find((artist: any) => artist.home_featured_rank === 1);
  const remainingArtists = artists?.filter((artist: any) => artist.home_featured_rank !== 1);

  // When searching, detect if there are more results and show only first 8
  const hasMore = isSearching && (artists?.length ?? 0) > 8;
  const visibleArtists = hasMore ? artists?.slice(0, 8) : artists;

  // Determine section title and empty state based on search mode
  const sectionTitle = isSearching ? "Resultados de búsqueda" : "Artistas destacados";
  const emptyMessage = isSearching
    ? "No se encontraron artistas"
    : "Próximamente artistas destacados";

  return (
    <div className="flex min-w-0 flex-col gap-10 bg-neutral-50">

      {/* HERO */}
      <HeroSection
        categories={categories ?? []}
        initialQuery={searchParams?.q}
        initialCategoryId={searchParams?.categoryId}
      />

      {/* RESULTS SECTION */}
      <section className="mx-auto w-full max-w-7xl px-[6px] pb-14 sm:px-4 lg:px-6">

        {/* HEADER */}
        <div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900">
              {sectionTitle}
            </h2>

            <p className="text-base text-neutral-500 max-w-xl leading-relaxed">
              Descubre talento destacado, explora perfiles profesionales y encuentra el artista ideal para tu evento.
            </p>
          </div>

          <a
            href="/artists"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 transition hover:opacity-60"
          >
            Ver todos los artistas
            <span className="transition group-hover:translate-x-1">→</span>
          </a>

        </div>

        {/* GRID */}
        {visibleArtists && visibleArtists.length > 0 ? (
          <div id="results">

            <div className="grid grid-cols-2 gap-1 auto-rows-fr md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-3">

              {visibleArtists.map((artist: any) => (
                <ArtistCard
                  key={artist.id}
                  id={artist.id}
                  slug={artist.slug}
                  name={artist.name}
                  city={artist.city}
                  categoryName={artist.categories?.name}
                  avatarUrl={artist.avatar_url}
                  isFeatured={artist.home_featured_rank != null}
                  isHero={artist.home_featured_rank === 1}
                />
              ))}

            </div>

            {/* VER MÁS */}
            {hasMore && (
              <div className="mt-10 flex justify-center">

                <Link
                  href={{
                    pathname: "/artists",
                    query: {
                      ...(searchParams?.q && { q: searchParams.q }),
                      ...(searchParams?.categoryId && { categoryId: searchParams.categoryId }),
                    },
                  }}
                  className="group inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-neutral-900 shadow-md shadow-neutral-200 transition hover:shadow-xl hover:-translate-y-0.5"
                >
                  {searchParams?.q
                    ? `Ver más resultados de '${searchParams.q}'`
                    : searchParams?.categoryId
                      ? "Ver más artistas de esta categoría"
                      : "Ver más resultados"}

                  <span className="ml-2 transition group-hover:translate-x-1">→</span>
                </Link>

              </div>
            )}

          </div>

        ) : (

          <div className="flex flex-col items-center gap-3 py-16 text-center">

            <div className="text-5xl opacity-40">🎭</div>

            <p className="text-lg font-semibold text-neutral-800">
              {emptyMessage}
            </p>

            <p className="text-sm text-neutral-500 max-w-md">
              Muy pronto encontrarás artistas increíbles listos para ser contratados.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}

