import { WhatsAppGenerator } from "@/components/whatsapp-generator";
import { EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const versions = await prisma.version.findMany({
    include: {
      brand: true,
      model: true,
      prices: { where: { status: "VIGENTE" }, orderBy: { effectiveFrom: "desc" } }
    },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { commercialOrder: "asc" }]
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Generar mensaje para cliente" description="Crea un mensaje editable para WhatsApp usando únicamente datos disponibles." />
      {versions.length ? <WhatsAppGenerator versions={versions} /> : <EmptyState title="No hay vehículos cargados para generar mensajes." description="Cargue versiones aprobadas antes de preparar mensajes comerciales." actionHref="/admin" actionLabel="Administrar catálogo" />}
    </div>
  );
}
