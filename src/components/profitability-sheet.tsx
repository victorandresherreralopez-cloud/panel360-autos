"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Mail, Printer, RotateCcw } from "lucide-react";
import { formatCLP } from "@/lib/format";
import { sendRentabilidadEmail } from "@/app/rentabilidad/email-action";

export type ProfitabilityVehicle = {
  id: string;
  label: string;
  brandName: string;
  modelName: string;
  versionName: string;
  segment?: string | null;
  equipmentSummary?: string | null;
  citCode: string | null;
  listPrice: number | null;
  campaignPrice: number | null;
  cashPrice?: number | null;
  financingPrice?: number | null;
  prices?: Array<{
    priceType: string;
    amount: number;
    status?: string | null;
    channel?: string | null;
    bonusName?: string | null;
    bonusAmount?: number | null;
    hasIva?: boolean | null;
    effectiveFrom?: Date | string | null;
  }>;
};

type ProfitabilitySheetProps = {
  vehicles: ProfitabilityVehicle[];
  today: string;
  initialState?: Partial<FormState>;
  syncKey?: string;
  hideVehicleSelector?: boolean;
};

export type FormState = {
  selectedVersionId: string;
  orderNumber: string;
  internalNumber: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: string;
  priceListGross: number;
  brandBonusGross: number;
  salePriceWithVat: number;
  fleteOsorno: number;
  rubberFloor: number;
  safetyKit: number;
  trins: number;
  registration: number;
  greenTax: number;
  soap: number;
  circulationPermit: number;
  accGrabado: number;
  maintenance: number;
  interests: number;
  others: number;
  discountSergio: number;
  amicarSergio: number;
  amicarMarca: number;
  aporteAdicMarca: number;
  aportePtteMarca: number;
  creditMargin: number;
  marginPercent: number;
  tradeInValue: number;
  notes: string;
};

const vatRate = 1.19;
const utmByMonth2026: Record<number, number> = {
  1: 69751,
  2: 69611,
  3: 69889,
  4: 69889,
  5: 70588,
  6: 71506,
  7: 71649,
  8: 71649
};

const defaultState: FormState = {
  selectedVersionId: "",
  orderNumber: "",
  internalNumber: "",
  customerName: "",
  customerEmail: "",
  invoiceDate: "",
  priceListGross: 0,
  brandBonusGross: 0,
  salePriceWithVat: 0,
  fleteOsorno: 380600,
  rubberFloor: 35988,
  safetyKit: 23988,
  trins: 34280,
  registration: 82230,
  greenTax: 0,
  soap: 22000,
  circulationPermit: 0,
  accGrabado: 0,
  maintenance: 0,
  interests: 0,
  others: 0,
  discountSergio: 0,
  amicarSergio: 0,
  amicarMarca: 0,
  aporteAdicMarca: 0,
  aportePtteMarca: 0,
  creditMargin: 0,
  marginPercent: 7,
  tradeInValue: 0,
  notes: ""
};

function mergeDefinedState(state: FormState, updates?: Partial<FormState>) {
  if (!updates) return state;
  const next = { ...state };
  for (const [key, value] of Object.entries(updates) as Array<[keyof FormState, FormState[keyof FormState]]>) {
    if (value !== undefined) {
      next[key] = value as never;
    }
  }
  return next;
}

function stateWithVehicle(state: FormState, vehicles: ProfitabilityVehicle[], versionId: string) {
  const vehicle = vehicles.find((item) => item.id === versionId);
  if (!vehicle) return { ...state, selectedVersionId: "" };

  const listPrice = vehicle.listPrice ?? 0;
  const salePrice = vehicle.cashPrice ?? vehicle.campaignPrice ?? listPrice;
  const detectedBonus = listPrice && salePrice && listPrice > salePrice ? listPrice - salePrice : 0;

  return {
    ...state,
    selectedVersionId: versionId,
    priceListGross: listPrice,
    brandBonusGross: detectedBonus,
    salePriceWithVat: salePrice || listPrice
  };
}

function buildState(vehicles: ProfitabilityVehicle[], today: string, initialState?: Partial<FormState>) {
  const merged = mergeDefinedState({ ...defaultState, invoiceDate: today }, initialState);
  const withVehicle = merged.selectedVersionId ? stateWithVehicle(merged, vehicles, merged.selectedVersionId) : merged;
  return mergeDefinedState(withVehicle, initialState);
}

function round(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function net(value: number) {
  return round(value / vatRate);
}

function estimateCirculationPermit(netPrice: number, invoiceDate: string) {
  const month = Number.parseInt(invoiceDate.slice(5, 7), 10);
  const utm = utmByMonth2026[month];
  if (!netPrice || !month || !utm) return null;

  const priceInUtm = netPrice / utm;
  let annualPermit = 0;
  if (priceInUtm > 0 && priceInUtm <= 60) annualPermit = round(netPrice * 0.01);
  if (priceInUtm > 60 && priceInUtm <= 120) annualPermit = round(netPrice * 0.02 - 0.6 * utm);
  if (priceInUtm > 120 && priceInUtm <= 250) annualPermit = round(netPrice * 0.03 - 1.8 * utm);
  if (priceInUtm > 250 && priceInUtm <= 400) annualPermit = round(netPrice * 0.04 - 4.3 * utm);
  if (priceInUtm > 400) annualPermit = round(netPrice * 0.045 - 6.3 * utm);

  return round((annualPermit / 12) * (13 - month));
}

function numberValue(value: string) {
  return Number.parseInt(value || "0", 10) || 0;
}

function MoneyInput({
  label,
  value,
  onChange,
  helper
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-steel">{label}</span>
      <input className="input" type="number" inputMode="numeric" value={value || ""} onChange={(event) => onChange(numberValue(event.target.value))} />
      <span className="text-xs font-semibold text-steel">{helper ?? formatCLP(value)}</span>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-steel">{label}</span>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: number | string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-center justify-between gap-4 border-t border-graphite/10 pt-3 text-base font-black text-ink" : "flex items-center justify-between gap-4 text-sm font-semibold text-graphite"}>
      <span>{label}</span>
      <span>{typeof value === "number" ? formatCLP(value) : value}</span>
    </div>
  );
}

type PrintRow = { label: string; value: number | string; neto?: number; strong?: boolean };

function PrintTable({ title, rows, showNeto = false }: { title: string; rows: PrintRow[]; showNeto?: boolean }) {
  return (
    <table className="pr-table">
      <thead>
        <tr>
          <th>{title}</th>
          <th className="pr-amount">Bruto</th>
          {showNeto ? <th className="pr-amount">Neto</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${title}-${index}`} className={row.strong ? "pr-strong" : undefined}>
            <td>{row.label}</td>
            <td className="pr-amount">{typeof row.value === "number" ? formatCLP(row.value) : row.value}</td>
            {showNeto ? <td className="pr-amount">{row.neto != null ? formatCLP(row.neto) : ""}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ProfitabilitySheet({ vehicles, today, initialState, syncKey, hideVehicleSelector = false }: ProfitabilitySheetProps) {
  const [state, setState] = useState<FormState>(() => buildState(vehicles, today, initialState));
  const [permitStatus, setPermitStatus] = useState("");
  const [greenTaxStatus, setGreenTaxStatus] = useState("");
  const [loadingPermit, setLoadingPermit] = useState(false);
  const [loadingGreenTax, setLoadingGreenTax] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === state.selectedVersionId) ?? null;

  useEffect(() => {
    if (!syncKey) return;
    setState((current) => {
      const versionChanged = initialState?.selectedVersionId && initialState.selectedVersionId !== current.selectedVersionId;
      const base = versionChanged ? { ...current, greenTax: 0, circulationPermit: 0 } : current;
      const merged = mergeDefinedState(base, initialState);
      const withVehicle = merged.selectedVersionId ? stateWithVehicle(merged, vehicles, merged.selectedVersionId) : merged;
      return mergeDefinedState(withVehicle, initialState);
    });
    setPermitStatus("");
    setGreenTaxStatus("");
  }, [initialState, syncKey, vehicles]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const selectVehicle = (versionId: string) => {
    const vehicle = vehicles.find((item) => item.id === versionId);
    if (!vehicle) {
      update("selectedVersionId", "");
      return;
    }

    setState((current) => stateWithVehicle(current, vehicles, versionId));
  };

  const totals = useMemo(() => {
    const priceListFinalGross = Math.max(0, state.priceListGross - state.brandBonusGross);
    const invoiceableExtras = state.fleteOsorno + state.rubberFloor + state.safetyKit + state.trins + state.accGrabado + state.maintenance + state.interests + state.others;
    const invoiceableGross = priceListFinalGross + invoiceableExtras;
    const invoiceableNet =
      net(priceListFinalGross) +
      net(state.fleteOsorno) +
      net(state.rubberFloor) +
      net(state.safetyKit) +
      net(state.trins) +
      net(state.accGrabado) +
      net(state.maintenance) +
      net(state.interests) +
      net(state.others);
    const nonInvoiceable = state.registration + state.greenTax + state.soap + state.circulationPermit;
    const totalIncome = invoiceableGross + nonInvoiceable;
    const totalDiscounts = state.discountSergio + state.amicarSergio + state.amicarMarca + state.aporteAdicMarca + state.aportePtteMarca;
    const saleTotal = totalIncome - totalDiscounts;
    const vehicleMarginGross = round(priceListFinalGross * (state.marginPercent / 100));
    const totalMarginGross = vehicleMarginGross + state.creditMargin - state.discountSergio - state.amicarSergio;
    const marginNet = net(totalMarginGross);
    const customerPayment = saleTotal - state.tradeInValue;
    const priceListFinalNet = net(priceListFinalGross);

    return {
      priceListFinalGross,
      priceListFinalNet,
      invoiceableGross,
      invoiceableNet,
      nonInvoiceable,
      totalIncome,
      totalDiscounts,
      saleTotal,
      vehicleMarginGross,
      totalMarginGross,
      marginNet,
      customerPayment,
      marginRatio: priceListFinalGross ? totalMarginGross / priceListFinalGross : 0
    };
  }, [state]);

  const siiSalePrice = state.salePriceWithVat || totals.priceListFinalGross;
  const estimatedPermit = estimateCirculationPermit(totals.priceListFinalNet, state.invoiceDate);
  const lasCondesText = `Valor neto: ${totals.priceListFinalNet} | Fecha factura: ${state.invoiceDate}${estimatedPermit ? ` | Permiso estimado: ${estimatedPermit}` : ""}`;
  const siiText = `Marca: ${selectedVehicle?.brandName ?? ""} | Modelo: ${selectedVehicle?.modelName ?? ""} ${selectedVehicle?.versionName ?? ""} | CIT: ${selectedVehicle?.citCode ?? "PENDIENTE"} | Precio venta con IVA: ${siiSalePrice}`;
  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  // Imprimir / Descargar PDF: usa el dialogo del navegador (destino "Guardar como PDF").
  // Ajustamos el titulo del documento para que el PDF quede con un nombre util.
  const printSheet = () => {
    const previousTitle = document.title;
    const cleanLabel = (selectedVehicle?.label ?? "vehiculo").replace(/[^a-zA-Z0-9]+/g, "-");
    const cleanClient = (state.customerName || "cliente").replace(/[^a-zA-Z0-9]+/g, "-");
    document.title = `Rentabilidad_${cleanLabel}_${cleanClient}_${state.invoiceDate || today}`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 1500);
  };

  const buildEmailRows = () =>
    [
      ["Precio Lista Unidad", state.priceListGross],
      ["Bono Marca (-)", state.brandBonusGross],
      ["Precio Lista Final", totals.priceListFinalGross],
      ["Flete Osorno", state.fleteOsorno],
      ["Pisos de goma", state.rubberFloor],
      ["Set de Seguridad", state.safetyKit],
      ["Trins", state.trins],
      ["ACC Grabado PPU + Gardex", state.accGrabado],
      ["Mantencion", state.maintenance],
      ["Intereses / gastos", state.interests],
      ["Otros", state.others],
      ["Inscripcion", state.registration],
      ["Imp. Fuentes Movs. (verde)", state.greenTax],
      ["Seguro Obligatorio (SOAP)", state.soap],
      ["Permiso Circulacion", state.circulationPermit],
      ["ZQDV Desct. S. Escobar", state.discountSergio],
      ["Z104 Amicar S. Escobar", state.amicarSergio],
      ["Z127 Amicar Marca", state.amicarMarca],
      ["Z126 Aporte adic. Marca", state.aporteAdicMarca],
      ["Z124 Aporte Ptte. Marca", state.aportePtteMarca],
      ["Retoma", state.tradeInValue],
      ["Total ingresos", totals.totalIncome],
      ["Total descuentos", totals.totalDiscounts],
      ["Precio de venta", totals.saleTotal],
      ["A pagar cliente", totals.customerPayment],
      ["Margen total bruto", totals.totalMarginGross],
      ["Margen total neto", totals.marginNet],
      ["Rentabilidad", `${(totals.marginRatio * 100).toFixed(2)}%`]
    ] as Array<[string, number | string]>;

  const buildEmailHtml = () => {
    const rowsHtml = buildEmailRows()
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb">${label}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${typeof value === "number" ? formatCLP(value) : value}</td></tr>`
      )
      .join("");
    return `<div style="font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto">
      <h2 style="margin:0 0 4px">Hoja de Rentabilidad</h2>
      <p style="margin:0 0 2px;color:#b45309;font-weight:bold">Sergio Escobar Automotriz</p>
      <p style="margin:0 0 12px;color:#374151">${selectedVehicle?.label ?? "Vehiculo no seleccionado"} — Cliente: ${state.customerName || "-"} — Fecha factura: ${state.invoiceDate || "-"}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">${rowsHtml}</table>
      ${state.notes ? `<p style="margin-top:12px;color:#374151"><strong>Notas:</strong> ${state.notes}</p>` : ""}
      <p style="margin-top:16px;color:#9ca3af;font-size:11px">Sistema creado por Victor Herrera</p>
    </div>`;
  };

  const handleSendEmail = async () => {
    setEmailStatus("");
    const to = state.customerEmail.trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setEmailStatus("⚠️ Ingresa un correo de cliente valido primero.");
      return;
    }
    setSendingEmail(true);
    try {
      const result = await sendRentabilidadEmail({
        to,
        subject: `Hoja de rentabilidad ${selectedVehicle?.label ?? ""}`.trim(),
        html: buildEmailHtml()
      });
      if (result.ok) {
        setEmailStatus(`✅ Correo enviado a ${to}`);
      } else if (result.reason === "RESEND_NOT_CONFIGURED") {
        setEmailStatus("⚠️ El envio de correo aun no esta activado (falta configurar Resend en el servidor).");
      } else {
        setEmailStatus(`No se pudo enviar: ${result.reason ?? "error desconocido"}`);
      }
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "No se pudo enviar el correo.");
    } finally {
      setSendingEmail(false);
    }
  };

  const consultPermit = async () => {
    setLoadingPermit(true);
    setPermitStatus("");
    try {
      const response = await fetch("/api/taxes/permit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          netPrice: totals.priceListFinalNet,
          invoiceDate: state.invoiceDate
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message ?? "No se pudo consultar Las Condes.");
      update("circulationPermit", result.amount);
      if (result.isEstimated) {
        setPermitStatus(`⚠️ VALOR ESTIMADO REFERENCIAL: ${formatCLP(result.amount)} (${result.message})`);
      } else {
        setPermitStatus(`✅ VALOR OFICIAL CONFIRMADO (Las Condes API): ${formatCLP(result.amount)}`);
      }
    } catch (error) {
      setPermitStatus(error instanceof Error ? error.message : "No se pudo consultar Las Condes.");
    } finally {
      setLoadingPermit(false);
    }
  };

  const consultGreenTax = async () => {
    setLoadingGreenTax(true);
    setGreenTaxStatus("");
    try {
      if (!selectedVehicle?.citCode) throw new Error("Esta versión no tiene Código CIT cargado.");
      const response = await fetch("/api/taxes/green", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          citCode: selectedVehicle.citCode,
          salePriceWithVat: siiSalePrice,
          calculationDate: state.invoiceDate
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message ?? "No se pudo calcular el impuesto verde.");
      update("greenTax", result.amountClp);
      const detail = result.exempt
        ? "Exento de Impuesto Verde"
        : `${Number(result.taxUtm).toFixed(4)} UTM (UTM: ${formatCLP(result.utm)})`;
      setGreenTaxStatus(`✅ VALOR OFICIAL CONFIRMADO (Listado SII): ${formatCLP(result.amountClp)} — ${detail}`);
    } catch (error) {
      setGreenTaxStatus(error instanceof Error ? error.message : "No se pudo calcular el impuesto verde.");
    } finally {
      setLoadingGreenTax(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="panel no-print rounded-lg p-5">
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {!hideVehicleSelector ? (
              <label className="grid gap-1.5 md:col-span-2">
                <span className="text-xs font-black uppercase text-steel">Version</span>
                <select className="input" value={state.selectedVersionId} onChange={(event) => selectVehicle(event.target.value)}>
                  <option value="">Selecciona marca, modelo y version</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.label} {vehicle.citCode ? `| CIT ${vehicle.citCode}` : "| CIT pendiente"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <TextInput label="Nota venta" value={state.orderNumber} onChange={(value) => update("orderNumber", value)} placeholder="Nro. nota venta" />
            <TextInput label="Interno" value={state.internalNumber} onChange={(value) => update("internalNumber", value)} placeholder="Interno o unidad" />
            <TextInput label="Cliente" value={state.customerName} onChange={(value) => update("customerName", value)} placeholder="Nombre cliente" />
            <TextInput label="Correo cliente" type="email" value={state.customerEmail} onChange={(value) => update("customerEmail", value)} placeholder="correo@cliente.cl" />
            <TextInput label="Fecha factura" type="date" value={state.invoiceDate} onChange={(value) => update("invoiceDate", value)} />
          </div>

          <div className="rounded-lg border border-graphite/10 bg-white p-4">
            <p className="text-xs font-black uppercase text-copper">Datos para consultas externas</p>
            <div className="mt-3 grid gap-3 text-sm font-semibold text-graphite">
              <div>
                <p className="font-black text-ink">Permiso circulacion</p>
                <p>Usar Precio Lista Final neto y fecha factura de hoy.</p>
                <p className="mt-1 rounded-lg bg-mist p-2 text-xs">{lasCondesText}</p>
              </div>
              <div>
                <p className="font-black text-ink">Imp. Fuentes Movs.</p>
                <p>Usar marca, modelo, Codigo CIT y precio venta con IVA.</p>
                <p className="mt-1 rounded-lg bg-mist p-2 text-xs">{siiText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" type="button" onClick={consultPermit} disabled={loadingPermit || !totals.priceListFinalNet}>
                  {loadingPermit ? "Consultando..." : "Consultar permiso"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => copyText(lasCondesText)}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar permiso
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => estimatedPermit !== null && update("circulationPermit", estimatedPermit)} disabled={estimatedPermit === null}>
                  Usar estimado
                </button>
                <a className="btn btn-secondary" href="https://www.lascondesonline.cl/Permisos%20Circulacion/asp/convalper.asp" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Las Condes
                </a>
                <button className="btn btn-primary" type="button" onClick={consultGreenTax} disabled={loadingGreenTax || !selectedVehicle?.citCode || !siiSalePrice}>
                  {loadingGreenTax ? "Calculando..." : "Calcular impuesto verde"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => copyText(siiText)}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar SII
                </button>
                <a className="btn btn-secondary" href="https://www4.sii.cl/calcImpVehiculoNuevoInternet/internet.html" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  SII
                </a>
              </div>
              {permitStatus ? <p className="rounded-lg bg-mist p-2 text-xs font-bold text-graphite">{permitStatus}</p> : null}
              {greenTaxStatus ? <p className="rounded-lg bg-mist p-2 text-xs font-bold text-graphite">{greenTaxStatus}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="print-page panel rounded-lg p-5">
        <div className="flex flex-col gap-4 border-b border-graphite/10 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-copper">Informe de rentabilidad</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{selectedVehicle?.label ?? "Vehiculo no seleccionado"}</h2>
            <p className="mt-1 text-sm font-semibold text-steel">
              Nota venta: {state.orderNumber || "-"} | Interno: {state.internalNumber || "-"} | Fecha factura: {state.invoiceDate}
            </p>
            <p className="mt-1 text-sm font-semibold text-steel">
              Cliente: {state.customerName || "-"} | Codigo CIT: {selectedVehicle?.citCode ?? "Pendiente en lista"}
            </p>
          </div>
          <div className="no-print flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn btn-secondary" type="button" onClick={() => setState({ ...defaultState, invoiceDate: today })}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Limpiar
              </button>
              <button className="btn btn-secondary" type="button" onClick={printSheet}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Imprimir
              </button>
              <button className="btn btn-primary" type="button" onClick={printSheet} title='En el dialogo elige destino "Guardar como PDF"'>
                <Download className="h-4 w-4" aria-hidden="true" />
                Descargar PDF
              </button>
              <button className="btn btn-secondary" type="button" onClick={handleSendEmail} disabled={sendingEmail}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                {sendingEmail ? "Enviando..." : "Enviar correo"}
              </button>
            </div>
            {emailStatus ? <p className="text-xs font-bold text-graphite">{emailStatus}</p> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-5">
            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">Ingresos</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MoneyInput label="Precio Lista Unidad" value={state.priceListGross} onChange={(value) => update("priceListGross", value)} />
                <MoneyInput label="ZQDA Bono Marca" value={state.brandBonusGross} onChange={(value) => update("brandBonusGross", value)} />
                <MoneyInput label="Flete Osorno" value={state.fleteOsorno} onChange={(value) => update("fleteOsorno", value)} />
                <MoneyInput label="Pisos de goma" value={state.rubberFloor} onChange={(value) => update("rubberFloor", value)} />
                <MoneyInput label="Set de Seguridad" value={state.safetyKit} onChange={(value) => update("safetyKit", value)} />
                <MoneyInput label="Trins" value={state.trins} onChange={(value) => update("trins", value)} />
                <MoneyInput label="ACC Grabado PPU + Gardex" value={state.accGrabado} onChange={(value) => update("accGrabado", value)} />
                <MoneyInput label="Mantencion" value={state.maintenance} onChange={(value) => update("maintenance", value)} />
                <MoneyInput label="Intereses / gastos" value={state.interests} onChange={(value) => update("interests", value)} />
                <MoneyInput label="Otros" value={state.others} onChange={(value) => update("others", value)} />
              </div>
            </div>

            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">No facturables</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MoneyInput label="Inscripcion" value={state.registration} onChange={(value) => update("registration", value)} />
                <MoneyInput label="Imp. Fuentes Movs." value={state.greenTax} onChange={(value) => update("greenTax", value)} helper="Impuesto verde informado por SII" />
                <MoneyInput label="Seguro Obligatorio" value={state.soap} onChange={(value) => update("soap", value)} />
                <MoneyInput label="Permiso Circulacion" value={state.circulationPermit} onChange={(value) => update("circulationPermit", value)} helper="Resultado de Las Condes" />
              </div>
            </div>

            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">Descuentos</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MoneyInput label="ZQDV Desct. S. Escobar" value={state.discountSergio} onChange={(value) => update("discountSergio", value)} />
                <MoneyInput label="Z104 Amicar S. Escobar" value={state.amicarSergio} onChange={(value) => update("amicarSergio", value)} />
                <MoneyInput label="Z127 Amicar Marca" value={state.amicarMarca} onChange={(value) => update("amicarMarca", value)} />
                <MoneyInput label="Z126 Aporte adic. Marca" value={state.aporteAdicMarca} onChange={(value) => update("aporteAdicMarca", value)} />
                <MoneyInput label="Z124 Aporte Ptte. Marca" value={state.aportePtteMarca} onChange={(value) => update("aportePtteMarca", value)} />
                <MoneyInput label="Retoma" value={state.tradeInValue} onChange={(value) => update("tradeInValue", value)} />
              </div>
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">Resumen</h3>
              <div className="mt-4 grid gap-3">
                <SummaryLine label="Precio Lista Final bruto" value={totals.priceListFinalGross} />
                <SummaryLine label="Precio Lista Final neto" value={totals.priceListFinalNet} />
                <SummaryLine label="Ingresos facturables bruto" value={totals.invoiceableGross} />
                <SummaryLine label="Ingresos facturables neto" value={totals.invoiceableNet} />
                <SummaryLine label="No facturables" value={totals.nonInvoiceable} />
                <SummaryLine label="Total ingresos" value={totals.totalIncome} />
                <SummaryLine label="Total descuentos" value={totals.totalDiscounts} />
                <SummaryLine label="Precio de venta" value={totals.saleTotal} strong />
                <SummaryLine label="A pagar cliente" value={totals.customerPayment} />
              </div>
            </div>

            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">Margenes</h3>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-black uppercase text-steel">Margen unidad %</span>
                  <input className="input" type="number" value={state.marginPercent} onChange={(event) => update("marginPercent", Number.parseFloat(event.target.value) || 0)} />
                </label>
                <MoneyInput label="Utilidad credito" value={state.creditMargin} onChange={(value) => update("creditMargin", value)} />
                <div className="grid gap-3">
                  <SummaryLine label="Margen vehiculo bruto" value={totals.vehicleMarginGross} />
                  <SummaryLine label="Margen total bruto" value={totals.totalMarginGross} strong />
                  <SummaryLine label="Margen total neto" value={totals.marginNet} />
                  <SummaryLine label="Rentabilidad" value={`${(totals.marginRatio * 100).toFixed(2)}%`} />
                </div>
              </div>
            </div>

            <div className="print-avoid rounded-lg border border-graphite/10 bg-white p-4">
              <h3 className="text-lg font-black text-ink">Impuesto verde SII</h3>
              <div className="mt-4 grid gap-4">
                <MoneyInput label="Precio venta con IVA" value={state.salePriceWithVat} onChange={(value) => update("salePriceWithVat", value)} />
                <SummaryLine label="Marca" value={selectedVehicle?.brandName ?? "-"} />
                <SummaryLine label="Modelo" value={selectedVehicle ? `${selectedVehicle.modelName} ${selectedVehicle.versionName}` : "-"} />
                <SummaryLine label="Codigo CIT" value={selectedVehicle?.citCode ?? "Pendiente"} />
                <button className="btn btn-primary no-print" type="button" onClick={consultGreenTax} disabled={loadingGreenTax || !selectedVehicle?.citCode || !siiSalePrice}>
                  {loadingGreenTax ? "Calculando..." : "Calcular Imp. Fuentes Movs."}
                </button>
                {greenTaxStatus ? <p className="text-xs font-bold leading-5 text-steel">{greenTaxStatus}</p> : null}
              </div>
            </div>

            <label className="print-avoid grid gap-1.5 rounded-lg border border-graphite/10 bg-white p-4">
              <span className="text-xs font-black uppercase text-steel">Notas internas</span>
              <textarea className="input min-h-28" value={state.notes} onChange={(event) => update("notes", event.target.value)} />
            </label>
          </aside>
        </div>

        <div className="mt-5 hidden border-t border-graphite/10 pt-8 print:block">
          <p className="text-sm font-semibold text-ink">Nombre y firma jefe sucursal:</p>
          <div className="mt-10 h-px w-80 bg-graphite/40" />
        </div>
      </section>

      {/* Informe dedicado para impresion / PDF: formato documento limpio (solo visible al imprimir) */}
      <section className="print-report">
        <div className="pr-head">
          <div>
            <h1>Hoja de Rentabilidad</h1>
            <p className="pr-brand">Sergio Escobar Automotriz</p>
          </div>
          <div className="pr-meta">
            <p><strong>Fecha factura:</strong> {state.invoiceDate || "-"}</p>
            <p><strong>Nota venta:</strong> {state.orderNumber || "-"}</p>
            <p><strong>Interno:</strong> {state.internalNumber || "-"}</p>
          </div>
        </div>

        <div className="pr-vehicle">
          <h2>{selectedVehicle?.label ?? "Vehiculo no seleccionado"}</h2>
          <p>
            Cliente: {state.customerName || "-"} &middot; Correo: {state.customerEmail || "-"} &middot; Codigo CIT: {selectedVehicle?.citCode ?? "Pendiente"}
          </p>
          <p>
            Marca: {selectedVehicle?.brandName ?? "-"} &middot; Modelo: {selectedVehicle ? `${selectedVehicle.modelName} ${selectedVehicle.versionName}` : "-"} &middot; Precio venta c/IVA (SII): {formatCLP(siiSalePrice)}
          </p>
        </div>

        <div className="pr-cols">
          <div>
            <PrintTable
              title="Ingresos"
              showNeto
              rows={[
                { label: "Precio Lista Unidad", value: state.priceListGross, neto: net(state.priceListGross) },
                { label: "Bono Marca (-)", value: state.brandBonusGross, neto: net(state.brandBonusGross) },
                { label: "Precio Lista Final", value: totals.priceListFinalGross, neto: totals.priceListFinalNet, strong: true },
                { label: "Flete Osorno", value: state.fleteOsorno, neto: net(state.fleteOsorno) },
                { label: "Pisos de goma", value: state.rubberFloor, neto: net(state.rubberFloor) },
                { label: "Set de Seguridad", value: state.safetyKit, neto: net(state.safetyKit) },
                { label: "Trins", value: state.trins, neto: net(state.trins) },
                { label: "ACC Grabado PPU + Gardex", value: state.accGrabado, neto: net(state.accGrabado) },
                { label: "Mantencion", value: state.maintenance, neto: net(state.maintenance) },
                { label: "Intereses / gastos", value: state.interests, neto: net(state.interests) },
                { label: "Otros", value: state.others, neto: net(state.others) },
                { label: "Total ingresos facturables", value: totals.invoiceableGross, neto: totals.invoiceableNet, strong: true }
              ]}
            />
            <PrintTable
              title="No facturables"
              rows={[
                { label: "Inscripcion", value: state.registration },
                { label: "Imp. Fuentes Movs. (verde)", value: state.greenTax },
                { label: "Seguro Obligatorio (SOAP)", value: state.soap },
                { label: "Permiso Circulacion", value: state.circulationPermit },
                { label: "Total no facturables", value: totals.nonInvoiceable, strong: true }
              ]}
            />
          </div>
          <div>
            <PrintTable
              title="Descuentos"
              showNeto
              rows={[
                { label: "ZQDV Desct. S. Escobar", value: state.discountSergio, neto: net(state.discountSergio) },
                { label: "Z104 Amicar S. Escobar", value: state.amicarSergio, neto: net(state.amicarSergio) },
                { label: "Z127 Amicar Marca", value: state.amicarMarca, neto: net(state.amicarMarca) },
                { label: "Z126 Aporte adic. Marca", value: state.aporteAdicMarca, neto: net(state.aporteAdicMarca) },
                { label: "Z124 Aporte Ptte. Marca", value: state.aportePtteMarca, neto: net(state.aportePtteMarca) },
                { label: "Retoma", value: state.tradeInValue, neto: net(state.tradeInValue) },
                { label: "Total descuentos", value: totals.totalDiscounts, neto: net(totals.totalDiscounts), strong: true }
              ]}
            />
            <PrintTable
              title="Resumen de venta"
              rows={[
                { label: "Total ingresos", value: totals.totalIncome },
                { label: "Total descuentos", value: totals.totalDiscounts },
                { label: "Precio de venta", value: totals.saleTotal, strong: true },
                { label: "Retoma", value: state.tradeInValue },
                { label: "A pagar cliente", value: totals.customerPayment, strong: true }
              ]}
            />
            <PrintTable
              title="Margenes"
              rows={[
                { label: "Margen unidad %", value: `${state.marginPercent}%` },
                { label: "Margen vehiculo bruto", value: totals.vehicleMarginGross },
                { label: "Utilidad credito", value: state.creditMargin },
                { label: "Margen total bruto", value: totals.totalMarginGross, strong: true },
                { label: "Margen total neto", value: totals.marginNet },
                { label: "Rentabilidad", value: `${(totals.marginRatio * 100).toFixed(2)}%`, strong: true }
              ]}
            />
          </div>
        </div>

        {state.notes ? (
          <p className="pr-notes">
            <strong>Notas:</strong> {state.notes}
          </p>
        ) : null}

        <div className="pr-sign">
          <div className="pr-sign-line" />
          <p>Nombre y firma jefe sucursal</p>
        </div>

        <p className="pr-foot">Documento generado por Panel360 Autos &middot; {today} &middot; Sistema creado por Victor Herrera</p>
      </section>
    </div>
  );
}
