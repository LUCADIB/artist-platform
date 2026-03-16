import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getServiceClient } from "@/lib/serviceClient";
import { parseVideoUrl, VideoParseError } from "@/lib/parseVideoUrl";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_VIDEOS_PER_ARTIST = 6;

/**
 * GET /api/artist-videos?artistId=xxx
 * Fetches videos for a specific artist.
 * Used by manager dashboard to load videos for editing.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("artistId");

  if (!artistId) {
    return NextResponse.json(
      { error: "artistId es requerido." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({});

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set(name, "", options);
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "No autenticado." },
      { status: 401 }
    );
  }

  const serviceClient = getServiceClient();

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role;
  const isManager = role === "manager" || role === "admin";

  if (!isManager) {
    const { data: artist } = await serviceClient
      .from("artists")
      .select("id")
      .eq("profile_id", session.user.id)
      .maybeSingle();

    if (!artist || String(artist.id) !== artistId) {
      return NextResponse.json(
        { error: "No tienes permiso." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await serviceClient
    .from("artist_videos")
    .select("id, url, platform, embed_url, video_id")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Error al obtener videos." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/artist-videos
 * Adds a new video for an artist.
 *
 * Request body: { url: string, artistId?: string }
 * - URL is automatically parsed to detect platform and extract video ID
 * - Duplicates are prevented by video_id
 * - Maximum 6 videos per artist
 *
 * For artists: artistId is derived from session
 * For managers: artistId must be provided in body
 */
export async function POST(request: NextRequest) {
  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { url, artistId: providedArtistId } = body;

  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { error: "La URL del video es obligatoria." },
      { status: 400 }
    );
  }

  // Create response for cookie attachment
  const response = NextResponse.json({});

  // Create Supabase client with cookie handling
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set(name, "", options);
      },
    },
  });

  // Get authenticated user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "No autenticado. Por favor, inicia sesión." },
      { status: 401 }
    );
  }

  const serviceClient = getServiceClient();

  // Determine artistId with proper ownership validation
  let artistId: string;

  if (providedArtistId) {
    // First check: does this artist belong to the session user?
    const { data: ownedArtist } = await serviceClient
      .from("artists")
      .select("id")
      .eq("id", providedArtistId)
      .eq("profile_id", session.user.id)
      .maybeSingle();

    if (ownedArtist) {
      // User owns this artist - allow
      artistId = providedArtistId;
    } else {
      // User doesn't own this artist - must be manager/admin
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const role = profile?.role;
      const isManager = role === "manager" || role === "admin";

      if (!isManager) {
        return NextResponse.json(
          { error: "No tienes permiso para agregar videos a otros artistas." },
          { status: 403 }
        );
      }

      artistId = providedArtistId;
    }
  } else {
    // Artist flow: get artist ID from profile
    const { data: artist } = await serviceClient
      .from("artists")
      .select("id")
      .eq("profile_id", session.user.id)
      .maybeSingle();

    if (!artist) {
      return NextResponse.json(
        { error: "No tienes un perfil de artista asociado." },
        { status: 403 }
      );
    }

    artistId = artist.id;
  }

  // Check video count limit
  const { count, error: countError } = await serviceClient
    .from("artist_videos")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", artistId);

  if (countError) {
    console.error("[ArtistVideos] Count error:", countError);
    return NextResponse.json(
      { error: "Error al verificar límite de videos." },
      { status: 500 }
    );
  }

  if ((count ?? 0) >= MAX_VIDEOS_PER_ARTIST) {
    return NextResponse.json(
      { error: `Máximo ${MAX_VIDEOS_PER_ARTIST} videos permitidos por artista.` },
      { status: 400 }
    );
  }

  // Parse video URL
  let parsed;
  try {
    parsed = await parseVideoUrl(url);
  } catch (error) {
    if (error instanceof VideoParseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error("[ArtistVideos] Parse error:", error);
    return NextResponse.json(
      { error: "Error al procesar la URL del video." },
      { status: 500 }
    );
  }

  // Check for duplicate video_id
  const { data: existing } = await serviceClient
    .from("artist_videos")
    .select("id")
    .eq("artist_id", artistId)
    .eq("video_id", parsed.videoId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Este video ya ha sido agregado anteriormente." },
      { status: 400 }
    );
  }

  // Insert video record
  const insertData: Record<string, unknown> = {
    artist_id: artistId,
    original_url: parsed.normalizedUrl,
    embed_url: parsed.embedUrl,
    platform: parsed.platform,
    video_id: parsed.videoId,
  };

  // Also store in legacy 'url' column if it exists (backward compatibility)
  insertData.url = parsed.normalizedUrl;

  const { data: inserted, error: insertError } = await serviceClient
    .from("artist_videos")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error("[ArtistVideos] Insert error:", insertError);
    return NextResponse.json(
      { error: "Error al guardar el video." },
      { status: 500 }
    );
  }

  // Build final response
  const finalResponse = NextResponse.json({
    success: true,
    video: inserted,
  });

  // Copy cookies from interim response
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}

/**
 * DELETE /api/artist-videos?id=xxx
 * Deletes a video by ID.
 * Artists can delete their own videos.
 * Managers/admins can delete any video.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID del video es requerido." },
      { status: 400 }
    );
  }

  // Create response for cookie attachment
  const response = NextResponse.json({});

  // Create Supabase client with cookie handling
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set(name, "", options);
      },
    },
  });

  // Get authenticated user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "No autenticado." },
      { status: 401 }
    );
  }

  const serviceClient = getServiceClient();

  // Check user role
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role;
  const isManager = role === "manager" || role === "admin";

  // Get video with artist info
  const { data: video } = await serviceClient
    .from("artist_videos")
    .select("id, artist_id, artists!inner(profile_id)")
    .eq("id", id)
    .maybeSingle();

  if (!video) {
    return NextResponse.json(
      { error: "Video no encontrado." },
      { status: 404 }
    );
  }

  // Check permission: artist owner or manager/admin
  const artistData = video.artists as unknown as { profile_id: string } | { profile_id: string }[];
  const profileId = Array.isArray(artistData) ? artistData[0]?.profile_id : artistData?.profile_id;

  if (!isManager && profileId !== session.user.id) {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar este video." },
      { status: 403 }
    );
  }

  // Delete the video
  const { error: deleteError } = await serviceClient
    .from("artist_videos")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("[ArtistVideos] Delete error:", deleteError);
    return NextResponse.json(
      { error: "Error al eliminar el video." },
      { status: 500 }
    );
  }

  // Build final response
  const finalResponse = NextResponse.json({ success: true });

  // Copy cookies
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return finalResponse;
}
