import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingEmailToArtist({
  artistEmail,
  artistName,
  clientName,
  clientPhone,
  eventDate,
  eventTime,
  city,
}: {
  artistEmail: string;
  artistName: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventTime: string;
  city: string;
}) {
  await resend.emails.send({
    from: "QuitoShows <noreply@quitoshows.com>",
    to: artistEmail,
    subject: "Nueva solicitud de reserva",
    html: `
      <h2>Tienes una nueva solicitud</h2>
      <p><b>Cliente:</b> ${clientName}</p>
      <p><b>Teléfono:</b> ${clientPhone}</p>
      <p><b>Fecha:</b> ${eventDate}</p>
      <p><b>Hora:</b> ${eventTime}</p>
      <p><b>Ciudad:</b> ${city}</p>
      <p>Ingresa a tu dashboard para verla.</p>
    `,
  });
}