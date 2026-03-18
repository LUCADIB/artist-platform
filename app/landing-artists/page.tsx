"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingArtists() {
  return (
    <div className="bg-black text-white overflow-hidden">

      {/* HERO IMAGE */}
      <section className="relative w-full h-[75vh] md:h-[90vh]">

        {/* IMAGE */}
        <img
          src="/images/img-hero.jpg"
          className="absolute w-full h-full object-cover"
        />

        {/* OVERLAY CINEMATIC */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">

          {/* LOGO */}
          <motion.img
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            src="https://xvrzlrgzcamromyxawiz.supabase.co/storage/v1/object/public/artists/Logo%201000%20tr.png"
            alt="1000Artistas"
            className="w-[220px] md:w-[320px] mb-10 opacity-90"
          />

          {/* TITLE */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold leading-tight max-w-5xl"
          >
            Donde el talento se convierte en oportunidades reales
          </motion.h1>

          {/* SUBTITLE */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl"
          >
            Únete al marketplace-agencia donde los artistas se posicionan,
            destacan y consiguen contrataciones constantemente.
          </motion.p>

          {/* CTA */}
          <Link
            href="/register/artist"
            className="mt-12 bg-blue-600 hover:bg-blue-700 px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/40 hover:scale-105 transition"
          >
            Crear mi perfil ahora
          </Link>

        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-28 px-6 max-w-6xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-bold text-center max-w-3xl mx-auto">
          No es solo visibilidad. Es posicionamiento artístico real.
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-20">

          {[
            "Perfil profesional optimizado para destacar",
            "Mayor exposición frente a clientes reales",
            "Sistema de destacados premium dentro del marketplace",
            "Gestión tipo agencia para oportunidades estratégicas",
            "Incremento de solicitudes y contrataciones",
            "Presencia digital moderna y competitiva"
          ].map((text, i) => (
            <motion.div
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 50 }}
              transition={{ delay: i * 0.08 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl hover:border-blue-500 hover:-translate-y-1 transition"
            >
              {text}
            </motion.div>
          ))}

        </div>

      </section>

      {/* VIDEO DEMO SECTION */}
      <section className="py-28">

        <div className="text-center mb-14 px-6">
          <h2 className="text-3xl md:text-5xl font-bold">
            Así se verá tu perfil dentro de la plataforma
          </h2>

          <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg">
            Miles de clientes explorarán artistas en una galería moderna,
            visual e impactante diseñada para generar oportunidades reales.
          </p>
        </div>

        {/* DESKTOP VIDEO */}
        <div className="hidden md:flex justify-center px-6">
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/video-destok.mp4"
            />
          </div>
        </div>

        {/* MOBILE VIDEO */}
        <div className="md:hidden w-full">
          <div className="relative w-full aspect-[3/4] overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/video-mobile.mp4"
            />
          </div>
        </div>

      </section>

      {/* DESTACADOS */}
      <section className="py-28 px-6">

        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl px-8 py-14 md:p-16 text-center shadow-2xl">

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Destaca tu talento dentro de la plataforma
          </h2>

          <p className="mt-6 text-blue-100 text-lg md:text-xl">
            Los perfiles destacados reciben más visibilidad, más clics
            y muchas más oportunidades de contratación.
          </p>

        </div>

      </section>

      {/* FUTURO */}
      <section className="py-28 px-6 text-center max-w-4xl mx-auto">

        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Estamos construyendo la red artística más potente de Latinoamérica
        </h2>

        <p className="mt-6 text-gray-400 text-lg">
          Posiciónate desde hoy, construye reputación digital y crece junto a 1000Artistas.
        </p>

        <Link
          href="/register/artist"
          className="inline-block mt-14 bg-white text-black px-14 py-6 rounded-2xl font-bold text-xl hover:scale-105 transition"
        >
          Unirme como artista
        </Link>

      </section>

    </div>
  );
}