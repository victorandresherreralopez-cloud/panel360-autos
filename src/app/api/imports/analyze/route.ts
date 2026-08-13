import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { detectColumnMappings } from "@/lib/import-detector";
import { normalizeImportedRut, normalizePhone, normalizeEmail } from "@/lib/import-normalizer";
import { prisma } from "@/lib/prisma";
import { normalizeRut } from "@/lib/rut";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No se recibió archivo." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";

    let rows: string[][] = [];
    let headers: string[] = [];

    if (ext === "csv") {
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter(Boolean);
      headers = parseCsvLine(lines[0] ?? "");
      rows = lines.slice(1).map(parseCsvLine);
    } else if (ext === "xlsx" || ext === "xls") {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      headers = (data[0] ?? []).map(String);
      rows = data.slice(1).map((row) => (row as unknown[]).map(String));
    } else {
      return NextResponse.json({ ok: false, error: "Formato no soportado. Use .xlsx, .xls o .csv" }, { status: 400 });
    }

    // Limit analysis to first 500 rows for speed
    const sampleRows = rows.slice(0, 500);
    const mappings = detectColumnMappings(headers, sampleRows);

    // Quick stats over ALL rows
    const totalRows = rows.filter((r) => r.some((c) => c.trim())).length;

    // Check RUT column index
    const rutMapping = mappings.find((m) => m.detectedField === "rut");
    const rutColIdx = rutMapping?.colIndex ?? -1;

    let validRuts = 0;
    let invalidRuts = 0;
    let duplicateRuts = 0;
    const existingRuts = new Set<string>();
    const rutsSeen = new Set<string>();

    // Get all existing customer RUTs from DB for duplicate detection
    const dbCustomers = await prisma.customer.findMany({
      where: { rut: { not: null } },
      select: { rut: true }
    });
    for (const c of dbCustomers) {
      if (c.rut) existingRuts.add(normalizeRut(c.rut) ?? "");
    }

    let emailIssues = 0;
    let phoneIssues = 0;
    const emailColIdx = mappings.find((m) => m.detectedField === "email")?.colIndex ?? -1;
    const phoneColIdx = mappings.find((m) => m.detectedField === "phone")?.colIndex ?? -1;

    for (const row of rows) {
      if (!row.some((c) => c.trim())) continue;

      if (rutColIdx >= 0) {
        const rawRut = row[rutColIdx] ?? "";
        const { valid, normalized } = normalizeImportedRut(rawRut);
        if (valid && normalized) {
          if (rutsSeen.has(normalized)) duplicateRuts++;
          else if (existingRuts.has(normalized)) duplicateRuts++;
          else validRuts++;
          rutsSeen.add(normalized ?? "");
        } else if (rawRut.trim()) {
          invalidRuts++;
        }
      }

      if (emailColIdx >= 0) {
        const { valid } = normalizeEmail(row[emailColIdx] ?? "");
        if (!valid && (row[emailColIdx] ?? "").trim()) emailIssues++;
      }

      if (phoneColIdx >= 0) {
        const { valid } = normalizePhone(row[phoneColIdx] ?? "");
        if (!valid && (row[phoneColIdx] ?? "").trim()) phoneIssues++;
      }
    }

    const readyRows = validRuts > 0 ? validRuts : totalRows - invalidRuts;
    const reviewRows = invalidRuts + (rutColIdx < 0 ? 0 : 0);

    return NextResponse.json({
      ok: true,
      filename,
      totalRows,
      readyRows,
      duplicates: duplicateRuts,
      reviewRows,
      invalidRuts,
      emailIssues,
      phoneIssues,
      headers,
      mappings,
      sampleData: sampleRows.slice(0, 5)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno al procesar el archivo.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
