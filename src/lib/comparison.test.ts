import { describe, expect, it } from "vitest";
import { buildComparisonRows, buildPriceSummary, toComparableVersion } from "@/lib/comparison";

const baseVersion = {
  id: "v1",
  name: "Comfort MT",
  sapCode: "CIT-001",
  modelYear: "2026",
  engine: null,
  displacement: null,
  power: "102",
  torque: null,
  transmission: "Manual",
  traction: null,
  fuelType: "Gasolina",
  consumption: "15",
  wheels: null,
  screen: null,
  carPlay: null,
  androidAuto: null,
  camera: null,
  roof: null,
  seats: null,
  climateControl: null,
  airbags: null,
  adas: null,
  cruiseControl: null,
  sensors: null,
  cargoCapacity: null,
  warranty: null,
  equipmentSummary: null,
  brand: { name: "CHANGAN" },
  model: { name: "Alsvin Plus" },
  prices: [
    { priceType: "LIST", amount: 10990000, status: "VIGENTE" },
    { priceType: "CASH", amount: 10390000, status: "VIGENTE", bonusAmount: 600000 },
    { priceType: "FINANCING", amount: 9790000, status: "VIGENTE", bonusAmount: 600000 }
  ]
};

describe("comparison helpers", () => {
  it("keeps cash and financing prices separated and calculates client bonuses", () => {
    const comparable = toComparableVersion(baseVersion);

    expect(comparable.priceList).toBe(10990000);
    expect(comparable.priceCash).toBe(10390000);
    expect(comparable.priceFinancing).toBe(9790000);
    expect(comparable.priceFinal).toBe(9790000);
    expect(comparable.finalPriceSource).toBe("Precio Financiamiento (Mejor opción)");
    expect(comparable.clientBonuses.brandBonus).toBe(600000);
    expect(comparable.clientBonuses.financingBonus).toBe(600000);
    expect(comparable.onTheRoad.totalOnTheRoadCash).toBeGreaterThan(10390000);
    expect(comparable.onTheRoad.totalOnTheRoadFinancing).toBeGreaterThan(9790000);
  });

  it("marks price, CIT and equipment differences for selected vehicles", () => {
    const first = toComparableVersion(baseVersion);
    const second = toComparableVersion({
      ...baseVersion,
      id: "v2",
      name: "Luxury AT",
      sapCode: "CIT-002",
      transmission: "Automatica",
      prices: [
        { priceType: "LIST", amount: 13990000, status: "VIGENTE" },
        { priceType: "CASH", amount: 12590000, status: "VIGENTE", bonusAmount: 1400000 },
        { priceType: "FINANCING", amount: 11990000, status: "VIGENTE", bonusAmount: 600000 }
      ]
    });

    const rows = buildComparisonRows([first, second]);
    const summary = buildPriceSummary([first, second]);

    expect(rows.find((row) => row.key === "priceCash")?.status).toBe("different");
    expect(rows.find((row) => row.key === "onTheRoad.totalOnTheRoadCash")?.status).toBe("different");
    expect(rows.find((row) => row.key === "onTheRoad.totalOnTheRoadFinancing")?.status).toBe("different");
    expect(rows.find((row) => row.key === "sapCode")?.status).toBe("different");
    expect(rows.find((row) => row.key === "transmission")?.status).toBe("different");
    expect(summary?.cheapestCash.id).toBe("v1");
    expect(summary?.lowestOnTheRoadFinancing.id).toBe("v1");
  });
});
