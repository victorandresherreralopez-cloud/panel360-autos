import Link from "next/link";
import { updateCustomerStatus } from "@/lib/actions";
import { SALES_STAGES } from "@/lib/constants";
import { formatCLP, formatDateTime, fullName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CustomerRutForm } from "@/components/customer-rut-form";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, statuses, origins, versions] = await Promise.all([
    prisma.customer.findMany({
      include: { status: true, origin: true, quotes: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.customerStatus.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.customerOrigin.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.version.findMany({ include: { brand: true, model: true }, orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { name: "asc" }] })
  ]);

  const catalog = {
    brands: Array.from(new Set(versions.map((v) => v.brand.name))).sort((a, b) => a.localeCompare(b)),
    models: Array.from(new Set(versions.map((v) => `${v.brand.name} ${v.model.name}`))).sort((a, b) => a.localeCompare(b)),
    versions: Array.from(new Set(versions.map((v) => `${v.brand.name} ${v.model.name} ${v.name}`))).sort((a, b) => a.localeCompare(b))
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Clientes" description="Mini CRM para registrar prospectos, proximos pasos y oportunidades comerciales." />

      <Panel>
        <h2 className="text-xl font-black text-ink">Nuevo cliente</h2>
        <CustomerRutForm
          statuses={statuses.map((status) => ({ id: status.id, name: status.name }))}
          origins={origins.map((origin) => ({ id: origin.id, name: origin.name }))}
          catalog={catalog}
        />
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink">Embudo de ventas</h2>
          <StatusPill>{customers.length} clientes</StatusPill>
        </div>
        {customers.length ? (
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {SALES_STAGES.map((stage) => {
              const stageCustomers = customers.filter((customer) => customer.status?.stage === stage || customer.status?.name === stage);
              return (
                <div key={stage} className="w-72 shrink-0 rounded-lg border border-graphite/10 bg-mist/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase text-graphite">{stage}</p>
                    <StatusPill>{stageCustomers.length}</StatusPill>
                  </div>
                  <div className="grid gap-3">
                    {stageCustomers.map((customer) => (
                      <div key={customer.id} className="rounded-lg bg-white p-3 shadow-sm">
                        <Link href={`/clientes/${customer.id}`} className="font-black text-ink">
                          {fullName(customer.firstName, customer.lastName)}
                        </Link>
                        <p className="mt-1 text-xs font-semibold text-steel">
                          {customer.interestedModel ?? "Vehiculo pendiente"} | {customer.interestedVersion ?? "Version pendiente"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-steel">Ultimo contacto: {customer.lastContactAt ? formatDateTime(customer.lastContactAt) : "Sin contacto registrado"}</p>
                        <p className="mt-1 text-xs font-semibold text-steel">Proxima accion: {customer.nextActionType ?? "Sin accion"}</p>
                        <p className="mt-1 text-xs font-semibold text-steel">Monto cotizado: {formatCLP(customer.quotes[0]?.totalAmount)}</p>
                        <form action={updateCustomerStatus} className="mt-3 grid gap-2">
                          <input type="hidden" name="customerId" value={customer.id} />
                          <select className="input text-xs" name="statusId" defaultValue={customer.statusId ?? ""}>
                            {statuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                          <button className="btn btn-secondary text-xs" type="submit">
                            Mover
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Todavia no hay clientes registrados." description="Agrega el primer prospecto para activar embudo, agenda y seguimientos." />
        )}
      </Panel>
    </div>
  );
}
