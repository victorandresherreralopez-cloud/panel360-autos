type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "RESEND_NOT_CONFIGURED" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Recuperar clave | Asistente Comercial Automotriz",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h1>Recuperar clave</h1>
          <p>Hola ${name}, recibimos una solicitud para cambiar tu clave.</p>
          <p>Este enlace dura 45 minutos y solo se puede usar una vez.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#0f766e;color:white;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:700">Crear nueva clave</a></p>
          <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    return { sent: false, reason: `RESEND_ERROR_${response.status}` };
  }

  return { sent: true };
}
