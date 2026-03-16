/**
 * Skeleton placeholder that matches the ArtistCard masonry layout.
 * Renders shimmer-animated blocks for image, text, and CTA.
 */
export function ArtistCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-2xl break-inside-avoid mb-3 sm:mb-0 border border-neutral-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
    >
      {/* Image placeholder */}
      <div className="relative aspect-square overflow-hidden bg-neutral-200/70 sm:aspect-[4/3]">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>

      {/* Content placeholder */}
      <div className="p-2 sm:p-4 space-y-2.5">
        {/* Name */}
        <div className="relative h-3.5 w-3/4 overflow-hidden rounded bg-neutral-200/70">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        {/* City */}
        <div className="relative h-2.5 w-1/2 overflow-hidden rounded bg-neutral-100">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
        {/* CTA button */}
        <div className="relative mt-1.5 h-8 w-full overflow-hidden rounded-lg bg-neutral-200/70 sm:mt-3 sm:h-9">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
