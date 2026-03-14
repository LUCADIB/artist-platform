import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabaseClient";
import { BookingRequestForm } from "../../../components/BookingRequestForm";
import ArtistVideos from "../../../components/ArtistVideos";

type ArtistPageParams = {
  params: {
    slug: string;
  };
};

interface ArtistWithCategory {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  category_id: string | null;
  whatsapp: string | null;
  categories: { name: string } | null;
}

export default async function ArtistProfilePage({ params }: ArtistPageParams) {
  const supabase = await createSupabaseServerClient();

  const { data: artistRaw } = await supabase
    .from("artists")
    .select(
      "id, name, slug, bio, avatar_url, city, category_id, whatsapp, categories ( name )"
    )
    .eq("slug", params.slug)
    .eq("status", "approved") // Only show approved artists publicly
    .maybeSingle();

  const artist = artistRaw as ArtistWithCategory | null;

  if (!artist) {
    notFound();
  }
  // TypeScript requires a non-null assertion after the notFound() guard
  const safeArtist = artist!;

  const { data: images } = await supabase
    .from("artist_images")
    .select("id, image_url")
    .eq("artist_id", safeArtist.id);



  const primaryImage =
    images && images.length > 0 ? images[0].image_url : safeArtist.avatar_url;

  // Use artist's WhatsApp for direct contact (not manager's)
  const artistWhatsapp = safeArtist.whatsapp;
  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría hablar sobre una reserva para ${safeArtist.name}.`
  );
  const whatsappHref = artistWhatsapp
    ? `https://wa.me/${artistWhatsapp.replace(/\D/g, "")}?text=${whatsappMessage}`
    : undefined;

  return (
    <div className="mx-auto flex min-w-0 flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      {/* Hero section */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center">
        <div className="w-full md:w-2/3">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 max-w-[520px]">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={safeArtist.name}
                className="w-full aspect-square object-cover object-top"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
                Sin imagen principal
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-1/3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
              Perfil de artista
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {safeArtist.name}
            </h1>
          </div>
          <div className="space-y-1 text-sm text-neutral-700">
            {safeArtist.categories?.name && (
              <p>
                <span className="font-medium">Categoría: </span>
                {safeArtist.categories.name}
              </p>
            )}
            {safeArtist.city && (
              <p>
                <span className="font-medium">Ciudad: </span>
                {safeArtist.city}
              </p>
            )}
          </div>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full sm:w-auto"
            >
              Contactar directamente
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-8">
          {/* Gallery */}
          {images && images.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
                Galería de fotos
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {images.map((image: any) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={artist.name}
                      className="h-32 w-full object-cover transition duration-300 hover:scale-105 md:h-40"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}          
          <ArtistVideos artistId={safeArtist.id} />

          {/* Description */}
          {safeArtist.bio && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
                Descripción
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700 sm:text-base">
                {safeArtist.bio}
              </p>
            </div>
          )}
        </div>

        {/* Booking form */}
        <div className="w-full lg:w-[360px] xl:w-[400px] lg:mt-[45px]">
          <BookingRequestForm
            artistId={safeArtist.id}
            artistName={safeArtist.name}
            artistWhatsapp={safeArtist.whatsapp}
          />
        </div>
      </section>
    </div>
  );
}

