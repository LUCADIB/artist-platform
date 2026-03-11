import Link from "next/link";

interface ArtistCardProps {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  categoryName?: string | null;
  avatarUrl?: string | null;
}

export function ArtistCard({
  slug,
  name,
  city,
  categoryName,
  avatarUrl
}: ArtistCardProps) {
  const href = slug ? `/artist/${slug}` : "#";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-400">
            Sin foto
          </div>
        )}
        {categoryName && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white">
            {categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold leading-snug tracking-tight text-neutral-900">
              {name}
            </h3>
            {city && (
              <p className="mt-1 text-xs text-neutral-500">
                {city}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Link
            href={href}
            className="btn-primary w-full justify-center text-xs"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}