export default function ContactPage() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h1 className="text-3xl font-bold">Contacto</h1>

            <p className="mt-6 text-neutral-600">
                Somos una <strong>plataforma profesional de artistas</strong> y trabajamos
                conectando talento con clientes para shows, eventos privados,
                conciertos y presentaciones en vivo.
            </p>

            <p className="mt-4 text-neutral-600">
                Si deseas <strong>contratar un artista</strong> o recibir asesoría para tu
                evento, puedes escribirnos directamente por WhatsApp y te ayudaremos a
                encontrar la mejor opción.
            </p>

            <p className="mt-4 text-neutral-600">
                También si eres <strong>artista y deseas aparecer en esta plataforma</strong>,
                puedes contactarnos. No importa si ya tienes manager o si solo quieres
                mayor visibilidad. Evaluamos cada caso y podemos ayudarte a mostrar tu
                talento a nuevos clientes.
            </p>

            <a
                href="https://wa.me/593993737070"
                target="_blank"
                className="btn-primary mt-10 inline-block px-6 py-3"
            >
                Contactar por WhatsApp
            </a>
        </main>
    );
}