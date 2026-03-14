"use client";

import { useState, useEffect } from "react";
import { isVerticalPlatform, type VideoPlatform } from "@/lib/parseVideoUrl";

export interface VideoData {
  id: string;
  url: string;
  platform: string | null;
  embed_url: string | null;
  video_id: string | null;
}

interface VideoLinksManagerProps {
  artistId: string;
  initialVideos: VideoData[];
  maxVideos?: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  vimeo: "Vimeo",
};

/**
 * Shared video management component.
 * Used by both Artist and Manager dashboards.
 *
 * - Single URL input (no platform selector)
 * - Auto-detects platform from URL
 * - Uses /api/artist-videos for CRUD operations
 * - Optimistic local state updates
 */
export function VideoLinksManager({
  artistId,
  initialVideos,
  maxVideos = 6,
}: VideoLinksManagerProps) {
  const [videos, setVideos] = useState<VideoData[]>(initialVideos);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state when initialVideos changes
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  async function handleAddVideo() {
  setError(null);
  setSuccess(false);

    if (!url.trim()) {
      setError("Por favor, ingresa una URL válida.");
      return;
    }

    // Check limit before API call
    if (videos.length >= maxVideos) {
      setError(`Máximo ${maxVideos} videos permitidos.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/artist-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, artistId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al agregar el video.");
      } else {
        if (data.video) {
          setVideos((prev) => [...prev, data.video]);
        }
        setSuccess(true);
        setUrl("");
      }
    } catch {
      setError("Error de conexión. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteVideo(id: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar este video?")) {
      return;
    }

    const previousVideos = [...videos];
    setVideos((prev) => prev.filter((v) => v.id !== id));
    setDeletingId(id);

    try {
      const res = await fetch(`/api/artist-videos?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al eliminar el video.");
        setVideos(previousVideos); // Rollback
      }
    } catch {
      setError("Error de conexión al intentar eliminar el video.");
      setVideos(previousVideos); // Rollback
    } finally {
      setDeletingId(null);
    }
  }

 return (
  <div className="space-y-4">
    {/* Add video input */}
    <div className="flex gap-3">
      <input
        type="url"
        placeholder="Pega el enlace del video (YouTube, TikTok, Instagram, Facebook, Vimeo)"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError(null);
          setSuccess(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddVideo();
          }
        }}
        required
        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      />
      <button
        type="button"
        onClick={handleAddVideo}
        disabled={submitting}
        className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Procesando…" : "Agregar"}
      </button>
    </div>
      {/* Feedback messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Video agregado correctamente.
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Soportado: YouTube, TikTok, Instagram Reels, Facebook Videos/Reels, Vimeo. Máximo {maxVideos} videos.
      </p>

      {/* Videos grid */}
      {videos.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
          <p className="text-sm text-neutral-400">
            Aún no hay videos agregados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const platform = (video.platform?.toLowerCase() || "youtube") as VideoPlatform;
            const isVertical = isVerticalPlatform(platform);
            const embedUrl = video.embed_url;

            return (
              <div
                key={video.id}
                className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900"
              >
                {/* Aspect ratio container */}
                <div className={isVertical ? "aspect-[9/16]" : "aspect-video"}>
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={`Video - ${PLATFORM_LABELS[platform] || "Video"}`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400 text-sm">
                      Vista previa no disponible
                    </div>
                  )}
                </div>

                {/* Platform badge */}
                <div className="absolute left-2 top-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    {PLATFORM_LABELS[platform] || video.platform}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  disabled={deletingId === video.id}
                  className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === video.id ? "…" : "Eliminar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
