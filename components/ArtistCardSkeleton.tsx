/**
 * Skeleton placeholder that matches the ArtistCard layout.
 * Mobile: standalone image tile + text lines (no card chrome).
 * Desktop: image tile with rounded-2xl + text lines (no card chrome, no CTA).
 */
export function ArtistCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="break-inside-avoid mb-2 sm:mb-0"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200/70 sm:aspect-[3/4] sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      {/* Mobile: text skeleton below tile */}
      <div className="mt-1.5 px-0.5 space-y-1.5 sm:hidden">
        <div className="relative h-3 w-3/4 overflow-hidden rounded bg-neutral-200/70">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        <div className="relative h-2.5 w-1/2 overflow-hidden rounded bg-neutral-100">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>

      {/* Desktop: text skeleton below tile */}
      <div className="hidden sm:block sm:mt-2.5 sm:px-1 sm:space-y-1.5">
        <div className="relative h-3.5 w-3/4 overflow-hidden rounded bg-neutral-200/70">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        <div className="relative h-2.5 w-1/2 overflow-hidden rounded bg-neutral-100">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
