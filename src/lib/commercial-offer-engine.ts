import { formatCLP } from "./format";

export type CommercialScenario = {
  key: "LISTA" | "CONTADO" | "FINANCING" | "FINANCIAMIENTO" | "CAMPAIGN" | "DERCO_CL" | "PREVENTA";
  label: string;
  amount: number;
  condition?: string;
  badge?: string;
};


export type CommercialOfferEngineResult = {
  // Scenarios
  listPrice: number | null;
  cashPrice: number | null;
  financingPrice: number | null;
  campaignPrice: number | null;
  dercoClPrice: number | null;
  presalePrice: number | null;

  // Best scenario matching buyer criteria
  bestEligiblePrice: number | null;
  eligibleScenarioName: string;

  // All active scenarios
  scenarios: CommercialScenario[];

  // On The Road Breakdown (Puesto en Calle / Llave en Mano)
  onTheRoad: {
    isCommercialVehicle: boolean;
    greenTax: number;
    registrationPermit: number; // RNVM / Conservaduría
    freight: number;
    circulatingPermit: number;
    totalOnTheRoadCash: number | null;
    totalOnTheRoadFinancing: number | null;
    statusText: "DISPONIBLE" | "ESTIMADO" | "PENDIENTES_DATOS";
  };

  // Client Bonuses (Bono público al cliente)
  clientBonuses: {
    brandBonus: number;
    financingBonus: number;
    totalClientBonus: number;
  };

  // Internal Closing Tool (Bono / Aporte de Cierre Compartido CES + Marca)
  closingTool: {
    hasClosingSupport: boolean;
    cesCashShare: number;
    brandCashShare: number;
    cesCreditShare: number;
    brandCreditShare: number;
    totalClosingSupportCash: number;
    totalClosingSupportCredit: number;
    restrictions: string[];
    compatibleCampaigns: string[];
  };

  // Badges & Special Features
  features: {
    hasFreeLicensePlate: boolean; // Patente gratis
    specialRate?: string | null;  // Tasa especial, ej: "1.69%"
    presaleName?: string | null;
    digitalExclusiveName?: string | null;
  };
};

export function evaluateCommercialOffers(params: {
  brandName: string;
  modelName: string;
  versionName: string;
  segment?: string | null;
  canonicalSegment?: string | null;
  equipmentSummary?: string | null;
  sapCode?: string | null;
  prices: Array<{ priceType: string; amount: number; status?: string; channel?: string }>;
  offers?: Array<{
    offerType: string;
    amountCash?: number | null;
    amountCredit?: number | null;
    amountTotal?: number | null;
    aporteCES?: number | null;
    aporteMarca?: number | null;
    aporteCESCredit?: number | null;
    aporteMarcaCredit?: number | null;
    rate?: string | null;
    incompatibleWith?: string | null;
    compatibleWith?: string | null;
    condition?: string | null;
    sheetName?: string | null;
    status?: string;
  }>;
  customFreight?: number;
  customGreenTax?: number;
  preferredPayment?: "CONTADO" | "CREDITO" | "INDIFERENTE";
}): CommercialOfferEngineResult {
  const {
    brandName,
    modelName,
    versionName,
    segment,
    canonicalSegment,
    equipmentSummary,
    sapCode,
    prices,
    offers = [],
    customFreight = 150000,
    customGreenTax,
    preferredPayment = "INDIFERENTE"
  } = params;

  // Active prices filtering
  const activePrices = prices.filter((p) => p.status !== "IGNORADO" && p.status !== "REEMPLAZADO");

  const listPriceObj = activePrices.find((p) => p.priceType === "LIST");
  const campaignPriceObj = activePrices.find((p) => p.priceType === "CAMPAIGN");
  const cashPriceObj = activePrices.find((p) => p.priceType === "CASH");
  const financingPriceObj = activePrices.find((p) => p.priceType === "FINANCING");
  const dercoClPriceObj = activePrices.find((p) => p.channel === "DERCO_CL" || p.priceType === "DERCO_CL");
  const presalePriceObj = activePrices.find((p) => p.channel === "PREVENTA" || p.priceType === "PREVENTA");

  const listPrice = listPriceObj?.amount ?? null;
  const campaignPrice = campaignPriceObj?.amount ?? null;
  const cashPrice = cashPriceObj?.amount ?? campaignPrice ?? listPrice;
  const financingPrice = financingPriceObj?.amount ?? null; // STRICTLY from DB, NO dummy fallback
  const dercoClPrice = dercoClPriceObj?.amount ?? null;
  const presalePrice = presalePriceObj?.amount ?? null;

  // Scenarios list
  const scenarios: CommercialScenario[] = [];
  if (listPrice) scenarios.push({ key: "LISTA", label: "Precio Lista Oficial", amount: listPrice });
  if (cashPrice) scenarios.push({ key: "CONTADO", label: "Precio Contado", amount: cashPrice });
  if (financingPrice) scenarios.push({ key: "FINANCING", label: "Precio Financiamiento (Todos Bonos)", amount: financingPrice, badge: "💳 Crédito" });
  if (campaignPrice && campaignPrice !== cashPrice) scenarios.push({ key: "CAMPAIGN", label: "Precio Campaña Vigente", amount: campaignPrice, badge: "🔥 Campaña" });
  if (dercoClPrice) scenarios.push({ key: "DERCO_CL", label: "Precio Derco.cl / DCR.cl", amount: dercoClPrice, condition: "Requiere reserva online en Derco.cl", badge: "🌐 Web" });
  if (presalePrice) scenarios.push({ key: "PREVENTA", label: "Precio Preventa", amount: presalePrice, badge: "⭐ Preventa" });

  // Determine best eligible price based on preferred payment method
  let bestEligiblePrice: number | null = null;
  let eligibleScenarioName = "Precio Contado";

  if (preferredPayment === "CONTADO") {
    bestEligiblePrice = dercoClPrice ?? presalePrice ?? cashPrice ?? listPrice;
    if (dercoClPrice) eligibleScenarioName = "Precio Reserva Derco.cl (Contado)";
    else if (presalePrice) eligibleScenarioName = "Precio Preventa (Contado)";
    else eligibleScenarioName = "Precio Contado";
  } else if (preferredPayment === "CREDITO") {
    bestEligiblePrice = financingPrice ?? dercoClPrice ?? cashPrice ?? listPrice;
    if (financingPrice) eligibleScenarioName = "Precio Financiamiento";
    else if (dercoClPrice) eligibleScenarioName = "Precio Reserva Derco.cl";
    else eligibleScenarioName = "Precio Contado (Sin bono crédito disponible)";
  } else {
    // Indiferente: mejor precio disponible
    const allAmounts = [financingPrice, dercoClPrice, presalePrice, campaignPrice, cashPrice, listPrice].filter((a): a is number => a != null && a > 0);
    bestEligiblePrice = allAmounts.length ? Math.min(...allAmounts) : null;
    if (bestEligiblePrice === financingPrice) eligibleScenarioName = "Precio Financiamiento (Mejor opción)";
    else if (bestEligiblePrice === dercoClPrice) eligibleScenarioName = "Precio Derco.cl (Requiere reserva web)";
    else if (bestEligiblePrice === campaignPrice) eligibleScenarioName = "Precio Campaña Vigente";
    else eligibleScenarioName = "Precio Contado";
  }

  // Detect commercial/pickup status for VAT deduction
  const textHaystack = [brandName, modelName, versionName, segment, canonicalSegment, equipmentSummary].filter(Boolean).join(" ").toLowerCase();
  const isCommercialVehicle =
    canonicalSegment === "PICKUP" ||
    canonicalSegment === "COMERCIAL" ||
    textHaystack.includes("pickup") ||
    textHaystack.includes("camioneta") ||
    textHaystack.includes("wingle") ||
    textHaystack.includes("poer") ||
    textHaystack.includes("hunter") ||
    textHaystack.includes("bt-50") ||
    textHaystack.includes("furgon") ||
    textHaystack.includes("truck");

  // On The Road Expenses (Llave en Mano)
  const freight = customFreight;
  const registrationPermit = 82230; // Conservaduría / Inscripción RNVM
  const greenTax = customGreenTax ?? (isCommercialVehicle ? 120000 : 250000);
  const basePriceForPermit = cashPrice ?? listPrice ?? 15000000;
  const circulatingPermit = Math.round(Math.max(45000, basePriceForPermit * 0.015));

  const totalOnTheRoadCash = cashPrice ? cashPrice + freight + registrationPermit + greenTax + circulatingPermit : null;
  const totalOnTheRoadFinancing = financingPrice ? financingPrice + freight + registrationPermit + greenTax + circulatingPermit : null;

  // Client Public Bonuses
  const brandBonus = listPrice && cashPrice && listPrice > cashPrice ? listPrice - cashPrice : 0;
  const financingBonus = cashPrice && financingPrice && cashPrice > financingPrice ? cashPrice - financingPrice : 0;
  const totalClientBonus = brandBonus + financingBonus;

  // Internal Closing Tool (Bono Cierre Compartido CES + Marca)
  const closingOffers = offers.filter((o) => o.offerType === "BONO_CIERRE_COMPARTIDO" && o.status !== "FINALIZADA");
  let cesCashShare = 0;
  let brandCashShare = 0;
  let cesCreditShare = 0;
  let brandCreditShare = 0;
  const restrictions: string[] = [];
  const compatibleCampaigns: string[] = [];

  for (const c of closingOffers) {
    cesCashShare += c.aporteCES ?? 0;
    brandCashShare += c.aporteMarca ?? 0;
    cesCreditShare += c.aporteCESCredit ?? c.aporteCES ?? 0;
    brandCreditShare += c.aporteMarcaCredit ?? c.aporteMarca ?? 0;
    if (c.incompatibleWith) restrictions.push(c.incompatibleWith);
    if (c.compatibleWith) compatibleCampaigns.push(c.compatibleWith);
    if (c.condition) restrictions.push(c.condition);
  }

  const totalClosingSupportCash = cesCashShare + brandCashShare;
  const totalClosingSupportCredit = cesCreditShare + brandCreditShare;
  const hasClosingSupport = totalClosingSupportCash > 0 || totalClosingSupportCredit > 0;

  // Features (Patente Gratis, Tasas)
  const hasFreeLicensePlate = offers.some((o) => o.offerType === "PATENTE_GRATIS" && o.status !== "FINALIZADA");
  const rateOffer = offers.find((o) => o.offerType === "TASA" && o.status !== "FINALIZADA");
  const specialRate = rateOffer?.rate ?? null;
  const presaleOffer = offers.find((o) => o.offerType === "PREVENTA");
  const digitalOffer = offers.find((o) => o.channel === "DERCO_CL");

  return {
    listPrice,
    cashPrice,
    financingPrice,
    campaignPrice,
    dercoClPrice,
    presalePrice,
    bestEligiblePrice,
    eligibleScenarioName,
    scenarios,
    onTheRoad: {
      isCommercialVehicle,
      greenTax,
      registrationPermit,
      freight,
      circulatingPermit,
      totalOnTheRoadCash,
      totalOnTheRoadFinancing,
      statusText: cashPrice ? "ESTIMADO" : "PENDIENTES_DATOS"
    },
    clientBonuses: {
      brandBonus,
      financingBonus,
      totalClientBonus
    },
    closingTool: {
      hasClosingSupport,
      cesCashShare,
      brandCashShare,
      cesCreditShare,
      brandCreditShare,
      totalClosingSupportCash,
      totalClosingSupportCredit,
      restrictions: Array.from(new Set(restrictions)),
      compatibleCampaigns: Array.from(new Set(compatibleCampaigns))
    },
    features: {
      hasFreeLicensePlate,
      specialRate,
      presaleName: presaleOffer?.title ?? null,
      digitalExclusiveName: digitalOffer?.title ?? null
    }
  };
}
