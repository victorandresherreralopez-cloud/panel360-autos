import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { addCreditContract, addCustomerActivity, addReminder, updateCustomerStatus } from "@/lib/actions";
import { formatCLP, formatDate, formatDateTime, fullName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PageHeader, Panel, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, statuses] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        origin: true,
        activities: { orderBy: { activityAt: "desc" } },
        reminders: { orderBy: { dueAt: "asc" } },
        credits: { orderBy: { createdAt: "desc" } },
        vehicles: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" }, include: { items: true } }
      }
    }),
    prisma.customerStatus.findMany({ orderBy: { position: "asc" } })
  ]);

  if (!customer) notFound();

  return (
    <div className="grid gap-6">
      <PageHeader
        title={fullName(customer.firstName, customer.lastName)}
        description={`${customer.status?.name ?? "Sin estado"} | ${customer.origin?.name ?? "Origen no informado"} | ${customer.interestedModel ?? "Vehiculo pendiente"}`}
      />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Ficha del cliente</h2>
            <StatusPill>{customer.status?.name ?? "Sin estado"}</StatusPill>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-black text-steel">Contacto</dt>
              <dd className="font-semibold text-graphite">{customer.phone ?? "Telefono pendiente"} | {customer.email ?? "Email pendiente"}</dd>
            </div>
            <div>
              <dt className="font-black text-steel">RUT</dt>
              <dd className="font-semibold text-graphite">{customer.rut ?? "RUT pendiente"}</dd>
            </div>
            <div>
              <dt className="font-black text-steel">Direccion</dt>
              <dd className="font-semibold leading-6 text-graphite">
                {[customer.address, customer.commune, customer.city, customer.region].filter(Boolean).join(", ") || "Direccion pendiente"}
              </dd>
            </div>
            <div>
              <dt className="font-black text-steel">Interes</dt>
              <dd className="font-semibold text-graphite">
                {[customer.interestedBrand, customer.interestedModel, customer.interestedVersion].filter(Boolean).join(" ") || "Informacion pendiente de cargar"}
              </dd>
            </div>
            <div>
              <dt className="font-black text-steel">Presupuesto</dt>
              <dd className="font-semibold text-graphite">{formatCLP(customer.budget)}</dd>
            </div>
            <div>
              <dt className="font-black text-steel">Cumpleanos</dt>
              <dd className="font-semibold text-graphite">{customer.birthDate ? formatDate(customer.birthDate) : "Fecha pendiente"}</dd>
            </div>
            <div>
              <dt className="font-black text-steel">Notas</dt>
              <dd className="font-semibold leading-6 text-graphite">{customer.notes ?? "Sin observaciones"}</dd>
            </div>
          </dl>

          <form action={updateCustomerStatus} className="mt-5 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input" name="statusId" defaultValue={customer.statusId ?? ""}>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary w-fit" type="submit">
              Actualizar estado
            </button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Linea de tiempo</h2>
          <form action={addCustomerActivity} className="mt-4 grid gap-3 md:grid-cols-[0.35fr_1fr_auto]">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input" name="type" required>
              {["LLAMADO", "WHATSAPP", "COTIZACION", "SEGUIMIENTO", "CREDITO", "RESERVA", "ENTREGA", "POSTVENTA", "OTRO"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input className="input" name="description" placeholder="Detalle de actividad" required />
            <button className="btn btn-primary" type="submit">
              Agregar
            </button>
          </form>
          <div className="mt-5 grid gap-3">
            {customer.activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                <p className="font-black text-ink">{activity.type}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-steel">{activity.description}</p>
                <p className="mt-1 text-xs font-semibold text-steel">{formatDateTime(activity.activityAt)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <h2 className="text-xl font-black text-ink">Proxima accion</h2>
          <form action={addReminder} className="mt-4 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input" name="type" required>
              {["LLAMAR", "WHATSAPP", "ENVIAR COTIZACION", "SEGUIMIENTO", "SOLICITAR DOCUMENTOS", "REVISAR CREDITO", "AGENDAR TEST DRIVE", "RESERVA", "ENTREGA", "POSTVENTA", "RENOVACION", "OTRO"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input className="input" name="dueAt" type="datetime-local" required />
            <select className="input" name="priority">
              {["BAJA", "NORMAL", "ALTA", "URGENTE"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <textarea className="input min-h-24" name="description" placeholder="Descripcion" required />
            <button className="btn btn-primary w-fit" type="submit">
              Guardar recordatorio
            </button>
          </form>
          <div className="mt-4 grid gap-2">
            {customer.reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-lg border border-graphite/10 bg-white p-3">
                <p className="text-sm font-black text-ink">{reminder.type}</p>
                <p className="text-xs font-semibold text-steel">{formatDateTime(reminder.dueAt)} | {reminder.status}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-ink">Credito</h2>
            <Link className="btn btn-secondary" href={`/creditos?customerId=${customer.id}`}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Amicar
            </Link>
          </div>
          <form action={addCreditContract} className="mt-4 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <input className="input" name="financialEntity" placeholder="Entidad financiera" />
            <input className="input" name="purchaseDate" type="date" />
            <input className="input" name="firstInstallmentDate" type="date" />
            <input className="input" name="installments" placeholder="Cantidad de cuotas" type="number" />
            <input className="input" name="lastInstallmentDate" type="date" />
            <input className="input" name="financedAmount" placeholder="Monto financiado" />
            <input className="input" name="downPayment" placeholder="Pie" />
            <input className="input" name="installmentAmount" placeholder="Cuota aproximada" />
            <input className="input" name="rate" placeholder="Tasa si esta informada" />
            <input className="input" name="cae" placeholder="CAE si esta informado" />
            <textarea className="input min-h-24" name="observations" placeholder="Observaciones" />
            <button className="btn btn-primary w-fit" type="submit">
              Registrar credito
            </button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Historial comercial</h2>
          <div className="mt-4 grid gap-3">
            {customer.quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg border border-graphite/10 bg-white p-3">
                <p className="text-sm font-black text-ink">{quote.title}</p>
                <p className="text-xs font-semibold text-steel">Total: {formatCLP(quote.totalAmount)}</p>
              </div>
            ))}
            {customer.credits.map((credit) => (
              <div key={credit.id} className="rounded-lg border border-graphite/10 bg-white p-3">
                <p className="text-sm font-black text-ink">Credito {credit.financialEntity ?? ""}</p>
                <p className="text-xs font-semibold text-steel">
                  Termino: {credit.lastInstallmentDate ? formatDate(credit.lastInstallmentDate) : "Fecha pendiente"} | {credit.endDateSource ?? "Sin fuente"}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
