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
  console.log(`[Email] Sending booking notification to: ${artistEmail} (${artistName})`);

  try {
    const result = await resend.emails.send({
      from: "1000Artistas <noreply@1000artistas.com>",
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

    console.log(`[Email] Successfully sent to ${artistEmail}:`, result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send to ${artistEmail}:`, error);
    return { success: false, error };
  }
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
    from: "1000Artistas <noreply@1000artistas.com>",
    to: artistEmail,
    subject: "Tu perfil ha sido aprobado 🎉",
    html: `
<div style="background:#0f0f0f;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#ffffff">

  <div style="max-width:600px;margin:0 auto;background:#151515;border-radius:16px;padding:40px">

    <div style="text-align:center;margin-bottom:30px">
      <img src="https://xvrzlrgzcamromyxawiz.supabase.co/storage/v1/object/public/artists/Logo%20750x300.png" width="170" />
    </div>

    <h1 style="text-align:center;font-size:30px;margin-bottom:10px">
      🎉 ¡Felicidades ${artistName}!
    </h1>

    <p style="text-align:center;font-size:18px;color:#cfcfcf;margin-bottom:30px">
      Ya eres oficialmente un <b>Artista en 1000Artistas.com</b>.
    </p>

    <p style="text-align:center;color:#9ca3af;margin-bottom:40px">
      Desde ahora clientes reales podrán descubrir tu talento y contratarte.
    </p>

    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:15px">
      <h3 style="margin:0 0 5px 0">📸 Usa tu mejor foto</h3>
      <p style="margin:0;color:#9ca3af">Una imagen profesional aumenta tus clics y contrataciones.</p>
    </div>

    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:15px">
      <h3 style="margin:0 0 5px 0">🎬 Agrega videos impactantes</h3>
      <p style="margin:0;color:#9ca3af">YouTube, Instagram o shows en vivo. Los artistas con video venden más.</p>
    </div>

    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:15px">
      <h3 style="margin:0 0 5px 0">📝 Cuenta tu historia</h3>
      <p style="margin:0;color:#9ca3af">Describe tu estilo, experiencia y lo que te hace único.</p>
    </div>

    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);border-radius:14px;padding:25px;margin-top:30px;margin-bottom:30px">
      <h2 style="margin:0 0 10px 0">⭐ Aparece primero con Destacados</h2>
      <p style="margin:0;color:#e5e7eb">
        Los artistas destacados obtienen <b>muchísima más visibilidad</b>, aparecen en la página principal y reciben más solicitudes de booking.  
        Si deseas destacar y estar entre <b>los primeros</b>, contáctanos.
      </p>
    </div>

    <div style="text-align:center;margin-top:30px">
      <a href="https://1000artistas.com/dashboard/artist"
         style="background:#2563eb;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold">
         Ver mi perfil ahora
      </a>
    </div>

    <p style="text-align:center;margin-top:40px;color:#6b7280;font-size:13px">
      1000Artistas — Marketplace & Agencia de Artistas
    </p>

  </div>

</div>
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