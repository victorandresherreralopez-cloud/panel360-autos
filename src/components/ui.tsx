import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CarFront, FileSearch, Info, Plus } from "lucide-react";
import clsx from "clsx";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-black uppercase text-copper">{eyebrow}</p> : null}
        <h1 className="text-3xl font-black tracking-normal text-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-steel">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("panel rounded-lg p-5", className)}>{children}</section>;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-steel/30 bg-white/60 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mist text-steel">
        <FileSearch className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-black text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-steel">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-primary mt-5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border border-graphite/10 bg-white/78 p-4">
      <p className="text-xs font-black uppercase text-steel">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-steel">{detail}</p> : null}
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black",
        tone === "good" && "bg-emerald-50 text-emerald-800",
        tone === "warn" && "bg-amber-50 text-amber-800",
        tone === "bad" && "bg-red-50 text-red-800",
        tone === "neutral" && "bg-mist text-graphite"
      )}
    >
      {children}
    </span>
  );
}

export function VehicleVisual({ label, imageUrl }: { label: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <div className="relative h-44 overflow-hidden rounded-lg border border-graphite/10 bg-white">
        <Image src={imageUrl} alt={label} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-4" unoptimized />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-4 pt-10">
          <p className="text-xs font-black uppercase text-steel">Imagen Derco</p>
          <p className="text-lg font-black text-ink">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-placeholder relative h-40 overflow-hidden rounded-lg p-5 text-white">
      <div className="absolute inset-x-6 bottom-7 h-10 rounded-full border border-white/25 bg-white/10" />
      <div className="absolute bottom-5 left-10 h-7 w-7 rounded-full border-4 border-white/70 bg-ink" />
      <div className="absolute bottom-5 right-10 h-7 w-7 rounded-full border-4 border-white/70 bg-ink" />
      <CarFront className="relative z-10 h-7 w-7" aria-hidden="true" />
      <p className="relative z-10 mt-12 text-xs font-black uppercase text-white/70">Fotografia pendiente</p>
      <p className="relative z-10 text-lg font-black">{label}</p>
    </div>
  );
}

export function QuickLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="group rounded-lg border border-graphite/10 bg-white/78 p-4 transition hover:-translate-y-0.5 hover:shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-ink">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-steel">{detail}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-steel transition group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-signal/20 bg-signal/5 p-4 text-sm font-semibold leading-6 text-graphite">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
