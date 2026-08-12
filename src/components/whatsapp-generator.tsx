"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { formatCLP, missing } from "@/lib/format";

type VersionOption = {
  id: string;
  name: string;
  engine: string | null;
  transmission: string | null;
  traction: string | null;
  equipmentSummary: string | null;
  brand: { name: string };
  model: { name: string };
  prices: { priceType: string; amount: number; status: string }[];
};

export function WhatsAppGenerator({ versions }: { versions: VersionOption[] }) {
  const [customerName, setCustomerName] = useState("");
  const [versionId, setVersionId] = useState("");
  const selected = versions.find((version) => version.id === versionId);
  const message = useMemo(() => {
    if (!selected) return "";
    const campaignPrice = selected.prices.find((price) => price.priceType === "CAMPAIGN")?.amount;
    const listPrice = selected.prices.find((price) => price.priceType === "LIST")?.amount;
    const cashPrice = selected.prices.find((price) => price.priceType === "CASH")?.amount;
    return [
      `Hola ${customerName || "[Nombre]"}, tal como conversamos le envío la información del:`,
      "",
      `${selected.brand.name} ${selected.model.name} ${selected.name}`,
      "",
      `Motor: ${missing(selected.engine)}`,
      `Transmisión: ${missing(selected.transmission)}`,
      `Tracción: ${missing(selected.traction)}`,
      "",
      `Precio lista: ${formatCLP(listPrice)}`,
      `Precio contado: ${formatCLP(cashPrice)}`,
      `Precio campaña: ${formatCLP(campaignPrice)}`,
      "",
      "Principales características:",
      selected.equipmentSummary || "Información no disponible en las fuentes cargadas",
      "",
      "Promoción vigente hasta: Vigencia no informada",
      "",
      "Quedo atento a cualquier consulta."
    ].join("\n");
  }, [customerName, selected]);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="panel rounded-lg p-5">
        <label className="text-sm font-black text-ink" htmlFor="customerName">
          Nombre cliente
        </label>
        <input id="customerName" className="input mt-2" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />

        <label className="mt-4 block text-sm font-black text-ink" htmlFor="versionId">
          Vehículo
        </label>
        <select id="versionId" className="input mt-2" value={versionId} onChange={(event) => setVersionId(event.target.value)}>
          <option value="">Seleccione una versión</option>
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.brand.name} {version.model.name} {version.name}
            </option>
          ))}
        </select>
      </div>

      <div className="panel rounded-lg p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-ink">Mensaje editable</p>
          <button className="btn btn-secondary" type="button" disabled={!message} onClick={() => navigator.clipboard.writeText(message)}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copiar mensaje
          </button>
        </div>
        <textarea className="input mt-4 min-h-80 font-mono text-sm" value={message} onChange={() => undefined} placeholder="Seleccione un vehículo para generar un mensaje." readOnly />
      </div>
    </div>
  );
}
