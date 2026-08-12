import { sendTelegramTest } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { getTelegramStatus } from "@/lib/services/notifications/telegram";
import { prisma } from "@/lib/prisma";
import { Notice, PageHeader, Panel, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TelegramConfigPage() {
  const status = getTelegramStatus();
  const history = await prisma.notificationHistory.findMany({
    where: { channel: "telegram" },
    orderBy: { sentAt: "desc" },
    take: 8
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Configuración Telegram" description="Alertas desacopladas para recordatorios, resumen diario y cambios comerciales aprobados." />
      <Notice>
        No coloque tokens en el código. Use TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el archivo .env local. El token completo no se muestra en pantalla ni se guarda en logs.
      </Notice>

      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-copper">Estado</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{status.label}</h2>
            <p className="mt-1 text-sm font-semibold text-steel">
              {status.configured ? `Token: ${status.tokenPreview}` : "Configure variables de entorno para activar la integración."}
            </p>
          </div>
          <form action={sendTelegramTest}>
            <button className="btn btn-primary" type="submit">
              Enviar mensaje de prueba
            </button>
          </form>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-black text-ink">Historial de notificaciones</h2>
        <div className="mt-4 grid gap-3">
          {history.length ? (
            history.map((item) => (
              <div key={item.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.eventType}</p>
                  <StatusPill tone={item.status === "ENVIADO" ? "good" : item.status === "NO_CONFIGURADO" ? "warn" : "bad"}>{item.status}</StatusPill>
                </div>
                <p className="mt-1 text-sm font-semibold text-steel">{formatDateTime(item.sentAt)}</p>
                {item.error ? <p className="mt-1 text-sm font-semibold text-red-700">{item.error}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-steel">No hay envíos registrados todavía.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
