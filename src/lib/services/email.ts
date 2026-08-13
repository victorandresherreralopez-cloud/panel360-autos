type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

type CustomerVerificationEmailInput = {
  to: string;
  customerName: string;
  verificationUrl: string;
};

type BirthdayGreetingEmailInput = {
  to: string;
  customerName: string;
  sellerName?: string;
  dealershipName?: string;
};

type CreditRenewalEmailInput = {
  to: string;
  customerName: string;
  vehicleLabel: string;
  installmentNumber: number;
  totalInstallments: number;
  contactPhone?: string;
  sellerName?: string;
};

export async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Panel360 Autos <onboarding@resend.dev>";

  if (!apiKey) {
    return { sent: false, reason: "RESEND_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { sent: false, reason: `RESEND_ERROR_${response.status}: ${errorText}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: `NETWORK_ERROR: ${error instanceof Error ? error.message : "Error de conexión"}` };
  }
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailInput) {
  return sendEmailViaResend({
    to,
    subject: "Recuperar clave | Panel360 Autos",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#e31837">Recuperar clave de acceso</h2>
        <p>Hola <strong>${name}</strong>, recibimos una solicitud para restablecer tu clave.</p>
        <p>Este enlace es válido por 45 minutos y de un solo uso:</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#e31837;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Restablecer clave</a>
        </p>
        <p style="color:#6b7280;font-size:12px">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `
  });
}

export async function sendCustomerVerificationEmail({ to, customerName, verificationUrl }: CustomerVerificationEmailInput) {
  return sendEmailViaResend({
    to,
    subject: "Confirma tu correo electrónico | Panel360 Autos",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#10b981">Verificación de Correo Electrónico</h2>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>Para asegurar que recibas tus cotizaciones, fichas técnicas e información comercial, confirma tu correo haciendo clic abajo:</p>
        <p style="margin:24px 0">
          <a href="${verificationUrl}" style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Confirmar mi Correo</a>
        </p>
        <p style="color:#6b7280;font-size:12px">Este enlace de verificación expirará en 72 horas.</p>
      </div>
    `
  });
}

export async function sendBirthdayGreetingEmail({ to, customerName, sellerName = "Tu Asesor Comercial", dealershipName = "Panel360 Autos" }: BirthdayGreetingEmailInput) {
  return sendEmailViaResend({
    to,
    subject: `🎉 ¡Feliz Cumpleaños ${customerName}! | ${dealershipName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px;background:#f9fafb">
        <div style="text-align:center;margin-bottom:20px">
          <span style="font-size:48px">🎂🎉</span>
          <h1 style="color:#e31837;margin:10px 0">¡Feliz Cumpleaños!</h1>
        </div>
        <p>Estimado/a <strong>${customerName}</strong>,</p>
        <p>De parte de todo el equipo de <strong>${dealershipName}</strong> y en especial de tu ejecutivo <strong>${sellerName}</strong>, te deseamos un excelente día junto a tus seres queridos.</p>
        <p>Queremos agradecer tu confianza constante en nosotros. ¡Que sea un gran año!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#6b7280;font-size:12px;text-align:center">${dealershipName} — Atención Comercial Automotriz</p>
      </div>
    `
  });
}

export async function sendCreditRenewalEmail({ to, customerName, vehicleLabel, installmentNumber, totalInstallments, contactPhone = "+56 9 1234 5678", sellerName = "Tu Ejecutivo Comercial" }: CreditRenewalEmailInput) {
  return sendEmailViaResend({
    to,
    subject: `🚗 Oportunidad de Renovación de tu ${vehicleLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px">
        <h2 style="color:#0284c7">Tu crédito se encuentra cercano a finalizar</h2>
        <p>Hola <strong>${customerName}</strong>,</p>
        <p>Te recordamos que tu vehículo <strong>${vehicleLabel}</strong> se encuentra en la cuota <strong>${installmentNumber} de ${totalInstallments}</strong>.</p>
        <p>Este es el momento perfecto para evaluar la <strong>renovación de tu auto</strong> y acceder a los nuevos modelos con bonos de retención exclusivos.</p>
        <p style="margin:20px 0">
          <a href="tel:${contactPhone}" style="background:#0284c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Contactar a ${sellerName}</a>
        </p>
      </div>
    `
  });
}
