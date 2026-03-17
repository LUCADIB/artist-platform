"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

/**
 * HeroArtistCard — Visually highlighted card for the #1 featured artist.
 *
 * Rendered outside the main artist grid on the homepage when:
 *   - An artist has `home_featured_rank === 1`
 *   - The user is NOT in search mode
 *
 * Uses a large image-first tile with text overlay and a "DESTACADO" badge.
 * Mobile: full-width 3/4 tile. Desktop: col-span-2 within a 4-col grid.
 */

interface HeroArtistCardProps {
  artist: {
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    avatar_url: string | null;
    categories?: { name: string } | { name: string }[] | null;
  };
}

export function HeroArtistCard({ artist }: HeroArtistCardProps) {
  const href = artist.slug ? `/artist/${artist.slug}` : "#";
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "40px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const categoryName = Array.isArray(artist.categories)
    ? artist.categories[0]?.name
    : artist.categories?.name;

  return (
    <Link href={href} className="block mb-4 sm:mb-6 lg:mb-8">
      <div
        ref={ref}
        className={[
          "group relative w-full overflow-hidden rounded-2xl bg-neutral-100",
          "shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
          "sm:hover:-translate-y-1 sm:hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]",
          "active:scale-[0.98] transition-all duration-300 ease-out",
          isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        ].join(" ")}
      >
        {/* Image — mobile vertical, desktop cinematic */}
        <div className="relative aspect-[3/4] sm:aspect-[16/9] md:aspect-[2/1] lg:aspect-[16/7] xl:aspect-[16/6]">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.name}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-400">
              Sin foto
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Badge — DESTACADO */}
          <span className="absolute right-3 top-3 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
            DESTACADO
          </span>

          {/* Category badge */}
          {categoryName && (
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm sm:px-3 sm:py-1 sm:text-[11px]">
              {categoryName}
            </span>
          )}

          {/* Text overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 lg:p-8">
            <h3 className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
              {artist.name}
            </h3>
            {artist.city && (
              <p className="mt-1 text-xs text-white/75 sm:text-sm">
                {artist.city}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
