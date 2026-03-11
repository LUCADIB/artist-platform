import "./globals.css";
import type { ReactNode } from "react";
import { Navbar } from "../components/Navbar";

export const metadata = {
  title: "Plataforma de Artistas",
  description: "Marketplace de reservas para artistas"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-white">
            <div className="mx-auto flex max-w-6xl justify-between px-4 py-6 text-xs text-neutral-500">
              <span>© {new Date().getFullYear()} Agencia de Artistas</span>
              <span>Hecho con Next.js, Supabase y Tailwind CSS</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
