import { CommercialAidAlerts } from "@/components/commercial-aid-alerts";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getCommercialAidAlerts } from "@/lib/commercial-aids";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CommercialPlanPage() {
  const [campaigns, commercialAidAlerts] = await Promise.all([
    prisma.commercialCampaign.findMany({
      orderBy: [{ startDate: "desc" }, { title: "asc" }]
    }),
    getCommercialAidAlerts(20)
  ]);

  const grouped = campaigns.reduce<Record<string, typeof campaigns>>((acc, campaign) => {
    const key = campaign.startDate
      ? new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "America/Santiago" }).format(campaign.startDate)
      : "Mes no informado";
    acc[key] = acc[key] ?? [];
    acc[key].push(campaign);
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <PageHeader title="Plan comercial" description="Historico de campanas, bonos y beneficios por mes. No se eliminan planes anteriores." />

      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-copper">Alertas de ayuda</p>
            <h2 className="text-xl font-black text-ink">Bonos y acciones detectadas</h2>
          </div>
          <StatusPill tone={commercialAidAlerts.length ? "warn" : "neutral"}>{commercialAidAlerts.length} alertas</StatusPill>
        </div>
        <CommercialAidAlerts alerts={commercialAidAlerts} compact />
      </Panel>

      {campaigns.length ? (
        Object.entries(grouped).map(([month, items]) => (
          <Panel key={month}>
            <h2 className="text-xl font-black capitalize text-ink">{month}</h2>
            <div className="mt-4 grid gap-3">
              {items.map((campaign) => (
                <div key={campaign.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{campaign.title}</p>
                    <StatusPill>{campaign.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-steel">{campaign.benefit ?? "Beneficio pendiente de cargar"}</p>
                  <p className="mt-2 text-xs font-semibold text-steel">
                    Inicio: {campaign.startDate ? formatDate(campaign.startDate) : "Fecha inicio no informada"} | Termino:{" "}
                    {campaign.endDate ? formatDate(campaign.endDate) : "Vigencia no informada"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        ))
      ) : (
        <EmptyState
          title="No hay planes comerciales cargados."
          description="Sube PDF, PPTX, Excel o pega comunicaciones para revisar y aprobar campanas."
          actionHref="/actualizaciones"
          actionLabel="Cargar plan"
        />
      )}
    </div>
  );
}
