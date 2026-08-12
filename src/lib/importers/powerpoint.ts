import JSZip from "jszip";
import { parseTextUpdate } from "@/lib/importers/text";
import type { ImportResult } from "@/lib/importers/types";

function stripXml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function parsePowerPoint(buffer: Buffer): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const chunks: string[] = [];

  for (const file of slideFiles) {
    const xml = await zip.files[file].async("string");
    chunks.push(stripXml(xml));
  }

  return { ...parseTextUpdate(chunks.join("\n")), importer: "powerpoint" };
}
