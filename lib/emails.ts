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
    from: "QuitoShows Team <noreply@quitoshows.com>",
    to: artistEmail,
    subject: "Tu perfil ha sido aprobado 🎉",
    html: `
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f8">
<tr>
<td align="center">

<table width="100%" style="max-width:600px;margin-top:30px;" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
<tr>
<td align="center" style="padding:30px 20px;border-bottom:1px solid #eee;">

<img src="https://xvrzlrgzcamromyxawiz.supabase.co/storage/v1/object/public/artists/logo%20600px%20transparente.png" width="160" />

</td>
</tr>

<tr>
<td style="padding:30px 30px;font-family:Arial,Helvetica,sans-serif;color:#111;">

<h1 style="margin:0 0 10px 0;font-size:26px;line-height:32px;">
🎉 ¡Felicidades ${artistName}!
</h1>

<p style="font-size:16px;color:#555;margin-bottom:25px;line-height:24px;">
Tu perfil ha sido aprobado y ahora formas parte oficial de <b>QuitoShows</b>.  
Desde este momento podrás recibir solicitudes reales de contratación.
</p>

</td>
</tr>

<tr>
<td style="padding:0 30px 25px 30px;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
<tr>
<td style="padding:14px;border:1px solid #eee;">
<b>📸 Usa tu mejor foto</b><br>
<span style="color:#666;font-size:14px;">Una imagen profesional aumenta tus clics.</span>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
<tr>
<td style="padding:14px;border:1px solid #eee;">
<b>🎬 Agrega videos impactantes</b><br>
<span style="color:#666;font-size:14px;">Los artistas con video generan más reservas.</span>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:14px;border:1px solid #eee;">
<b>📝 Cuenta tu historia</b><br>
<span style="color:#666;font-size:14px;">Explica tu estilo y experiencia.</span>
</td>
</tr>
</table>

</td>
</tr>

<tr>
<td style="padding:22px 30px;font-family:Arial;background:#f8fafc;border-top:1px solid #eee;border-bottom:1px solid #eee;">

<b style="font-size:17px;">⭐ Aparece primero con Destacados</b>

<p style="font-size:14px;color:#555;margin-top:6px;line-height:22px;">
Los artistas destacados obtienen mayor visibilidad en la página principal y reciben más solicitudes de contratación.
</p>

</td>
</tr>

<tr>
<td align="center" style="padding:30px;">

<a href="https://quitoshows.com/login"
style="background:#111;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold;font-family:Arial,Helvetica,sans-serif;display:inline-block;border-radius:10px;font-size:15px;">
Ir a mi perfil
</a>

</td>
</tr>

<tr>
<td align="center" style="padding:18px;font-size:12px;color:#999;font-family:Arial;">
QuitoShows Team — Marketplace & Agencia de Artistas
</td>
</tr>

</table>

</td>
</tr>
</table>
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