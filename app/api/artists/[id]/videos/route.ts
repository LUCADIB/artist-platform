import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("artist_videos")
    .select("id, url, platform")
    .eq("artist_id", id)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { videos } = body as { videos: { url: string; platform: string }[] };

  if (!Array.isArray(videos)) {
    return NextResponse.json({ error: "videos must be an array" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Delete existing videos for this artist
  const { error: deleteError } = await supabase
    .from("artist_videos")
    .delete()
    .eq("artist_id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new videos (if any)
  if (videos.length > 0) {
    const rows = videos
      .filter((v) => v.url.trim() !== "")
      .map((v) => ({ artist_id: id, url: v.url.trim(), platform: v.platform }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("artist_videos")
        .insert(rows);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
