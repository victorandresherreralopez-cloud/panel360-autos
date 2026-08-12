import { prisma } from "../src/lib/prisma";
import { sendTelegramMessage } from "../src/lib/services/notifications/telegram";

async function main() {
  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: {
      status: "PENDIENTE",
      dueAt: { lte: now },
      OR: [{ lastNotificationAt: null }, { lastNotificationAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } }]
    },
    include: { customer: true },
    take: 25,
    orderBy: { dueAt: "asc" }
  });

  for (const reminder of dueReminders) {
    const customer = reminder.customer ? `${reminder.customer.firstName} ${reminder.customer.lastName ?? ""}`.trim() : "Sin cliente asociado";
    const message = [
      "RECORDATORIO COMERCIAL",
      `Cliente: ${customer}`,
      `Acción: ${reminder.type}`,
      `Hora: ${new Intl.DateTimeFormat("es-CL", { timeStyle: "short", timeZone: "America/Santiago" }).format(reminder.dueAt)}`,
      `Observación: ${reminder.description}`
    ].join("\n");

    const result = await sendTelegramMessage(message);
    await prisma.notificationHistory.create({
      data: {
        channel: "telegram",
        eventType: "REMINDER",
        entityType: "reminder",
        entityId: reminder.id,
        message,
        status: result.status,
        error: result.ok ? undefined : result.message
      }
    });

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { lastNotificationAt: now }
    });
  }

  console.log(`Procesados ${dueReminders.length} recordatorios pendientes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
