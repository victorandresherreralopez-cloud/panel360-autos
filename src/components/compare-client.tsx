"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CheckCircle2, Info, Search, SlidersHorizontal, Tag } from "lucide-react";
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

function priceForDifference(version: ComparableVersion) {
  return version.priceFinal ?? version.priceList;
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

function statusTone(status: ReturnType<typeof buildComparisonRows>[number]["status"]) {
  if (status === "different") return "warn";
  if (status === "partial") return "bad";
  if (status === "same") return "good";
  return "neutral";
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
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(true);
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
  const differenceCount = rows.filter((row) => row.status === "different").length;
  const partialCount = rows.filter((row) => row.status === "partial").length;

  if (!versions.length) {
    return (
      <EmptyState
        title="Todavia no existen versiones cargadas."
        description="Carga modelos y versiones desde Administracion o revisa un documento comercial para comenzar a comparar."
        actionHref="/admin"
        actionLabel="Abrir administracion"
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="panel rounded-lg p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-ink">Seleccione hasta 3 versiones</p>
            <p className="mt-1 text-xs font-semibold text-steel">La primera opcion queda como referencia para calcular diferencias.</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden="true" />
            <input
              className="input pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar marca, modelo, version o CIT"
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
              <option value="">Version {slot + 1}</option>
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
        <EmptyState title="Seleccione al menos dos versiones." description="El comparador muestra precios, bonos y diferencias cuando existen dos o tres versiones seleccionadas." />
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                <BadgeDollarSign className="h-4 w-4 text-signal" aria-hidden="true" />
                Mas conveniente
              </p>
              <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.cheapest}</p>
            </div>
            <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                <SlidersHorizontal className="h-4 w-4 text-copper" aria-hidden="true" />
                Brecha de precio
              </p>
              <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.spread}</p>
            </div>
            <div className="rounded-lg border border-graphite/10 bg-white/82 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                <Tag className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Mayor bono
              </p>
              <p className="mt-2 text-sm font-black leading-5 text-ink">{priceSummary.bestDiscount}</p>
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            {comparable.map((version, index) => {
              const base = comparable[0];
              const price = priceForDifference(version);
              const difference = index === 0 ? "Referencia" : priceDifferenceLabel(priceForDifference(base), price);

              return (
                <article key={version.id} className="rounded-lg border border-graphite/10 bg-white/82 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-copper">{index === 0 ? "Referencia" : `Opcion ${index + 1}`}</p>
                      <h2 className="mt-1 text-base font-black leading-5 text-ink">{version.label}</h2>
                    </div>
                    <StatusPill tone={index === 0 ? "neutral" : difference.includes("menos") ? "good" : "warn"}>{difference}</StatusPill>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-steel">Precio final</dt>
                      <dd className="text-right font-black text-ink">{formatCLP(price)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-steel">Precio lista</dt>
                      <dd className="text-right font-bold text-graphite">{formatCLP(version.priceList)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-steel">Bono/ahorro</dt>
                      <dd className="text-right font-bold text-emerald-800">{formatCLP(version.campaignDiscount)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="font-semibold text-steel">CIT</dt>
                      <dd className="text-right font-bold text-graphite">{version.sapCode ?? "Pendiente"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/cotizador?versionId=${version.id}`} className="btn btn-secondary">
                      Cotizar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href={`/rentabilidad?versionId=${version.id}`} className="btn btn-secondary">
                      Rentabilidad
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>

          {aidAlerts.length ? (
            <section className="panel rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-ink">Alertas comerciales relacionadas</p>
                  <p className="mt-1 text-xs font-semibold text-steel">Bonos, campanas, tasas o patente detectadas en los documentos cargados.</p>
                </div>
                <StatusPill tone="warn">{aidAlerts.length} alertas</StatusPill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {aidAlerts.map((aid) => (
                  <article key={aid.id} className="rounded-lg border border-graphite/10 bg-white/78 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-ink">
                      <Info className="h-4 w-4 text-copper" aria-hidden="true" />
                      {aid.title}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase text-steel">
                      {[aid.brandName, aid.modelName, aid.versionName].filter(Boolean).join(" | ")}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-graphite">{aid.detail}</p>
                    <p className="mt-2 text-xs font-semibold text-steel">Fuente: {aid.source}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="panel overflow-hidden rounded-lg">
            <div className="flex flex-col gap-3 border-b border-graphite/10 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-ink">Diferencias detectadas</p>
                <p className="mt-1 text-sm font-semibold text-steel">
                  {differenceCount} campos distintos y {partialCount} campos con datos incompletos.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-graphite/10 bg-mist p-1">
                <button
                  type="button"
                  className={clsx("rounded-md px-3 py-2 text-xs font-black", showOnlyDifferences ? "bg-white text-ink shadow-sm" : "text-steel")}
                  onClick={() => setShowOnlyDifferences(true)}
                >
                  Solo diferencias
                </button>
                <button
                  type="button"
                  className={clsx("rounded-md px-3 py-2 text-xs font-black", !showOnlyDifferences ? "bg-white text-ink shadow-sm" : "text-steel")}
                  onClick={() => setShowOnlyDifferences(false)}
                >
                  Todo
                </button>
              </div>
            </div>

            {visibleRows.length ? (
              <div className="overflow-x-auto">
                <table className="data-table min-w-[860px]">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      {comparable.map((version) => (
                        <th key={version.id}>{version.label}</th>
                      ))}
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.key} className={row.status === "different" ? "bg-copper/5" : row.status === "partial" ? "bg-red-50/60" : undefined}>
                        <td className="font-black text-ink">{row.label}</td>
                        {row.values.map((value, index) => (
                          <td key={`${row.key}-${index}`} className="max-w-[320px] text-sm font-semibold leading-6 text-graphite">
                            {value}
                          </td>
                        ))}
                        <td>
                          <StatusPill tone={statusTone(row.status)}>
                            {row.status === "same" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                            {rowStatusLabel(row.status)}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState title="No hay diferencias con datos cargados." description="Cambia a la vista Todo para revisar campos iguales o informacion pendiente." />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
