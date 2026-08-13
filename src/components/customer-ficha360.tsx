"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeDollarSign,
  CalendarClock,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  History,
  MessageSquareText,
  Phone,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  User,
  Wallet
} from "lucide-react";
import clsx from "clsx";

type Tab = "identificacion" | "comercial" | "historial" | "postventa";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "identificacion", label: "Identificación", icon: User },
  { id: "comercial", label: "Info Comercial", icon: Star },
  { id: "historial", label: "Historial", icon: History },
  { id: "postventa", label: "Postventa", icon: RefreshCw }
];

type CustomerFicha360Props = {
  customer: {
    id: string;
    firstName: string;
    lastName?: string | null;
    rut?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    birthDate?: Date | null;
    address?: string | null;
    commune?: string | null;
    city?: string | null;
    region?: string | null;
    interestedBrand?: string | null;
    interestedModel?: string | null;
    interestedVersion?: string | null;
    budget?: number | null;
    purchaseType?: string | null;
    currentVehicle?: string | null;
    currentPlate?: string | null;
    notes?: string | null;
    lastContactAt?: Date | null;
    nextActionType?: string | null;
    nextActionAt?: Date | null;
    status?: { name: string } | null;
    origin?: { name: string } | null;
    activities: {
      id: string;
      type: string;
      description?: string | null;
      activityAt: Date;
    }[];
    reminders: {
      id: string;
      type: string;
      dueAt: Date;
      status: string;
      description?: string | null;
    }[];
    credits: {
      id: string;
      financialEntity?: string | null;
      financedAmount?: number | null;
      installments?: number | null;
      installmentAmount?: number | null;
      firstInstallmentDate?: Date | null;
      lastInstallmentDate?: Date | null;
      purchaseDate?: Date | null;
      observations?: string | null;
    }[];
    quotes: {
      id: string;
      title: string;
      totalAmount?: number | null;
      status: string;
      createdAt: Date;
    }[];
    vehicles: {
      id: string;
      brand: string;
      model: string;
      version?: string | null;
      year?: string | null;
      plate?: string | null;
      purchaseDate?: Date | null;
    }[];
    sales: {
      id: string;
      brandName: string;
      modelName: string;
      versionName?: string | null;
      agreedPrice?: number | null;
      saleDate: Date;
    }[];
  };
  formatCLP: (v?: number | null) => string;
  formatDate: (v?: Date | null) => string;
  formatDateTime: (v: Date) => string;
};

export function CustomerFicha360({ customer, formatCLP, formatDate, formatDateTime }: CustomerFicha360Props) {
  const [activeTab, setActiveTab] = useState<Tab>("identificacion");

  // Days until next birthday
  const birthdayBadge = (() => {
    if (!customer.birthDate) return null;
    const bd = new Date(customer.birthDate);
    const now = new Date();
    const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    const days = Math.ceil((next.getTime() - now.getTime()) / 86_400_000);
    return days <= 30 ? days : null;
  })();

  // Next credit renewal
  const renewalCredit = customer.credits
    .filter((c) => c.lastInstallmentDate)
    .sort((a, b) => (a.lastInstallmentDate?.getTime() ?? 0) - (b.lastInstallmentDate?.getTime() ?? 0))[0];

  const renewalDays = renewalCredit?.lastInstallmentDate
    ? Math.ceil((renewalCredit.lastInstallmentDate.getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="space-y-5">
      {/* QUICK ACTIONS BANNER */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/80">
        <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mr-1">Acciones rápidas</span>

        <Link
          href={`/comparador?customerId=${customer.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Comparar
        </Link>

        <Link
          href={`/cotizador?customerId=${customer.id}&customerName=${encodeURIComponent(`${customer.firstName} ${customer.lastName ?? ""}`)}`}
          className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/60"
        >
          <ClipboardCheck className="h-3.5 w-3.5" /> Cotizar
        </Link>

        <Link
          href={`/creditos?customerId=${customer.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
        >
          <CreditCard className="h-3.5 w-3.5" /> Crédito
        </Link>

        <Link
          href={`/cierre-venta?customerId=${customer.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Cierre
        </Link>

        <Link
          href={`/whatsapp?customerId=${customer.id}&name=${encodeURIComponent(customer.firstName)}`}
          className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-100 dark:bg-green-950/60 dark:text-green-300 dark:hover:bg-green-900/60"
        >
          <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
        </Link>

        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Phone className="h-3.5 w-3.5" /> Llamar
          </a>
        )}

        {/* Alerts */}
        <div className="ml-auto flex items-center gap-2">
          {birthdayBadge !== null && (
            <span className="flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-black text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
              🎂 Cumple en {birthdayBadge}d
            </span>
          )}
          {renewalDays !== null && renewalDays <= 90 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <RefreshCw className="h-3 w-3" /> Renueva en {renewalDays}d
            </span>
          )}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition",
                activeTab === tab.id
                  ? "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PESTAÑA: IDENTIFICACIÓN */}
      {activeTab === "identificacion" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Datos Personales</p>
            <dl className="space-y-3 text-sm">
              <Row label="RUT" value={customer.rut ?? "Pendiente"} />
              <Row label="Nombre completo" value={`${customer.firstName} ${customer.lastName ?? ""}`.trim()} />
              <Row label="Fecha de nacimiento" value={customer.birthDate ? formatDate(customer.birthDate) : "Pendiente"} />
              <Row label="Teléfono" value={customer.phone ?? "Pendiente"} />
              <Row label="WhatsApp" value={customer.whatsapp ?? customer.phone ?? "Pendiente"} />
              <Row label="Correo electrónico" value={customer.email ?? "Pendiente"} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Domicilio</p>
            <dl className="space-y-3 text-sm">
              <Row label="Dirección" value={customer.address ?? "Pendiente"} />
              <Row label="Comuna" value={customer.commune ?? "Pendiente"} />
              <Row label="Ciudad" value={customer.city ?? "Pendiente"} />
              <Row label="Región" value={customer.region ?? "Pendiente"} />
            </dl>

            <p className="mb-4 mt-6 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Clasificación</p>
            <dl className="space-y-3 text-sm">
              <Row label="Estado" value={customer.status?.name ?? "Sin estado"} />
              <Row label="Origen" value={customer.origin?.name ?? "No informado"} />
              <Row label="Notas" value={customer.notes ?? "Sin observaciones"} />
            </dl>
          </section>
        </div>
      )}

      {/* PESTAÑA: INFO COMERCIAL */}
      {activeTab === "comercial" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Vehículo de Interés</p>
            <dl className="space-y-3 text-sm">
              <Row label="Marca" value={customer.interestedBrand ?? "No especificada"} />
              <Row label="Modelo" value={customer.interestedModel ?? "No especificado"} />
              <Row label="Versión" value={customer.interestedVersion ?? "No especificada"} />
            </dl>

            <p className="mb-4 mt-6 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Condiciones de Compra</p>
            <dl className="space-y-3 text-sm">
              <Row label="Presupuesto" value={formatCLP(customer.budget)} />
              <Row label="Forma de pago" value={customer.purchaseType ?? "No informada"} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Vehículo Actual del Cliente</p>
            <dl className="space-y-3 text-sm">
              <Row label="Vehículo actual" value={customer.currentVehicle ?? "No registrado"} />
              <Row label="Patente actual" value={customer.currentPlate ?? "No registrada"} />
            </dl>

            {customer.vehicles.length > 0 && (
              <>
                <p className="mb-4 mt-6 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Vehículos Registrados</p>
                <div className="space-y-2">
                  {customer.vehicles.map((v) => (
                    <div key={v.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {v.brand} {v.model} {v.version ?? ""} {v.year ? `(${v.year})` : ""}
                      </p>
                      {v.plate && <p className="text-xs text-slate-500">Patente: {v.plate}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* PESTAÑA: HISTORIAL */}
      {activeTab === "historial" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Actividades */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">
              Línea de Tiempo ({customer.activities.length})
            </p>
            {customer.activities.length ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {customer.activities.map((act) => (
                  <div key={act.id} className="border-l-2 border-teal-400 pl-3 py-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{act.type}</p>
                    {act.description && <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{act.description}</p>}
                    <p className="text-[11px] text-slate-400">{formatDateTime(act.activityAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin actividades registradas.</p>
            )}
          </section>

          {/* Cotizaciones & Ventas */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">
                Cotizaciones ({customer.quotes.length})
              </p>
              {customer.quotes.length ? (
                <div className="space-y-2">
                  {customer.quotes.slice(0, 5).map((q) => (
                    <div key={q.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">{q.title}</p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(q.createdAt)}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{formatCLP(q.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sin cotizaciones.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">
                Ventas ({customer.sales.length})
              </p>
              {customer.sales.length ? (
                <div className="space-y-2">
                  {customer.sales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {s.brandName} {s.modelName} {s.versionName ?? ""}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(s.saleDate)}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{formatCLP(s.agreedPrice)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Sin ventas registradas.</p>
              )}
            </section>
          </div>
        </div>
      )}

      {/* PESTAÑA: POSTVENTA */}
      {activeTab === "postventa" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">Calendario Importante</p>
            <dl className="space-y-3 text-sm">
              <Row
                label="🎂 Cumpleaños"
                value={customer.birthDate ? formatDate(customer.birthDate) : "Pendiente"}
                highlight={birthdayBadge !== null}
              />
              <Row
                label="📅 Último contacto"
                value={customer.lastContactAt ? formatDateTime(customer.lastContactAt) : "Sin registro"}
              />
              <Row
                label="⏭️ Próxima acción"
                value={customer.nextActionType && customer.nextActionAt ? `${customer.nextActionType} — ${formatDateTime(customer.nextActionAt)}` : "Sin programar"}
              />
            </dl>

            {/* Recordatorios pendientes */}
            {customer.reminders.filter((r) => r.status === "PENDIENTE").length > 0 && (
              <>
                <p className="mb-3 mt-6 text-xs font-black uppercase text-amber-600 dark:text-amber-400">Recordatorios Pendientes</p>
                <div className="space-y-2">
                  {customer.reminders.filter((r) => r.status === "PENDIENTE").map((r) => (
                    <div key={r.id} className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{r.type}</p>
                      <p className="text-[11px] text-slate-500">{formatDateTime(r.dueAt)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Créditos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="mb-4 text-xs font-black uppercase text-teal-600 dark:text-teal-400">
              Créditos y Renovaciones ({customer.credits.length})
            </p>
            {customer.credits.length ? (
              <div className="space-y-3">
                {customer.credits.map((credit) => {
                  const daysLeft = credit.lastInstallmentDate
                    ? Math.ceil((credit.lastInstallmentDate.getTime() - Date.now()) / 86_400_000)
                    : null;

                  return (
                    <div
                      key={credit.id}
                      className={clsx(
                        "rounded-xl border p-3",
                        daysLeft !== null && daysLeft <= 30
                          ? "border-red-300/60 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20"
                          : daysLeft !== null && daysLeft <= 90
                          ? "border-amber-300/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {credit.financialEntity ?? "Financiera no registrada"}
                        </p>
                        {daysLeft !== null && (
                          <span className={clsx(
                            "text-[11px] font-black",
                            daysLeft <= 30 ? "text-red-600 dark:text-red-400" :
                            daysLeft <= 90 ? "text-amber-600 dark:text-amber-400" :
                            "text-slate-500"
                          )}>
                            {daysLeft > 0 ? `${daysLeft}d restantes` : "Vencido"}
                          </span>
                        )}
                      </div>
                      <dl className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {credit.installments && <dd>{credit.installments} cuotas de {formatCLP(credit.installmentAmount)}</dd>}
                        {credit.firstInstallmentDate && <dd>Primera cuota: {formatDate(credit.firstInstallmentDate)}</dd>}
                        {credit.lastInstallmentDate && <dd>Última cuota: {formatDate(credit.lastInstallmentDate)}</dd>}
                        {credit.financedAmount && <dd>Monto financiado: {formatCLP(credit.financedAmount)}</dd>}
                      </dl>
                      {daysLeft !== null && daysLeft <= 90 && (
                        <Link
                          href={`/cotizador?customerId=${customer.id}`}
                          className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-teal-500/10 px-3 py-1.5 text-[11px] font-black text-teal-700 hover:bg-teal-500/20 dark:text-teal-300"
                        >
                          <RefreshCw className="h-3 w-3" /> Cotizar renovación
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin créditos registrados.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <dt className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={clsx("text-xs font-semibold", highlight ? "font-black text-pink-600 dark:text-pink-400" : "text-slate-900 dark:text-white")}>
        {value}
      </dd>
    </div>
  );
}
