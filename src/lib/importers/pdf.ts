import pdf from "pdf-parse";
import { parseTextUpdate } from "@/lib/importers/text";
import type { ImportResult } from "@/lib/importers/types";

export async function parsePdf(buffer: Buffer): Promise<ImportResult> {
  const data = await pdf(buffer);
  return { ...parseTextUpdate(data.text), importer: "pdf" };
}
