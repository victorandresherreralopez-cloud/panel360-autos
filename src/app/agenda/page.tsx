import { completeReminder } from "@/lib/actions";
import { formatDate, formatDateTime, fullName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [reminders, birthdays, credits] = await Promise.all([
    prisma.reminder.findMany({
      where: { status: "PENDIENTE" },
      include: { customer: true },
      orderBy: { dueAt: "asc" },
      take: 100
    }),
    prisma.customer.findMany({
      where: { birthDate: { not: null } },
      orderBy: { firstName: "asc" },
      take: 100
    }),
    prisma.creditContract.findMany({
      where: { lastInstallmentDate: { not: null, lte: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()) } },
      include: { customer: true },
      orderBy: { lastInstallmentDate: "asc" },
      take: 100
    })
  ]);

  const upcomingBirthdays = birthdays.filter((customer) => {
    if (!customer.birthDate) return false;
    const birthday = new Date(now.getFullYear(), customer.birthDate.getMonth(), customer.birthDate.getDate());
    if (birthday < now) birthday.setFullYear(now.getFullYear() + 1);
    return birthday <= inSevenDays;
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Mi agenda" description="Seguimientos, llamados, WhatsApp, cumpleaños, créditos y oportunidades de renovación." />

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Recordatorios</h2>
            <StatusPill>{reminders.length}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3">
            {reminders.length ? (
              reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                  <p className="font-black text-ink">{reminder.type}</p>
                  <p className="mt-1 text-sm font-semibold text-steel">{reminder.description}</p>
                  <p className="mt-1 text-xs font-semibold text-steel">
                    {reminder.customer ? fullName(reminder.customer.firstName, reminder.customer.lastName) : "Sin cliente"} · {formatDateTime(reminder.dueAt)}
                  </p>
                  <form action={completeReminder} className="mt-3">
                    <input type="hidden" name="id" value={reminder.id} />
                    <button className="btn btn-secondary" type="submit">
                      Marcar realizado
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <EmptyState title="Sin recordatorios pendientes." description="Agregue próximos pasos desde la ficha de cliente." />
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Cumpleaños próximos</h2>
            <StatusPill>{upcomingBirthdays.length}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3">
            {upcomingBirthdays.length ? (
              upcomingBirthdays.map((customer) => (
                <div key={customer.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                  <p className="font-black text-ink">{fullName(customer.firstName, customer.lastName)}</p>
                  <p className="mt-1 text-sm font-semibold text-steel">{customer.birthDate ? formatDate(customer.birthDate) : "Fecha pendiente"}</p>
                  <textarea
                    className="input mt-3 min-h-28 text-sm"
                    readOnly
                    value={`Hola ${customer.firstName}, le deseo un muy feliz cumpleaños. Que tenga un excelente día.`}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-steel">No hay cumpleaños dentro de los próximos 7 días.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Renovaciones</h2>
            <StatusPill>{credits.length}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3">
            {credits.length ? (
              credits.map((credit) => (
                <div key={credit.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                  <p className="font-black text-ink">{fullName(credit.customer.firstName, credit.customer.lastName)}</p>
                  <p className="mt-1 text-sm font-semibold text-steel">
                    Crédito termina: {credit.lastInstallmentDate ? formatDate(credit.lastInstallmentDate) : "Fecha pendiente"} · {credit.endDateSource ?? "Sin fuente"}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-steel">Oportunidad comercial. No asumir intención de renovar.</p>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-steel">No hay créditos próximos a terminar registrados.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
