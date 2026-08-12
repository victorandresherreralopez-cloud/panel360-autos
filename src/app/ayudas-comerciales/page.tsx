import { CommercialAidAlerts } from "@/components/commercial-aid-alerts";
import { Notice, PageHeader } from "@/components/ui";
import { getCommercialAidAlerts } from "@/lib/commercial-aids";

export const dynamic = "force-dynamic";

export default async function CommercialAidsPage() {
  const alerts = await getCommercialAidAlerts(120);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Ayudas comerciales"
        description="Alertas detectadas desde listas de precios y planes comerciales: bonos compartidos, bonos especiales, campanas, tasas y patente gratis."
      />
      <Notice>
        Estas ayudas salen de documentos cargados y fuentes detectadas. Si una alerta aparece como AMBIGUA, usala como aviso para revisar la fuente antes de prometerla al cliente.
      </Notice>
      <CommercialAidAlerts alerts={alerts} />
    </div>
  );
}
