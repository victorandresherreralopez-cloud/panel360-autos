type TelegramResult = {
  ok: boolean;
  status: "NO_CONFIGURADO" | "ENVIADO" | "ERROR";
  message: string;
};

function maskToken(token: string) {
  if (!token) return "";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function getTelegramStatus() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      configured: false,
      label: "NO CONFIGURADO",
      tokenPreview: ""
    };
  }

  return {
    configured: true,
    label: "CONECTADO",
    tokenPreview: maskToken(token)
  };
}

export async function sendTelegramMessage(text: string, customChatId?: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !targetChatId) {
    return {
      ok: false,
      status: "NO_CONFIGURADO",
      message: "Telegram no está configurado. Defina TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en Vercel o proporcione un Chat ID de vendedor."
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        ok: false,
        status: "ERROR",
        message: `Telegram respondió con error HTTP ${response.status}. Detalle: ${errText || "Revise token y chat ID."}`
      };
    }

    return { ok: true, status: "ENVIADO", message: "Mensaje enviado correctamente a Telegram." };
  } catch (error) {
    return {
      ok: false,
      status: "ERROR",
      message: `No fue posible conectar con la API de Telegram: ${error instanceof Error ? error.message : "Error de red"}`
    };
  }
}
