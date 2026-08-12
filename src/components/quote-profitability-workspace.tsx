"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardCheck, CreditCard } from "lucide-react";
import { saveQuote } from "@/lib/actions";
import { formatCLP } from "@/lib/format";
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
      </section>

      <ProfitabilitySheet vehicles={vehicles} today={today} initialState={profitabilityState} syncKey={syncKey} hideVehicleSelector />
    </div>
  );
}
