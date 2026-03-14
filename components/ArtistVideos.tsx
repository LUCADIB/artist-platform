import { createSupabaseServerClient } from "../lib/supabaseClient";
import { isVerticalPlatform, type VideoPlatform } from "../lib/parseVideoUrl";

interface ArtistVideo {
  id: string;
  url: string | null;
  platform: string | null;
  embed_url: string | null;
  video_id: string | null;
}

interface ArtistVideosProps {
  artistId: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  vimeo: "Vimeo",
};

/**
 * Fallback embed URL generator for legacy records without embed_url.
 * Uses simple parsing to generate embed URL from the original url field.
 */
function generateFallbackEmbedUrl(videoUrl: string, platform: string | null): string | null {
  try {
    const url = new URL(videoUrl);
    const normalizedPlatform = (platform || "").toLowerCase();

    // YouTube
    if (normalizedPlatform === "youtube" || url.hostname.includes("youtube.com") || url.hostname === "youtu.be") {
      let videoId: string | null = null;
      if (url.hostname === "youtu.be") {
        videoId = url.pathname.slice(1).split("?")[0];
      } else if (url.pathname.startsWith("/embed/")) {
        videoId = url.pathname.replace("/embed/", "").split("/")[0];
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.replace("/shorts/", "").split("/")[0];
      } else {
        videoId = url.searchParams.get("v");
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // TikTok
    if (normalizedPlatform === "tiktok" || url.hostname.includes("tiktok.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const videoIndex = parts.indexOf("video");
      if (videoIndex !== -1 && parts[videoIndex + 1]) {
        return `https://www.tiktok.com/embed/v2/${parts[videoIndex + 1]}`;
      }
    }

    // Facebook
    if (normalizedPlatform === "facebook" || url.hostname.includes("facebook.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      // facebook.com/watch/?v=ID
      if (url.searchParams.has("v")) {
        return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${url.searchParams.get("v")}`;
      }
      // facebook.com/username/videos/ID
      const videosIndex = parts.indexOf("videos");
      if (videosIndex !== -1 && parts[videosIndex + 1]) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}`;
      }
      // facebook.com/reel/ID
      if (parts[0] === "reel" && parts[1]) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}`;
      }
    }

    // Instagram
    if (normalizedPlatform === "instagram" || url.hostname.includes("instagram.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "reel" || parts[0] === "reels") && parts[1]) {
        return `https://www.instagram.com/reel/${parts[1]}/embed`;
      }
    }

    // Vimeo
    if (normalizedPlatform === "vimeo" || url.hostname.includes("vimeo.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] && /^\d+$/.test(parts[0])) {
        return `https://player.vimeo.com/video/${parts[0]}`;
      }
    }
  } catch {
    // Silently fail for invalid URLs
  }

  return null;
}

export default async function ArtistVideos({ artistId }: ArtistVideosProps) {
  const supabase = await createSupabaseServerClient();

  const { data: videos } = await supabase
  
    .from("artist_videos")
  .select("id, url, platform, embed_url, video_id")
  .eq("artist_id", artistId)
  .order("created_at", { ascending: true });
    
   
  if (!videos || videos.length === 0) {
    return null;
  }

  // Process videos - use embed_url if available, otherwise fallback
  const embeddable = (videos as ArtistVideo[])
    .map((video) => {
      const platform = (video.platform?.toLowerCase() || "youtube") as VideoPlatform;
      const isVertical = isVerticalPlatform(platform);

      // Use embed_url directly if available
      let embedSrc = video.embed_url;

      // Fallback: generate from url if embed_url is null
      if (!embedSrc && video.url) {
        embedSrc = generateFallbackEmbedUrl(video.url, video.platform);
      }

      return {
        id: video.id,
        embedSrc,
        platform,
        isVertical,
      };
    })
    
    .filter((v) => v.embedSrc !== null);

  if (embeddable.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
        Videos
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {embeddable.map((video) => (
          <div
            key={video.id}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900"
          >
            <div
              className={`relative w-full ${
                video.isVertical ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              <iframe
                src={video.embedSrc!}
                title={`Video — ${PLATFORM_LABELS[video.platform] || "video"}`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
