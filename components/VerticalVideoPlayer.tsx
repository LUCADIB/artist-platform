"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface VerticalVideoPlayerProps {
  /** TikTok / Instagram embed URL */
  embedUrl: string;
  /** Platform identifier — used for branding and autoplay logic */
  platform: string;
  /** Artist profile image — shown as preview background when available */
  artistImageUrl?: string | null;
  /** Accessible title for the player */
  title?: string;
}

/** Animation duration in ms — keep in sync with Tailwind `duration-[250ms]` */
const ANIM_MS = 250;

/**
 * Controlled vertical-video player for TikTok & Instagram Reels.
 *
 * Preview: artist profile image (with dark overlay) or shimmer skeleton.
 * Modal:   cinematic scale/fade, autoplay, focus-trapped, ESC / click-outside.
 */
export function VerticalVideoPlayer({
  embedUrl,
  platform,
  artistImageUrl,
  title,
}: VerticalVideoPlayerProps) {
  const displayTitle =
    title || (platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : "Video");
  const hasArtistImage = !!artistImageUrl;

  /* ── State ─────────────────────────────────────────────── */
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /* ── Open / Close ──────────────────────────────────────── */
  const handleOpen = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
    setIsMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsMounted(false), ANIM_MS);
  }, []);

  /* ── Enter animation ───────────────────────────────────── */
  useEffect(() => {
    if (!isMounted) return;
    let raf: number;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setIsVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [isMounted]);

  /* ── Auto-focus close button ───────────────────────────── */
  useEffect(() => {
    if (isVisible) closeBtnRef.current?.focus();
  }, [isVisible]);

  /* ── ESC to close ──────────────────────────────────────── */
  useEffect(() => {
    if (!isMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMounted, handleClose]);

  /* ── Focus trap ────────────────────────────────────────── */
  useEffect(() => {
    if (!isMounted || !modalRef.current) return;
    const modal = modalRef.current;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe'
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [isMounted]);

  /* ── Body scroll lock ──────────────────────────────────── */
  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  /* ── Cleanup timer ─────────────────────────────────────── */
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  /* ── Autoplay URL (TikTok only — Instagram embeds ignore it) */
  const autoplayUrl = (() => {
    if (platform !== "tiktok") return embedUrl;
    try {
      const u = new URL(embedUrl);
      u.searchParams.set("autoplay", "1");
      return u.toString();
    } catch {
      return embedUrl + (embedUrl.includes("?") ? "&" : "?") + "autoplay=1";
    }
  })();

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ═══ PREVIEW CARD ═══ */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-full h-full overflow-hidden cursor-pointer group/vplayer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-inset"
        aria-label={`Reproducir ${displayTitle}`}
      >
        {/* ── Background layer ── */}
        {hasArtistImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artistImageUrl!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/5 to-black/50" />
          </>
        ) : (
          <>
            {/* Shimmer skeleton fallback */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
            {/* Platform-specific ambient glow */}
            {platform === "tiktok" ? (
              <>
                <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-[#25f4ee]/[0.06] blur-3xl" />
                <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-[#fe2c55]/[0.06] blur-3xl" />
              </>
            ) : (
              <>
                <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-[#833ab4]/[0.06] blur-3xl" />
                <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-[#fd1d1d]/[0.06] blur-3xl" />
              </>
            )}
          </>
        )}

        {/* Hover darken */}
        <div className="absolute inset-0 bg-black/0 group-hover/vplayer:bg-black/20 transition-colors duration-300" />

        {/* Platform watermark */}
        <div className="absolute top-3 right-3 opacity-30">
          {platform === "tiktok" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.89 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.14 15.67a6.34 6.34 0 0 0 6.34 6.33 6.34 6.34 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.77 1.53V7.3a4.85 4.85 0 0 1-1-.61z" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
            </svg>
          )}
        </div>

        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover/vplayer:bg-white/20 group-hover/vplayer:scale-110">
            <svg
              viewBox="0 0 24 24"
              fill="white"
              className="h-6 w-6 ml-0.5"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <span className="text-white/40 text-[11px] font-medium tracking-wide select-none">
            Toca para reproducir
          </span>
        </div>
      </button>

      {/* ═══ CINEMATIC MODAL ═══ */}
      {isMounted && (
        <div
          ref={modalRef}
          className={[
            "fixed inset-0 z-[9999] flex items-center justify-center p-4",
            "bg-black/85 backdrop-blur-sm",
            "transition-opacity duration-[250ms] ease-out",
            isVisible ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={displayTitle}
        >
          <div
            className={[
              "relative flex flex-col items-center",
              "transition-all duration-[250ms] ease-out",
              isVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-2",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              ref={closeBtnRef}
              onClick={handleClose}
              className="self-end mb-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <span>Cerrar</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Player container — 9:16 · max 85vh */}
            <div className="relative aspect-[9/16] h-[min(85vh,720px)] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10">
              <iframe
                src={autoplayUrl}
                title={displayTitle}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
