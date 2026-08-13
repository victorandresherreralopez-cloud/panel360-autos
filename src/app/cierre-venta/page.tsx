import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { formatCLP, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CierreVentaPage() {
  const [recentSales, versions, customers] = await Promise.all([
    prisma.sale.findMany({
      take: 10,
      orderBy: { saleDate: "desc" },
      include: { customer: true }
    }),
    prisma.version.findMany({
      take: 100,
      orderBy: { commercialOrder: "asc" },
      include: { brand: true, model: true }
    }),
    prisma.customer.findMany({
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, rut: true }
    })
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="VENTA & CIERRE"
        title="Cierre de Venta y Registro de Contrato"
        description="Formaliza el cierre de una venta comercial vinculando al cliente con el vehículo, forma de pago (Contado / Crédito) y fechas clave para postventa y renovación."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* FORM PANEL */}
        <Panel>
          <p className="text-xs font-black uppercase text-teal-600 dark:text-teal-400">Paso Final del Proceso Comercial</p>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Registrar Cierre Comercial</h2>

          <form className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 md:col-span-2">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Cliente</span>
                <select className="input text-sm" required name="customerId">
                  <option value="">Selecciona cliente registrado</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName ?? ""} {c.rut ? `(${c.rut})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Marca</span>
                <input className="input text-sm" name="brandName" placeholder="Ej: Mazda" required />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Modelo</span>
                <input className="input text-sm" name="modelName" placeholder="Ej: CX-5" required />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Versión</span>
                <input className="input text-sm" name="versionName" placeholder="Ej: GT 2.5 AWD" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Precio Final Acordado ($)</span>
                <input className="input text-sm" type="number" name="agreedPrice" placeholder="Ej: 15990000" required />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Forma de Pago</span>
                <select className="input text-sm" name="paymentMethod" required>
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito / Financiamiento</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Fecha de Venta</span>
                <input className="input text-sm" type="date" name="saleDate" required />
              </label>

              {/* Crédito section */}
              <div className="md:col-span-2 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-4">
                <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Si es Crédito — Datos de Financiamiento</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Financiera</span>
                    <input className="input text-sm" name="financialEntity" placeholder="Ej: Amicar / Forum / Tanner" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Monto Financiado ($)</span>
                    <input className="input text-sm" type="number" name="financedAmount" placeholder="Ej: 12000000" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Pie ($)</span>
                    <input className="input text-sm" type="number" name="downPayment" placeholder="Ej: 3990000" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Nº Cuotas</span>
                    <input className="input text-sm" type="number" name="installments" placeholder="Ej: 48" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Valor Cuota Mensual ($)</span>
                    <input className="input text-sm" type="number" name="installmentAmount" placeholder="Ej: 290000" />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Fecha Primera Cuota</span>
                    <input className="input text-sm" type="date" name="firstInstallmentDate" />
                  </label>

                  <label className="grid gap-1.5 md:col-span-2">
                    <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">⚠ Fecha Última Cuota (Obligatoria para Renovaciones)</span>
                    <input className="input text-sm border-amber-300 dark:border-amber-700" type="date" name="lastInstallmentDate" />
                    <p className="text-xs text-slate-400">Esta fecha activa automáticamente las alertas de renovación a 30, 60 y 90 días antes del vencimiento.</p>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar y Registrar Cierre de Venta
            </button>
          </form>
        </Panel>

        {/* RECENT SALES LOG */}
        <Panel>
          <p className="text-xs font-black uppercase text-amber-500">Historial</p>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Últimos Cierres Registrados</h3>

          <div className="mt-4 space-y-3">
            {recentSales.length ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 text-xs">
                  <p className="font-black text-slate-900 dark:text-white">
                    {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}` : "Cliente"}
                  </p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                    {sale.brandName} {sale.modelName} {sale.versionName ?? ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    <span>{sale.agreedPrice ? formatCLP(sale.agreedPrice) : "—"}</span>
                    <span className="text-slate-400">{formatDateTime(sale.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Aún no hay ventas registradas. Usa el formulario de la izquierda para registrar el primer cierre.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
