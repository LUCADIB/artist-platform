/**
 * Server-side video URL parser.
 * Sanitizes, normalizes, resolves redirects, and extracts video metadata.
 */

export type VideoPlatform = "youtube" | "tiktok" | "facebook" | "instagram" | "vimeo";

export interface ParsedVideo {
  platform: VideoPlatform;
  embedUrl: string;
  videoId: string;
  normalizedUrl: string;
}

export class VideoParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoParseError";
  }
}

/**
 * Resolves short URLs by following redirects.
 * Returns the final URL after all redirects.
 */
async function resolveRedirects(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return res.url || url;
  } catch {
    // If resolution fails, return original URL
    return url;
  }
}

/**
 * Extracts YouTube video ID from various URL formats.
 */
function extractYouTubeId(url: URL): string | null {
  // youtube.com/watch?v=VIDEO_ID
  if (url.searchParams.has("v")) {
    return url.searchParams.get("v");
  }

  // youtube.com/embed/VIDEO_ID
  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.replace("/embed/", "").split("/")[0] || null;
  }

  // youtu.be/VIDEO_ID
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("?")[0] || null;
  }

  // youtube.com/shorts/VIDEO_ID
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.replace("/shorts/", "").split("/")[0] || null;
  }

  return null;
}

/**
 * Extracts TikTok video ID from URL.
 */
function extractTikTokId(url: URL): string | null {
  // tiktok.com/@username/video/VIDEO_ID
  const parts = url.pathname.split("/").filter(Boolean);
  const videoIndex = parts.indexOf("video");
  if (videoIndex !== -1 && parts[videoIndex + 1]) {
    return parts[videoIndex + 1];
  }

  // vm.tiktok.com/SHORT_ID (redirects to full URL)
  return null;
}

/**
 * Extracts Facebook video ID from URL.
 */
function extractFacebookId(url: URL): string | null {
  // facebook.com/watch/?v=VIDEO_ID
  if (url.searchParams.has("v")) {
    return url.searchParams.get("v");
  }

  // facebook.com/username/videos/VIDEO_ID
  const parts = url.pathname.split("/").filter(Boolean);
  const videosIndex = parts.indexOf("videos");
  if (videosIndex !== -1 && parts[videosIndex + 1]) {
    return parts[videosIndex + 1];
  }

  // facebook.com/reel/VIDEO_ID
  if (parts[0] === "reel" && parts[1]) {
    return parts[1];
  }

  return null;
}

/**
 * Extracts Instagram Reel ID from URL.
 */
function extractInstagramId(url: URL): string | null {
  // instagram.com/reel/REEL_ID
  const parts = url.pathname.split("/").filter(Boolean);
  if ((parts[0] === "reel" || parts[0] === "reels") && parts[1]) {
    return parts[1];
  }

  return null;
}

/**
 * Extracts Vimeo video ID from URL.
 */
function extractVimeoId(url: URL): string | null {
  // vimeo.com/VIDEO_ID
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] && /^\d+$/.test(parts[0])) {
    return parts[0];
  }

  return null;
}

/**
 * Generates embed URL based on platform and video ID.
 */
function generateEmbedUrl(platform: VideoPlatform, videoId: string): string {
  switch (platform) {
    case "youtube":
      return `https://www.youtube.com/embed/${videoId}`;
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${videoId}`;
    case "instagram":
      return `https://www.instagram.com/reel/${videoId}/embed`;
    case "vimeo":
      return `https://player.vimeo.com/video/${videoId}`;
    default:
      throw new VideoParseError(`Unsupported platform: ${platform}`);
  }
}

/**
 * Detects platform from URL hostname.
 */
function detectPlatform(hostname: string): VideoPlatform | null {
  const normalized = hostname.toLowerCase().replace("www.", "");

  if (normalized === "youtube.com" || normalized === "youtu.be" || normalized === "m.youtube.com") {
    return "youtube";
  }
  if (normalized === "tiktok.com" || normalized === "vm.tiktok.com" || normalized === "m.tiktok.com") {
    return "tiktok";
  }
  if (normalized === "facebook.com" || normalized === "fb.watch" || normalized === "m.facebook.com") {
    return "facebook";
  }
  if (normalized === "instagram.com" || normalized === "instagr.am" || normalized === "m.instagram.com") {
    return "instagram";
  }
  if (normalized === "vimeo.com") {
    return "vimeo";
  }

  return null;
}

/**
 * Main function: parses a video URL and returns structured data.
 *
 * @param rawUrl - The raw video URL from user input
 * @returns ParsedVideo with platform, embedUrl, videoId, and normalizedUrl
 * @throws VideoParseError if URL is invalid or platform is unsupported
 */
export async function parseVideoUrl(rawUrl: string): Promise<ParsedVideo> {
  // Sanitize input
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new VideoParseError("La URL está vacía.");
  }

  // Add protocol if missing
  let urlStr = trimmed;
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    urlStr = "https://" + urlStr;
  }

  // Resolve short URLs (e.g., youtu.be, vm.tiktok.com, fb.watch)
  const resolvedUrl = await resolveRedirects(urlStr);

  // Parse URL
  let url: URL;
  try {
    url = new URL(resolvedUrl);
  } catch {
    throw new VideoParseError("La URL no tiene un formato válido.");
  }

  // Detect platform
  const platform = detectPlatform(url.hostname);
  if (!platform) {
    throw new VideoParseError(
      "Plataforma no soportada. Usa YouTube, TikTok, Facebook, Instagram o Vimeo."
    );
  }

  // Extract video ID
  let videoId: string | null = null;

  switch (platform) {
    case "youtube":
      videoId = extractYouTubeId(url);
      break;
    case "tiktok":
      videoId = extractTikTokId(url);
      break;
    case "facebook":
      videoId = extractFacebookId(url);
      break;
    case "instagram":
      videoId = extractInstagramId(url);
      break;
    case "vimeo":
      videoId = extractVimeoId(url);
      break;
  }

  if (!videoId) {
    throw new VideoParseError(
      "No se pudo extraer el ID del video. Verifica que la URL sea correcta."
    );
  }

  // Generate embed URL
  const embedUrl = generateEmbedUrl(platform, videoId);

  // Generate normalized URL for storage
  const normalizedUrl = url.toString();

  return {
    platform,
    embedUrl,
    videoId,
    normalizedUrl,
  };
}

/**
 * Determines if a platform uses vertical (portrait) aspect ratio.
 * TikTok and Instagram Reels are typically 9:16.
 */
export function isVerticalPlatform(platform: VideoPlatform): boolean {
  return platform === "tiktok" || platform === "instagram";
}
