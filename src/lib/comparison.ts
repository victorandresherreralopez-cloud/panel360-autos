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
  prices: { priceType: string; amount: number; status: string }[];
  brand: { name: string };
  model: { name: string };
};

function latestPrice(version: VersionForCompare, type: string) {
  return version.prices.find((price) => price.priceType === type && price.status === "VIGENTE")?.amount ?? null;
}

export function toComparableVersion(version: VersionForCompare) {
  const priceList = latestPrice(version, "LIST");
  const priceCampaign = latestPrice(version, "CAMPAIGN");
  const priceCash = latestPrice(version, "CASH");
  const priceFinancing = latestPrice(version, "FINANCING");
  const priceFinal = priceCampaign ?? priceCash ?? priceFinancing ?? priceList;
  const campaignDiscount = priceList !== null && priceFinal !== null ? Math.max(priceList - priceFinal, 0) : null;

  return {
    id: version.id,
    brandName: version.brand.name,
    modelName: version.model.name,
    versionName: version.name,
    label: `${version.brand.name} ${version.model.name} ${version.name}`,
    priceList,
    priceFinal,
    priceCampaign,
    priceCash,
    priceFinancing,
    campaignDiscount,
    finalPriceSource:
      priceCampaign !== null
        ? "Precio campana"
        : priceCash !== null
          ? "Precio contado"
          : priceFinancing !== null
            ? "Precio financiamiento"
            : "Precio lista",
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
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function comparableKey(value: string | number | null | undefined) {
  if (!hasComparableValue(value)) return "";
  return typeof value === "number" ? String(value) : String(value).trim().toLowerCase();
}

function formatComparableValue(key: keyof ComparableVersion, value: string | number | null | undefined) {
  if (!hasComparableValue(value)) {
    if (key === "campaignDiscount") return "Sin bono informado";
    return missing(value);
  }

  if (typeof value === "number") return formatCLP(value);
  return missing(value);
}

function rowStatus(values: Array<string | number | null | undefined>): ComparisonRowStatus {
  const available = values.filter(hasComparableValue).map(comparableKey);
  const missingCount = values.length - available.length;
  const unique = new Set(available);

  if (!available.length) return "missing";
  if (unique.size > 1) return "different";
  if (missingCount > 0) return "partial";
  return "same";
}

export function rowStatusLabel(status: ComparisonRowStatus) {
  if (status === "different") return "Diferente";
  if (status === "partial") return "Falta dato";
  if (status === "missing") return "Sin dato";
  return "Igual";
}

export function buildComparisonRows(versions: ComparableVersion[]) {
  return VEHICLE_COMPARE_FIELDS.map(([label, key]) => {
    const values = versions.map((version) => version[key]);
    const status = rowStatus(values);
    const printable = values.map((value) => formatComparableValue(key, value));
    return { label, key, values: printable, status, different: status === "different" };
  });
}

export function priceDifferenceLabel(from?: number | null, to?: number | null) {
  if (from === null || from === undefined || to === null || to === undefined) {
    return "Diferencia de precio no disponible en las fuentes cargadas";
  }

  const difference = to - from;
  if (difference === 0) return "Mismo precio registrado";
  if (difference > 0) return `Cuesta ${formatCLP(Math.abs(difference))} mas`;
  return `${formatCLP(Math.abs(difference))} menos`;
}

export function buildPriceSummary(versions: ComparableVersion[]) {
  const priced = versions
    .map((version) => ({ version, amount: version.priceFinal ?? version.priceList }))
    .filter((item): item is { version: ComparableVersion; amount: number } => item.amount !== null);

  if (!priced.length) {
    return {
      cheapest: "Sin precios vigentes",
      spread: "No hay precios para comparar",
      bestDiscount: "Sin bono informado"
    };
  }

  const cheapest = priced.reduce((best, item) => (item.amount < best.amount ? item : best), priced[0]);
  const mostExpensive = priced.reduce((best, item) => (item.amount > best.amount ? item : best), priced[0]);
  const bestDiscount = versions.reduce<ComparableVersion | null>((best, version) => {
    if (version.campaignDiscount === null) return best;
    if (!best || version.campaignDiscount > (best.campaignDiscount ?? 0)) return version;
    return best;
  }, null);

  return {
    cheapest: `${cheapest.version.label}: ${formatCLP(cheapest.amount)}`,
    spread:
      mostExpensive.amount === cheapest.amount
        ? "No hay diferencia entre precios finales"
        : `${formatCLP(mostExpensive.amount - cheapest.amount)} entre la opcion mas barata y la mas cara`,
    bestDiscount:
      bestDiscount && bestDiscount.campaignDiscount !== null
        ? `${bestDiscount.label}: ${formatCLP(bestDiscount.campaignDiscount)}`
        : "Sin bono informado"
  };
}
