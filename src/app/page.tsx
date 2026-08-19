import Link from "next/link";
import { AlertTriangle, ArrowDown, CalendarClock, CheckCircle2, FileWarning, UsersRound } from "lucide-react";
import { LoginIntro } from "@/components/login-intro";
import { CommercialAidPanel } from "@/components/commercial-aid-alerts";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHeader, Panel, QuickLink, StatCard, StatusPill } from "@/components/ui";
import { VitokoBriefPanel } from "@/components/vitoko-brief-panel";
import { formatDateTime } from "@/lib/format";
import { getCommercialAidAlerts } from "@/lib/commercial-aids";
import { prisma } from "@/lib/prisma";
import { getVitokoBrief } from "@/lib/vitoko";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const showIntro = Boolean(searchParams?.bienvenido);
  const [brandCount, modelCount, versionCount, pendingItems, activePromotions, customers, recentPriceChanges, reminders, commercialAidAlerts, vitokoBrief] =
    await Promise.all([
      prisma.brand.count(),
      prisma.vehicleModel.count(),
      prisma.version.count(),
      prisma.updateItem.count({ where: { status: { in: ["DETECTADO", "EN_REVISION"] } } }),
      prisma.commercialCampaign.count({ where: { status: "VIGENTE" } }),
      prisma.customer.count(),
      prisma.priceHistory.findMany({
        take: 6,
        orderBy: { changedAt: "desc" },
        include: { version: { include: { brand: true, model: true } } }
      }),
      prisma.reminder.findMany({
        where: { status: "PENDIENTE", dueAt: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
        include: { customer: true },
        take: 5,
        orderBy: { dueAt: "asc" }
      }),
      getCommercialAidAlerts(8),
      getVitokoBrief()
    ]);

  return (
    <div className="grid gap-6">
      {showIntro ? <LoginIntro /> : null}
      <PageHeader
        eyebrow="PANEL360 AUTOS — ASISTENTE COMERCIAL"
        title="Tu copiloto de ventas"
        description="Busca información aprobada, revisa cambios comerciales, compara versiones y mantén seguimiento de clientes desde el mismo tablero."
      />

      <SearchForm />

      <VitokoBriefPanel brief={vitokoBrief} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Marcas" value={brandCount} detail="Catálogo Derco y documentos internos" />
        <StatCard label="Modelos" value={modelCount} detail="Sin inventar catálogo" />
        <StatCard label="Versiones" value={versionCount} detail="Orden editable por modelo" />
        <StatCard label="Pendiente revisión" value={pendingItems} detail="No aplicado automáticamente" />
        <StatCard label="Promociones vigentes" value={activePromotions} detail="Solo aprobadas" />
        <StatCard label="Clientes" value={customers} detail="Mini CRM local" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QuickLink href="/cliente-frente-a-mi" label="Cliente frente a mí" detail="Filtros rápidos para recomendar con datos aprobados." />
        <QuickLink href="/renovaciones" label="🔄 Motor de Renovaciones" detail="Alertas 30/60/90 días antes del vencimiento de crédito." />
        <QuickLink href="/cierre-venta" label="✅ Cierre de Venta" detail="Registra venta + contrato de crédito con fecha última cuota." />
        <QuickLink href="/clientes" label="Ficha 360 Clientes" detail="Pestañas: Identificación, Comercial, Historial, Postventa." />
        <QuickLink href="/admin/importar-clientes" label="📥 Importar Clientes" detail="Excel/CSV con detección automática de columnas." />
        <QuickLink href="/vehiculos" label="Vehículos" detail="Marcas, modelos, versiones, fotos y fichas técnicas." />
        <QuickLink href="/comparador" label="Comparador" detail="Hasta tres versiones, incluso entre marcas." />
        <QuickLink href="/cotizador" label="Cotizador" detail="Guarda una foto histórica de valores usados." />
        <QuickLink href="/rentabilidad" label="Rentabilidad" detail="Hoja editable con CIT, impuesto verde, permiso e impresión." />
        <QuickLink href="/creditos" label="Créditos Amicar" detail="Prepara datos, abre Amicar y guarda el resultado en el CRM." />
        <QuickLink href="/plan-comercial" label="Control Comercial" detail="Semáforo de actualización por marca (verde/amarillo/rojo)." />
        <QuickLink href="/ayudas-comerciales" label="Ayudas comerciales" detail="Bonos compartidos, especiales, tasas y patente gratis." />
        <QuickLink href="/actualizaciones" label="Centro de actualizaciones" detail="Subir archivos o pegar mensajes sin publicar directo." />
        <QuickLink href="/agenda" label="Mi agenda" detail="Seguimientos, cumpleaños, créditos y entregas." />
        <QuickLink href="/aprender" label="Modo aprender" detail="Siglas, versiones y tarjetas de estudio." />
      </div>

      <CommercialAidPanel alerts={commercialAidAlerts} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-copper dark:text-amber-400">Actualizaciones recientes</p>
              <h2 className="mt-1 text-xl font-black text-ink dark:text-white">Qué cambió</h2>
            </div>
            <Link href="/historial-precios" className="btn btn-secondary">
              Ver historial
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentPriceChanges.length ? (
              recentPriceChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-3 rounded-lg border border-graphite/10 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal dark:bg-teal-950 dark:text-teal-400">
                    <ArrowDown className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink dark:text-white">
                      {change.version.brand.name} {change.version.model.name} {change.version.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-steel dark:text-slate-400">
                      Precio actualizado | {formatDateTime(change.changedAt)} | Fuente: {change.sourceName ?? "No informada"}
                    </p>
                  </div>
                  <StatusPill tone={change.difference && change.difference < 0 ? "good" : "warn"}>
                    {change.difference === null ? "Nuevo" : change.difference < 0 ? "Bató" : "Subió"}
                  </StatusPill>
                </div>
              ))
            ) : (
              <EmptyState
                title="Todavía no hay cambios aprobados."
                description="Cuando apruebes precios o campañas, aparecerán aquí para revisar rápidamente cada mañana."
                actionHref="/actualizaciones"
                actionLabel="Revisar actualizaciones"
              />
            )}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs font-black uppercase text-copper dark:text-amber-400">Mi día</p>
          <h2 className="mt-1 text-xl font-black text-ink dark:text-white">Agenda comercial</h2>
          <div className="mt-4 grid gap-3">
            {reminders.length ? (
              reminders.map((reminder) => (
                <Link key={reminder.id} href="/agenda" className="rounded-lg border border-graphite/10 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
                    <CalendarClock className="h-4 w-4 text-signal dark:text-teal-400" aria-hidden="true" />
                    {reminder.type}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-steel dark:text-slate-400">
                    {reminder.customer ? `${reminder.customer.firstName} ${reminder.customer.lastName ?? ""}` : "Sin cliente asociado"} | {formatDateTime(reminder.dueAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-graphite/10 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-signal dark:text-teal-400" aria-hidden="true" />
                  No hay recordatorios vencidos o próximos.
                </p>
                <p className="mt-1 text-xs font-semibold text-steel dark:text-slate-400">Agrega próximos pasos desde la ficha de cliente o Agenda.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
            <AlertTriangle className="h-4 w-4 text-copper dark:text-amber-400" aria-hidden="true" />
            Resumen comercial de hoy
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel dark:text-slate-300">
            {pendingItems
              ? `${pendingItems} cambios o extracciones pendientes de revisión. Ninguno fue aplicado automáticamente.`
              : "No hay conflictos ni documentos pendientes de revisión."}
          </p>
        </Panel>
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
            <UsersRound className="h-4 w-4 text-signal dark:text-teal-400" aria-hidden="true" />
            CRM
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel dark:text-slate-300">
            Registra clientes, próximas acciones, créditos y oportunidades de renovación sin enviar datos privados a servicios externos.
          </p>
        </Panel>
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
            <FileWarning className="h-4 w-4 text-copper dark:text-amber-400" aria-hidden="true" />
            Documentos fuente
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel dark:text-slate-300">
            Los documentos cargados quedan guardados como respaldo para revisar fuentes, fichas técnicas y cambios comerciales.
          </p>
        </Panel>
      </div>
    </div>
  );
}
