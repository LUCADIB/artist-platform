"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

interface ArtistCardProps {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  categoryName?: string | null;
  avatarUrl?: string | null;
  isFeatured?: boolean;
  isHero?: boolean;
}

export function ArtistCard({
  slug,
  name,
  city,
  categoryName,
  avatarUrl,
  isFeatured,
  isHero
}: ArtistCardProps) {
  const href = slug ? `/artist/${slug}` : "#";
  const ref = useRef<HTMLElement>(null);
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

  return (
    <Link
      href={href}
      className={[
        "block break-inside-avoid mb-2 sm:mb-0",
        isHero ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
      ].join(" ")}
    >
      <article
        ref={ref}
        className={[
          "group h-full",
          /* Desktop: premium hover */
          "sm:hover:-translate-y-1 sm:hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
          /* Tap feedback + reveal */
          "active:scale-[0.97] transition-all duration-300 ease-out",
          isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        ].join(" ")}
      >
        {/* ── Image tile ── */}
        <div className={[
          "relative overflow-hidden rounded-2xl bg-neutral-100 sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
          isHero ? "aspect-[4/5] sm:aspect-auto h-auto sm:h-full" : "aspect-[3/4] sm:aspect-[3/4]",
        ].join(" ")}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-400">
              Sin foto
            </div>
          )}
          {categoryName && (
            <span className={[
              "absolute left-1.5 top-1.5 sm:left-2 sm:top-2 bg-black/70 uppercase text-white",
              isHero
                ? "rounded-full px-3 py-1 text-xs font-medium tracking-[0.15em]"
                : "rounded-md px-1 py-[1px] text-[8px] font-medium tracking-normal sm:rounded-lg sm:px-1.5 sm:py-[2px] sm:text-[9px] sm:tracking-wider md:rounded-full md:px-2 md:py-[3px] md:text-[10px] md:font-medium md:tracking-[0.15em]",
            ].join(" ")}>
              {categoryName}
            </span>
          )}
          {isFeatured && (
            <span className={[
              "absolute right-1.5 top-1.5 sm:right-2 sm:top-2 bg-primary-600 uppercase text-white",
              isHero
                ? "rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-md"
                : "rounded-md px-1 py-[1px] text-[8px] font-medium tracking-normal shadow-sm sm:rounded-lg sm:px-1.5 sm:py-[2px] sm:text-[9px] sm:tracking-wider md:rounded-full md:px-2 md:py-[3px] md:text-[10px] md:font-semibold md:tracking-wide md:shadow-md",
            ].join(" ")}>
              DESTACADO
            </span>
          )}
        </div>

        {/* ── Mobile: text below tile ── */}
        <div className="mt-1.5 px-0.5 sm:hidden">
          <h3 className="text-xs font-semibold leading-snug tracking-tight text-neutral-900">
            {name}
          </h3>
          {city && (
            <p className="mt-0.5 text-[10px] text-neutral-500">{city}</p>
          )}
        </div>

        {/* ── Desktop: text below tile ── */}
        <div className="hidden sm:block sm:mt-2.5 sm:px-1">
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-neutral-900">
            {name}
          </h3>
          {city && (
            <p className="mt-0.5 text-xs text-neutral-500">{city}</p>
          )}
        </div>
      </article>
    </Link>
  );
}
