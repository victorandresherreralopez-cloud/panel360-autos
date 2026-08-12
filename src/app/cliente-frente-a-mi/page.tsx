import Link from "next/link";
import {
  BadgeDollarSign,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Gauge,
  GitCompareArrows,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { saveClientProfile } from "@/lib/actions";
import { commercialAidMatchesVehicle, getCommercialAidAlerts, type CommercialAidAlert } from "@/lib/commercial-aids";
import { formatCLP, missing, normalizeText, parseMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { EmptyState, Notice, PageHeader, Panel, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

const budgets = [
  ["", "Sin limite claro"],
  ["10000000", "Hasta $10 millones"],
  ["12000000", "Hasta $12 millones"],
  ["15000000", "Hasta $15 millones"],
  ["18000000", "Hasta $18 millones"],
  ["20000000", "Hasta $20 millones"],
  ["25000000", "Hasta $25 millones"],
  ["30000000", "Hasta $30 millones"],
  ["40000000", "Hasta $40 millones"],
  ["50000000", "Hasta $50 millones"]
];

const types = ["Citycar", "Hatchback", "Sedan", "SUV", "Pickup", "Comercial", "Indiferente"];
const uses = ["Ciudad", "Familia", "Carretera", "Trabajo", "Campo", "4x4", "Mixto"];
const fuels = ["Gasolina", "Diesel", "Hibrido", "Hibrido enchufable", "Electrico", "Indiferente"];
const boxes = ["Manual", "Automatica", "Indiferente"];
const tractions = ["2WD", "AWD", "4WD", "Indiferente"];
const priorities = ["Precio", "Economia", "Equipamiento", "Seguridad", "Espacio", "Potencia", "Tecnologia"];
const familySizes = ["1-2 personas", "3-4 personas", "5 o mas", "Carga/herramientas"];
const timings = ["Solo mirando", "Cotizar hoy", "Credito ahora", "Cerrar esta semana"];
const financingModes = ["Indefinido", "Contado", "Credito", "Credito con pie", "Retoma + credito"];
const tradeInOptions = ["No", "Si, por tasar", "Si, ya valorizado"];

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function budgetLabel(value: string) {
  return budgets.find(([optionValue]) => optionValue === value)?.[1] ?? "No informado";
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalizeText(word)));
}

function addReason(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function buildCompareHref(ids: string[]) {
  const params = new URLSearchParams();
  ids.slice(0, 3).forEach((id) => params.append("v", id));
  return `/comparador?${params.toString()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default async function ClientInFrontPage({ searchParams }: { searchParams: SearchParams }) {
  const customerId = firstParam(searchParams, "customerId");
  const budgetRaw = firstParam(searchParams, "budget");
  const budget = parseMoney(budgetRaw);
  const segment = firstParam(searchParams, "type");
  const use = firstParam(searchParams, "use");
  const fuel = firstParam(searchParams, "fuel");
  const box = firstParam(searchParams, "box");
  const traction = firstParam(searchParams, "traction");
  const priority = firstParam(searchParams, "priority");
  const familySize = firstParam(searchParams, "familySize");
  const purchaseTiming = firstParam(searchParams, "purchaseTiming");
  const financing = firstParam(searchParams, "financing");
  const tradeIn = firstParam(searchParams, "tradeIn");
  const profileNotes = firstParam(searchParams, "profileNotes");
  const hasFilters = [customerId, budgetRaw, segment, use, fuel, box, traction, priority, familySize, purchaseTiming, financing, tradeIn, profileNotes].some(Boolean);

  const [versions, customers, commercialAidAlerts] = await Promise.all([
    prisma.version.findMany({
      where: { status: { not: "IGNORADO" } },
      include: {
        brand: true,
        model: true,
        prices: { where: { status: "VIGENTE" }, orderBy: { effectiveFrom: "desc" } }
      },
      orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { commercialOrder: "asc" }, { name: "asc" }]
    }),
    prisma.customer.findMany({
      include: { status: true },
      orderBy: { updatedAt: "desc" },
      take: 80
    }),
    getCommercialAidAlerts(120)
  ]);

  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  const scored = versions
    .map((version) => {
      const listPrice = version.prices.find((item) => item.priceType === "LIST")?.amount ?? null;
      const campaignPrice = version.prices.find((item) => item.priceType === "CAMPAIGN")?.amount ?? null;
      const cashPrice = version.prices.find((item) => item.priceType === "CASH")?.amount ?? null;
      const financingPrice = version.prices.find((item) => item.priceType === "FINANCING")?.amount ?? null;
      const price = campaignPrice ?? cashPrice ?? financingPrice ?? listPrice;
      const detectedBonus = listPrice && price && listPrice > price ? listPrice - price : 0;
      const haystack = normalizeText(
        [
          version.brand.name,
          version.model.name,
          version.model.segment,
          version.name,
          version.engine,
          version.power,
          version.transmission,
          version.traction,
          version.fuelType,
          version.consumption,
          version.passengers,
          version.cargoCapacity,
          version.screen,
          version.carPlay,
          version.androidAuto,
          version.camera,
          version.sensors,
          version.airbags,
          version.adas,
          version.equipmentSummary,
          version.safetySummary
        ]
          .filter(Boolean)
          .join(" ")
      );

      const segmentText = normalizeText(version.model.segment ?? `${version.model.name} ${version.name}`);
      const reasons: string[] = [];
      const warnings: string[] = [];
      let score = price ? 24 : -40;

      if (!price) warnings.push("Sin precio vigente aprobado.");

      if (budget && price) {
        if (price <= budget) {
          score += 28;
          addReason(reasons, "calza dentro del presupuesto declarado");
        } else if (price <= budget * 1.08) {
          score += 8;
          addReason(reasons, "sirve como opcion para subir presupuesto");
        } else {
          score -= 36;
          warnings.push(`Supera el presupuesto por ${formatCLP(price - budget)}.`);
        }
      }

      if (segment && segment !== "Indiferente") {
        const segmentMatches = segmentText.includes(normalizeText(segment)) || haystack.includes(normalizeText(segment));
        if (segmentMatches) {
          score += 16;
          addReason(reasons, `busca ${segment.toLowerCase()}`);
        } else {
          score -= 5;
        }
      }

      if (fuel && fuel !== "Indiferente") {
        if (haystack.includes(normalizeText(fuel))) {
          score += 11;
          addReason(reasons, `combustible ${fuel.toLowerCase()}`);
        } else {
          score -= 4;
        }
      }

      if (box && box !== "Indiferente") {
        const wantsAutomatic = normalizeText(box).includes("automat");
        const matchesBox = wantsAutomatic ? includesAny(haystack, ["AT", "CVT", "DCT", "automatica"]) : includesAny(haystack, ["MT", "manual"]);
        if (matchesBox) {
          score += 9;
          addReason(reasons, `caja ${box.toLowerCase()}`);
        } else {
          score -= 4;
        }
      }

      if (traction && traction !== "Indiferente") {
        if (haystack.includes(normalizeText(traction))) {
          score += 9;
          addReason(reasons, `traccion ${traction}`);
        } else {
          score -= traction === "4WD" || traction === "AWD" ? 8 : 2;
        }
      }

      if (use === "Ciudad") {
        if (includesAny(haystack, ["citycar", "hatchback", "sedan", "hibrido", "electrico", "cvt", "automatica"])) score += 12;
        addReason(reasons, "uso urbano y maniobrabilidad diaria");
      }
      if (use === "Familia") {
        if (includesAny(haystack, ["suv", "airbags", "adas", "isofix", "camara", "sensores", "climatizador"])) score += 14;
        addReason(reasons, "prioriza comodidad y seguridad familiar");
      }
      if (use === "Carretera") {
        if (includesAny(haystack, ["crucero", "adas", "turbo", "diesel", "awd", "hibrido"])) score += 12;
        addReason(reasons, "debe sentirse estable en carretera");
      }
      if (use === "Trabajo") {
        if (includesAny(haystack, ["pickup", "comercial", "diesel", "carga", "truck", "4x4"])) score += 16;
        addReason(reasons, "necesita rendimiento para trabajo");
      }
      if (use === "Campo" || use === "4x4") {
        if (includesAny(haystack, ["4wd", "awd", "pickup", "diesel", "4x4"])) score += 16;
        else warnings.push("Revisar si la traccion cumple el uso fuera de ciudad.");
        addReason(reasons, "requiere mejor traccion y despeje");
      }
      if (use === "Mixto") {
        if (includesAny(haystack, ["suv", "hatchback", "pickup", "automatica", "hibrido"])) score += 8;
        addReason(reasons, "sirve para uso mixto sin cerrar alternativas");
      }

      if (familySize === "5 o mas") {
        if (includesAny(haystack, ["5", "6", "7", "suv", "cx-90", "h7", "tank"])) score += 10;
        else warnings.push("Confirmar espacio real para pasajeros.");
      }
      if (familySize === "Carga/herramientas") {
        if (includesAny(haystack, ["pickup", "carga", "cargo", "truck", "comercial"])) score += 12;
        else warnings.push("Confirmar volumen de carga antes de ofrecer.");
      }

      if (priority === "Precio") {
        if (detectedBonus > 0) score += 12;
        if (budget && price && price <= budget * 0.92) score += 8;
        addReason(reasons, "permite defender precio y bono");
      }
      if (priority === "Economia") {
        if (includesAny(haystack, ["hibrido", "hybrid", "electrico", "diesel", "consumo"])) score += 14;
        addReason(reasons, "argumento de economia de uso");
      }
      if (priority === "Equipamiento") {
        if (version.equipmentSummary || includesAny(haystack, ["pantalla", "techo", "camara", "sensores", "carplay", "android"])) score += 14;
        addReason(reasons, "tiene elementos para mostrar equipamiento");
      }
      if (priority === "Seguridad") {
        if (version.safetySummary || includesAny(haystack, ["airbags", "adas", "camara", "sensores", "crucero"])) score += 14;
        addReason(reasons, "puedes vender seguridad con respaldo");
      }
      if (priority === "Espacio") {
        if (includesAny(haystack, ["suv", "pickup", "cargo", "maletero", "pasajeros"])) score += 14;
        addReason(reasons, "calza con necesidad de espacio");
      }
      if (priority === "Potencia") {
        if (version.power || includesAny(haystack, ["turbo", "2.0", "2.4", "2.5", "3.3"])) score += 12;
        addReason(reasons, "hay argumento de respuesta y motor");
      }
      if (priority === "Tecnologia") {
        if (includesAny(haystack, ["pantalla", "carplay", "android", "adas", "camara", "sensores"])) score += 14;
        addReason(reasons, "puedes mostrar tecnologia en sala");
      }

      if (financing.includes("Credito") && financingPrice) {
        score += 8;
        addReason(reasons, "tiene precio o foco de financiamiento cargado");
      }

      if (detectedBonus > 0) addReason(reasons, `bono/precio campaña detectado: ${formatCLP(detectedBonus)}`);
      if (version.sapCode) score += 2;
      else warnings.push("Codigo CIT pendiente para impuesto verde.");

      const aids = commercialAidAlerts.filter((alert) => commercialAidMatchesVehicle(alert, version.brand.name, version.model.name)).slice(0, 2);
      if (aids.length) {
        score += aids.length * 5;
        addReason(reasons, "tiene ayuda comercial detectada");
      }

      return {
        version,
        price,
        listPrice,
        detectedBonus,
        score,
        fit: clamp(Math.round(score), 0, 100),
        reasons: reasons.slice(0, 4),
        warnings: warnings.slice(0, 3),
        aids
      };
    })
    .filter((item) => {
      if (!item.price) return false;
      if (!budget) return item.score > 10;
      return item.price <= budget * 1.12;
    })
    .sort((a, b) => b.score - a.score || (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);

  const top = scored[0];
  const compareHref = scored.length >= 2 ? buildCompareHref(scored.map((item) => item.version.id)) : "/comparador";
  const currentPath = `/cliente-frente-a-mi?${new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map((item) => [key, item]);
      return [[key, value]];
    })
  ).toString()}`;

  const sellerAdvice = top
    ? `Partir con ${top.version.brand.name} ${top.version.model.name}: ${top.reasons[0] ?? "calza mejor con el perfil cargado"}. Luego comparar contra la segunda opcion para justificar precio/equipamiento.`
    : "Hacer dos preguntas mas: presupuesto real y uso principal. Con eso el sistema ordena alternativas.";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Perfilador express"
        description="Una pauta rapida para entender al cliente, elegir que ofrecerle primero y pasar directo a comparar, cotizar, rentabilidad o credito."
      />

      <Notice>
        La recomendacion usa solo versiones, precios vigentes, fichas cargadas y ayudas comerciales detectadas. Sirve como apoyo de venta; antes de cerrar revisa disponibilidad, vigencia y condiciones.
      </Notice>

      {firstParam(searchParams, "guardado") ? <Notice>Perfil guardado en el CRM del cliente.</Notice> : null}

      <Panel>
        <form className="grid gap-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cliente</span>
              <select className="input" name="customerId" defaultValue={customerId}>
                <option value="">Cliente no creado aun</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName ?? ""} | {customer.status?.name ?? "Sin estado"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Presupuesto</span>
              <select className="input" name="budget" defaultValue={budgetRaw}>
                {budgets.map(([value, label]) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Cuando compra</span>
              <select className="input" name="purchaseTiming" defaultValue={purchaseTiming}>
                <option value="">Momento de compra</option>
                {timings.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Uso principal</span>
              <select className="input" name="use" defaultValue={use}>
                <option value="">Uso</option>
                {uses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Tipo ideal</span>
              <select className="input" name="type" defaultValue={segment}>
                <option value="">Tipo</option>
                {types.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Familia o carga</span>
              <select className="input" name="familySize" defaultValue={familySize}>
                <option value="">No preguntado</option>
                {familySizes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Prioridad</span>
              <select className="input" name="priority" defaultValue={priority}>
                <option value="">Lo mas importante</option>
                {priorities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Combustible</span>
              <select className="input" name="fuel" defaultValue={fuel}>
                <option value="">Combustible</option>
                {fuels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Caja</span>
              <select className="input" name="box" defaultValue={box}>
                <option value="">Caja</option>
                {boxes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Traccion</span>
              <select className="input" name="traction" defaultValue={traction}>
                <option value="">Traccion</option>
                {tractions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Pago</span>
              <select className="input" name="financing" defaultValue={financing}>
                {financingModes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-steel">Retoma</span>
              <select className="input" name="tradeIn" defaultValue={tradeIn}>
                {tradeInOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase text-steel">Notas rapidas del cliente</span>
            <input className="input" name="profileNotes" defaultValue={profileNotes} placeholder="Ej: quiere automatico, maletero grande, no quiere pasar de cuota X" />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" type="submit">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Perfilar y recomendar
            </button>
            <Link className="btn btn-secondary" href="/clientes">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              Crear cliente
            </Link>
            <p className="text-sm font-semibold text-steel">
              Preguntas minimas: presupuesto, uso y prioridad. Lo demas afina la recomendacion.
            </p>
          </div>
        </form>
      </Panel>

      {!hasFilters ? (
        <EmptyState
          title="Haz 3 preguntas y el sistema ordena las opciones."
          description="Parte por presupuesto, uso principal y prioridad. Despues puedes afinar con caja, combustible, traccion, credito o retoma."
        />
      ) : scored.length ? (
        <>
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Panel>
              <p className="text-xs font-black uppercase text-copper">Lectura del cliente</p>
              <h2 className="mt-1 text-xl font-black text-ink">{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName ?? ""}` : "Cliente aun no asociado"}</h2>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-graphite">
                <p><strong className="text-ink">Presupuesto:</strong> {budgetLabel(budgetRaw)}</p>
                <p><strong className="text-ink">Necesidad:</strong> {[use, segment, familySize, priority].filter(Boolean).join(" | ") || "No definida"}</p>
                <p><strong className="text-ink">Pago:</strong> {[financing, tradeIn, purchaseTiming].filter(Boolean).join(" | ") || "No definido"}</p>
              </div>
              <div className="mt-4 rounded-lg border border-signal/20 bg-signal/5 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-ink">
                  <MessageSquareText className="h-4 w-4 text-signal" aria-hidden="true" />
                  Que decir primero
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-graphite">{sellerAdvice}</p>
              </div>
              <form action={saveClientProfile} className="mt-4 grid gap-2">
                <input type="hidden" name="customerId" value={customerId} />
                <input type="hidden" name="budget" value={budgetRaw} />
                <input type="hidden" name="budgetLabel" value={budgetLabel(budgetRaw)} />
                <input type="hidden" name="use" value={use} />
                <input type="hidden" name="type" value={segment} />
                <input type="hidden" name="fuel" value={fuel} />
                <input type="hidden" name="box" value={box} />
                <input type="hidden" name="traction" value={traction} />
                <input type="hidden" name="priority" value={priority} />
                <input type="hidden" name="familySize" value={familySize} />
                <input type="hidden" name="purchaseTiming" value={purchaseTiming} />
                <input type="hidden" name="financing" value={financing} />
                <input type="hidden" name="tradeIn" value={tradeIn} />
                <input type="hidden" name="profileNotes" value={profileNotes} />
                <input type="hidden" name="recommendedBrand" value={top.version.brand.name} />
                <input type="hidden" name="recommendedModel" value={top.version.model.name} />
                <input type="hidden" name="recommendedVersion" value={top.version.name} />
                <input type="hidden" name="recommendedVehicleLabel" value={`${top.version.brand.name} ${top.version.model.name} ${top.version.name}`} />
                <input type="hidden" name="sellerAdvice" value={sellerAdvice} />
                <input type="hidden" name="returnTo" value={currentPath} />
                <button className="btn btn-primary w-fit" type="submit" disabled={!customerId}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Guardar perfil en CRM
                </button>
                {!customerId ? <p className="text-xs font-semibold text-steel">Selecciona o crea un cliente para guardar este perfil.</p> : null}
              </form>
            </Panel>

            <Panel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-copper">Siguiente paso</p>
                  <h2 className="mt-1 text-xl font-black text-ink">Trabajar las opciones recomendadas</h2>
                </div>
                <StatusPill tone="good">{scored.length} alternativas</StatusPill>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Link href={compareHref} className="btn btn-secondary">
                  <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                  Comparar estas
                </Link>
                <Link href={`/cotizador?versionId=${top.version.id}${customerId ? `&customerId=${customerId}` : ""}`} className="btn btn-primary">
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Cotizar la mejor
                </Link>
                <Link href={`/rentabilidad?versionId=${top.version.id}`} className="btn btn-secondary">
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                  Ver margen
                </Link>
                <Link
                  href={`/creditos?vehicleLabel=${encodeURIComponent(`${top.version.brand.name} ${top.version.model.name} ${top.version.name}`)}&saleAmount=${top.price ?? ""}${customerId ? `&customerId=${customerId}` : ""}`}
                  className="btn btn-secondary"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Evaluar credito
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {top.aids.length ? (
                  top.aids.map((aid: CommercialAidAlert) => (
                    <div key={aid.id} className="rounded-lg border border-graphite/10 bg-white p-3">
                      <p className="flex items-center gap-2 text-sm font-black text-ink">
                        <BadgeDollarSign className="h-4 w-4 text-signal" aria-hidden="true" />
                        {aid.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-steel">{aid.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-graphite/10 bg-white p-3 text-sm font-semibold text-steel">
                    Sin ayuda comercial asociada automaticamente a la primera opcion. Revisa plan comercial si quieres forzar una campana.
                  </p>
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {scored.map((item, index) => {
              const label = `${item.version.brand.name} ${item.version.model.name} ${item.version.name}`;
              return (
                <Panel key={item.version.id}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill tone={index === 0 ? "good" : item.price && budget && item.price > budget ? "warn" : "neutral"}>
                      {index === 0 ? "Ofrecer primero" : index === 1 ? "Comparar contra esta" : "Opcion para subir"}
                    </StatusPill>
                    <div className="flex items-center gap-1 text-sm font-black text-signal">
                      <Gauge className="h-4 w-4" aria-hidden="true" />
                      {item.fit}%
                    </div>
                  </div>
                  <h2 className="mt-4 text-xl font-black text-ink">{item.version.brand.name} {item.version.model.name}</h2>
                  <p className="mt-1 text-sm font-black text-graphite">{item.version.name}</p>
                  <p className="mt-4 text-2xl font-black text-ink">{formatCLP(item.price)}</p>
                  {item.detectedBonus ? <p className="mt-1 text-sm font-black text-signal">Bono/precio campana: {formatCLP(item.detectedBonus)}</p> : null}

                  <div className="mt-4 grid gap-2">
                    {item.reasons.map((reason) => (
                      <p key={reason} className="flex gap-2 text-sm font-semibold leading-5 text-graphite">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
                        {reason}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-mist p-3">
                    <p className="flex items-center gap-2 text-xs font-black uppercase text-steel">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Argumentos
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-graphite">
                      Equipamiento: {missing(item.version.equipmentSummary)}. Seguridad: {missing(item.version.safetySummary)}.
                    </p>
                  </div>

                  {item.warnings.length ? (
                    <div className="mt-3 grid gap-2">
                      {item.warnings.map((warning) => (
                        <p key={warning} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-800">
                          {warning}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="btn btn-primary" href={`/cotizador?versionId=${item.version.id}${customerId ? `&customerId=${customerId}` : ""}`}>
                      Cotizar
                    </Link>
                    <Link className="btn btn-secondary" href={`/rentabilidad?versionId=${item.version.id}`}>
                      Margen
                    </Link>
                    <Link className="btn btn-secondary" href={`/buscar?q=${encodeURIComponent(label)}`}>
                      Ver datos
                    </Link>
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title="No hay una recomendacion seria con estos datos."
          description="Prueba ampliar presupuesto, dejar tipo como indiferente o cambiar traccion/combustible. Prefiero no recomendar algo que no calza."
          actionHref="/vehiculos"
          actionLabel="Revisar catalogo"
        />
      )}
    </div>
  );
}
