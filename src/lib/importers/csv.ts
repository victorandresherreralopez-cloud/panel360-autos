import { parseTextUpdate } from "@/lib/importers/text";
import type { ImportResult } from "@/lib/importers/types";

export async function parseCsv(buffer: Buffer): Promise<ImportResult> {
  const text = buffer.toString("utf8");
  return { ...parseTextUpdate(text), importer: "csv" };
}
