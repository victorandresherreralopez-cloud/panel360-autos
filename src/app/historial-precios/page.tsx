import { PageHeader, Panel } from "@/components/ui";
import { formatCLP, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PriceHistoryPage() {
  const history = await prisma.priceHistory.findMany({
    include: { version: { include: { brand: true, model: true } } },
    orderBy: { changedAt: "desc" }
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Historial de precios" description="Los precios anteriores no se eliminan. Cada cambio mantiene fuente, usuario y diferencia." />
      <Panel>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vehículo</th>
                <th>Tipo</th>
                <th>Anterior</th>
                <th>Nuevo</th>
                <th>Diferencia</th>
                <th>Fuente</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.changedAt)}</td>
                  <td className="font-black text-ink">
                    {item.version.brand.name} {item.version.model.name} {item.version.name}
                  </td>
                  <td>{item.priceType}</td>
                  <td>{formatCLP(item.previousAmount)}</td>
                  <td>{formatCLP(item.newAmount)}</td>
                  <td>{item.difference === null ? "Nuevo" : formatCLP(item.difference)}</td>
                  <td>{item.sourceName ?? "Fuente no informada"}</td>
                  <td>{item.approvedBy ?? "Usuario no informado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
