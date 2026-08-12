"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ClipboardCopy, CreditCard, FileCheck2 } from "lucide-react";
import { registerAmicarCreditEvaluation } from "@/lib/actions";
import { formatCLP } from "@/lib/format";

const AMICAR_LOGIN_URL = "https://amices.amicar.com/login";

export type AmicarCustomer = {
  id: string;
  label: string;
  rut: string;
  phone: string;
  email: string;
  interestedVehicle: string;
  statusName: string;
};

export type AmicarQuote = {
  id: string;
  customerId: string;
  title: string;
  totalAmount: number | null;
  vehicleLabel: string;
  dateLabel: string;
};

export type AmicarInitialValues = {
  customerId?: string;
  quoteId?: string;
  vehicleLabel?: string;
  saleAmount?: string;
  financedAmount?: string;
  downPayment?: string;
  installments?: string;
  rate?: string;
};

type AmicarCreditWorkspaceProps = {
  customers: AmicarCustomer[];
  quotes: AmicarQuote[];
  initialValues: AmicarInitialValues;
  today: string;
};

function moneyValue(value: string) {
  return Number.parseInt(value.replace(/[^\d-]/g, "") || "0", 10) || 0;
}

function moneyText(value: string) {
  const parsed = moneyValue(value);
  return parsed ? formatCLP(parsed) : "Pendiente";
}

export function AmicarCreditWorkspace({ customers, quotes, initialValues, today }: AmicarCreditWorkspaceProps) {
  const [customerId, setCustomerId] = useState(initialValues.customerId ?? "");
  const [quoteId, setQuoteId] = useState(initialValues.quoteId ?? "");
  const [vehicleLabel, setVehicleLabel] = useState(initialValues.vehicleLabel ?? "");
  const [saleAmount, setSaleAmount] = useState(initialValues.saleAmount ?? "");
  const [downPayment, setDownPayment] = useState(initialValues.downPayment ?? "");
  const [financedAmount, setFinancedAmount] = useState(initialValues.financedAmount ?? "");
  const [installments, setInstallments] = useState(initialValues.installments ?? "");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [rate, setRate] = useState(initialValues.rate ?? "");
  const [cae, setCae] = useState("");
  const [evaluationResult, setEvaluationResult] = useState("EN_EVALUACION");
  const [nextActionAt, setNextActionAt] = useState("");
  const [nextActionDescription, setNextActionDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;
  const selectedQuote = quotes.find((quote) => quote.id === quoteId) ?? null;
  const currentVehicle = vehicleLabel || selectedQuote?.vehicleLabel || selectedCustomer?.interestedVehicle || "";
  const currentSaleAmount = moneyValue(saleAmount) || selectedQuote?.totalAmount || 0;
  const financedValue = moneyValue(financedAmount);
  const downPaymentValue = moneyValue(downPayment);

  const clipboardText = useMemo(
    () =>
      [
        "AMICAR - Evaluacion credito",
        `Cliente: ${selectedCustomer?.label ?? ""}`,
        `RUT: ${selectedCustomer?.rut || "Pendiente"}`,
        `Telefono: ${selectedCustomer?.phone || "Pendiente"}`,
        `Email: ${selectedCustomer?.email || "Pendiente"}`,
        `Vehiculo: ${currentVehicle || "Pendiente"}`,
        `Precio venta: ${currentSaleAmount ? formatCLP(currentSaleAmount) : "Pendiente"}`,
        `Pie: ${downPaymentValue ? formatCLP(downPaymentValue) : "Pendiente"}`,
        `Monto a financiar: ${financedValue ? formatCLP(financedValue) : "Pendiente"}`,
        `Cuotas: ${installments || "Pendiente"}`,
        `Cuota aprox.: ${moneyText(installmentAmount)}`,
        `Tasa: ${rate || "Pendiente"}`,
        `CAE: ${cae || "Pendiente"}`,
        `Resultado: ${evaluationResult.replaceAll("_", " ")}`,
        observations ? `Observaciones: ${observations}` : ""
      ]
        .filter(Boolean)
        .join("\n"),
    [
      cae,
      currentSaleAmount,
      currentVehicle,
      downPaymentValue,
      evaluationResult,
      financedValue,
      installmentAmount,
      installments,
      observations,
      rate,
      selectedCustomer?.email,
      selectedCustomer?.label,
      selectedCustomer?.phone,
      selectedCustomer?.rut
    ]
  );

  function updateQuote(nextQuoteId: string) {
    setQuoteId(nextQuoteId);
    const quote = quotes.find((item) => item.id === nextQuoteId);
    if (!quote) return;

    setCustomerId(quote.customerId);
    setVehicleLabel(quote.vehicleLabel);
    if (quote.totalAmount) {
      setSaleAmount(String(quote.totalAmount));
      setFinancedAmount(String(Math.max(0, quote.totalAmount - downPaymentValue)));
    }
  }

  function updateDownPayment(value: string) {
    setDownPayment(value);
    const sale = moneyValue(saleAmount) || selectedQuote?.totalAmount || 0;
    if (sale) {
      setFinancedAmount(String(Math.max(0, sale - moneyValue(value))));
    }
  }

  function updateSaleAmount(value: string) {
    setSaleAmount(value);
    const sale = moneyValue(value);
    if (sale) {
      setFinancedAmount(String(Math.max(0, sale - downPaymentValue)));
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(clipboardText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-copper">Evaluacion credito</p>
          <h2 className="mt-1 text-xl font-black text-ink">Datos para Amicar</h2>
          <p className="mt-1 text-sm font-semibold text-steel">
            Cliente, vehiculo, pie y monto quedan listos para copiar y luego registrar el resultado en el CRM.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-secondary" type="button" onClick={copyToClipboard} disabled={!selectedCustomer}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar datos"}
          </button>
          <a className="btn btn-primary" href={AMICAR_LOGIN_URL} target="_blank" rel="noreferrer">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Abrir Amicar
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <form action={registerAmicarCreditEvaluation} className="grid gap-3">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="purchaseDate" value={today} />

          <div className="grid gap-3 lg:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cliente</span>
              <select className="input" name="customerId" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
                <option value="">Seleccionar cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cotizacion</span>
              <select className="input" value={quoteId} onChange={(event) => updateQuote(event.target.value)}>
                <option value="">Sin cotizacion guardada</option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.title} | {quote.dateLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Vehiculo evaluado</span>
            <input className="input" name="vehicleLabel" value={vehicleLabel} onChange={(event) => setVehicleLabel(event.target.value)} placeholder="Marca, modelo y version" />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Precio venta</span>
              <input className="input" name="saleAmount" inputMode="numeric" value={saleAmount} onChange={(event) => updateSaleAmount(event.target.value)} placeholder="Precio con IVA" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Pie</span>
              <input className="input" name="downPayment" inputMode="numeric" value={downPayment} onChange={(event) => updateDownPayment(event.target.value)} placeholder="Pie cliente" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Monto financiado</span>
              <input className="input" name="financedAmount" inputMode="numeric" value={financedAmount} onChange={(event) => setFinancedAmount(event.target.value)} placeholder="A financiar" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cuotas</span>
              <input className="input" name="installments" inputMode="numeric" value={installments} onChange={(event) => setInstallments(event.target.value)} placeholder="Ej: 48" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cuota aprox.</span>
              <input className="input" name="installmentAmount" inputMode="numeric" value={installmentAmount} onChange={(event) => setInstallmentAmount(event.target.value)} placeholder="Valor cuota" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Primera cuota</span>
              <input className="input" name="firstInstallmentDate" type="date" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Tasa</span>
              <input className="input" name="rate" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Tasa Amicar" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">CAE</span>
              <input className="input" name="cae" value={cae} onChange={(event) => setCae(event.target.value)} placeholder="CAE informado" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Resultado</span>
              <select className="input" name="evaluationResult" value={evaluationResult} onChange={(event) => setEvaluationResult(event.target.value)}>
                <option value="EN_EVALUACION">En evaluacion</option>
                <option value="SOLICITAR_DOCUMENTOS">Solicitar documentos</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Proximo seguimiento</span>
              <input className="input" name="nextActionAt" type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Accion pendiente</span>
              <input
                className="input"
                name="nextActionDescription"
                value={nextActionDescription}
                onChange={(event) => setNextActionDescription(event.target.value)}
                placeholder="Ej: revisar respuesta o pedir liquidaciones"
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Observaciones</span>
            <textarea className="input min-h-28" name="observations" value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Comentarios de la evaluacion" />
          </label>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit">
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              Registrar evaluacion
            </button>
            <a className="btn btn-secondary" href={AMICAR_LOGIN_URL} target="_blank" rel="noreferrer">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Ir a Amicar
            </a>
          </div>
        </form>

        <aside className="rounded-lg border border-graphite/10 bg-white p-4">
          <p className="text-xs font-black uppercase text-copper">Resumen para pegar</p>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="rounded-lg bg-mist p-3">
              <p className="font-black text-ink">{selectedCustomer?.label ?? "Cliente pendiente"}</p>
              <p className="mt-1 font-semibold text-steel">
                RUT {selectedCustomer?.rut || "pendiente"} | {selectedCustomer?.phone || "telefono pendiente"}
              </p>
            </div>
            <div className="rounded-lg bg-mist p-3">
              <p className="font-black text-ink">{currentVehicle || "Vehiculo pendiente"}</p>
              <p className="mt-1 font-semibold text-steel">Precio venta: {currentSaleAmount ? formatCLP(currentSaleAmount) : "Pendiente"}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-graphite/10 p-3">
                <dt className="text-xs font-black uppercase text-steel">Pie</dt>
                <dd className="mt-1 font-black text-ink">{downPaymentValue ? formatCLP(downPaymentValue) : "Pendiente"}</dd>
              </div>
              <div className="rounded-lg border border-graphite/10 p-3">
                <dt className="text-xs font-black uppercase text-steel">Financiado</dt>
                <dd className="mt-1 font-black text-ink">{financedValue ? formatCLP(financedValue) : "Pendiente"}</dd>
              </div>
              <div className="rounded-lg border border-graphite/10 p-3">
                <dt className="text-xs font-black uppercase text-steel">Cuotas</dt>
                <dd className="mt-1 font-black text-ink">{installments || "Pendiente"}</dd>
              </div>
              <div className="rounded-lg border border-graphite/10 p-3">
                <dt className="text-xs font-black uppercase text-steel">Cuota</dt>
                <dd className="mt-1 font-black text-ink">{moneyText(installmentAmount)}</dd>
              </div>
            </dl>
          </div>
          <textarea className="input mt-4 min-h-80 font-mono text-xs" value={clipboardText} readOnly aria-label="Datos listos para copiar a Amicar" />
        </aside>
      </div>
    </section>
  );
}
