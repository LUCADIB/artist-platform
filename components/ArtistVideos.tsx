import { createSupabaseServerClient } from "../lib/supabaseClient";

interface ArtistVideo {
  id: string;
  url: string;
  platform: string | null;
}

interface ArtistVideosProps {
  artistId: string;
}

/**
 * Converts a raw watch / share URL into an embeddable iframe src.
 * Supports YouTube, Vimeo and TikTok.
 */
function toEmbedUrl(videoUrl: string, platform: string | null): string | null {
  const normalizedPlatform = (platform ?? "").toLowerCase().trim();

  try {
    // YouTube
    if (
      normalizedPlatform === "youtube" ||
      videoUrl.includes("youtube.com") ||
      videoUrl.includes("youtu.be")
    ) {
      let videoId: string | null = null;

      const urlObj = new URL(videoUrl);
      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1).split("?")[0];
      } else {
        videoId = urlObj.searchParams.get("v");
      }

      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (normalizedPlatform === "vimeo" || videoUrl.includes("vimeo.com")) {
      const urlObj = new URL(videoUrl);
      const videoId = urlObj.pathname.split("/").filter(Boolean).pop();
      if (!videoId) return null;
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // TikTok
    if (normalizedPlatform === "tiktok" || videoUrl.includes("tiktok.com")) {
      const urlObj = new URL(videoUrl);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      const videoIndex = parts.indexOf("video");
      const videoId = videoIndex !== -1 ? parts[videoIndex + 1] : null;
      if (!videoId) return null;
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
  } catch {}

  return null;
}

export default async function ArtistVideos({ artistId }: ArtistVideosProps) {
  const supabase = await createSupabaseServerClient();

  const { data: videos } = await supabase
    .from("artist_videos")
    .select("id, url, platform")
    .eq("artist_id", Number(artistId));

  const embeddable = (videos as ArtistVideo[] | null)
    ?.map((video) => ({
      id: video.id,
      embedSrc: toEmbedUrl(video.url, video.platform),
      platform: video.platform,
    }))
    .filter((v) => v.embedSrc !== null) ?? [];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
        Videos
      </h2>

      {embeddable.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          Aún no has agregado videos. Puedes agregar enlaces de YouTube, Vimeo o TikTok para mostrar tu trabajo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {embeddable.map((video) => (
            <div
              key={video.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900"
            >
              <div
                className={`relative w-full ${
                  video.platform?.toLowerCase() === "tiktok"
                    ? "aspect-[9/16]"
                    : "aspect-video"
                }`}
              >
                <iframe
                  src={video.embedSrc!}
                  title={`Video — ${video.platform ?? "video"}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}