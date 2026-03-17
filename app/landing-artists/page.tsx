"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingArtists() {
  return (
    <div className="bg-black text-white overflow-hidden">

      {/* HERO VIDEO */}
      <section className="relative w-full h-[70vh] md:h-[85vh]">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover"
          src="/videos/hero.mp4"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-bold leading-tight max-w-5xl"
          >
            Convierte tu talento en oportunidades reales
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl"
          >
            Forma parte del marketplace-agencia donde los artistas se posicionan,
            destacan y consiguen contrataciones.
          </motion.p>

          <Link
            href="/register/artist"
            className="mt-10 bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-blue-600/40 transition"
          >
            Quiero ser estar en 1000Artistas
          </Link>

        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center">
          No es solo una página. Es posicionamiento artístico.
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          {[
            "Perfil profesional optimizado",
            "Mayor visibilidad frente a clientes",
            "Sistema de destacados premium",
            "Gestión tipo agencia",
            "Más oportunidades de contratación",
            "Presencia digital de alto nivel"
          ].map((text, i) => (
            <motion.div
              key={i}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 40 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl hover:border-blue-500 transition"
            >
              {text}
            </motion.div>
          ))}

        </div>
      </section>

      {/* DESTACADOS */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl px-6 py-12 md:p-14 text-center shadow-2xl">

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Destaca tu talento. Destaca tu perfil.
          </h2>

          <p className="mt-6 text-blue-100 text-lg md:text-xl">
            Los artistas destacados obtienen mucha más visibilidad,
            más clics y más solicitudes dentro de la plataforma.
          </p>

        </div>
      </section>

      {/* FUTURO */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">

        <h2 className="text-4xl md:text-5xl font-bold">
          Estamos construyendo la plataforma artística más potente de LATAM
        </h2>

        <p className="mt-6 text-gray-400 text-lg">
          Posiciónate desde ahora, construye reputación y crece junto a 1000Artistas.com
        </p>

        <Link
          href="/register/artist"
          className="inline-block mt-12 bg-white text-black px-12 py-5 rounded-xl font-bold text-xl hover:scale-105 transition"
        >
          Crear mi perfil ahora
        </Link>

      </section>

    </div>
  );
}