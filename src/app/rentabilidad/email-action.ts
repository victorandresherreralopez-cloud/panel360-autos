"use server";

import { sendEmailViaResend } from "@/lib/services/email";

type SendInput = {
  to: string;
  subject: string;
  html: string;
};

// Envia la hoja de rentabilidad por correo usando Resend (server-side).
// Devuelve { ok:false, reason:"RESEND_NOT_CONFIGURED" } si falta la API key,
// para que la UI muestre un mensaje claro en vez de fallar en silencio.
export async function sendRentabilidadEmail(input: SendInput): Promise<{ ok: boolean; reason?: string }> {
  const to = (input.to ?? "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, reason: "CORREO_INVALIDO" };
  }

  const result = await sendEmailViaResend({
    to,
    subject: input.subject?.trim() || "Hoja de rentabilidad",
    html: input.html
  });

  return result.sent ? { ok: true } : { ok: false, reason: result.reason };
}
