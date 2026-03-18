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
    <section className="relative overflow-hidden bg-black pb-[1px]">

      {/* GLOW BACKGROUND */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 blur-[180px]" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-28 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] md:gap-14 md:pt-24 md:pb-36 lg:px-8 lg:pt-28 lg:pb-44">

        {/* TEXT SIDE */}
        <div className="space-y-7">

          {/* LOGO */}
          <img
            src="https://xvrzlrgzcamromyxawiz.supabase.co/storage/v1/object/public/artists/Logo%201000%20tr.png"
            alt="1000Artistas"
            className="w-[180px] md:w-[220px] opacity-90"
          />

          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-blue-400">
            Marketplace artístico
          </p>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Encuentra artistas increíbles para eventos inolvidables
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-neutral-300">
            Descubre DJs, bandas, performers y shows cuidadosamente seleccionados.
            Reserva fácilmente y conecta con talento que hará destacar tu evento.
          </p>

        </div>

        {/* SEARCH CARD */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Encuentra el artista ideal
            </h2>

            <p className="text-xs text-neutral-300">
              Busca por nombre o categoría y comienza a explorar.
            </p>
          </div>

          <div
            className="
    [&_input]:text-neutral-900
    [&_input::placeholder]:text-neutral-400
    [&_label]:text-neutral-200
    [&_button]:bg-white
    [&_button]:text-black
    [&_button]:font-semibold
    [&_button]:shadow-lg
    [&_button:hover]:bg-neutral-200
  "
          >
            <SearchBar
              categories={categories}
              initialQuery={initialQuery}
              initialCategoryId={initialCategoryId}
            />
          </div>

        </div>

      </div>

      {/* WAVE DIVIDER */}
      <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0] rotate-180">
        <svg
          className="relative block w-[140%] h-[120px] -ml-[20%]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39 56.44C214.69 98.06 105.46 111.69 0 96V0h1200v27.35c-94.39 34.29-206.79 56.91-321.39 56.44-144.11-.6-260.73-45.89-383.17-44.21-121.73 1.67-219.11 48.77-274.05 60.86z"
            className="fill-neutral-50"
          />
        </svg>
      </div>

    </section>
  );
}