import { SearchBar } from "./SearchBar";

type Category = {
  id: string;
  name: string;
};

interface HeroSectionProps {
  categories: Category[];
  initialQuery?: string;
  initialCategoryId?: string;
}

export function HeroSection({
  categories,
  initialQuery,
  initialCategoryId
}: HeroSectionProps) {
  return (
    <section className="border-b bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] md:gap-10 md:py-14 lg:px-8 lg:py-16">
        <div className="space-y-4 sm:space-y-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-600 sm:text-[11px]">
            Marketplace de artistas
          </p>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-neutral-900 sm:text-3xl md:text-4xl lg:text-5xl">
            Encuentra artistas{" "}
            <span className="text-primary-600">increíbles</span> para tu
            próximo evento.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            Descubre bandas, DJs, shows y performers cuidadosamente
            seleccionados. Gestionamos las reservas y la comunicación para que
            solo tengas que disfrutar del show.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 sm:gap-3">
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
              Multiples artistas
            </span>
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
              Confirmación rápida
            </span>
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
              Pagos seguros
            </span>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-md backdrop-blur sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Encuentra el artista ideal
              </h2>
              <p className="text-xs text-neutral-500">
                Filtra por nombre y categoría para empezar.
              </p>
            </div>
          </div>

          <SearchBar
            categories={categories}
            initialQuery={initialQuery}
            initialCategoryId={initialCategoryId}
          />
        </div>
      </div>
    </section>
  );
}

