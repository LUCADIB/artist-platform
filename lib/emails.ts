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
  try {
    await resend.emails.send({
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

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f8">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="margin-top:30px;border-radius:12px;overflow:hidden;">

<tr>
<td align="center" style="padding:30px 20px;border-bottom:1px solid #eee;">

<h1 style="margin:0;font-size:28px;font-family:Arial,Helvetica,sans-serif;">
<span style="font-weight:800;color:#111;">1000</span>
<span style="background:linear-gradient(90deg,#FF3CAC,#784BA0,#2B86C5);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent;
font-weight:600;">
Artistas
</span>
</h1>

</td>
</tr>

<tr>
<td style="padding:30px;font-family:Arial,Helvetica,sans-serif;color:#111;">

<h2 style="margin:0 0 10px 0;">
🎉 ¡Felicidades ${artistName}!
</h2>

<p style="font-size:16px;color:#555;line-height:24px;">
Tu perfil ha sido aprobado y ahora formas parte oficial de <b>1000Artistas</b>.
Desde este momento podrás recibir solicitudes reales de contratación.
</p>

<div style="text-align:center;margin-top:30px;">
<a href="https://1000artistas.com/dashboard/artist"
style="background:#111;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">
Ver mi perfil
</a>
</div>

</td>
</tr>

<tr>
<td style="padding:20px;text-align:center;font-size:12px;color:#999;font-family:Arial;">
1000Artistas Team — Marketplace & Agencia de Artistas
</td>
</tr>

</table>

</td>
</tr>
</table>
`,
  });
}

export async function sendNewArtistRegistrationEmail({
  artistName,
}: {
  artistName: string;
}) {
  await resend.emails.send({
    from: "1000Artistas <noreply@1000artistas.com>",
    to: process.env.MANAGER_EMAIL!,
    subject: "Nuevo artista registrado pendiente de aprobación",
    html: `
      <h2>Nuevo artista registrado</h2>
      <p><strong>${artistName}</strong> se ha registrado en la plataforma.</p>
      <p>Ingresa al panel de manager para aprobar o rechazar.</p>
    `,
  });
}