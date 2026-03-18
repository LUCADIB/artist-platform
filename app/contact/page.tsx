"use client";

import { motion } from "framer-motion";

export default function ContactPage() {

  const whatsappMessage = encodeURIComponent(
    "Hola 1000Artistas 👋 quiero información para destacar mi perfil o trabajar con ustedes como agencia artística."
  );

  return (
    <div className="bg-black text-white overflow-hidden">

      {/* HERO */}
      <section className="relative w-full h-[75vh] md:h-[90vh]">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover"
          src="/videos/hero.mp4"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />

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

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-bold leading-tight max-w-5xl"
          >
            Posiciona tu talento y consigue más contrataciones
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl"
          >
            En 1000Artistas puedes destacar tu perfil o trabajar con nosotros como agencia digital para acelerar tu crecimiento.
          </motion.p>

        </div>
      </section>

      {/* OPCIONES */}
      <section className="py-28 px-6 max-w-6xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-bold text-center max-w-3xl mx-auto">
          Dos formas estratégicas de impulsar tu carrera artística
        </h2>

        <div className="grid md:grid-cols-2 gap-12 mt-20">

          {/* DESTACAR */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 50 }}
            className="bg-neutral-900 border border-neutral-800 p-12 rounded-3xl hover:border-blue-500 hover:-translate-y-1 transition"
          >
            <h3 className="text-3xl font-bold">⭐ Destacar tu perfil</h3>

            <p className="mt-6 text-gray-400 text-lg">
              Aparece en posiciones privilegiadas dentro del marketplace,
              recibe más clics y aumenta significativamente tus solicitudes de booking.
            </p>

            <ul className="mt-8 space-y-3 text-gray-300">
              <li>✔ Mayor visibilidad dentro de la plataforma</li>
              <li>✔ Posición estratégica frente a clientes</li>
              <li>✔ Incremento de oportunidades reales</li>
              <li>✔ Imagen profesional fortalecida</li>
            </ul>

          </motion.div>

          {/* AGENCIA */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 50 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 p-12 rounded-3xl shadow-2xl hover:scale-[1.02] transition"
          >
            <h3 className="text-3xl font-bold">🚀 Trabajar con 1000Artistas como agencia</h3>

            <p className="mt-6 text-blue-100 text-lg">
              Recibe acompañamiento estratégico para optimizar tu perfil,
              mejorar tu posicionamiento digital y acceder a nuevas oportunidades.
            </p>

            <ul className="mt-8 space-y-3 text-blue-100">
              <li>✔ Orientación profesional personalizada</li>
              <li>✔ Optimización de contenido e imagen</li>
              <li>✔ Búsqueda activa de contrataciones</li>
              <li>✔ Representación digital dentro del marketplace</li>
            </ul>

          </motion.div>

        </div>

      </section>

      {/* COMBINAR */}
      <section className="py-28 px-6">

        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl px-10 py-16 text-center shadow-2xl">

          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Combinar ambas estrategias acelera tu posicionamiento
          </h2>

          <p className="mt-6 text-blue-100 text-lg md:text-xl">
            Los artistas que destacan su perfil y reciben acompañamiento tipo agencia
            logran mayor visibilidad, más clics y más contrataciones.
          </p>

        </div>

      </section>

      {/* CTA FINAL */}
      <section className="py-28 px-6 text-center max-w-4xl mx-auto">

        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Los espacios destacados y de acompañamiento son limitados
        </h2>

        <p className="mt-6 text-gray-400 text-lg">
          Esto nos permite garantizar impacto real, posicionamiento efectivo
          y oportunidades auténticas dentro del mercado.
        </p>

        <a
          href={`https://wa.me/593963737070?text=${whatsappMessage}`}
          target="_blank"
          className="inline-block mt-14 bg-green-500 hover:bg-green-600 px-14 py-6 rounded-2xl font-bold text-xl shadow-2xl shadow-green-500/40 hover:scale-105 transition"
        >
          Hablar ahora por WhatsApp
        </a>

      </section>

    </div>
  );
}