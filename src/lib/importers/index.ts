import path from "node:path";
import { parseCsv } from "@/lib/importers/csv";
import { parseExcel } from "@/lib/importers/excel";
import { parsePdf } from "@/lib/importers/pdf";
import { parsePowerPoint } from "@/lib/importers/powerpoint";
import type { ImportResult } from "@/lib/importers/types";

export async function parseCommercialDocument(filename: string, buffer: Buffer): Promise<ImportResult> {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".xlsx" || extension === ".xls") return parseExcel(buffer);
  if (extension === ".csv") return parseCsv(buffer);
  if (extension === ".pdf") return parsePdf(buffer);
  if (extension === ".pptx") return parsePowerPoint(buffer);

  throw new Error("Formato no soportado. Use XLSX, XLS, CSV, PDF o PPTX.");
}

export const allowedDocumentExtensions = [".xlsx", ".xls", ".csv", ".pdf", ".pptx"];
