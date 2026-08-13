import { formatCLP, normalizeText } from "./format";

export type CommercialPriceInfo = {
  isCommercialVehicle: boolean;
  listPrice: number | null;
  cashPrice: number | null;
  financingPrice: number | null;
  brandBonus: number;
  financingBonus: number;
  totalBonus: number;
  cashNetPrice: number | null;
  cashVatAmount: number | null;
  financingNetPrice: number | null;
  financingVatAmount: number | null;
  estimatedFreight: number;
  estimatedRegistration: number;
  estimatedGreenTax: number;
  estimatedPermit: number;
  estimatedKeyInHandCash: number | null;
  estimatedKeyInHandFinancing: number | null;
  sharedBonusAlert: string | null;
  campaignAlerts: string[];
};

export function getPricingBreakdown(params: {
  brandName: string;
  modelName: string;
  versionName: string;
  segment?: string | null;
  equipmentSummary?: string | null;
  citCode?: string | null;
  prices: Array<{ priceType: string; amount: number }>;
  customFreight?: number;
  customGreenTax?: number;
}): CommercialPriceInfo {
  const { brandName, modelName, versionName, segment, equipmentSummary, citCode, prices, customFreight = 150000, customGreenTax } = params;

  const listPriceObj = prices.find((p) => p.priceType === "LIST");
  const campaignPriceObj = prices.find((p) => p.priceType === "CAMPAIGN");
  const cashPriceObj = prices.find((p) => p.priceType === "CASH");
  const financingPriceObj = prices.find((p) => p.priceType === "FINANCING");

  const listPrice = listPriceObj?.amount ?? null;
  const cashPrice = cashPriceObj?.amount ?? campaignPriceObj?.amount ?? listPrice;
  const financingPrice = financingPriceObj?.amount ?? (cashPrice ? Math.round(cashPrice * 0.94) : null);

  const brandBonus = listPrice && cashPrice && listPrice > cashPrice ? listPrice - cashPrice : 0;
  const financingBonus = cashPrice && financingPrice && cashPrice > financingPrice ? cashPrice - financingPrice : 0;
  const totalBonus = brandBonus + financingBonus;

  // Detect commercial/pickup status for VAT deduction
  const textHaystack = normalizeText([brandName, modelName, versionName, segment, equipmentSummary].filter(Boolean).join(" "));
  const isCommercialVehicle =
    textHaystack.includes("pickup") ||
    textHaystack.includes("pick up") ||
    textHaystack.includes("camioneta") ||
    textHaystack.includes("poer") ||
    textHaystack.includes("wingle") ||
    textHaystack.includes("hunter") ||
    textHaystack.includes("bt 50") ||
    textHaystack.includes("d1") ||
    textHaystack.includes("truck") ||
    textHaystack.includes("cargo") ||
    textHaystack.includes("furgon") ||
    textHaystack.includes("van") ||
    textHaystack.includes("comercial");

  // VAT Net Calculations
  const cashNetPrice = isCommercialVehicle && cashPrice ? Math.round(cashPrice / 1.19) : null;
  const cashVatAmount = isCommercialVehicle && cashPrice && cashNetPrice ? cashPrice - cashNetPrice : null;

  const financingNetPrice = isCommercialVehicle && financingPrice ? Math.round(financingPrice / 1.19) : null;
  const financingVatAmount = isCommercialVehicle && financingPrice && financingNetPrice ? financingPrice - financingNetPrice : null;

  // Operational delivery expenses (Llave en Mano)
  const estimatedFreight = customFreight;
  const estimatedRegistration = 82230; // Conservaduría/Inscripción RNVM Chile
  const estimatedGreenTax = customGreenTax ?? (isCommercialVehicle ? 120000 : 250000); // Estimación referencial por emisiones/CIT
  const basePriceForPermit = cashPrice ?? listPrice ?? 15000000;
  const estimatedPermit = Math.round(Math.max(45000, basePriceForPermit * 0.015)); // Estimación Permiso de Circulación

  const estimatedKeyInHandCash = cashPrice ? cashPrice + estimatedFreight + estimatedRegistration + estimatedGreenTax + estimatedPermit : null;
  const estimatedKeyInHandFinancing = financingPrice
    ? financingPrice + estimatedFreight + estimatedRegistration + estimatedGreenTax + estimatedPermit
    : null;

  // Campaign alerts & shared bonuses
  const campaignAlerts: string[] = [];
  let sharedBonusAlert: string | null = null;

  if (brandBonus > 0 && financingBonus > 0) {
    sharedBonusAlert = `Bono Compartido Detectado: Bono Marca (${formatCLP(brandBonus)}) + Bono Financiamiento (${formatCLP(financingBonus)})`;
  } else if (brandBonus > 0) {
    campaignAlerts.push(`Bono Marca Vigente: ${formatCLP(brandBonus)}`);
  } else if (financingBonus > 0) {
    campaignAlerts.push(`Bono Crédito Vigente: ${formatCLP(financingBonus)}`);
  }

  if (isCommercialVehicle) {
    campaignAlerts.push("Vehículo Comercial / Pickup: Apto para descuento de IVA (Factura)");
  }

  if (citCode) {
    campaignAlerts.push(`CIT Homologado: ${citCode}`);
  }

  return {
    isCommercialVehicle,
    listPrice,
    cashPrice,
    financingPrice,
    brandBonus,
    financingBonus,
    totalBonus,
    cashNetPrice,
    cashVatAmount,
    financingNetPrice,
    financingVatAmount,
    estimatedFreight,
    estimatedRegistration,
    estimatedGreenTax,
    estimatedPermit,
    estimatedKeyInHandCash,
    estimatedKeyInHandFinancing,
    sharedBonusAlert,
    campaignAlerts
  };
}
