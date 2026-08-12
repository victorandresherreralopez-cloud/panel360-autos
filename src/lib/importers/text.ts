import { CONFIDENCE } from "@/lib/constants";
import { normalizeText } from "@/lib/format";
import type { DetectedChange, ImportResult } from "@/lib/importers/types";

const KNOWN_BRANDS = ["GWM", "MAZDA", "SUZUKI", "CHANGAN", "DEEPAL", "DFSK"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

function parseAmount(text: string) {
  const match = text.match(/\$?\s?(\d{1,3}(?:[.\s]\d{3})+|\d{6,})/);
  if (!match) return undefined;
  return Number.parseInt(match[1].replace(/[^\d]/g, ""), 10);
}

function detectBrand(text: string) {
  const normalized = normalizeText(text).toUpperCase();
  return KNOWN_BRANDS.find((brand) => normalized.includes(brand));
}

function detectMonth(text: string) {
  const normalized = normalizeText(text);
  const month = MONTHS.find((item) => normalized.includes(item));
  const year = normalized.match(/\b(20\d{2})\b/)?.[1];
  if (!month && !year) return undefined;
  return [month, year].filter(Boolean).join(" ");
}

function inferModelOrVersion(line: string) {
  const beforeColon = line.split(":")[0]?.trim();
  if (beforeColon && beforeColon.length <= 45 && /[a-zA-Z0-9]/.test(beforeColon)) {
    const parts = beforeColon.split(/\s+/);
    return {
      modelName: parts.slice(0, 2).join(" "),
      versionName: parts.length > 2 ? parts.slice(2).join(" ") : undefined
    };
  }

  const simple = line.match(/\b([A-Z0-9][A-Z0-9-]{1,12})(?:\s+([A-Z0-9][A-Z0-9-]{1,12}))?/i);
  if (!simple) return {};
  return { modelName: simple[1], versionName: simple[2] };
}

export function parseTextUpdate(text: string): ImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const changes: DetectedChange[] = [];
  const warnings: string[] = [];
  const detectedBrand = detectBrand(text);
  const detectedMonth = detectMonth(text);

  for (const line of lines) {
    const normalized = normalizeText(line);
    const amount = parseAmount(line);
    const ambiguousRange = /\bentre\b/.test(normalized) || /\ba\s+\$?\s?\d/.test(normalized);
    const base = {
      brandName: detectBrand(line) ?? detectedBrand,
      rawText: line,
      amount,
      ...inferModelOrVersion(line)
    };

    if (/baja|sube|precio|actualiz/.test(normalized) && amount) {
      changes.push({
        ...base,
        category: "PRECIO",
        fieldName: "precio",
        proposedValue: amount ? String(amount) : undefined,
        confidence: ambiguousRange ? CONFIDENCE.AMBIGUOUS : CONFIDENCE.REVIEW,
        ambiguityReason: ambiguousRange
          ? "El texto informa un rango o una baja general, pero no especifica el monto exacto por versión."
          : "Requiere asociar el monto a una versión existente antes de aprobar."
      });
      continue;
    }

    if (/bono|descuento/.test(normalized)) {
      changes.push({
        ...base,
        category: "BONO",
        fieldName: "bono",
        proposedValue: amount ? String(amount) : line,
        confidence: amount ? CONFIDENCE.REVIEW : CONFIDENCE.AMBIGUOUS,
        ambiguityReason: amount ? undefined : "Se menciona bono o descuento, pero no se detectó un monto claro."
      });
      continue;
    }

    if (/patente\s+gratis/.test(normalized)) {
      changes.push({
        ...base,
        category: "PATENTE",
        fieldName: "beneficio",
        proposedValue: "Patente gratis",
        confidence: /excepto|salvo|solo|credito|crédito|contado/.test(normalized) ? CONFIDENCE.REVIEW : CONFIDENCE.REVIEW,
        ambiguityReason: /excepto|salvo/.test(normalized)
          ? "El beneficio contiene excepciones; debe revisarse antes de aplicarlo."
          : undefined
      });
      continue;
    }

    if (/tasa/.test(normalized) && /(\d+[,.]\d+|\d+)%?/.test(normalized)) {
      changes.push({
        ...base,
        category: "TASA",
        fieldName: "tasa",
        proposedValue: line,
        confidence: CONFIDENCE.REVIEW
      });
      continue;
    }

    if (/campana|campaña|0\s?km|gift\s?card|accesorio/.test(normalized)) {
      changes.push({
        ...base,
        category: "CAMPAÑA",
        fieldName: "campaña",
        proposedValue: line,
        confidence: CONFIDENCE.REVIEW
      });
    }
  }

  if (!changes.length && text.trim()) {
    warnings.push("No se detectaron cambios comerciales estructurados. El texto quedó guardado para revisión manual.");
  }

  return {
    importer: "text",
    detectedBrand,
    detectedMonth,
    rawText: text,
    changes,
    warnings
  };
}
