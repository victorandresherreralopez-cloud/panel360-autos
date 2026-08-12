import { describe, expect, it } from "vitest";
import { parseTextUpdate } from "@/lib/importers/text";

describe("parseTextUpdate", () => {
  it("marks price ranges as ambiguous", () => {
    const result = parseTextUpdate("H6 F2 baja entre $200.000 y $300.000");
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].category).toBe("PRECIO");
    expect(result.changes[0].confidence).toBe("AMBIGUA");
    expect(result.changes[0].ambiguityReason).toContain("no especifica");
  });

  it("detects benefits without making them active", () => {
    const result = parseTextUpdate("Todo Poer Diesel excepto P500 tiene patente gratis con crédito.");
    expect(result.changes[0].category).toBe("PATENTE");
    expect(result.changes[0].proposedValue).toBe("Patente gratis");
    expect(result.changes[0].confidence).toBe("REQUIERE_REVISION");
  });
});
