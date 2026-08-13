"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  GitCompareArrows,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import clsx from "clsx";
import { EmptyState, Panel, StatusPill, VehicleVisual } from "@/components/ui";
import { formatCLP, missing, normalizeText } from "@/lib/format";
import { getPricingBreakdown } from "@/lib/pricing-breakdown";

export type VehicleExplorerAid = {
  id: string;
  title: string;
  detail: string;
  category: string;
  tone: "neutral" | "good" | "warn" | "bad";
};

export type VehicleExplorerVersion = {
  id: string;
  name: string;
  sapCode: string | null;
  engine: string | null;
  transmission: string | null;
  traction: string | null;
  fuelType: string | null;
  listPrice: number | null;
  bestPrice: number | null;
  prices?: Array<{ priceType: string; amount: number }>;
};

export type VehicleExplorerModel = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  segment: string | null;
  fuelTypes: string | null;
  transmissions: string | null;
  tractions: string | null;
  imagePath: string | null;
  status: string;
  fromPrice: number | null;
  technicalSheet: { id: string; originalName: string } | null;
  aids: VehicleExplorerAid[];
  versions: VehicleExplorerVersion[];
};

export type VehicleExplorerBrand = {
  id: string;
  name: string;
  models: VehicleExplorerModel[];
};

const quickFilters = [
  { id: "all", label: "Todos" },
  { id: "sheet", label: "Con ficha" },
  { id: "aids", label: "Con ayudas" },
  { id: "missing-cit", label: "Falta CIT" }
] as const;

type QuickFilter = (typeof quickFilters)[number]["id"];

function includesQuery(model: VehicleExplorerModel, query: string) {
  if (!query) return true;
  const normalized = normalizeText(query);
  const haystack = normalizeText(
    [
      model.brandName,
      model.name,
      model.segment,
      model.fuelTypes,
      model.transmissions,
      model.tractions,
      model.technicalSheet?.originalName,
      ...model.aids.flatMap((aid) => [aid.title, aid.detail, aid.category]),
      ...model.versions.flatMap((version) => [
        version.name,
        version.sapCode,
        version.engine,
        version.transmission,
        version.traction,
        version.fuelType,
        version.listPrice ? String(version.listPrice) : "",
        version.bestPrice ? String(version.bestPrice) : ""
      ])
    ]
      .filter(Boolean)
      .join(" ")
  );

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function compareHref(versions: VehicleExplorerVersion[]) {
  const params = new URLSearchParams();
  versions.slice(0, 3).forEach((version) => params.append("v", version.id));
  return `/comparador?${params.toString()}`;
}

function filterLabel(filter: QuickFilter) {
  return quickFilters.find((item) => item.id === filter)?.label ?? "Todos";
}

export function VehiclesExplorer({
  brands,
  initialQuery = ""
}: {
  brands: VehicleExplorerBrand[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [brandId, setBrandId] = useState("all");
  const [segment, setSegment] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const allModels = useMemo(() => brands.flatMap((brand) => brand.models), [brands]);
  const segments = useMemo(() => {
    const seen = new Map<string, string>();
    allModels.forEach((model) => {
      if (!model.segment) return;
      const key = normalizeText(model.segment);
      if (!seen.has(key)) seen.set(key, model.segment);
    });
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label })).slice(0, 10);
  }, [allModels]);

  const filteredModels = useMemo(
    () =>
      allModels.filter((model) => {
        if (brandId !== "all" && model.brandId !== brandId) return false;
        if (segment !== "all" && normalizeText(model.segment ?? "") !== segment) return false;
        if (quickFilter === "sheet" && !model.technicalSheet) return false;
        if (quickFilter === "aids" && !model.aids.length) return false;
        if (quickFilter === "missing-cit" && !model.versions.some((version) => !version.sapCode)) return false;
        return includesQuery(model, query);
      }),
    [allModels, brandId, query, quickFilter, segment]
  );

  const sheetModels = filteredModels.filter((model) => model.technicalSheet).slice(0, 8);
  const versionCount = filteredModels.reduce((total, model) => total + model.versions.length, 0);
  const missingCitCount = filteredModels.reduce((total, model) => total + model.versions.filter((version) => !version.sapCode).length, 0);

  function resetFilters() {
    setQuery("");
    setBrandId("all");
    setSegment("all");
    setQuickFilter("all");
  }

  return (
    <div className="grid gap-5">
      <Panel className="sticky top-20 z-10 lg:top-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-steel" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input min-h-14 pl-12 pr-11 text-base font-bold"
                placeholder="Buscar modelo, version, marca, ficha tecnica o Codigo CIT..."
                aria-label="Buscar vehiculo o ficha tecnica"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 rounded-lg p-2 text-steel transition hover:bg-mist"
                  aria-label="Limpiar busqueda"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <button type="button" onClick={resetFilters} className="btn btn-secondary shrink-0">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Accesos rapidos por marca">
            <button
              type="button"
              onClick={() => setBrandId("all")}
              className={clsx("min-h-11 shrink-0 rounded-lg border px-4 text-sm font-black transition", brandId === "all" ? "border-ink bg-ink text-white" : "border-graphite/10 bg-white text-graphite hover:border-signal/40")}
            >
              Todas
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setBrandId(brand.id)}
                className={clsx(
                  "min-h-11 shrink-0 rounded-lg border px-4 text-left transition",
                  brandId === brand.id ? "border-ink bg-ink text-white" : "border-graphite/10 bg-white text-graphite hover:border-signal/40"
                )}
              >
                <span className="block text-sm font-black">{brand.name}</span>
                <span className={clsx("block text-xs font-semibold", brandId === brand.id ? "text-white/72" : "text-steel")}>{brand.models.length} modelos</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtros rapidos de vehiculos">
            {quickFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuickFilter(item.id)}
                className={clsx(
                  "min-h-10 shrink-0 rounded-lg border px-3 text-sm font-black transition",
                  quickFilter === item.id ? "border-signal bg-signal text-white" : "border-graphite/10 bg-white text-graphite hover:border-signal/40"
                )}
              >
                {item.label}
              </button>
            ))}
            {segments.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSegment(segment === item.key ? "all" : item.key)}
                className={clsx(
                  "min-h-10 shrink-0 rounded-lg border px-3 text-sm font-black transition",
                  segment === item.key ? "border-copper bg-copper text-white" : "border-graphite/10 bg-white text-graphite hover:border-copper/50"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 text-sm font-semibold text-steel sm:grid-cols-4">
            <div className="rounded-lg border border-graphite/10 bg-mist/50 p-3">
              <span className="block text-xs font-black uppercase text-steel">Resultado</span>
              <span className="mt-1 block text-lg font-black text-ink">{filteredModels.length} modelos</span>
            </div>
            <div className="rounded-lg border border-graphite/10 bg-mist/50 p-3">
              <span className="block text-xs font-black uppercase text-steel">Versiones</span>
              <span className="mt-1 block text-lg font-black text-ink">{versionCount}</span>
            </div>
            <div className="rounded-lg border border-graphite/10 bg-mist/50 p-3">
              <span className="block text-xs font-black uppercase text-steel">Filtro activo</span>
              <span className="mt-1 block text-sm font-black text-ink">{filterLabel(quickFilter)}</span>
            </div>
            <div className="rounded-lg border border-graphite/10 bg-mist/50 p-3">
              <span className="block text-xs font-black uppercase text-steel">CIT pendiente</span>
              <span className="mt-1 block text-lg font-black text-ink">{missingCitCount}</span>
            </div>
          </div>
        </div>
      </Panel>

      {sheetModels.length ? (
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-copper">Fichas rapidas</p>
              <h2 className="text-xl font-black text-ink">Descarga directa</h2>
            </div>
            <StatusPill tone="good">{sheetModels.length} disponibles en esta vista</StatusPill>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {sheetModels.map((model) => (
              <a key={model.id} href={`/api/documents/${model.technicalSheet?.id}/download`} className="rounded-lg border border-graphite/10 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-panel">
                <p className="text-sm font-black text-ink">
                  {model.brandName} {model.name}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-steel">{model.technicalSheet?.originalName}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs font-black text-signal">
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  Descargar ficha
                </span>
              </a>
            ))}
          </div>
        </Panel>
      ) : null}

      {filteredModels.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredModels.map((model) => {
            const firstVersion = model.versions[0];
            const hasMissingCit = model.versions.some((version) => !version.sapCode);

            return (
              <Panel key={model.id} className="grid gap-4">
                <VehicleVisual label={`${model.brandName} ${model.name}`} imageUrl={model.imagePath} />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-copper">{model.brandName}</p>
                    <h2 className="mt-1 text-2xl font-black text-ink">{model.name}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-steel">
                      {missing(model.segment)} | {missing(model.fuelTypes)} | {missing(model.transmissions)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>{model.status}</StatusPill>
                    {model.technicalSheet ? <StatusPill tone="good">Ficha</StatusPill> : <StatusPill tone="warn">Sin ficha</StatusPill>}
                    {hasMissingCit ? <StatusPill tone="warn">CIT pendiente</StatusPill> : <StatusPill tone="good">CIT OK</StatusPill>}
                  </div>
                </div>

                <div className="grid gap-2 text-sm font-semibold text-graphite sm:grid-cols-3">
                  <p className="rounded-lg bg-mist/60 p-3">Precio desde: {formatCLP(model.fromPrice)}</p>
                  <p className="rounded-lg bg-mist/60 p-3">Traccion: {missing(model.tractions)}</p>
                  <p className="rounded-lg bg-mist/60 p-3">Versiones: {model.versions.length}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {model.technicalSheet ? (
                    <a className="btn btn-primary" href={`/api/documents/${model.technicalSheet.id}/download`}>
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      Ficha tecnica
                    </a>
                  ) : null}
                  {firstVersion ? (
                    <>
                      <Link href={`/cotizador?versionId=${firstVersion.id}`} className="btn btn-secondary">
                        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                        Cotizar
                      </Link>
                      <Link href={`/rentabilidad?versionId=${firstVersion.id}`} className="btn btn-secondary">
                        <Calculator className="h-4 w-4" aria-hidden="true" />
                        Rentabilidad
                      </Link>
                      {model.versions.length > 1 ? (
                        <Link href={compareHref(model.versions)} className="btn btn-secondary">
                          <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                          Comparar
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {model.aids.length ? (
                  <div className="rounded-lg border border-signal/15 bg-signal/5 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-black text-ink">
                      <BadgeDollarSign className="h-4 w-4 text-signal" aria-hidden="true" />
                      Ayudas para este modelo
                    </p>
                    <div className="grid gap-2">
                      {model.aids.map((aid) => (
                        <div key={aid.id} className="rounded-lg bg-white p-3">
                          <p className="text-sm font-black text-ink">{aid.title}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-steel">{aid.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  {model.versions.length ? (
                    <table className="data-table min-w-[860px]">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Codigo CIT</th>
                          <th>Precio Contado</th>
                          <th>Financiamiento (Todos Bonos)</th>
                          <th>Valor Sin IVA</th>
                          <th>Accion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.versions.map((version) => {
                          const breakdown = getPricingBreakdown({
                            brandName: model.brandName,
                            modelName: model.name,
                            versionName: version.name,
                            segment: model.segment,
                            citCode: version.sapCode,
                            prices: version.prices ? version.prices.map((p) => ({ priceType: p.priceType, amount: p.amount })) : []
                          });

                          return (
                            <tr key={version.id}>
                              <td className="font-black text-ink">
                                {version.name}
                                {breakdown.sharedBonusAlert ? (
                                  <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                                    ⭐ Bono Compartido
                                  </span>
                                ) : null}
                              </td>
                              <td>
                                {version.sapCode ? (
                                  <span className="inline-flex items-center gap-1 font-black text-signal">
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    {version.sapCode}
                                  </span>
                                ) : (
                                  <span className="font-bold text-amber-800">Pendiente</span>
                                )}
                              </td>
                              <td className="font-bold text-ink">{formatCLP(breakdown.cashPrice)}</td>
                              <td className="font-black text-emerald-700">{formatCLP(breakdown.financingPrice)}</td>
                              <td>
                                {breakdown.isCommercialVehicle && breakdown.cashNetPrice ? (
                                  <span className="font-black text-emerald-700">
                                    {formatCLP(breakdown.cashNetPrice)} <span className="text-[10px] font-semibold text-steel">+IVA</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-steel">N/A (Pasajeros)</span>
                                )}
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <Link href={`/cotizador?versionId=${version.id}`} className="rounded-lg border border-graphite/10 bg-white px-2.5 py-1.5 text-xs font-black text-graphite transition hover:border-signal/40">
                                    Cotizar
                                  </Link>
                                  <Link href={`/rentabilidad?versionId=${version.id}`} className="rounded-lg border border-graphite/10 bg-white px-2.5 py-1.5 text-xs font-black text-graphite transition hover:border-signal/40">
                                    Rentabilidad
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <EmptyState title="Todavia no existen versiones cargadas." description="Agrega versiones manualmente o importa un documento y aprueba los cambios detectados." />
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No encontre vehiculos con esos filtros."
          description="Prueba con marca, modelo, version, Codigo CIT o limpia filtros para volver al catalogo completo."
          actionHref="/actualizaciones"
          actionLabel="Cargar informacion"
        />
      )}
    </div>
  );
}
