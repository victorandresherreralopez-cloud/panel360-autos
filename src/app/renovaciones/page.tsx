import Link from "next/link";
import { CarFront, RefreshCw } from "lucide-react";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatCLP, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function tramo(days: number | null) {
  if (days === null) return null;
  if (days <= 30) return "30";
  if (days <= 60) return "60";
  if (days <= 90) return "90";
  if (days <= 180) return "180";
  return null;
}

export default async function RenovacionesPage() {
  const credits = await prisma.creditContract.findMany({
    include: { customer: true },
    orderBy: { lastInstallmentDate: "asc" }
  });

  // Filter those ending within 180 days from now
  const upcoming = credits.filter((c) => {
    if (!c.lastInstallmentDate) return false;
    const days = daysUntil(c.lastInstallmentDate);
    return days !== null && days <= 180;
  });

  const count30 = upcoming.filter((c) => daysUntil(c.lastInstallmentDate) !== null && daysUntil(c.lastInstallmentDate)! <= 30).length;
  const count60 = upcoming.filter((c) => { const d = daysUntil(c.lastInstallmentDate); return d !== null && d > 30 && d <= 60; }).length;
  const count90 = upcoming.filter((c) => { const d = daysUntil(c.lastInstallmentDate); return d !== null && d > 60 && d <= 90; }).length;
  const count180 = upcoming.filter((c) => { const d = daysUntil(c.lastInstallmentDate); return d !== null && d > 90 && d <= 180; }).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="CLIENTES Y OPORTUNIDADES"
        title="Motor de Renovaciones"
        description="Anticípate al término de crédito de tus clientes. Panel360 analiza automáticamente las fechas de última cuota y te alerta para iniciar el proceso de renovación en el momento justo."
      />

      {/* KPI TRAMOS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Próximos 30 días", count: count30, color: "teal", urgency: "Urgente — contactar hoy" },
          { label: "31 – 60 días", count: count60, color: "amber", urgency: "Contactar este mes" },
          { label: "61 – 90 días", count: count90, color: "blue", urgency: "En preparación" },
          { label: "91 – 180 días", count: count180, color: "purple", urgency: "Proyección a mediano plazo" }
        ].map(({ label, count, color, urgency }) => (
          <div key={label} className={`rounded-xl border p-4 border-${color}-500/30 bg-${color}-50/50 dark:border-${color}-800 dark:bg-${color}-950/40`}>
            <p className={`text-xs font-black uppercase text-${color}-800 dark:text-${color}-300`}>{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{count}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{urgency}</p>
          </div>
        ))}
      </div>

      {/* LIST */}
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-amber-500">Oportunidades de Renovación</p>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Créditos próximos a vencer ({upcoming.length})
            </h2>
          </div>
        </div>

        {upcoming.length ? (
          <div className="grid gap-3">
            {upcoming.map((credit) => {
              const days = daysUntil(credit.lastInstallmentDate);
              const customerName = credit.customer
                ? `${credit.customer.firstName} ${credit.customer.lastName ?? ""}`.trim()
                : "Cliente";

              return (
                <div
                  key={credit.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-900 dark:text-white">{customerName}</p>
                      {credit.customer?.rut && (
                        <span className="text-xs font-semibold text-slate-400">RUT: {credit.customer.rut}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Financiera: {credit.financialEntity ?? "No registrada"} •{" "}
                      {credit.installmentAmount ? `Cuota: ${formatCLP(credit.installmentAmount)}` : ""} •{" "}
                      Última cuota:{" "}
                      {credit.lastInstallmentDate ? formatDateTime(credit.lastInstallmentDate) : "Sin fecha"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusPill
                      tone={days !== null && days <= 30 ? "bad" : days !== null && days <= 60 ? "warn" : "good"}
                    >
                      {days !== null ? `${days} días` : "Pendiente"}
                    </StatusPill>
                    <Link
                      href={`/cotizador?customerId=${credit.customerId}`}
                      className="btn btn-secondary text-xs"
                    >
                      Cotizar Renovación
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No hay créditos próximos a vencer."
            description="A medida que registres cierres de venta a crédito con fecha de última cuota, o importes bases históricas, las oportunidades de renovación aparecerán aquí automáticamente."
            actionHref="/admin/importar-clientes"
            actionLabel="Importar base de clientes"
          />
        )}
      </Panel>
    </div>
  );
}
