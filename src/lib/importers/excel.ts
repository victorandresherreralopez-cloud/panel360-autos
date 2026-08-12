import * as XLSX from "xlsx";
import { CONFIDENCE } from "@/lib/constants";
import { normalizeText } from "@/lib/format";
import { parseTextUpdate } from "@/lib/importers/text";
import type { DetectedChange, ImportResult } from "@/lib/importers/types";

function valueToString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function moneyFromCell(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  return Number.parseInt(valueToString(value).replace(/[^\d-]/g, ""), 10) || undefined;
}

export async function parseExcel(buffer: Buffer): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const textParts: string[] = [];
  const changes: DetectedChange[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    textParts.push(XLSX.utils.sheet_to_csv(sheet));

    for (const row of rows) {
      const entries = Object.entries(row);
      const normalizedKeys = entries.map(([key]) => normalizeText(key));
      const get = (...candidates: string[]) => {
        const index = normalizedKeys.findIndex((key) =>
          candidates.some((candidate) => key === candidate || key.startsWith(`${candidate} `) || key.endsWith(` ${candidate}`))
        );
        return index >= 0 ? entries[index][1] : undefined;
      };

      const brandName = valueToString(get("marca", "brand"));
      const modelName = valueToString(get("modelo"));
      const versionName = valueToString(get("version", "versión"));
      const priceList = moneyFromCell(get("precio lista", "lista", "precio"));
      const cash = moneyFromCell(get("contado"));
      const financing = moneyFromCell(get("financiamiento", "credito", "crédito"));
      const bonus = moneyFromCell(get("bono"));

      const rawText = entries.map(([key, value]) => `${key}: ${valueToString(value)}`).join(" | ");

      for (const [fieldName, amount] of [
        ["Precio lista", priceList],
        ["Precio contado", cash],
        ["Precio financiamiento", financing],
        ["Bono", bonus]
      ] as const) {
        if (!amount) continue;

        changes.push({
          category: fieldName === "Bono" ? "BONO" : "PRECIO",
          brandName: brandName || undefined,
          modelName: modelName || undefined,
          versionName: versionName || undefined,
          fieldName,
          proposedValue: String(amount),
          amount,
          rawText,
          confidence: modelName && versionName ? CONFIDENCE.REVIEW : CONFIDENCE.AMBIGUOUS,
          ambiguityReason: modelName && versionName ? undefined : "La fila contiene monto, pero no identifica claramente modelo y versión."
        });
      }
    }
  }

  const text = textParts.join("\n");
  const parsedText = parseTextUpdate(text);

  return {
    importer: "excel",
    detectedBrand: parsedText.detectedBrand,
    detectedMonth: parsedText.detectedMonth,
    rawText: text,
    changes: [...changes, ...parsedText.changes],
    warnings: parsedText.warnings
  };
}
