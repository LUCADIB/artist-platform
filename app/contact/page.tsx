"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function ContactPage() {

  const whatsappMessage = encodeURIComponent(
    "Hola QuitoShows 👋 quiero información para destacar mi perfil o trabajar con ustedes como agencia artística."
  );

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
            Impulsa tu carrera artística con QuitoShows
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl"
          >
            Posiciona tu perfil, aumenta tu visibilidad y accede a oportunidades reales de contratación.
          </motion.p>

        </div>
      </section>

      {/* DOS CAMINOS */}
      <section className="py-24 px-6 max-w-6xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-bold text-center">
          Dos caminos para impulsar tu carrera artística
        </h2>

        <div className="grid md:grid-cols-2 gap-10 mt-16">

          {/* DESTACAR */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 40 }}
            className="bg-neutral-900 border border-neutral-800 p-10 rounded-3xl hover:border-blue-500 transition"
          >
            <h3 className="text-3xl font-bold">⭐ Destacar tu perfil</h3>

            <p className="mt-6 text-gray-400 text-lg">
              Aparece primero en búsquedas, aumenta los clics en tu perfil y recibe más solicitudes de booking dentro de la plataforma.
            </p>

            <ul className="mt-8 space-y-3 text-gray-300">
              <li>✔ Mayor visibilidad</li>
              <li>✔ Posición estratégica</li>
              <li>✔ Más oportunidades</li>
              <li>✔ Impacto profesional</li>
            </ul>

          </motion.div>

          {/* AGENCIA */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 40 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 rounded-3xl shadow-2xl"
          >
            <h3 className="text-3xl font-bold">🚀 Trabajar con QuitoShows como agencia</h3>

            <p className="mt-6 text-blue-100 text-lg">
              Recibe apoyo estratégico para mejorar tu perfil, tu imagen profesional y acceder a nuevas oportunidades de eventos.
            </p>

            <ul className="mt-8 space-y-3 text-blue-100">
              <li>✔ Orientación profesional</li>
              <li>✔ Optimización de contenido</li>
              <li>✔ Búsqueda activa de contrataciones</li>
              <li>✔ Representación digital</li>
            </ul>

          </motion.div>

        </div>

      </section>

      {/* COMBINAR */}
      <section className="py-24 px-6">

        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl px-6 py-12 md:p-14 text-center shadow-2xl">

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Combinar ambos caminos acelera tu crecimiento
          </h2>

          <p className="mt-6 text-blue-100 text-base md:text-xl leading-relaxed">
            Los artistas que destacan su perfil y reciben apoyo tipo agencia logran un posicionamiento mucho más fuerte dentro del mercado.
          </p>

        </div>

      </section>

      {/* URGENCIA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">

        <h2 className="text-4xl md:text-5xl font-bold">
          Los espacios destacados y de acompañamiento estratégico son limitados
        </h2>

        <p className="mt-6 text-gray-400 text-lg">
          Esto permite garantizar impacto real, posicionamiento efectivo y oportunidades auténticas.
        </p>

        <a
          href={`https://wa.me/593963737070?text=${whatsappMessage}`}
          target="_blank"
          className="inline-block mt-12 bg-green-500 hover:bg-green-600 px-12 py-5 rounded-xl font-bold text-xl shadow-2xl shadow-green-500/40 transition"
        >
          Quiero destacar o trabajar con la agencia
        </a>

      </section>

    </div>
  );
}