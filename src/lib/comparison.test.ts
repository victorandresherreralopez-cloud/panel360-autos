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
    { priceType: "CAMPAIGN", amount: 9690000, status: "VIGENTE" }
  ]
};

describe("comparison helpers", () => {
  it("uses campaign price as final price and calculates savings against list price", () => {
    const comparable = toComparableVersion(baseVersion);

    expect(comparable.priceList).toBe(10990000);
    expect(comparable.priceFinal).toBe(9690000);
    expect(comparable.campaignDiscount).toBe(1300000);
    expect(comparable.finalPriceSource).toBe("Precio campana");
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
        { priceType: "CAMPAIGN", amount: 11390000, status: "VIGENTE" }
      ]
    });

    const rows = buildComparisonRows([first, second]);
    const summary = buildPriceSummary([first, second]);

    expect(rows.find((row) => row.key === "priceFinal")?.status).toBe("different");
    expect(rows.find((row) => row.key === "sapCode")?.status).toBe("different");
    expect(rows.find((row) => row.key === "transmission")?.status).toBe("different");
    expect(summary.spread).toContain("$1.700.000");
  });
});
