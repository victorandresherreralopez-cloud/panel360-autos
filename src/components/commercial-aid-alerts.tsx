import Link from "next/link";
import { BadgeDollarSign, ExternalLink } from "lucide-react";
import { EmptyState, Panel, StatusPill } from "@/components/ui";
import type { CommercialAidAlert } from "@/lib/commercial-aids";
import { formatDateTime } from "@/lib/format";

export function CommercialAidAlerts({ alerts, compact = false }: { alerts: CommercialAidAlert[]; compact?: boolean }) {
  if (!alerts.length) {
    if (compact) {
      return <p className="text-sm font-semibold leading-6 text-steel dark:text-slate-400">No hay ayudas comerciales detectadas para esta vista.</p>;
    }

    return (
      <EmptyState
        title="No hay ayudas comerciales detectadas."
        description="Cuando los planes comerciales o listas traigan bonos, campañas, tasas o patente gratis, aparecerán aquí para revisión."
        actionHref="/actualizaciones"
        actionLabel="Revisar actualizaciones"
      />
    );
  }

  return (
    <div className={compact ? "grid gap-0" : "grid gap-3"}>
      {alerts.map((alert) => (
        <div key={alert.id} className={compact ? "border-t border-graphite/10 py-3 dark:border-slate-800 first:border-t-0 first:pt-0 last:pb-0" : "rounded-lg border border-graphite/10 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-white">
                <BadgeDollarSign className="h-4 w-4 text-signal dark:text-teal-400" aria-hidden="true" />
                {alert.title}
              </p>
              <p className="mt-1 text-xs font-black uppercase text-copper dark:text-amber-400">
                {[alert.brandName, alert.modelName, alert.versionName].filter(Boolean).join(" | ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={alert.tone}>{alert.category}</StatusPill>
              <StatusPill tone={alert.confidence === "AMBIGUA" ? "warn" : "neutral"}>{alert.confidence}</StatusPill>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-graphite dark:text-slate-200">{alert.detail}</p>
          {!compact ? <p className="mt-3 rounded-lg bg-mist/70 p-3 text-xs font-semibold leading-5 text-steel dark:bg-slate-800/80 dark:text-slate-300">{alert.rawText}</p> : null}
          <div className="mt-3 flex flex-col gap-2 text-xs font-semibold text-steel dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Fuente: {alert.source} | {formatDateTime(alert.createdAt)}
            </span>
            <Link href="/actualizaciones" className="inline-flex items-center gap-1 font-black text-signal dark:text-teal-400">
              Revisar fuente <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommercialAidPanel({ alerts }: { alerts: CommercialAidAlert[] }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-copper dark:text-amber-400">Ayudas comerciales</p>
          <h2 className="text-xl font-black text-ink dark:text-white">Campañas y bonos detectados</h2>
        </div>
        <Link href="/ayudas-comerciales" className="btn btn-secondary">
          Ver todas
        </Link>
      </div>
      <CommercialAidAlerts alerts={alerts.slice(0, 6)} compact />
    </Panel>
  );
}
