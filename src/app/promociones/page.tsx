import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Tag, Sparkles, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const now = new Date();

  // Fetch all campaigns in database regardless of strict status text
  const campaigns = await prisma.commercialCampaign.findMany({
    orderBy: [{ createdAt: "desc" }, { title: "asc" }]
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="ACCIONES COMERCIALES"
        title="Promociones y Ofertas del Mes"
        description="Campañas comerciales activas, bonos de financiamiento, regalos de patente y condiciones vigentes para apoyar la venta."
      />

      {campaigns.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const isExpired = campaign.endDate && new Date(campaign.endDate) < now;

            return (
              <Panel key={campaign.id}>
                <div className="flex items-center justify-between gap-2">
                  <StatusPill tone={isExpired ? "bad" : "good"}>
                    {isExpired ? "EXPIRED" : campaign.status ?? "VIGENTE"}
                  </StatusPill>
                  <span className="text-xs font-bold text-slate-400 uppercase">{campaign.promotionType}</span>
                </div>

                <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{campaign.title}</h2>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-teal-700 dark:text-teal-300">
                  {campaign.benefit ?? "Beneficio comercial activo"}
                </p>

                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-950/60 dark:text-slate-400">
                  <p><strong className="text-slate-900 dark:text-white">Condición:</strong> {campaign.condition ?? "Aplica según stock disponible"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Excepción:</strong> {campaign.exception ?? "Sin excepciones informadas"}</p>
                  <p><strong className="text-slate-900 dark:text-white">Vigencia:</strong> {campaign.startDate ? formatDate(campaign.startDate) : "Inicio inmediato"} al {campaign.endDate ? formatDate(campaign.endDate) : "hasta agotar stock"}</p>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No hay promociones registradas aún."
          description="Puedes crear promociones desde el centro de actualizaciones o importar campañas desde archivos de precios."
          actionHref="/actualizaciones"
          actionLabel="Ir a Centro de Actualizaciones"
        />
      )}
    </div>
  );
}
