import { ArtistCardSkeleton } from "../components/ArtistCardSkeleton";

export default function HomeLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      {/* Hero skeleton */}
      <div className="relative flex flex-col items-center justify-center gap-4 bg-neutral-50 px-4 py-16 sm:py-24">
        <div className="h-10 w-80 max-w-full rounded-lg bg-neutral-200/70 animate-pulse" />
        <div className="h-5 w-64 rounded bg-neutral-100 animate-pulse" />
        <div className="mt-4 h-12 w-full max-w-xl rounded-xl bg-neutral-100 animate-pulse" />
      </div>

      {/* Artist grid skeleton */}
      <section className="mx-auto w-full max-w-6xl px-2 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-2">
          <div className="h-6 w-52 rounded-lg bg-neutral-200/70 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="columns-2 gap-2 sm:columns-none sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ArtistCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
