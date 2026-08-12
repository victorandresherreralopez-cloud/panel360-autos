import { describe, expect, it } from "vitest";
import { formatRut, isValidRut, normalizeRut, rutMatches } from "@/lib/rut";

describe("rut helpers", () => {
  it("formats and validates Chilean RUT values", () => {
    expect(normalizeRut("12.345.678-5")).toBe("12345678-5");
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("12.345.678-9")).toBe(false);
  });

  it("matches equivalent RUT formats", () => {
    expect(rutMatches("12.345.678-5", "12345678-5")).toBe(true);
    expect(rutMatches("12.345.678-5", "12.345.678-9")).toBe(false);
  });
});
