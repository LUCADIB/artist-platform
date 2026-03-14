"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ArtistVideo {
  id: string;
  url: string;
  platform: string;
}

interface ArtistVideosManagerProps {
  artistId: string;
  initialVideos: ArtistVideo[];
}

/**
 * ArtistVideosManager component allows artists to manage their videos.
 * They can add new videos from YouTube, Vimeo, or TikTok and delete existing ones.
 *
 * Spanish UI for the artist dashboard.
 */
export default function ArtistVideosManager({
  artistId,
  initialVideos,
}: ArtistVideosManagerProps) {
  const router = useRouter();

  const [videos, setVideos] = useState<ArtistVideo[]>(initialVideos);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state when initialVideos changes (after router.refresh())
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  /**
   * Validates if the URL is from the selected platform.
   */
  function validateUrl(url: string, platform: string): boolean {
    const normalizedUrl = url.toLowerCase();
    const normalizedPlatform = platform.toLowerCase();

    if (normalizedPlatform === "youtube") {
      return (
        normalizedUrl.includes("youtube.com") ||
        normalizedUrl.includes("youtu.be")
      );
    }
    if (normalizedPlatform === "vimeo") {
      return normalizedUrl.includes("vimeo.com");
    }
    if (normalizedPlatform === "tiktok") {
      return normalizedUrl.includes("tiktok.com");
    }
    return false;
  }

  /**
   * Handles adding a new video.
   * Implements optimistic update.
   */
  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!url.trim()) {
      setError("Por favor, ingresa una URL válida.");
      return;
    }

    if (!validateUrl(url, platform)) {
      setError(`La URL no parece ser de ${platform}.`);
      return;
    }

    // Check for duplicate URL
    if (videos.some((v) => v.url === url)) {
      setError("Este video ya ha sido agregado.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/artist-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: Number(artistId),
          url,
          platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al agregar el video.");
      } else {
        if (data.video) {
          // Optimistic update
          setVideos((prev) => [...prev, data.video]);
        }
        setSuccess(true);
        setUrl("");
        // Refresh the page data
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Handles deleting a video.
   * Confirms before deleting.
   */
  async function handleDeleteVideo(id: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar este video?")) {
      return;
    }

    // Optimistic delete
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
      } else {
        router.refresh();
      }
    } catch {
      setError("Error de conexión al intentar eliminar el video.");
      setVideos(previousVideos); // Rollback
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add video form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-neutral-800">
          Agregar nuevo video
        </h3>
        <form onSubmit={handleAddVideo} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Platform selection */}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Plataforma
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                <option value="YouTube">YouTube</option>
                <option value="Vimeo">Vimeo</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            {/* URL Input */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                URL del video
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
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

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Agregar video"}
          </button>
        </form>
      </div>

      {/* Videos list */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-800">
          Tus videos
        </h3>

        {videos.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
            <p className="text-sm text-neutral-400">
              Aún no has agregado videos.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Plataforma
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      URL
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                          {video.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <div className="max-w-xs truncate md:max-w-md">
                          {video.url}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          disabled={deletingId === video.id}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === video.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
