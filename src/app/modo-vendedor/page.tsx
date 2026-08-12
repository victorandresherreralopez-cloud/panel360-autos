import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { missing } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SellerModePage() {
  const versions = await prisma.version.findMany({
    include: { brand: true, model: true },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { commercialOrder: "asc" }]
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Modo vendedor" description="Argumentos de venta basados solo en la información cargada para cada versión." />
      {versions.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {versions.map((version) => (
            <Panel key={version.id}>
              <h2 className="text-xl font-black text-ink">
                {version.brand.name} {version.model.name} {version.name}
              </h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-copper">Ideal para</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-steel">{missing(version.observations)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-copper">Destaca por</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-steel">{missing(version.equipmentSummary)}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-copper">Preguntas para el cliente</p>
                  <ul className="mt-2 grid gap-2 text-sm font-semibold text-graphite">
                    <li>¿Lo utilizará principalmente en ciudad o carretera?</li>
                    <li>¿Necesita realmente 4x4?</li>
                    <li>¿Prefiere priorizar precio o equipamiento?</li>
                  </ul>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay versiones para preparar argumentos." description="Cuando cargue versiones y equipamiento aprobado, esta pantalla generará apoyo comercial sin inventar datos." actionHref="/admin" actionLabel="Cargar versión" />
      )}
    </div>
  );
}
