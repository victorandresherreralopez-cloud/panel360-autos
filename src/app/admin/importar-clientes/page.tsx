import Link from "next/link";
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, Sparkles, Upload } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ImportarClientesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="ADMINISTRACIÓN & BASE DE DATOS"
        title="Importador Inteligente de Bases de Clientes"
        description="Carga bases de clientes históricas en formatos Excel (.xlsx, .xls) o CSV (.csv). El motor analiza e infiere automáticamente columnas (RUT, teléfonos, correos, vehículos y créditos) aunque el archivo venga completamente desordenado."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase text-teal-600 dark:text-teal-400">Carga Desatendida & Heurística</p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Selecciona tu archivo de clientes</h2>
            </div>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>

          <div className="mt-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">Arrastra tu planilla Excel o CSV aquí</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Soporta archivos de 100 hasta más de 50.000 registros. No necesitas ordenar previamente las columnas; el motor detecta RUT, teléfonos, marcas y vencimiento de créditos automáticamente.
            </p>

            <div className="mt-6 flex justify-center">
              <label className="btn btn-primary cursor-pointer">
                <Upload className="h-4 w-4" />
                Examinar Archivo (.xlsx, .xls, .csv)
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" />
              </label>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="text-xs font-black uppercase text-amber-500">Capacidades Inteligentes</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">¿Cómo procesa Panel360?</h3>

            <ul className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500 mt-0.5" />
                <span><strong>Detección por Regex:</strong> Infiere RUTs, correos y números sin depender del nombre exacto de la columna.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500 mt-0.5" />
                <span><strong>Conciliación de Duplicados:</strong> Evita duplicar registros por RUT e integra teléfonos o direcciones adicionales.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500 mt-0.5" />
                <span><strong>Generador de Renovaciones:</strong> Si la base trae vehículos o créditos anteriores, genera alertas automáticas a 30, 60 y 90 días.</span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
