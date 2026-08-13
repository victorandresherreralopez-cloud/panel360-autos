"use client";

import { useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  FileSpreadsheet,
  RefreshCw,
  Settings2,
  Users
} from "lucide-react";
import clsx from "clsx";
import type { FieldType, ColumnMapping } from "@/lib/import-detector";
import { ALL_FIELD_TYPES, getFieldLabel } from "@/lib/import-detector";

type Stage = "idle" | "analyzing" | "mapping" | "importing" | "done" | "error";

type AnalysisResult = {
  ok: boolean;
  filename: string;
  totalRows: number;
  readyRows: number;
  duplicates: number;
  reviewRows: number;
  invalidRuts: number;
  emailIssues: number;
  phoneIssues: number;
  headers: string[];
  mappings: ColumnMapping[];
  sampleData: string[][];
  error?: string;
};

type ImportResult = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  total: number;
  renewalOpportunities: number;
  message: string;
  error?: string;
};

export default function ImportarClientesPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [userMappings, setUserMappings] = useState<ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importLabel, setImportLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleFile(f: File) {
    setFile(f);
    setImportLabel(f.name.replace(/\.[^.]+$/, ""));
    setStage("analyzing");
    setErrorMsg("");
    setProgress(25);

    const form = new FormData();
    form.append("file", f);

    const res = await fetch("/api/imports/analyze", { method: "POST", body: form });
    const data: AnalysisResult = await res.json();
    setProgress(100);

    if (!data.ok) {
      setErrorMsg(data.error ?? "Error desconocido al analizar.");
      setStage("error");
      return;
    }

    setAnalysis(data);
    setUserMappings(data.mappings);
    setStage("mapping");
  }

  function setFieldForCol(colIndex: number, field: FieldType) {
    setUserMappings((prev) =>
      prev.map((m) => (m.colIndex === colIndex ? { ...m, detectedField: field, label: getFieldLabel(field) } : m))
    );
  }

  async function handleImport() {
    if (!file || !analysis) return;
    setStage("importing");
    setProgress(10);

    const form = new FormData();
    form.append("file", file);
    form.append("mappings", JSON.stringify(userMappings.map((m) => ({ colIndex: m.colIndex, field: m.detectedField }))));
    form.append("label", importLabel);

    const res = await fetch("/api/imports/process", { method: "POST", body: form });
    setProgress(90);
    const data: ImportResult = await res.json();
    setProgress(100);

    if (!data.ok) {
      setErrorMsg(data.error ?? "Error en la importación.");
      setStage("error");
      return;
    }

    setImportResult(data);
    setStage("done");
  }

  function reset() {
    setStage("idle");
    setFile(null);
    setAnalysis(null);
    setUserMappings([]);
    setImportResult(null);
    setImportLabel("");
    setErrorMsg("");
    setProgress(0);
  }

  return (
    <div className="grid gap-6">
      {/* HEADER */}
      <div>
        <p className="text-xs font-black uppercase text-teal-600 dark:text-teal-400">ADMINISTRACIÓN</p>
        <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
          Importador Inteligente de Clientes
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500 dark:text-slate-400">
          Sube un archivo Excel o CSV con tu base de clientes histórica. El sistema detecta automáticamente las columnas (RUT, teléfono, correo, créditos), normaliza los datos y genera las oportunidades de renovación correspondientes.
        </p>
      </div>

      {/* STAGE: IDLE — Dropzone */}
      {stage === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-teal-400 hover:bg-teal-50/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-600 dark:hover:bg-teal-950/20"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/60">
            <CloudUpload className="h-8 w-8 text-teal-500" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white">Arrastra tu archivo aquí</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              o haz clic para seleccionar — .xlsx, .xls, .csv
            </p>
          </div>
          <div className="flex gap-3 text-xs font-bold text-slate-400">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">✓ Detección automática de columnas</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">✓ Normalización de RUT y teléfonos</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">✓ Detección de duplicados</span>
          </div>
        </div>
      )}

      {/* STAGE: ANALYZING */}
      {stage === "analyzing" && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-teal-200 border-t-teal-500" />
          <p className="text-lg font-black text-slate-900 dark:text-white">Analizando archivo…</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detectando columnas, validando RUTs y buscando duplicados.</p>
          <div className="w-64 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* STAGE: MAPPING */}
      {stage === "mapping" && analysis && (
        <div className="grid gap-6">
          {/* Stats Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Filas detectadas", value: analysis.totalRows, color: "teal" },
              { label: "Listas para importar", value: analysis.readyRows, color: "emerald" },
              { label: "Duplicados encontrados", value: analysis.duplicates, color: "amber" },
              { label: "RUTs inválidos", value: analysis.invalidRuts, color: "red" }
            ].map(({ label, value, color }) => (
              <div key={label} className={clsx(
                "rounded-xl border p-4",
                `border-${color}-500/30 bg-${color}-50/40 dark:border-${color}-800 dark:bg-${color}-950/30`
              )}>
                <p className={`text-xs font-black uppercase text-${color}-700 dark:text-${color}-300`}>{label}</p>
                <p className="mt-1.5 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Issues warnings */}
          <div className="flex flex-wrap gap-2">
            {analysis.emailIssues > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" /> {analysis.emailIssues} correos con formato incorrecto — se importan como texto
              </span>
            )}
            {analysis.phoneIssues > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" /> {analysis.phoneIssues} teléfonos no normalizados — se importan tal cual
              </span>
            )}
          </div>

          {/* Column Mapping Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-teal-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-white">Mapeo de Columnas</h2>
                <span className="ml-2 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-black text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                  Revisa y ajusta si el sistema cometió un error
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                    <th className="px-4 py-3 text-left font-black text-slate-500 uppercase">Columna original</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500 uppercase">Campo detectado</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500 uppercase">Confianza</th>
                    <th className="px-4 py-3 text-left font-black text-slate-500 uppercase">Muestra</th>
                  </tr>
                </thead>
                <tbody>
                  {userMappings.map((m) => (
                    <tr key={m.colIndex} className="border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.originalHeader}</td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={m.detectedField}
                            onChange={(e) => setFieldForCol(m.colIndex, e.target.value as FieldType)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          >
                            {ALL_FIELD_TYPES.map((ft) => (
                              <option key={ft} value={ft}>{getFieldLabel(ft)}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={clsx(
                                "h-full rounded-full",
                                m.confidence >= 80 ? "bg-emerald-500" : m.confidence >= 50 ? "bg-amber-400" : "bg-red-400"
                              )}
                              style={{ width: `${m.confidence}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-600 dark:text-slate-300">{m.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{m.sample.slice(0, 2).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Label + Confirm */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="input flex-1 min-w-48 text-sm"
              value={importLabel}
              onChange={(e) => setImportLabel(e.target.value)}
              placeholder="Nombre de esta importación (ej: Base Mazda Agosto 2025)"
            />
            <button className="btn btn-secondary" onClick={reset} type="button">Cancelar</button>
            <button className="btn btn-primary" onClick={handleImport} type="button">
              <FileSpreadsheet className="h-4 w-4" />
              Importar {analysis.readyRows} clientes
            </button>
          </div>
        </div>
      )}

      {/* STAGE: IMPORTING */}
      {stage === "importing" && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-teal-200 border-t-teal-500" />
          <p className="text-lg font-black text-slate-900 dark:text-white">Procesando importación…</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Normalizando datos, detectando duplicados y registrando créditos.</p>
          <div className="w-64 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* STAGE: DONE */}
      {stage === "done" && importResult && (
        <div className="grid gap-5">
          <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/40 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xl font-black text-slate-900 dark:text-white">Importación completada</p>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{importResult.message}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Clientes nuevos", value: importResult.created, color: "teal" },
              { label: "Actualizados", value: importResult.updated, color: "blue" },
              { label: "Oportunidades de renovación", value: importResult.renewalOpportunities, color: "amber" },
              { label: "Errores", value: importResult.errors, color: "red" }
            ].map(({ label, value, color }) => (
              <div key={label} className={clsx(
                "rounded-xl border p-4",
                `border-${color}-500/30 bg-${color}-50/40 dark:border-${color}-800 dark:bg-${color}-950/30`
              )}>
                <p className={`text-xs font-black uppercase text-${color}-700 dark:text-${color}-300`}>{label}</p>
                <p className="mt-1.5 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <a href="/clientes" className="btn btn-primary">
              <Users className="h-4 w-4" /> Ver Clientes Importados
            </a>
            <a href="/renovaciones" className="btn btn-secondary">
              <RefreshCw className="h-4 w-4" /> Ver Motor de Renovaciones
            </a>
            <button className="btn btn-secondary" onClick={reset} type="button">
              Importar otro archivo
            </button>
          </div>
        </div>
      )}

      {/* STAGE: ERROR */}
      {stage === "error" && (
        <div className="rounded-2xl border border-red-300/60 bg-red-50/40 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 shrink-0 text-red-500" />
            <div>
              <p className="font-black text-slate-900 dark:text-white">Error al procesar el archivo</p>
              <p className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>
              <button className="btn btn-secondary mt-4" onClick={reset} type="button">Intentar de nuevo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
