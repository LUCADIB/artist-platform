"use client";

import { VideoLinksManager, type VideoData } from "./VideoLinksManager";

interface ArtistVideosManagerProps {
  artistId: string;
  initialVideos: VideoData[];
  artistImageUrl?: string | null;
}

/**
 * Artist dashboard video manager.
 * Wraps the shared VideoLinksManager component.
 */
export default function ArtistVideosManager({
  artistId,
  initialVideos,
  artistImageUrl,
}: ArtistVideosManagerProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-neutral-800">
          Agregar video
        </h3>
        <VideoLinksManager
          artistId={artistId}
          initialVideos={initialVideos}
          artistImageUrl={artistImageUrl}
        />
      </div>
    </div>
  );
}
