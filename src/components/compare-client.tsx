"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Car, CheckCircle2, FileText, Gift, Info, Percent, Search, SlidersHorizontal, Tag, Truck } from "lucide-react";
import clsx from "clsx";
import {
  buildComparisonRows,
  buildPriceSummary,
  type ComparableVersion,
  priceDifferenceLabel,
  rowStatusLabel,
  toComparableVersion
} from "@/lib/comparison";
import { formatCLP, normalizeText } from "@/lib/format";
import { EmptyState, StatusPill } from "@/components/ui";

type VersionOption = Parameters<typeof toComparableVersion>[0];
type CommercialAid = {
  id: string;
  title: string;
  brandName: string;
  modelName: string;
  versionName?: string | null;
  category: string;
  detail: string;
  source: string;
  tone: "neutral" | "good" | "warn" | "bad";
};

function firstThreeSlots(ids: string[]) {
  return [ids[0] ?? "", ids[1] ?? "", ids[2] ?? ""];
}

function selectedUniqueIds(slots: string[]) {
  return Array.from(new Set(slots.filter(Boolean))).slice(0, 3);
}

function filterText(version: VersionOption) {
  return normalizeText(`${version.brand.name} ${version.model.name} ${version.name} ${version.sapCode ?? ""}`);
}

function aidMatchesVersion(aid: CommercialAid, version: ComparableVersion) {
  const brand = normalizeText(version.brandName);
  const model = normalizeText(version.modelName);
  const versionName = normalizeText(version.versionName);
  const aidBrand = normalizeText(aid.brandName);
  const aidModel = normalizeText(aid.modelName);
  const aidVersion = normalizeText(aid.versionName ?? "");

  const brandMatches = aidBrand === brand || aidBrand.includes(brand) || brand.includes(aidBrand);
  const modelMatches = aidModel === model || aidModel.startsWith(`${model} `) || aidModel.includes(` ${model} `) || model.includes(aidModel);
  const versionMatches = !aidVersion || versionName.includes(aidVersion) || aidVersion.includes(versionName);

  return Boolean(brandMatches && modelMatches && versionMatches);
}

export function CompareClient({
  versions,
  initialSelected = [],
  commercialAids = []
}: {
  versions: VersionOption[];
  initialSelected?: string[];
  commercialAids?: CommercialAid[];
}) {
  const validInitialSelected = initialSelected.filter((id) => versions.some((version) => version.id === id)).slice(0, 3);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(firstThreeSlots(validInitialSelected));
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const selectedIds = useMemo(() => selectedUniqueIds(selectedSlots), [selectedSlots]);

  const comparable = useMemo(() => {
    return selectedIds
      .map((id) => versions.find((version) => version.id === id))
      .filter((version): version is VersionOption => Boolean(version))
      .map((version) => toComparableVersion(version));
  }, [selectedIds, versions]);

  const rows = useMemo(() => buildComparisonRows(comparable), [comparable]);
  const visibleRows = showOnlyDifferences ? rows.filter((row) => row.status === "different" || row.status === "partial") : rows;
  const priceSummary = useMemo(() => buildPriceSummary(comparable), [comparable]);

  const aidAlerts = useMemo(() => {
    const seen = new Set<string>();
    return commercialAids
      .filter((aid) => comparable.some((version) => aidMatchesVersion(aid, version)))
      .filter((aid) => {
        if (seen.has(aid.id)) return false;
        seen.add(aid.id);
        return true;
      })
      .slice(0, 8);
  }, [commercialAids, comparable]);

  const normalizedSearch = normalizeText(searchTerm);

  if (!versions.length) {
    return (
      <EmptyState
        title="Todavía no existen versiones cargadas."
        description="Carga modelos y versiones desde Administración o revisa un documento comercial para comenzar a comparar."
        actionHref="/admin"
        actionLabel="Abrir administración"
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="panel rounded-lg p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-ink">Seleccione hasta 3 versiones para comparar comercial y técnicamente</p>
            <p className="mt-1 text-xs font-semibold text-steel">La primera opción queda como referencia principal para calcular diferencias de precio.</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden="true" />
            <input
              className="input pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar marca, modelo, versión o CIT"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <select
              key={slot}
              className="input"
              value={selectedSlots[slot] ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                const next = firstThreeSlots(selectedSlots);
                next[slot] = value;
                if (value) {
                  next.forEach((selectedId, index) => {
                    if (index !== slot && selectedId === value) next[index] = "";
                  });
                }
                setSelectedSlots(next);
              }}
            >
              <option value="">Seleccionar Versión {slot + 1}</option>
              {versions
                .filter((version) => !normalizedSearch || filterText(version).includes(normalizedSearch) || selectedSlots[slot] === version.id)
                .map((version) => (
                  <option key={version.id} value={version.id} disabled={selectedSlots.some((id, index) => index !== slot && id === version.id)}>
                    {version.brand.name} {version.model.name} {version.name}
                    {version.sapCode ? ` | CIT ${version.sapCode}` : ""}
                  </option>
                ))}
            </select>
          ))}
        </div>
      </div>

      {comparable.length < 2 ? (
        <EmptyState title="Seleccione al menos dos versiones." description="El comparador muestra precios, escenarios, puesto en calle, bonos y diferencias entre 2 o 3 opciones." />
      ) : (
        <>
          {/* RESUMEN COMERCIAL SUPERIOR */}
          {priceSummary ? (
            <section className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                  <BadgeDollarSign className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Más Económico Contado
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.cheapestCash.label}</p>
                <p className="text-xs font-extrabold text-emerald-700">{formatCLP(priceSummary.cheapestCash.priceCash)}</p>
              </div>
              <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                  <Percent className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  Más Económico Crédito
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.cheapestFinancing.label}</p>
                <p className="text-xs font-extrabold text-sky-700">
                  {priceSummary.cheapestFinancing.priceFinancing ? formatCLP(priceSummary.cheapestFinancing.priceFinancing) : "Sin precio crédito"}
                </p>
              </div>
              <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                  <Truck className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Menor Puesto en Calle
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.lowestOnTheRoad.label}</p>
                <p className="text-xs font-extrabold text-amber-700">
                  {priceSummary.lowestOnTheRoad.onTheRoad.totalOnTheRoadCash
                    ? formatCLP(priceSummary.lowestOnTheRoad.onTheRoad.totalOnTheRoadCash)
                    : "Estimado"}
                </p>
              </div>
              <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                  <Tag className="h-4 w-4 text-copper" aria-hidden="true" />
                  Mayor Bono Cliente
                </p>
                <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.highestBonus.label}</p>
                <p className="text-xs font-extrabold text-copper">{formatCLP(priceSummary.highestBonus.clientBonuses.totalClientBonus)}</p>
              </div>
            </section>
          ) : null}

          {/* TARJETAS COMPARATIVAS */}
          <section className="grid gap-3 lg:grid-cols-3">
            {comparable.map((version, index) => {
              const base = comparable[0];
              const price = version.priceFinal ?? version.priceList;
              const basePrice = base.priceFinal ?? base.priceList;
              const difference = index === 0 ? "Referencia" : priceDifferenceLabel(basePrice, price);

              return (
                <article key={version.id} className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-copper">{index === 0 ? "Referencia" : `Opción ${index + 1}`}</p>
                      <h2 className="mt-1 text-base font-black leading-5 text-ink">{version.label}</h2>
                    </div>
                    {difference ? (
                      <StatusPill tone={index === 0 ? "neutral" : (difference || "").includes("menos") ? "good" : "warn"}>
                        {difference}
                      </StatusPill>
                    ) : null}
                  </div>

                  <dl className="mt-4 grid gap-2.5 text-xs">
                    <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-1.5">
                      <dt className="font-semibold text-steel">Precio Lista</dt>
                      <dd className="text-right font-bold text-graphite">{formatCLP(version.priceList)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-1.5">
                      <dt className="font-semibold text-steel">Precio Contado</dt>
                      <dd className="text-right font-black text-ink">{formatCLP(version.priceCash)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-1.5">
                      <dt className="font-semibold text-steel">Precio Financiamiento</dt>
                      <dd className="text-right font-bold text-sky-700">
                        {version.priceFinancing ? formatCLP(version.priceFinancing) : "Sin bono crédito"}
                      </dd>
                    </div>
                    {version.priceDercoCl ? (
                      <div className="flex items-center justify-between gap-3 border-b border-graphite/10 pb-1.5">
                        <dt className="font-semibold text-steel">🌐 Reserva Derco.cl</dt>
                        <dd className="text-right font-black text-emerald-700">{formatCLP(version.priceDercoCl)}</dd>
                      </div>
                    ) : null}

                    {/* COSTO PUESTO EN CALLE (LLAVE EN MANO) */}
                    <div className="mt-2 rounded bg-steel/5 p-2.5">
                      <div className="flex items-center justify-between font-extrabold text-ink">
                        <span>PUESTO EN CALLE:</span>
                        <span className="text-emerald-700">
                          {version.onTheRoad.totalOnTheRoadCash ? formatCLP(version.onTheRoad.totalOnTheRoadCash) : "Estimado"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-steel">
                        <span>• Impuesto Verde: {formatCLP(version.onTheRoad.greenTax)}</span>
                        <span>• Inscripción/RNVM: {formatCLP(version.onTheRoad.registrationPermit)}</span>
                        <span>• Flete: {formatCLP(version.onTheRoad.freight)}</span>
                        <span>• Permiso Circulación (Est.): {formatCLP(version.onTheRoad.circulatingPermit)}</span>
                      </div>
                    </div>

                    {/* HERRAMIENTA INTERNA DE CIERRE COMPARTIDO */}
                    {version.closingTool.hasClosingSupport ? (
                      <div className="mt-2 rounded bg-amber-500/10 border border-amber-500/30 p-2.5 text-amber-900">
                        <p className="font-extrabold text-xs flex items-center gap-1">
                          💰 Apoyo Cierre Compartido: {formatCLP(version.closingTool.totalClosingSupportCash)}
                        </p>
                        <div className="mt-1 text-[10px] grid gap-0.5">
                          <span>• Aporte Marca: {formatCLP(version.closingTool.brandCashShare)}</span>
                          <span>• Aporte Concesionario (CES): {formatCLP(version.closingTool.cesCashShare)}</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <dt className="font-semibold text-steel">CIT Homologado</dt>
                      <dd className="text-right font-bold text-graphite">{version.sapCode ?? "Pendiente"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/cotizador?versionId=${version.id}`} className="btn btn-secondary text-xs">
                      Cotizar
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Link href={`/rentabilidad?versionId=${version.id}`} className="btn btn-secondary text-xs">
                      Rentabilidad
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>

          {/* MATRIZ DETALLADA DE COMPARACIÓN */}
          <section className="panel rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">Matriz Detallada de Comparación Comercial y Técnica</p>
                <p className="mt-1 text-xs font-semibold text-steel">Revisa ítem por ítem las diferencias de precios, gastos puesta en calle, equipamiento y seguridad.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-steel">
                <input
                  type="checkbox"
                  checked={showOnlyDifferences}
                  onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                  className="rounded border-steel/30"
                />
                Ver solo diferencias
              </label>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-graphite/10 text-steel">
                    <th className="py-2.5 font-black uppercase">Característica</th>
                    {comparable.map((v) => (
                      <th key={v.id} className="py-2.5 font-black text-ink">{v.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite/5">
                  {visibleRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-steel">{row.label}</td>
                      {row.values.map((val, idx) => (
                        <td key={idx} className="py-2.5 font-semibold text-graphite">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
