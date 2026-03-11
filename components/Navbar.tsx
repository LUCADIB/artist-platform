import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-primary-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Agencia
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            Artistas
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-6 text-sm text-neutral-700 md:flex">
          <Link
            href="/artists"
            className="transition hover:text-primary-600"
          >
            Artistas
          </Link>

          <Link
            href="/contact"
            className="transition hover:text-primary-600"
          >
            Contacto
          </Link>

          <Link
            href="/login"
            className="transition hover:text-primary-600"
          >
            Login manager
          </Link>

          <Link
            href="https://wa.me/593993737070"
            target="_blank"
            className="btn-primary ml-2 whitespace-nowrap px-4 py-2 text-sm"
          >
            Contactar manager
          </Link>
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="text-xs font-medium text-neutral-700 hover:text-primary-600"
          >
            Login
          </Link>

          <Link
            href="https://wa.me/593993737070"
            target="_blank"
            className="btn-primary whitespace-nowrap px-3 py-1.5 text-[11px]"
          >
            Contactar
          </Link>
        </div>
      </div>
    </header>
  );
}
