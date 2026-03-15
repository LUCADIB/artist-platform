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

/**
 * Sends a transactional email to an artist when their profile is approved by the manager/admin.
 *
 * Purpose:
 * - Notifies the artist that their profile is now public and active in the marketplace.
 * - Encourages the artist to log in to their dashboard and start managing availability and bookings.
 *
 * Trigger:
 * - This function must be called server-side immediately after the artist approval mutation succeeds
 *   (e.g., when `approved = true` or similar status change in the artists table).
 *
 * Requirements:
 * - Resend API key must be configured in environment variables.
 * - Domain must be verified in Resend.
 * - Artist email is retrieved from Supabase Auth (`auth.users`) using the artist's `profile_id`.
 *
 * Parameters:
 * @param artistEmail - The email address of the approved artist.
 * @param artistName - The display name of the artist for personalization.
 *
 * Behavior:
 * - Sends an HTML transactional email from noreply@quitoshows.com
 * - Contains a success message and a direct link to the login/dashboard page.
 *
 * Notes:
 * - This is a business-critical engagement email that improves artist activation and response time.
 * - Should not be triggered from the client to avoid abuse or duplicate sends.
 */

export async function sendArtistApprovedEmail({
  artistEmail,
  artistName,
}: {
  artistEmail: string;
  artistName: string;
}) {
  await resend.emails.send({
    from: "QuitoShows <noreply@quitoshows.com>",
    to: artistEmail,
    subject: "Tu perfil ha sido aprobado 🎉",
    html: `
      <h2>¡Felicidades ${artistName}!</h2>
      <p>Tu perfil ya fue aprobado y ahora es visible en QuitoShows.</p>
      <p>Puedes entrar a tu dashboard y comenzar a recibir solicitudes.</p>
      <a href="https://quitoshows.com/login">Ir al dashboard</a>
    `,
  });
}

/**
 * Email to manager when a new artist registers and needs approval.
 */
export async function sendNewArtistRegistrationEmail({
  artistName,
}: {
  artistName: string;
}) {
  await resend.emails.send({
    from: "Marketplace <onboarding@resend.dev>",
    to: process.env.MANAGER_EMAIL!,
    subject: "Nuevo artista registrado pendiente de aprobación",
    html: `
      <h2>Nuevo artista registrado</h2>
      <p><strong>${artistName}</strong> se ha registrado en la plataforma.</p>
      <p>Ingresa al panel de manager para aprobar o rechazar.</p>
    `,
  });
}