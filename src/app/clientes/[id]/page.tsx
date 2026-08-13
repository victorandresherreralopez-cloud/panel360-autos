import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, PlusCircle } from "lucide-react";
import { addCreditContract, addCustomerActivity, addReminder, updateCustomerStatus } from "@/lib/actions";
import { formatCLP, formatDate, formatDateTime, fullName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PageHeader, Panel, StatusPill } from "@/components/ui";
import { CustomerFicha360 } from "@/components/customer-ficha360";

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
        quotes: { orderBy: { createdAt: "desc" } },
        sales: { orderBy: { saleDate: "desc" } }
      }
    }),
    prisma.customerStatus.findMany({ orderBy: { position: "asc" } })
  ]);

  if (!customer) notFound();

  const name = fullName(customer.firstName, customer.lastName);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/clientes"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Volver a Clientes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <PageHeader
            eyebrow={`${customer.rut ?? "RUT no registrado"} · ${customer.status?.name ?? "Sin estado"}`}
            title={`Ficha 360 — ${name}`}
            description={`Origen: ${customer.origin?.name ?? "No informado"} · Última actualización: ${formatDateTime(customer.updatedAt)}`}
          />
        </div>
      </div>

      {/* FICHA 360 CON PESTAÑAS */}
      <CustomerFicha360
        customer={customer}
        formatCLP={formatCLP}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
      />

      {/* ACTIONS: Estado + Agregar Actividad + Recordatorio + Crédito */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Cambiar estado */}
        <Panel>
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Gestión</p>
          <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Estado del Cliente</h3>
          <form action={updateCustomerStatus} className="mt-4 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input text-sm" name="statusId" defaultValue={customer.statusId ?? ""}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button className="btn btn-primary w-fit" type="submit">Actualizar estado</button>
          </form>
        </Panel>

        {/* Agregar actividad */}
        <Panel>
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Línea de Tiempo</p>
          <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Registrar Actividad</h3>
          <form action={addCustomerActivity} className="mt-4 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input text-sm" name="type" required>
              {["LLAMADO", "WHATSAPP", "COTIZACION", "SEGUIMIENTO", "CREDITO", "RESERVA", "ENTREGA", "POSTVENTA", "RENOVACION", "OTRO"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input className="input text-sm" name="description" placeholder="Detalle de la actividad" required />
            <button className="btn btn-primary w-fit" type="submit">
              <PlusCircle className="h-3.5 w-3.5" /> Agregar
            </button>
          </form>
        </Panel>

        {/* Recordatorio */}
        <Panel>
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Agenda</p>
          <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Próxima Acción</h3>
          <form action={addReminder} className="mt-4 grid gap-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <select className="input text-sm" name="type" required>
              {["LLAMAR", "WHATSAPP", "ENVIAR COTIZACION", "SEGUIMIENTO", "SOLICITAR DOCUMENTOS", "REVISAR CREDITO", "AGENDAR TEST DRIVE", "RESERVA", "ENTREGA", "POSTVENTA", "RENOVACION", "OTRO"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input className="input text-sm" name="dueAt" type="datetime-local" required />
            <select className="input text-sm" name="priority">
              {["BAJA", "NORMAL", "ALTA", "URGENTE"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <textarea className="input min-h-20 text-sm" name="description" placeholder="Descripción del recordatorio" required />
            <button className="btn btn-primary w-fit" type="submit">
              <PlusCircle className="h-3.5 w-3.5" /> Guardar recordatorio
            </button>
          </form>
        </Panel>
      </div>

      {/* REGISTRAR CRÉDITO (inline, sin modal) */}
      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Financiamiento</p>
            <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">Registrar Contrato de Crédito</h3>
          </div>
          <Link href={`/creditos?customerId=${customer.id}`} className="btn btn-secondary">
            <CreditCard className="h-4 w-4" /> Amicar
          </Link>
        </div>
        <form action={addCreditContract} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <input className="input text-sm" name="financialEntity" placeholder="Financiera (ej: Amicar)" />
          <input className="input text-sm" name="purchaseDate" type="date" title="Fecha de compra" />
          <input className="input text-sm" name="installments" placeholder="Nº cuotas" type="number" />
          <input className="input text-sm" name="installmentAmount" placeholder="Valor cuota ($)" type="number" />
          <input className="input text-sm" name="financedAmount" placeholder="Monto financiado ($)" type="number" />
          <input className="input text-sm" name="downPayment" placeholder="Pie ($)" type="number" />
          <input className="input text-sm" name="firstInstallmentDate" type="date" title="Primera cuota" />
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">⚠ Fecha Última Cuota</span>
            <input className="input text-sm border-amber-300 dark:border-amber-700" name="lastInstallmentDate" type="date" />
          </label>
          <input className="input text-sm" name="rate" placeholder="Tasa %" />
          <input className="input text-sm" name="cae" placeholder="CAE %" />
          <textarea className="input min-h-16 text-sm sm:col-span-2" name="observations" placeholder="Observaciones del contrato" />
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button className="btn btn-primary" type="submit">
              <CreditCard className="h-4 w-4" /> Registrar contrato de crédito
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
