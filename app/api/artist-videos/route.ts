import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/serviceClient";

/**
 * API Route for managing artist videos.
 * Handles adding and deleting videos from the artist_videos table.
 */

export async function POST(req: NextRequest) {
  try {
    const { artistId, url, platform } = await req.json();

    // Validation
    if (!artistId || !url || !platform) {
      return NextResponse.json(
        { error: "artistId, url and platform are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Insert the video record
    const { data, error } = await supabase
      .from("artist_videos")
      .insert([
        {
          artist_id: artistId,
          url,
          platform,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Delete the video record
    const { error } = await supabase
      .from("artist_videos")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
