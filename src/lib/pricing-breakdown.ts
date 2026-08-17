import { evaluateCommercialOffers } from "./commercial-offer-engine";
import { formatCLP } from "./format";

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
  estimatedSoap: number;
  estimatedGreenTax: number;
  estimatedPermit: number;
  estimatedPermitCash: number;
  estimatedPermitFinancing: number;
  estimatedRoadCostCash: number;
  estimatedRoadCostFinancing: number;
  estimatedKeyInHandCash: number | null;
  estimatedKeyInHandFinancing: number | null;
  creditBonusAlert: string | null;
  campaignAlerts: string[];
};

export function getPricingBreakdown(params: {
  brandName: string;
  modelName: string;
  versionName: string;
  segment?: string | null;
  canonicalSegment?: string | null;
  equipmentSummary?: string | null;
  citCode?: string | null;
  prices: Array<{
    priceType: string;
    amount: number;
    status?: string | null;
    channel?: string | null;
    bonusName?: string | null;
    bonusAmount?: number | null;
    hasIva?: boolean | null;
    effectiveFrom?: Date | string | null;
  }>;
  customFreight?: number;
  customGreenTax?: number;
}): CommercialPriceInfo {
  const result = evaluateCommercialOffers({
    brandName: params.brandName,
    modelName: params.modelName,
    versionName: params.versionName,
    segment: params.segment,
    canonicalSegment: params.canonicalSegment,
    equipmentSummary: params.equipmentSummary,
    sapCode: params.citCode,
    prices: params.prices,
    customFreight: params.customFreight,
    customGreenTax: params.customGreenTax
  });

  const cashNetPrice = result.onTheRoad.isCommercialVehicle && result.cashPrice ? Math.round(result.cashPrice / 1.19) : null;
  const cashVatAmount = result.onTheRoad.isCommercialVehicle && result.cashPrice && cashNetPrice ? result.cashPrice - cashNetPrice : null;
  const financingNetPrice = result.onTheRoad.isCommercialVehicle && result.financingPrice ? Math.round(result.financingPrice / 1.19) : null;
  const financingVatAmount = result.onTheRoad.isCommercialVehicle && result.financingPrice && financingNetPrice ? result.financingPrice - financingNetPrice : null;

  const campaignAlerts: string[] = [];
  let creditBonusAlert: string | null = null;

  if (result.clientBonuses.brandBonus > 0 && result.clientBonuses.financingBonus > 0) {
    creditBonusAlert = `Bono Marca (${formatCLP(result.clientBonuses.brandBonus)}) + Bono Crédito (${formatCLP(result.clientBonuses.financingBonus)})`;
  } else if (result.clientBonuses.brandBonus > 0) {
    campaignAlerts.push(`Bono Marca Vigente: ${formatCLP(result.clientBonuses.brandBonus)}`);
  } else if (result.clientBonuses.financingBonus > 0) {
    campaignAlerts.push(`Bono Crédito Vigente: ${formatCLP(result.clientBonuses.financingBonus)}`);
  }

  if (result.onTheRoad.isCommercialVehicle) {
    campaignAlerts.push("Vehículo Comercial / Pickup: Apto para descuento de IVA (Factura)");
  }

  if (params.citCode) {
    campaignAlerts.push(`CIT Homologado: ${params.citCode}`);
  }

  return {
    isCommercialVehicle: result.onTheRoad.isCommercialVehicle,
    listPrice: result.listPrice,
    cashPrice: result.cashPrice,
    financingPrice: result.financingPrice,
    brandBonus: result.clientBonuses.brandBonus,
    financingBonus: result.clientBonuses.financingBonus,
    totalBonus: result.clientBonuses.totalClientBonus,
    cashNetPrice,
    cashVatAmount,
    financingNetPrice,
    financingVatAmount,
    estimatedFreight: result.onTheRoad.freight,
    estimatedRegistration: result.onTheRoad.registrationPermit,
    estimatedSoap: result.onTheRoad.soap,
    estimatedGreenTax: result.onTheRoad.greenTax,
    estimatedPermit: result.onTheRoad.circulatingPermit,
    estimatedPermitCash: result.onTheRoad.circulatingPermitCash,
    estimatedPermitFinancing: result.onTheRoad.circulatingPermitFinancing,
    estimatedRoadCostCash: result.onTheRoad.roadCostCash,
    estimatedRoadCostFinancing: result.onTheRoad.roadCostFinancing,
    estimatedKeyInHandCash: result.onTheRoad.totalOnTheRoadCash,
    estimatedKeyInHandFinancing: result.onTheRoad.totalOnTheRoadFinancing,
    creditBonusAlert,
    campaignAlerts
  };
}
