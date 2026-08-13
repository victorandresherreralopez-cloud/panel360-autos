import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/services/notifications/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RENEWAL_THRESHOLDS = [30, 60, 90]; // días antes del vencimiento

export async function GET(request: Request) {
  // Validate cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const results: string[] = [];
  let notificationsSent = 0;

  for (const days of RENEWAL_THRESHOLDS) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const credits = await prisma.creditContract.findMany({
      where: { lastInstallmentDate: { gte: start, lte: end } },
      include: { customer: { select: { firstName: true, lastName: true, rut: true, phone: true } } }
    });

    for (const credit of credits) {
      const name = `${credit.customer.firstName} ${credit.customer.lastName ?? ""}`.trim();
      const phone = credit.customer.phone ?? "";
      const rut = credit.customer.rut ?? "Sin RUT";

      const msg = [
        `🔄 *RENOVACIÓN EN ${days} DÍAS*`,
        `Cliente: *${name}*`,
        `RUT: ${rut}`,
        phone ? `Teléfono: ${phone}` : "",
        `Financiera: ${credit.financialEntity ?? "No registrada"}`,
        credit.installmentAmount ? `Cuota: $${credit.installmentAmount.toLocaleString("es-CL")}` : "",
        `Última cuota: ${credit.lastInstallmentDate?.toLocaleDateString("es-CL") ?? "—"}`,
        ``,
        `💡 Cotiza su renovación en Panel360 Autos`
      ].filter(Boolean).join("\n");

      await sendTelegramMessage(msg);

      await prisma.notificationHistory.create({
        data: {
          channel: "telegram",
          eventType: "RENOVATION_ALERT",
          message: msg,
          status: "SENT"
        }
      });

      notificationsSent++;
      results.push(`${name} — ${days}d`);
    }
  }

  // Birthday check (same-day birthdays in Chile)
  const chileNow = new Date(today.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const todayMonth = chileNow.getMonth() + 1;
  const todayDay = chileNow.getDate();

  const customersWithBirthday = await prisma.customer.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, firstName: true, lastName: true, phone: true, rut: true, birthDate: true }
  });

  for (const c of customersWithBirthday) {
    if (!c.birthDate) continue;
    const bd = new Date(c.birthDate);
    if (bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay) {
      const name = `${c.firstName} ${c.lastName ?? ""}`.trim();
      const msg = [
        `🎂 *CUMPLEAÑOS HOY*`,
        `Cliente: *${name}*`,
        c.rut ? `RUT: ${c.rut}` : "",
        c.phone ? `Teléfono: ${c.phone}` : "",
        ``,
        `💡 Es un momento ideal para felicitarlo y mantener la relación comercial.`
      ].filter(Boolean).join("\n");

      await sendTelegramMessage(msg);

      await prisma.notificationHistory.create({
        data: {
          channel: "telegram",
          eventType: "BIRTHDAY_ALERT",
          message: msg,
          status: "SENT"
        }
      });

      notificationsSent++;
      results.push(`🎂 ${name}`);
    }
  }

  return NextResponse.json({
    ok: true,
    date: today.toISOString(),
    notificationsSent,
    renewals: results.filter((r) => r.includes("—")),
    birthdays: results.filter((r) => r.includes("🎂"))
  });
}
