import Link from "next/link";
import { PageHeader, Panel, StatusPill } from "@/components/ui";
import { SearchForm } from "@/components/search-form";
import { formatCLP } from "@/lib/format";
import { searchAll } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const results = await searchAll(q);
  const total = results.brands.length + results.models.length + results.versions.length + results.customers.length + results.campaigns.length;

  return (
    <div className="grid gap-6">
      <PageHeader title="Buscador inteligente" description="Busca vehículos, clientes y promociones. Las respuestas usan únicamente datos cargados y aprobados." />
      <SearchForm defaultValue={q} />

      {!q ? (
        <Panel>
          <p className="text-sm font-semibold text-steel">Escriba una consulta como &quot;¿Cuánto está el H6 hoy?&quot; o &quot;clientes con crédito por renovar&quot;.</p>
        </Panel>
      ) : total === 0 ? (
        <Panel>
          <p className="text-sm font-black text-ink">Información no disponible en las fuentes cargadas</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel">No encontré coincidencias aprobadas para &quot;{q}&quot;.</p>
        </Panel>
      ) : (
        <div className="grid gap-5">
          <Panel>
            <h2 className="text-lg font-black text-ink">Vehículos</h2>
            <div className="mt-4 grid gap-3">
              {[...results.models, ...results.versions].map((item) => {
                const isVersion = "model" in item;
                const label = isVersion ? `${item.brand.name} ${item.model.name} ${item.name}` : `${item.brand.name} ${item.name}`;
                const price = isVersion ? item.prices.find((priceItem) => priceItem.priceType === "LIST")?.amount : null;
                return (
                  <Link key={`${isVersion ? "v" : "m"}-${item.id}`} href={`/vehiculos?q=${encodeURIComponent(label)}`} className="rounded-lg border border-graphite/10 bg-white p-4">
                    <p className="font-black text-ink">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-steel">{isVersion ? `Precio lista: ${formatCLP(price)}` : "Modelo cargado"}</p>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-black text-ink">Clientes</h2>
            <div className="mt-4 grid gap-3">
              {results.customers.length ? (
                results.customers.map((customer) => (
                  <Link key={customer.id} href={`/clientes/${customer.id}`} className="rounded-lg border border-graphite/10 bg-white p-4">
                    <p className="font-black text-ink">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-steel">
                      {customer.interestedModel ?? "Vehículo pendiente"} · {customer.status?.name ?? "Sin estado"}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm font-semibold text-steel">Sin clientes relacionados.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-black text-ink">Promociones</h2>
            <div className="mt-4 grid gap-3">
              {results.campaigns.length ? (
                results.campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                    <p className="font-black text-ink">{campaign.title}</p>
                    <p className="mt-1 text-sm font-semibold text-steel">{campaign.benefit ?? "Beneficio pendiente de cargar"}</p>
                    <StatusPill>{campaign.status}</StatusPill>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-steel">Sin promociones relacionadas.</p>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
