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
}

export function ArtistCard({
  slug,
  name,
  city,
  categoryName,
  avatarUrl
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
    <article
      ref={ref}
      className={[
        "group flex flex-col overflow-hidden rounded-2xl break-inside-avoid mb-3 sm:mb-0",
        "border border-neutral-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]",
        "active:scale-[0.97] sm:border-neutral-200 sm:shadow-sm sm:hover:-translate-y-1 sm:hover:shadow-lg",
        "transition-all duration-300 ease-out",
        isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
      ].join(" ")}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100 sm:aspect-[4/3]">
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
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white sm:px-3 sm:py-1 sm:text-[11px]">
            {categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2 sm:gap-2 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <h3 className="text-xs font-semibold leading-snug tracking-tight text-neutral-900 sm:text-sm">
              {name}
            </h3>
            {city && (
              <p className="mt-0.5 text-[10px] text-neutral-500 sm:mt-1 sm:text-xs">
                {city}
              </p>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-3">
          <Link
            href={href}
            className="btn-primary w-full justify-center !h-8 !py-0 text-[11px] sm:!h-9 sm:text-sm"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
