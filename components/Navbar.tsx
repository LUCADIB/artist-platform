import Link from "next/link";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "../lib/supabaseClient";

/**
 * Navbar Component
 * 
 * - Auth-aware: Shows "Mi cuenta" if user is logged in, "Login" otherwise
 * - Responsive: Different layouts for mobile and desktop
 * - Hides on mobile login page for distraction-free auth flow
 */
export async function Navbar() {
  // Get current path to conditionally hide on mobile login
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "";

  // Check if we're on the login page
  const isLoginPage = currentPath.startsWith("/login");

  // Get session for auth-aware rendering
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Determine auth link
  const authHref = user ? "/dashboard/artist" : "/login";
  const authLabel = user ? "Mi cuenta" : "Login";

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-white/80 backdrop-blur ${isLoginPage ? "hidden md:block" : ""
        }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* LEFT: Agencia + Contacto */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Agencia
            </span>
          </Link>

          {/* Desktop Left Nav: Contacto */}
          <nav className="hidden items-center gap-5 text-sm text-neutral-700 md:flex">
            <Link
              href="/contact"
              className="transition hover:text-primary-600"
            >
              Contacto
            </Link>
          </nav>
        </div>

        {/* RIGHT: Artistas + Registrarse + Login/Mi cuenta */}
        <div className="flex items-center gap-2">
          {/* Desktop Right Nav */}
          <nav className="hidden items-center gap-5 text-sm text-neutral-700 md:flex">
            <Link
              href="/artists"
              className="transition hover:text-primary-600"
            >
              Artistas
            </Link>
            <Link
              href="/register/artist"
              className="transition hover:text-primary-600"
            >
              Registrarse
            </Link>
            <Link
              href={authHref}
              className="transition hover:text-primary-600"
            >
              {authLabel}
            </Link>
          </nav>

          {/* Mobile Nav */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/contact"
              className="text-xs font-medium text-neutral-700 transition hover:text-primary-600"
            >
              Contacto
            </Link>
            <Link
              href="/register/artist"
              className="text-xs font-medium text-neutral-700 transition hover:text-primary-600"
            >
              Regístrate
            </Link>
            <Link
              href={authHref}
              className="text-xs font-medium text-neutral-700 transition hover:text-primary-600"
            >
              {authLabel}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
