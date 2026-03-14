import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { ArtistProfileForm } from "../../../../components/ArtistProfileForm";
import type { VideoData } from "../../../../components/VideoLinksManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ArtistWithCategory {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  whatsapp: string | null;
  category_id: string | null;
  status: string;
  rejection_reason: string | null;
  categories: { id: string; name: string } | null;
}

export default async function ArtistProfilePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch the artist record associated with this user
  const { data: artistRaw } = await supabase
    .from("artists")
    .select(
      "id, name, slug, bio, avatar_url, city, whatsapp, category_id, status, rejection_reason, categories ( id, name )"
    )
    .eq("profile_id", session.user.id)
    .maybeSingle();

  const artist = artistRaw as ArtistWithCategory | null;

  // Fetch all categories for the dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  // Fetch artist videos if artist exists
  let artistVideos: VideoData[] = [];
  if (artist) {
    const { data: videos } = await supabase
      .from("artist_videos")
      .select("id, url, platform, embed_url, video_id")
      .eq("artist_id", Number(artist.id))
      .order("created_at", { ascending: true });
    artistVideos = (videos ?? []) as VideoData[];
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Mi perfil
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestiona tu información pública como artista.
        </p>
      </div>
      
      {/* Status Banner */}
      {artist && (
        <StatusBanner
          status={artist.status}
          rejectionReason={artist.rejection_reason}
        />
      )}

      {/* Profile Form */}
      {artist ? (
  <>
    <ArtistProfileForm
      artist={artist}
      categories={categories ?? []}
      initialVideos={artistVideos}
    />
  </>
) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-700">
            No tienes un perfil de artista asociado a tu cuenta. Si acabas de
            registrarte, contacta al administrador.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Displays the current approval status with appropriate styling.
 */
function StatusBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason: string | null;
}) {
  const statusConfig: Record<
    string,
    { bg: string; border: string; text: string; icon: React.ReactNode; label: string }
  > = {
    pending_review: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      label: "En revisión",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    approved: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      label: "Aprobado",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    rejected: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      label: "Rechazado",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    draft: {
      bg: "bg-neutral-50",
      border: "border-neutral-200",
      text: "text-neutral-700",
      label: "Borrador",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    suspended: {
      bg: "bg-neutral-100",
      border: "border-neutral-300",
      text: "text-neutral-700",
      label: "Suspendido",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <div className={`mb-6 rounded-xl border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={config.text}>{config.icon}</span>
        <div>
          <p className={`font-medium ${config.text}`}>
            Estado: {config.label}
          </p>
          {status === "pending_review" && (
            <p className="mt-1 text-sm text-neutral-600">
              Tu perfil está siendo revisado por el administrador. Te
              notificaremos cuando sea aprobado.
            </p>
          )}
          {status === "approved" && (
            <p className="mt-1 text-sm text-neutral-600">
              Tu perfil está visible públicamente en la plataforma.
            </p>
          )}
          {status === "rejected" && rejectionReason && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700">
                Motivo del rechazo:
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {rejectionReason}
              </p>
            </div>
          )}
          {status === "suspended" && (
            <p className="mt-1 text-sm text-neutral-600">
              Tu perfil ha sido suspendido. Contacta al administrador para más
              información.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
