"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardCheck, CreditCard } from "lucide-react";
import { saveQuote } from "@/lib/actions";
import { formatCLP } from "@/lib/format";
import { getPricingBreakdown } from "@/lib/pricing-breakdown";
import { ProfitabilitySheet, type FormState, type ProfitabilityVehicle } from "@/components/profitability-sheet";

type QuoteCustomer = {
  id: string;
  label: string;
  email: string;
};

type QuoteProfitabilityWorkspaceProps = {
  vehicles: ProfitabilityVehicle[];
  customers: QuoteCustomer[];
  today: string;
  initialVersionId?: string;
  initialCustomerId?: string;
};

function moneyValue(value: string) {
  return Number.parseInt(value.replace(/[^\d-]/g, "") || "0", 10) || 0;
}

export function QuoteProfitabilityWorkspace({ vehicles, customers, today, initialVersionId = "", initialCustomerId = "" }: QuoteProfitabilityWorkspaceProps) {
  const [selectedVersionId, setSelectedVersionId] = useState(initialVersionId);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [discount, setDiscount] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [installments, setInstallments] = useState("");
  const [rate, setRate] = useState("");
  const [conditions, setConditions] = useState("");

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVersionId) ?? null;
  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;
  const discountAmount = moneyValue(discount);
  const basePrice = selectedVehicle?.campaignPrice ?? selectedVehicle?.listPrice ?? 0;
  const quoteTotal = Math.max(0, basePrice - discountAmount);

  const profitabilityState = useMemo<Partial<FormState>>(
    () => ({
      selectedVersionId,
      customerName: selectedCustomer?.label ?? "",
      customerEmail: selectedCustomer?.email ?? "",
      discountSergio: discountAmount,
      salePriceWithVat: quoteTotal,
      notes: conditions
    }),
    [conditions, discountAmount, quoteTotal, selectedCustomer?.email, selectedCustomer?.label, selectedVersionId]
  );

  const syncKey = [selectedVersionId, customerId, discountAmount, quoteTotal, conditions].join("|");
  const amicarHref = useMemo(() => {
    const params = new URLSearchParams();
    if (customerId) params.set("customerId", customerId);
    if (selectedVehicle?.label) params.set("vehicleLabel", selectedVehicle.label);
    if (quoteTotal) {
      params.set("saleAmount", String(quoteTotal));
      params.set("financedAmount", String(Math.max(0, quoteTotal - moneyValue(downPayment))));
    }
    if (downPayment) params.set("downPayment", String(moneyValue(downPayment)));
    if (installments) params.set("installments", installments);
    if (rate) params.set("rate", rate);

    const query = params.toString();
    return `/creditos${query ? `?${query}` : ""}`;
  }, [customerId, downPayment, installments, quoteTotal, rate, selectedVehicle?.label]);

  return (
    <div className="grid gap-6">
      <section className="panel no-print rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-copper">Cotizacion + rentabilidad</p>
            <h2 className="mt-1 text-xl font-black text-ink">Cotiza y revisa margen en paralelo</h2>
            <p className="mt-1 text-sm font-semibold text-steel">
              La version, cliente y descuento alimentan automaticamente la hoja de rentabilidad de abajo.
            </p>
          </div>
          <div className="rounded-lg border border-graphite/10 bg-white p-3 text-sm font-black text-ink">
            Total cotizacion: <span className="text-signal">{formatCLP(quoteTotal || null)}</span>
          </div>
        </div>

        <form action={saveQuote} className="mt-5 grid gap-3 lg:grid-cols-4">
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-black uppercase text-steel">Vehiculo</span>
            <select className="input" name="versionId" value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)} required>
              <option value="">Marca, modelo y version</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label} {vehicle.citCode ? `| CIT ${vehicle.citCode}` : "| CIT pendiente"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Cliente</span>
            <select className="input" name="customerId" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Cliente opcional</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Descuento aprobado</span>
            <input className="input" name="discount" inputMode="numeric" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="Ej: 500000" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Pie</span>
            <input className="input" name="downPayment" inputMode="numeric" value={downPayment} onChange={(event) => setDownPayment(event.target.value)} placeholder="Pie" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Cuotas</span>
            <input className="input" name="installments" inputMode="numeric" value={installments} onChange={(event) => setInstallments(event.target.value)} placeholder="Cuotas" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Tasa informada</span>
            <input className="input" name="rate" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Tasa" />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Condiciones</span>
            <input className="input" name="conditions" value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder="Condiciones" />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
            <button className="btn btn-primary" type="submit">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Guardar cotizacion
            </button>
            <Link className="btn btn-secondary" href={amicarHref}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Evaluar credito Amicar
            </Link>
            <p className="text-sm font-semibold text-steel">
              Base usada: {formatCLP(basePrice || null)} | Descuento: {formatCLP(discountAmount || null)}
            </p>
          </div>
        </form>

        {/* TARJETA DE DESGLOSE COMERCIAL DETALLADO */}
        {selectedVehicle ? (() => {
          const breakdown = getPricingBreakdown({
            brandName: selectedVehicle.brandName,
            modelName: selectedVehicle.modelName,
            versionName: selectedVehicle.versionName,
            segment: selectedVehicle.segment,
            equipmentSummary: selectedVehicle.equipmentSummary,
            citCode: selectedVehicle.citCode,
            prices: selectedVehicle.prices ?? []
          });

          return (
            <div className="mt-6 rounded-xl border border-graphite/15 bg-slate-900 p-5 text-white shadow-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="rounded bg-rose-600 px-2.5 py-1 text-xs font-black uppercase text-white tracking-wider">
                    {selectedVehicle.brandName} — Desglose Comercial Completo
                  </span>
                  <h3 className="mt-2 text-xl font-black text-white">{selectedVehicle.label}</h3>
                </div>
                {breakdown.isCommercialVehicle ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/40">
                    🚚 Vehículo Comercial / Pickup (Apto Factura Sin IVA)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-400 border border-blue-500/40">
                    🚗 Vehículo Pasajeros
                  </span>
                )}
              </div>

              {/* BLOQUE DE VALOR SIN IVA PARA CAMIONETAS */}
              {breakdown.isCommercialVehicle && breakdown.cashNetPrice ? (
                <div className="mt-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    💼 Valor Especial Empresa / Facturación (Sin IVA)
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-emerald-300">Valor Neto (Sin IVA - Contado):</p>
                      <p className="text-2xl font-black text-emerald-400">{formatCLP(breakdown.cashNetPrice)}</p>
                      <p className="text-xs text-emerald-300/80">+ IVA (19%): {formatCLP(breakdown.cashVatAmount)}</p>
                    </div>
                    {breakdown.financingNetPrice ? (
                      <div>
                        <p className="text-xs text-emerald-300">Valor Neto (Sin IVA - Financiamiento todos los bonos):</p>
                        <p className="text-2xl font-black text-emerald-400">{formatCLP(breakdown.financingNetPrice)}</p>
                        <p className="text-xs text-emerald-300/80">+ IVA (19%): {formatCLP(breakdown.financingVatAmount)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* COMPARATIVA DE PRECIOS Y BONOS */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/5 p-3.5 border border-white/10">
                  <p className="text-xs font-bold uppercase text-slate-400">1. Precio Lista Público</p>
                  <p className="mt-1 text-lg font-black text-slate-200">{formatCLP(breakdown.listPrice)}</p>
                  <p className="text-xs text-slate-400 mt-1">Sin aplicación de bonos</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3.5 border border-white/10">
                  <p className="text-xs font-bold uppercase text-slate-400">2. Precio Contado (con Bono Marca)</p>
                  <p className="mt-1 text-xl font-black text-rose-400">{formatCLP(breakdown.cashPrice)}</p>
                  {breakdown.brandBonus ? <p className="text-xs font-bold text-emerald-400 mt-1">Ahorro Bono Marca: -{formatCLP(breakdown.brandBonus)}</p> : <p className="text-xs text-slate-400 mt-1">Sin bono marca vigente</p>}
                </div>
                <div className="rounded-lg bg-white/10 p-3.5 border border-rose-500/40 bg-rose-950/20">
                  <p className="text-xs font-bold uppercase text-rose-400">3. Financiamiento (Todos los Bonos)</p>
                  <p className="mt-1 text-2xl font-black text-emerald-400">{formatCLP(breakdown.financingPrice)}</p>
                  <p className="text-xs font-bold text-emerald-300 mt-1">Ahorro Total: -{formatCLP(breakdown.totalBonus)}</p>
                </div>
              </div>

              {/* GASTOS DE ENTREGA (LLAVE EN MANO) */}
              <div className="mt-4 rounded-lg bg-white/5 p-4 border border-white/10">
                <p className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  📦 Gastos Operacionales & Puesta en Calle (Llave en Mano)
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4 text-xs">
                  <div className="rounded bg-black/30 p-2.5">
                    <span className="text-slate-400 block">Flete e Inscripción:</span>
                    <strong className="text-white text-sm">{formatCLP(breakdown.estimatedFreight + breakdown.estimatedRegistration)}</strong>
                  </div>
                  <div className="rounded bg-black/30 p-2.5">
                    <span className="text-slate-400 block">Impuesto Verde (Est.):</span>
                    <strong className="text-white text-sm">{formatCLP(breakdown.estimatedGreenTax)}</strong>
                  </div>
                  <div className="rounded bg-black/30 p-2.5">
                    <span className="text-slate-400 block">Permiso Circulación (Est.):</span>
                    <strong className="text-white text-sm">{formatCLP(breakdown.estimatedPermit)}</strong>
                  </div>
                  <div className="rounded bg-emerald-950/80 border border-emerald-500/40 p-2.5">
                    <span className="text-emerald-400 font-bold block">TOTAL LLAVE EN MANO:</span>
                    <strong className="text-emerald-300 text-base">{formatCLP(breakdown.estimatedKeyInHandCash)}</strong>
                  </div>
                </div>
              </div>

              {/* ALERTAS DE BONOS MARCA + CREDITO Y CAMPAÑAS */}
              {breakdown.creditBonusAlert || breakdown.campaignAlerts.length ? (
                <div className="mt-4 grid gap-2">
                  {breakdown.creditBonusAlert ? (
                    <div className="rounded-lg bg-sky-500/20 border border-sky-500/40 p-3 text-xs font-bold text-sky-300 flex items-center gap-2">
                      💳 Bono Marca + Crédito: {breakdown.creditBonusAlert}
                    </div>
                  ) : null}

                  {breakdown.campaignAlerts.map((alert) => (
                    <div key={alert} className="rounded bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      • {alert}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })() : null}
      </section>

      <ProfitabilitySheet vehicles={vehicles} today={today} initialState={profitabilityState} syncKey={syncKey} hideVehicleSelector />
    </div>
  );
}
