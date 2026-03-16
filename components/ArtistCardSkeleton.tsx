/**
 * Skeleton placeholder that matches the ArtistCard layout.
 * Mobile: standalone image tile + text lines (no card chrome).
 * Desktop: card with image, text, and CTA placeholder.
 */
export function ArtistCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="break-inside-avoid mb-2 sm:mb-0 sm:flex sm:flex-col sm:overflow-hidden sm:rounded-2xl sm:border sm:border-neutral-100 sm:bg-white sm:shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200/70 sm:aspect-[4/3] sm:rounded-none">
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

      {/* Desktop: card content skeleton */}
      <div className="hidden sm:block sm:p-4 sm:space-y-2.5">
        <div className="relative h-3.5 w-3/4 overflow-hidden rounded bg-neutral-200/70">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        <div className="relative h-2.5 w-1/2 overflow-hidden rounded bg-neutral-100">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        <div className="relative mt-1.5 h-9 w-full overflow-hidden rounded-lg bg-neutral-200/70">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
