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
      .select("id, slug, name, city, avatar_url, home_featured_rank, categories ( name )")
      .eq("status", "approved");

    // Apply text filter if provided
    if (searchParams?.q) {
      searchQuery = searchQuery.ilike("name", `%${searchParams.q}%`);
    }

    // Apply category filter if provided
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
    <div className="flex min-w-0 flex-col gap-8">
      <HeroSection
        categories={categories ?? []}
        initialQuery={searchParams?.q}
        initialCategoryId={searchParams?.categoryId}
      />

      <section className="mx-auto w-full max-w-6xl px-2 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
              {sectionTitle}
            </h2>
            <p className="text-xs text-neutral-500 sm:text-sm">
              Explora el catálogo y filtra por categoría para encontrar el match perfecto.
            </p>
          </div>
          <a
            href="/artists"
            className="text-xs font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Ver todos los artistas
          </a>
        </div>
        {visibleArtists && visibleArtists.length > 0 ? (
          <div id="results">
            {/* Artist grid — hero artist gets col-span-2 row-span-2 via isHero */}
            <div className="grid grid-cols-2 gap-2 auto-rows-fr md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
            {/* Show "Ver más" button when there are more results */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Link
                  href={{
                    pathname: "/artists",
                    query: {
                      ...(searchParams?.q && { q: searchParams.q }),
                      ...(searchParams?.categoryId && { categoryId: searchParams.categoryId }),
                    },
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
                >
                  {searchParams?.q
                    ? `Ver más resultados de '${searchParams.q}'`
                    : searchParams?.categoryId
                    ? "Ver más artistas de esta categoría"
                    : "Ver más resultados"}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-neutral-700">
              {emptyMessage}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

