import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";
import { getCommercialAidAlerts } from "@/lib/commercial-aids";
import { formatCLP, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Tag, Sparkles, AlertCircle, Gift, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const now = new Date();

  const [campaigns, offers, aidAlerts] = await Promise.all([
    prisma.commercialCampaign.findMany({
      orderBy: [{ createdAt: "desc" }, { title: "asc" }]
    }),
    prisma.commercialOffer.findMany({
      where: { status: { in: ["VIGENTE", "DETECTADO", "APROBADO"] } },
      orderBy: [{ createdAt: "desc" }]
    }),
    getCommercialAidAlerts(150)
  ]);

  const hasAnyPromotion = campaigns.length > 0 || offers.length > 0 || aidAlerts.length > 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="INTELIGENCIA COMERCIAL"
        title="Promociones, Bonos y Acciones Comerciales"
        description="Consolidado de beneficios activos por marca: Patente Gratis, Bonos Cierre Compartido, Tasas Subvencionadas, Regalos y Campañas Derco."
      />

      {hasAnyPromotion ? (
        <div className="grid gap-6">
          {/* Seccion 1: Ayudas Detectadas en Listas Comerciales */}
          {aidAlerts.length ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Acciones Comerciales & Bonos Detectados ({aidAlerts.length})
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Extraídos de las listas de precios y circulares multi-hoja de Derco (GWM, Mazda, Suzuki, Changan, Deepal, DFSK).
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aidAlerts.map((aid) => (
                  <Panel key={aid.id} className="relative overflow-hidden border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300">
                        {aid.category}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{aid.brandName}</span>
                    </div>

                    <h3 className="mt-2.5 text-base font-black text-slate-900 dark:text-white">{aid.title}</h3>
                    
                    <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      Modelo: <span className="text-amber-600 dark:text-amber-400">{aid.modelName}</span>
                      {aid.versionName ? ` (${aid.versionName})` : ""}
                    </p>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                      {aid.detail}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>Fuente: {aid.source}</span>
                      <StatusPill tone={aid.tone === "good" ? "good" : aid.tone === "warn" ? "warn" : "neutral"}>
                        {aid.status}
                      </StatusPill>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          ) : null}

          {/* Seccion 2: Ofertas Comerciales Estructuradas */}
          {offers.length ? (
            <div>
              <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-500" />
                Ofertas Comerciales Registradas ({offers.length})
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => (
                  <Panel key={offer.id}>
                    <div className="flex items-center justify-between gap-2">
                      <StatusPill tone="good">{offer.status}</StatusPill>
                      <span className="text-xs font-bold text-slate-400 uppercase">{offer.offerType}</span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{offer.title}</h3>

                    <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-950/60 dark:text-slate-400">
                      {offer.amountCash ? <p>Monto Contado: <strong className="text-emerald-600 dark:text-emerald-400">{formatCLP(offer.amountCash)}</strong></p> : null}
                      {offer.amountCredit ? <p>Monto Crédito: <strong className="text-purple-600 dark:text-purple-400">{formatCLP(offer.amountCredit)}</strong></p> : null}
                      {offer.aporteCES ? <p>Aporte Concesionario (CES): {formatCLP(offer.aporteCES)}</p> : null}
                      {offer.aporteMarca ? <p>Aporte Fabricante (Marca): {formatCLP(offer.aporteMarca)}</p> : null}
                      {offer.condition ? <p className="mt-1 text-[11px] text-slate-500">Condiciones: {offer.condition}</p> : null}

                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          ) : null}

          {/* Seccion 3: Campañas Generales */}
          {campaigns.length ? (
            <div>
              <h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-sky-500" />
                Campañas Institucionales & Promociones ({campaigns.length})
              </h2>

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

                      <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{campaign.title}</h3>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-teal-700 dark:text-teal-300">
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
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No hay promociones registradas aún."
          description="Puedes crear promociones desde el centro de actualizaciones o importar circulares comerciales en Excel/PDF."
          actionHref="/actualizaciones"
          actionLabel="Ir a Centro de Actualizaciones"
        />
      )}
    </div>
  );
}
