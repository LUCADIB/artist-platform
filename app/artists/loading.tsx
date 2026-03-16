import { ArtistCardSkeleton } from "../../components/ArtistCardSkeleton";

export default function ArtistsLoading() {
  return (
    <div className="mx-auto flex min-w-0 flex-col gap-6 px-2 pb-10 pt-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-2">
        <div className="h-8 w-64 rounded-lg bg-neutral-200/70 animate-pulse" />
        <div className="h-4 w-96 max-w-full rounded bg-neutral-100 animate-pulse" />
      </header>

      {/* Search bar skeleton */}
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="h-10 w-full rounded-lg bg-neutral-100 animate-pulse" />
      </section>

      {/* Grid skeleton */}
      <section className="mx-auto w-full max-w-6xl">
        <div className="columns-2 gap-2 sm:columns-none sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ArtistCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
