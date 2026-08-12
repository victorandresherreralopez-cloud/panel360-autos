import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const now = new Date();
  const campaigns = await prisma.commercialCampaign.findMany({
    where: {
      status: "VIGENTE",
      OR: [{ endDate: null }, { endDate: { gte: now } }]
    },
    orderBy: [{ endDate: "asc" }, { title: "asc" }]
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Promociones de hoy" description="Solo se muestran promociones vigentes y aprobadas. Las condiciones y excepciones se mantienen visibles." />
      {campaigns.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Panel key={campaign.id}>
              <StatusPill>{campaign.promotionType}</StatusPill>
              <h2 className="mt-3 text-xl font-black text-ink">{campaign.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-steel">{campaign.benefit ?? "Beneficio pendiente de cargar"}</p>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-graphite">
                <p>Condición: {campaign.condition ?? "Condición no informada"}</p>
                <p>Excepción: {campaign.exception ?? "Sin excepción informada"}</p>
                <p>Vigencia: {campaign.startDate ? formatDate(campaign.startDate) : "Inicio no informado"} a {campaign.endDate ? formatDate(campaign.endDate) : "Vigencia no informada"}</p>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay promociones vigentes aprobadas." description="Las promociones detectadas desde documentos o mensajes deben revisarse y aprobarse antes de aparecer aquí." actionHref="/actualizaciones" actionLabel="Revisar actualizaciones" />
      )}
    </div>
  );
}
