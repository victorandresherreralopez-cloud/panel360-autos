import { evaluateCommercialOffers } from "@/lib/commercial-offer-engine";
import { VEHICLE_COMPARE_FIELDS } from "@/lib/constants";
import { formatCLP, missing } from "@/lib/format";

type VersionForCompare = {
  id: string;
  name: string;
  sapCode: string | null;
  modelYear: string | null;
  engine: string | null;
  displacement: string | null;
  power: string | null;
  torque: string | null;
  transmission: string | null;
  traction: string | null;
  fuelType: string | null;
  consumption: string | null;
  wheels: string | null;
  screen: string | null;
  carPlay: string | null;
  androidAuto: string | null;
  camera: string | null;
  roof: string | null;
  seats: string | null;
  climateControl: string | null;
  airbags: string | null;
  adas: string | null;
  cruiseControl: string | null;
  sensors: string | null;
  cargoCapacity: string | null;
  warranty: string | null;
  equipmentSummary: string | null;
  prices: {
    priceType: string;
    amount: number;
    status: string;
    channel?: string | null;
    bonusName?: string | null;
    bonusAmount?: number | null;
    hasIva?: boolean | null;
    effectiveFrom?: Date | string | null;
  }[];
  brand: { name: string };
  model: { name: string; segment?: string | null; canonicalSegment?: string | null };
};

export function toComparableVersion(version: VersionForCompare) {
  const offer = evaluateCommercialOffers({
    brandName: version.brand.name,
    modelName: version.model.name,
    versionName: version.name,
    segment: version.model.segment,
    canonicalSegment: version.model.canonicalSegment,
    equipmentSummary: version.equipmentSummary,
    sapCode: version.sapCode,
    prices: version.prices
  });

  return {
    id: version.id,
    brandName: version.brand.name,
    modelName: version.model.name,
    versionName: version.name,
    label: `${version.brand.name} ${version.model.name} ${version.name}`,

    // Precios por Escenario
    priceList: offer.listPrice,
    priceCash: offer.cashPrice,
    priceFinancing: offer.financingPrice,
    priceCampaign: offer.campaignPrice,
    priceDercoCl: offer.dercoClPrice,
    pricePresale: offer.presalePrice,
    priceFinal: offer.bestEligiblePrice,
    finalPriceSource: offer.eligibleScenarioName,

    // Puesto en Calle (Llave en Mano)
    onTheRoad: offer.onTheRoad,

    // Bonos Cliente
    clientBonuses: offer.clientBonuses,

    // Herramienta Interna de Cierre (Bono Cierre Compartido CES + Marca)
    closingTool: offer.closingTool,

    // Features / Badges
    features: offer.features,

    sapCode: version.sapCode,
    modelYear: version.modelYear,
    engine: version.engine,
    displacement: version.displacement,
    power: version.power,
    torque: version.torque,
    transmission: version.transmission,
    traction: version.traction,
    fuelType: version.fuelType,
    consumption: version.consumption,
    wheels: version.wheels,
    screen: version.screen,
    carPlay: version.carPlay,
    androidAuto: version.androidAuto,
    camera: version.camera,
    roof: version.roof,
    seats: version.seats,
    climateControl: version.climateControl,
    airbags: version.airbags,
    adas: version.adas,
    cruiseControl: version.cruiseControl,
    sensors: version.sensors,
    cargoCapacity: version.cargoCapacity,
    warranty: version.warranty,
    equipmentSummary: version.equipmentSummary
  };
}

export type ComparableVersion = ReturnType<typeof toComparableVersion>;
export type ComparisonRowStatus = "same" | "different" | "partial" | "missing";

function hasComparableValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && !value.trim()) return false;
  if (typeof value === "string" && value.trim().toLowerCase() === "no disponible") return false;
  return true;
}

// Desglosa el resumen "Clave: Valor; Clave: Valor" en un objeto para comparar.
function parseEquipmentSummary(summary: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!summary) return map;
  summary.split(";").forEach((part) => {
    const index = part.indexOf(":");
    if (index === -1) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key && value) map[key] = value;
  });
  return map;
}

export function rowStatusLabel(status: ComparisonRowStatus) {
  if (status === "same") return "Identico";
  if (status === "different") return "Diferente";
  if (status === "partial") return "Incompleto";
  return "Sin datos";
}

export function buildComparisonRows(versions: ComparableVersion[]) {
  if (!versions.length) return [];

  const rawFields = [
    // PRECIOS
    { key: "priceList", label: "Precio Lista Oficial", formatter: (val: any) => (val ? formatCLP(val) : "Sin lista") },
    { key: "priceCash", label: "Precio Contado", formatter: (val: any) => (val ? formatCLP(val) : "No aplica") },
    { key: "priceFinancing", label: "Precio Financiamiento", formatter: (val: any) => (val ? formatCLP(val) : "Sin bono credito") },
    { key: "priceCampaign", label: "Precio Campana", formatter: (val: any) => (val ? formatCLP(val) : "Sin campana") },
    { key: "priceDercoCl", label: "Precio Derco.cl", formatter: (val: any) => (val ? formatCLP(val) : "Sin reserva web") },

    // PUESTO EN CALLE
    { key: "onTheRoad.greenTax", label: "Impuesto Verde (Est.)", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.greenTax) },
    { key: "onTheRoad.registrationPermit", label: "Inscripcion / RNVM", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.registrationPermit) },
    { key: "onTheRoad.soap", label: "Seguro Obligatorio SOAP", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.soap) },
    { key: "onTheRoad.freight", label: "Flete Osorno", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.freight) },
    { key: "onTheRoad.circulatingPermitCash", label: "Permiso Circulacion Contado (Est.)", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.circulatingPermitCash) },
    { key: "onTheRoad.circulatingPermitFinancing", label: "Permiso Circulacion Credito (Est.)", formatter: (_: any, v: ComparableVersion) => formatCLP(v.onTheRoad.circulatingPermitFinancing) },
    { key: "onTheRoad.totalOnTheRoadCash", label: "TOTAL Puesto en Calle Contado", formatter: (_: any, v: ComparableVersion) => (v.onTheRoad.totalOnTheRoadCash ? formatCLP(v.onTheRoad.totalOnTheRoadCash) : "Pendiente") },
    { key: "onTheRoad.totalOnTheRoadFinancing", label: "TOTAL Puesto en Calle Credito", formatter: (_: any, v: ComparableVersion) => (v.onTheRoad.totalOnTheRoadFinancing ? formatCLP(v.onTheRoad.totalOnTheRoadFinancing) : "Sin precio credito") },

    // BENEFICIOS CLIENTE
    { key: "clientBonuses.brandBonus", label: "Bono Marca", formatter: (_: any, v: ComparableVersion) => (v.clientBonuses.brandBonus ? formatCLP(v.clientBonuses.brandBonus) : "Sin bono") },
    { key: "clientBonuses.financingBonus", label: "Bono Financiamiento", formatter: (_: any, v: ComparableVersion) => (v.clientBonuses.financingBonus ? formatCLP(v.clientBonuses.financingBonus) : "Sin bono") },

    // HERRAMIENTA INTERNA DE CIERRE
    { key: "closingTool.totalClosingSupportCash", label: "Apoyo Cierre Compartido (CES + Marca)", formatter: (_: any, v: ComparableVersion) => (v.closingTool.hasClosingSupport ? formatCLP(v.closingTool.totalClosingSupportCash) : "Sin fondo cierre") },

    // FICHA TÉCNICA (campos estructurados)
    ...VEHICLE_COMPARE_FIELDS.filter(([, key]) => key !== "equipmentSummary").map(([label, key]) => ({ key, label, get: undefined as ((v: ComparableVersion) => any) | undefined, formatter: (val: any) => missing(val) }))
  ] as Array<{ key: string; label: string; get?: (v: ComparableVersion) => any; formatter: (val: any, v: ComparableVersion) => string }>;

  // EQUIPAMIENTO: desglosamos el texto "Clave: Valor; Clave: Valor" en filas
  // comparables (asi no queda "Sin datos" cuando la info viene en el resumen).
  const equipKeys: string[] = [];
  const seen = new Set<string>();
  versions.forEach((v) => {
    Object.keys(parseEquipmentSummary(v.equipmentSummary)).forEach((k) => {
      if (!seen.has(k)) {
        seen.add(k);
        equipKeys.push(k);
      }
    });
  });
  equipKeys.forEach((k) => {
    rawFields.push({
      key: `equip:${k}`,
      label: k,
      get: (v: ComparableVersion) => parseEquipmentSummary(v.equipmentSummary)[k] ?? null,
      formatter: (val: any) => missing(val)
    });
  });

  return rawFields.map((field) => {
    const getValue = (version: ComparableVersion) => {
      if (field.get) return field.get(version);
      const parts = field.key.split(".");
      let val: any = version;
      for (const p of parts) val = val?.[p];
      return val;
    };

    const values = versions.map((v) => getValue(v));
    const formattedValues = versions.map((v) => field.formatter(getValue(v), v));

    const validValues = values.filter(hasComparableValue);
    let status: ComparisonRowStatus = "missing";

    if (validValues.length === 0) {
      status = "missing";
    } else if (validValues.length < versions.length) {
      status = "partial";
    } else {
      const first = JSON.stringify(validValues[0]);
      const allEqual = validValues.every((val) => JSON.stringify(val) === first);
      status = allEqual ? "same" : "different";
    }

    return {
      key: field.key,
      label: field.label,
      values: formattedValues,
      rawValues: values,
      status
    };
  });
}

export function buildPriceSummary(versions: ComparableVersion[]) {
  if (!versions.length) return null;

  let cheapestCash = versions[0];
  let cheapestFinancing = versions[0];
  let lowestOnTheRoad = versions[0];
  let lowestOnTheRoadFinancing = versions[0];
  let highestBonus = versions[0];

  for (const v of versions) {
    if ((v.priceCash ?? Number.MAX_SAFE_INTEGER) < (cheapestCash.priceCash ?? Number.MAX_SAFE_INTEGER)) cheapestCash = v;
    if ((v.priceFinancing ?? Number.MAX_SAFE_INTEGER) < (cheapestFinancing.priceFinancing ?? Number.MAX_SAFE_INTEGER)) cheapestFinancing = v;
    if ((v.onTheRoad.totalOnTheRoadCash ?? Number.MAX_SAFE_INTEGER) < (lowestOnTheRoad.onTheRoad.totalOnTheRoadCash ?? Number.MAX_SAFE_INTEGER)) lowestOnTheRoad = v;
    if ((v.onTheRoad.totalOnTheRoadFinancing ?? Number.MAX_SAFE_INTEGER) < (lowestOnTheRoadFinancing.onTheRoad.totalOnTheRoadFinancing ?? Number.MAX_SAFE_INTEGER)) lowestOnTheRoadFinancing = v;
    if (v.clientBonuses.totalClientBonus > highestBonus.clientBonuses.totalClientBonus) highestBonus = v;
  }

  return {
    cheapestCash,
    cheapestFinancing,
    lowestOnTheRoad,
    lowestOnTheRoadFinancing,
    highestBonus
  };
}

export function priceDifferenceLabel(basePrice: number | null, currentPrice: number | null) {
  if (!basePrice || !currentPrice) return null;
  const diff = currentPrice - basePrice;
  if (diff === 0) return "Mismo precio";
  if (diff > 0) return `+${formatCLP(diff)}`;
  return `-${formatCLP(Math.abs(diff))}`;
}
