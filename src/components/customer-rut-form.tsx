"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, Search, ShieldCheck } from "lucide-react";
import { createCustomer } from "@/lib/actions";
import { formatRut, isValidRut } from "@/lib/rut";

type Option = {
  id: string;
  name: string;
};

type LookupResult = {
  ok: boolean;
  status: string;
  message?: string;
  rut?: {
    formatted: string;
    valid: boolean;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    commune: string;
    city: string;
    region: string;
  };
  profile?: {
    firstName: string;
    lastName: string;
    address: string;
    commune: string;
    city: string;
    region: string;
  };
  vehicles?: Array<{
    patente: string;
    tipo: string;
    marca: string;
    modelo: string;
    anio: string;
    motor: string;
  }>;
  company?: {
    razonSocial: string;
    tipo: string;
    actividades: string;
  } | null;
  source?: string;
};

const nextActions = [
  "LLAMAR",
  "WHATSAPP",
  "ENVIAR COTIZACION",
  "SEGUIMIENTO",
  "SOLICITAR DOCUMENTOS",
  "REVISAR CREDITO",
  "AGENDAR TEST DRIVE",
  "RESERVA",
  "ENTREGA",
  "POSTVENTA",
  "RENOVACION",
  "OTRO"
];
const priorities = ["BAJA", "NORMAL", "ALTA", "URGENTE"];

function applyLookupData(result: LookupResult) {
  const profile = result.customer ?? result.profile;
  if (!profile) return null;

  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    phone: "phone" in profile ? profile.phone ?? "" : "",
    whatsapp: "whatsapp" in profile ? profile.whatsapp ?? "" : "",
    email: "email" in profile ? profile.email ?? "" : "",
    address: profile.address ?? "",
    commune: profile.commune ?? "",
    city: profile.city ?? "",
    region: profile.region ?? ""
  };
}

function statusMessage(result: LookupResult | null) {
  if (!result) return null;
  if (result.status === "invalid") return { tone: "bad" as const, icon: AlertTriangle, text: "RUT invalido." };
  if (result.status === "found") return { tone: "good" as const, icon: CheckCircle2, text: "Cliente encontrado en el CRM. Datos completados." };
  if (result.status === "external_found") return { tone: "good" as const, icon: ShieldCheck, text: "Datos completados desde fuente autorizada." };
  if (result.status === "requires_consent") return { tone: "warn" as const, icon: ShieldCheck, text: "Marca la autorizacion del cliente para consultar una fuente externa." };
  if (result.status === "not_configured") return { tone: "neutral" as const, icon: Database, text: "RUT valido. No existe en el CRM; completa los datos y quedaran guardados." };
  if (result.status === "empty") return { tone: "warn" as const, icon: Search, text: "La fuente consultada no entrego datos para este RUT." };
  return { tone: "bad" as const, icon: AlertTriangle, text: result.message ?? "No se pudo completar la busqueda." };
}

export function CustomerRutForm({ statuses, origins }: { statuses: Option[]; origins: Option[] }) {
  const [isPending, startTransition] = useTransition();
  const [rut, setRut] = useState("");
  const [consent, setConsent] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [source, setSource] = useState("");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    commune: "",
    city: "",
    region: ""
  });
  const rutIsFilled = rut.trim().length > 0;
  const rutIsValid = !rutIsFilled || isValidRut(rut);
  const message = useMemo(() => statusMessage(lookup), [lookup]);

  function updateField(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  const lookupRut = useCallback(async (nextConsent = consent) => {
    const formatted = formatRut(rut);
    if (!formatted || !isValidRut(formatted)) {
      setLookup(rut.trim() ? { ok: false, status: "invalid", message: "RUT invalido." } : null);
      return;
    }

    setRut(formatted);
    startTransition(async () => {
      const response = await fetch(`/api/customers/rut?rut=${encodeURIComponent(formatted)}&consent=${nextConsent ? "1" : "0"}`, {
        cache: "no-store"
      });
      const result = (await response.json()) as LookupResult;
      setLookup(result);
      setSource(result.source ?? (result.status === "found" ? "CRM_INTERNO" : ""));

      const nextFields = applyLookupData(result);
      if (nextFields) {
        setFields((current) => ({
          ...current,
          ...Object.fromEntries(Object.entries(nextFields).filter(([, value]) => value))
        }));
      }
    });
  }, [consent, rut]);

  useEffect(() => {
    if (!rut.trim() || formatRut(rut).length < 9) {
      setLookup(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void lookupRut(false);
    }, 550);

    return () => window.clearTimeout(timeout);
  }, [lookupRut, rut]);

  return (
    <form action={createCustomer} className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
      <input type="hidden" name="rutLookupSource" value={source} />

      <label className="grid gap-2 text-sm font-black text-ink">
        RUT
        <div className="flex gap-2">
          <input
            className="input"
            name="rut"
            value={rut}
            onBlur={() => setRut((value) => formatRut(value) || value)}
            onChange={(event) => setRut(event.target.value)}
            placeholder="12.345.678-9"
          />
          <button className="btn btn-secondary shrink-0" type="button" onClick={() => lookupRut(consent)} disabled={!rutIsValid || isPending}>
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </label>

      <label className="grid gap-2 text-sm font-black text-ink">
        Nombre
        <input className="input" name="firstName" value={fields.firstName} onChange={(event) => updateField("firstName", event.target.value)} placeholder="Nombre" required />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink">
        Apellidos
        <input className="input" name="lastName" value={fields.lastName} onChange={(event) => updateField("lastName", event.target.value)} placeholder="Apellidos" />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink">
        Telefono
        <input className="input" name="phone" value={fields.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+56 9" />
      </label>

      {message ? (
        (() => {
          const MessageIcon = message.icon;

          return (
            <div
              className={`md:col-span-3 xl:col-span-4 flex items-start justify-between gap-3 rounded-lg border p-3 text-sm font-bold ${
                message.tone === "good"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : message.tone === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : message.tone === "bad"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-graphite/10 bg-mist text-graphite"
              }`}
            >
              <span className="flex items-start gap-2">
                <MessageIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {message.text}
              </span>
              {lookup?.customer ? (
                <Link className="shrink-0 underline" href={`/clientes/${lookup.customer.id}`}>
                  Abrir ficha
                </Link>
              ) : null}
            </div>
          );
        })()
      ) : null}

      {lookup?.company ? (
        <div className="md:col-span-3 xl:col-span-4 rounded-lg border border-graphite/10 bg-white p-3 text-sm">
          <p className="text-xs font-black uppercase text-copper">Empresa (SII)</p>
          <p className="mt-1 font-black text-ink">{lookup.company.razonSocial.toUpperCase()}</p>
          {lookup.company.tipo ? <p className="text-xs font-semibold text-steel">{lookup.company.tipo}</p> : null}
          {lookup.company.actividades ? <p className="mt-1 text-xs font-semibold text-graphite">Giro: {lookup.company.actividades}</p> : null}
        </div>
      ) : null}

      {lookup && (lookup.status === "external_found" || lookup.status === "empty") ? (
        <p className="md:col-span-3 xl:col-span-4 text-xs font-semibold text-steel">
          ¿Es una empresa y no aparecen sus datos?{" "}
          <a className="font-black text-copper underline" href="https://www2.sii.cl/stc/noauthz" target="_blank" rel="noreferrer">
            Consultar en SII (fuente oficial)
          </a>
        </p>
      ) : null}

      {lookup?.vehicles && lookup.vehicles.length > 0 ? (
        <div className="md:col-span-3 xl:col-span-4 rounded-lg border border-graphite/10 bg-white p-3">
          <p className="text-xs font-black uppercase text-copper">Vehiculos a nombre del RUT ({lookup.vehicles.length})</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-black uppercase text-steel">
                  <th className="pb-1 pr-3">Patente</th>
                  <th className="pb-1 pr-3">Marca</th>
                  <th className="pb-1 pr-3">Modelo</th>
                  <th className="pb-1 pr-3">Año</th>
                  <th className="pb-1">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {lookup.vehicles.map((vehicle, index) => (
                  <tr key={`${vehicle.patente}-${index}`} className="border-t border-graphite/10">
                    <td className="py-1 pr-3 font-black text-ink">{vehicle.patente}</td>
                    <td className="py-1 pr-3 font-semibold text-graphite">{vehicle.marca}</td>
                    <td className="py-1 pr-3 font-semibold text-graphite">{vehicle.modelo}</td>
                    <td className="py-1 pr-3 font-semibold text-graphite">{vehicle.anio}</td>
                    <td className="py-1 font-semibold text-steel">{vehicle.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <label className="flex items-start gap-2 rounded-lg border border-graphite/10 bg-white/70 p-3 text-xs font-semibold leading-5 text-steel md:col-span-3 xl:col-span-4">
        <input
          className="mt-1"
          type="checkbox"
          name="rutLookupConsent"
          checked={consent}
          onChange={(event) => {
            const checked = event.target.checked;
            setConsent(checked);
            if (checked && rutIsValid && rut.trim()) void lookupRut(true);
          }}
        />
        Cliente autoriza usar su RUT para completar datos de contacto y direccion en este CRM.
      </label>

      <input className="input" name="whatsapp" value={fields.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} placeholder="WhatsApp" />
      <input className="input" name="email" value={fields.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" />
      <input className="input" name="birthDate" placeholder="Fecha nacimiento" type="date" />
      <select className="input" name="statusId">
        <option value="">Estado</option>
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
      <select className="input" name="originId">
        <option value="">Origen</option>
        {origins.map((origin) => (
          <option key={origin.id} value={origin.id}>
            {origin.name}
          </option>
        ))}
      </select>
      <input className="input md:col-span-2" name="address" value={fields.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Direccion" />
      <input className="input" name="commune" value={fields.commune} onChange={(event) => updateField("commune", event.target.value)} placeholder="Comuna" />
      <input className="input" name="city" value={fields.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Ciudad" />
      <input className="input" name="region" value={fields.region} onChange={(event) => updateField("region", event.target.value)} placeholder="Region" />
      <input className="input" name="interestedBrand" placeholder="Marca interesada" />
      <input className="input" name="interestedModel" placeholder="Modelo interesado" />
      <input className="input" name="interestedVersion" placeholder="Version interesada" />
      <input className="input" name="budget" placeholder="Presupuesto" />
      <input className="input" name="purchaseType" placeholder="Tipo de compra" />
      <input className="input" name="currentVehicle" placeholder="Vehiculo actual" />
      <input className="input" name="currentPlate" placeholder="Patente actual" />
      <select className="input" name="nextActionType">
        <option value="">Proxima accion</option>
        {nextActions.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <input className="input" name="nextActionAt" type="datetime-local" />
      <select className="input" name="nextActionPriority">
        <option value="">Prioridad</option>
        {priorities.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <textarea className="input md:col-span-3 xl:col-span-4" name="notes" placeholder="Observaciones" />
      <textarea className="input md:col-span-3 xl:col-span-4" name="nextActionNote" placeholder="Descripcion de proxima accion" />
      <button className="btn btn-primary w-fit md:col-span-3 xl:col-span-4" type="submit" disabled={!rutIsValid}>
        Crear o actualizar cliente
      </button>
    </form>
  );
}
