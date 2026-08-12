import Link from "next/link";
import { AlertTriangle, ArrowDown, CalendarClock, CheckCircle2, FileWarning, UsersRound } from "lucide-react";
import { CommercialAidPanel } from "@/components/commercial-aid-alerts";
import { SearchForm } from "@/components/search-form";
import { EmptyState, PageHeader, Panel, QuickLink, StatCard, StatusPill } from "@/components/ui";
import { VitokoBriefPanel } from "@/components/vitoko-brief-panel";
import { formatDateTime } from "@/lib/format";
import { getCommercialAidAlerts } from "@/lib/commercial-aids";
import { prisma } from "@/lib/prisma";
import { getVitokoBrief } from "@/lib/vitoko";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
      <PageHeader
        eyebrow="ASISTENTE COMERCIAL AUTOMOTRIZ"
        title="Tu copiloto de ventas"
        description="Busca informacion aprobada, revisa cambios comerciales, compara versiones y manten seguimiento de clientes desde el mismo tablero."
      />

      <SearchForm />

      <VitokoBriefPanel brief={vitokoBrief} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Marcas" value={brandCount} detail="Catalogo Derco y documentos internos" />
        <StatCard label="Modelos" value={modelCount} detail="Sin inventar catalogo" />
        <StatCard label="Versiones" value={versionCount} detail="Orden editable por modelo" />
        <StatCard label="Pendiente revision" value={pendingItems} detail="No aplicado automaticamente" />
        <StatCard label="Promociones vigentes" value={activePromotions} detail="Solo aprobadas" />
        <StatCard label="Clientes" value={customers} detail="Mini CRM local" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QuickLink href="/cliente-frente-a-mi" label="Cliente frente a mi" detail="Filtros rapidos para recomendar con datos aprobados." />
        <QuickLink href="/vehiculos" label="Vehiculos" detail="Marcas, modelos, versiones, fotos y fichas tecnicas." />
        <QuickLink href="/comparador" label="Comparador" detail="Hasta tres versiones, incluso entre marcas." />
        <QuickLink href="/cotizador" label="Cotizador" detail="Guarda una foto historica de valores usados." />
        <QuickLink href="/rentabilidad" label="Rentabilidad" detail="Hoja editable con CIT, impuesto verde, permiso e impresion." />
        <QuickLink href="/creditos" label="Creditos Amicar" detail="Prepara datos, abre Amicar y guarda el resultado en el CRM." />
        <QuickLink href="/plan-comercial" label="Plan comercial" detail="Meses, campanas y beneficios sin borrar historicos." />
        <QuickLink href="/ayudas-comerciales" label="Ayudas comerciales" detail="Bonos compartidos, especiales, tasas y patente gratis." />
        <QuickLink href="/actualizaciones" label="Centro de actualizaciones" detail="Subir archivos o pegar mensajes sin publicar directo." />
        <QuickLink href="/promociones" label="Promociones de hoy" detail="Campanas vigentes, condiciones y excepciones." />
        <QuickLink href="/modo-vendedor" label="Modo vendedor" detail="Argumentos basados en equipamiento comprobado." />
        <QuickLink href="/clientes" label="Mini CRM" detail="Clientes, embudo, actividades y proximos pasos." />
        <QuickLink href="/agenda" label="Mi agenda" detail="Seguimientos, cumpleanos, creditos y entregas." />
        <QuickLink href="/whatsapp" label="WhatsApp" detail="Genera mensajes editables con datos disponibles." />
        <QuickLink href="/aprender" label="Modo aprender" detail="Siglas, versiones y tarjetas de estudio." />
      </div>

      <CommercialAidPanel alerts={commercialAidAlerts} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-copper">Actualizaciones recientes</p>
              <h2 className="mt-1 text-xl font-black text-ink">Que cambio</h2>
            </div>
            <Link href="/historial-precios" className="btn btn-secondary">
              Ver historial
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentPriceChanges.length ? (
              recentPriceChanges.map((change) => (
                <div key={change.id} className="flex items-start gap-3 rounded-lg border border-graphite/10 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal">
                    <ArrowDown className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ink">
                      {change.version.brand.name} {change.version.model.name} {change.version.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-steel">
                      Precio actualizado | {formatDateTime(change.changedAt)} | Fuente: {change.sourceName ?? "No informada"}
                    </p>
                  </div>
                  <StatusPill tone={change.difference && change.difference < 0 ? "good" : "warn"}>
                    {change.difference === null ? "Nuevo" : change.difference < 0 ? "Bajo" : "Subio"}
                  </StatusPill>
                </div>
              ))
            ) : (
              <EmptyState
                title="Todavia no hay cambios aprobados."
                description="Cuando apruebes precios o campanas, apareceran aqui para revisar rapidamente cada manana."
                actionHref="/actualizaciones"
                actionLabel="Revisar actualizaciones"
              />
            )}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs font-black uppercase text-copper">Mi dia</p>
          <h2 className="mt-1 text-xl font-black text-ink">Agenda comercial</h2>
          <div className="mt-4 grid gap-3">
            {reminders.length ? (
              reminders.map((reminder) => (
                <Link key={reminder.id} href="/agenda" className="rounded-lg border border-graphite/10 bg-white p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-ink">
                    <CalendarClock className="h-4 w-4 text-signal" aria-hidden="true" />
                    {reminder.type}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-steel">
                    {reminder.customer ? `${reminder.customer.firstName} ${reminder.customer.lastName ?? ""}` : "Sin cliente asociado"} | {formatDateTime(reminder.dueAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-graphite/10 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-black text-ink">
                  <CheckCircle2 className="h-4 w-4 text-signal" aria-hidden="true" />
                  No hay recordatorios vencidos o proximos.
                </p>
                <p className="mt-1 text-xs font-semibold text-steel">Agrega proximos pasos desde la ficha de cliente o Agenda.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <AlertTriangle className="h-4 w-4 text-copper" aria-hidden="true" />
            Resumen comercial de hoy
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel">
            {pendingItems
              ? `${pendingItems} cambios o extracciones pendientes de revision. Ninguno fue aplicado automaticamente.`
              : "No hay conflictos ni documentos pendientes de revision."}
          </p>
        </Panel>
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <UsersRound className="h-4 w-4 text-signal" aria-hidden="true" />
            CRM
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel">
            Registra clientes, proximas acciones, creditos y oportunidades de renovacion sin enviar datos privados a servicios externos.
          </p>
        </Panel>
        <Panel>
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <FileWarning className="h-4 w-4 text-copper" aria-hidden="true" />
            Documentos fuente
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel">
            Los documentos cargados quedan guardados como respaldo local para revisar fuentes, fichas tecnicas y cambios comerciales.
          </p>
        </Panel>
      </div>
    </div>
  );
}
