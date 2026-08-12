import { ArrowUpRight, CreditCard } from "lucide-react";
import { AmicarCreditWorkspace, type AmicarInitialValues } from "@/components/amicar-credit-workspace";
import { EmptyState, Notice, PageHeader, Panel, StatusPill } from "@/components/ui";
import { formatCLP, formatDate, fullName } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AMICAR_LOGIN_URL = "https://amices.amicar.com/login";

function searchValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function todayInChile() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Santiago",
    year: "numeric"
  }).formatToParts(new Date());
  const dateByType = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  return `${dateByType.year}-${dateByType.month}-${dateByType.day}`;
}

export default async function CreditsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const [customers, quotes, latestCredits] = await Promise.all([
    prisma.customer.findMany({
      include: { status: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    }),
    prisma.quote.findMany({
      where: { customerId: { not: null } },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.creditContract.findMany({
      where: { financialEntity: "AMICAR" },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  const initialValues: AmicarInitialValues = {
    customerId: searchValue(searchParams?.customerId),
    quoteId: searchValue(searchParams?.quoteId),
    vehicleLabel: searchValue(searchParams?.vehicleLabel),
    saleAmount: searchValue(searchParams?.saleAmount),
    financedAmount: searchValue(searchParams?.financedAmount),
    downPayment: searchValue(searchParams?.downPayment),
    installments: searchValue(searchParams?.installments),
    rate: searchValue(searchParams?.rate)
  };

  const amicarCustomers = customers.map((customer) => ({
    id: customer.id,
    label: fullName(customer.firstName, customer.lastName),
    rut: customer.rut ?? "",
    phone: customer.phone ?? customer.whatsapp ?? "",
    email: customer.email ?? "",
    interestedVehicle: [customer.interestedBrand, customer.interestedModel, customer.interestedVersion].filter(Boolean).join(" "),
    statusName: customer.status?.name ?? "Sin estado"
  }));

  const amicarQuotes = quotes.map((quote) => {
    const firstItem = quote.items[0];
    return {
      id: quote.id,
      customerId: quote.customerId ?? "",
      title: quote.title,
      totalAmount: quote.totalAmount,
      vehicleLabel: firstItem ? `${firstItem.brandName} ${firstItem.modelName} ${firstItem.versionName}` : quote.title,
      dateLabel: formatDate(quote.createdAt)
    };
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="AMICAR"
        title="Creditos Amicar"
        description="Evalua creditos con los datos de cliente y cotizacion, abre Amicar oficial y deja el resultado guardado en el CRM."
        action={
          <a className="btn btn-primary" href={AMICAR_LOGIN_URL} target="_blank" rel="noreferrer">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Abrir Amicar
          </a>
        }
      />

      <Notice>
        Amicar bloquea el incrustado dentro de otros sistemas con X-Frame-Options: deny. Por eso se abre en una pestana segura y este sistema prepara los datos, registra el resultado y actualiza el estado del cliente.
      </Notice>

      {searchParams?.guardado ? <Notice>Evaluacion Amicar guardada en el CRM y estado del cliente actualizado.</Notice> : null}

      {customers.length ? (
        <AmicarCreditWorkspace customers={amicarCustomers} quotes={amicarQuotes} initialValues={initialValues} today={todayInChile()} />
      ) : (
        <EmptyState title="No hay clientes para evaluar." description="Crea el cliente en el CRM antes de enviar una evaluacion a Amicar." actionHref="/clientes" actionLabel="Crear cliente" />
      )}

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-copper">Seguimiento financiero</p>
            <h2 className="mt-1 text-xl font-black text-ink">Ultimas evaluaciones Amicar</h2>
          </div>
          <StatusPill>{latestCredits.length} registros</StatusPill>
        </div>
        <div className="mt-4 grid gap-3">
          {latestCredits.length ? (
            latestCredits.map((credit) => (
              <div key={credit.id} className="rounded-lg border border-graphite/10 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-black text-ink">
                      <CreditCard className="h-4 w-4 text-signal" aria-hidden="true" />
                      {fullName(credit.customer.firstName, credit.customer.lastName)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-steel">
                      Financiado: {formatCLP(credit.financedAmount)} | Pie: {formatCLP(credit.downPayment)} | Cuotas: {credit.installments ?? "Pendiente"}
                    </p>
                  </div>
                  <StatusPill tone={credit.observations?.includes("Aprobado") ? "good" : credit.observations?.includes("Rechazado") ? "bad" : "warn"}>
                    {credit.observations?.split("\n")[0]?.replace("Resultado Amicar: ", "") ?? "En evaluacion"}
                  </StatusPill>
                </div>
                <p className="mt-2 text-xs font-semibold text-steel">Registrado: {formatDate(credit.createdAt)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-steel">Aun no hay evaluaciones Amicar registradas.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
