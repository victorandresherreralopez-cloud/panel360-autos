import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { detectColumnMappings, type FieldType } from "@/lib/import-detector";
import { normalizeImportedRut, normalizePhone, normalizeEmail, parseImportedDate, parseFullName } from "@/lib/import-normalizer";
import { prisma } from "@/lib/prisma";
import { normalizeRut } from "@/lib/rut";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 200;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mappingsRaw = formData.get("mappings") as string | null;
    const importLabel = (formData.get("label") as string | null) ?? "Importación sin nombre";
    const assignedUserId = formData.get("assignedUserId") as string | null;

    if (!file || !mappingsRaw) {
      return NextResponse.json({ ok: false, error: "Archivo o mapeo faltante." }, { status: 400 });
    }

    const userMappings: { colIndex: number; field: FieldType }[] = JSON.parse(mappingsRaw);
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    let allRows: string[][] = [];

    if (ext === "csv") {
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter(Boolean);
      allRows = lines.slice(1).map((line) => parseCsvLine(line));
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      allRows = data.slice(1).map((row) => (row as unknown[]).map(String));
    }

    const activeRows = allRows.filter((r) => r.some((c) => String(c).trim()));

    // Build column index map
    const fieldMap: Partial<Record<FieldType, number>> = {};
    for (const m of userMappings) {
      if (m.field !== "ignore" && m.field !== "unknown") {
        fieldMap[m.field] = m.colIndex;
      }
    }

    function col(row: string[], field: FieldType): string {
      const idx = fieldMap[field];
      return idx !== undefined ? (row[idx] ?? "").toString().trim() : "";
    }

    // Load existing RUTs for duplicate detection
    const existingCustomers = await prisma.customer.findMany({
      where: { rut: { not: null } },
      select: { id: true, rut: true, firstName: true, lastName: true, phone: true, email: true }
    });
    const rutIndex = new Map<string, typeof existingCustomers[0]>();
    for (const c of existingCustomers) {
      const norm = c.rut ? normalizeRut(c.rut) : null;
      if (norm) rutIndex.set(norm, c);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < activeRows.length; i += BATCH_SIZE) {
      const batch = activeRows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
          const rawRut = col(row, "rut");
          const rutResult = rawRut ? normalizeImportedRut(rawRut) : null;

          // Build name
          const rawFull = col(row, "fullName");
          const rawFirst = col(row, "firstName");
          const rawLast = col(row, "lastName");

          let firstName = rawFirst;
          let lastName = rawLast;

          if (!firstName && rawFull) {
            const parsed = parseFullName(rawFull);
            firstName = parsed.firstName;
            lastName = parsed.lastName;
          }
          if (!firstName) { skipped++; continue; } // Skip rows without a name

          const phone = col(row, "phone");
          const phoneResult = phone ? normalizePhone(phone) : null;

          const email = col(row, "email");
          const emailResult = email ? normalizeEmail(email) : null;

          const birthRaw = col(row, "birthDate");
          const birthResult = birthRaw ? parseImportedDate(birthRaw) : null;

          const lastInstRaw = col(row, "lastInstallmentDate");
          const lastInstResult = lastInstRaw ? parseImportedDate(lastInstRaw) : null;

          const firstInstRaw = col(row, "firstInstallmentDate");
          const firstInstResult = firstInstRaw ? parseImportedDate(firstInstRaw) : null;

          const purchaseDateRaw = col(row, "purchaseDate");
          const purchaseDateResult = purchaseDateRaw ? parseImportedDate(purchaseDateRaw) : null;

          const customerData = {
            firstName: firstName.trim(),
            lastName: lastName.trim() || null,
            rut: rutResult?.valid ? rutResult.normalized : null,
            phone: phoneResult?.valid ? phoneResult.normalized : (phone || null),
            email: emailResult?.valid ? emailResult.normalized : (email || null),
            birthDate: birthResult?.date ?? null,
            address: col(row, "address") || null,
            commune: col(row, "commune") || null,
            city: col(row, "city") || null,
            region: col(row, "region") || null,
            interestedBrand: col(row, "brand") || null,
            interestedModel: col(row, "model") || null,
            currentVehicle: col(row, "model") ? `${col(row, "brand")} ${col(row, "model")} ${col(row, "version")}`.trim() : null,
            currentPlate: col(row, "plate") || null,
            notes: [col(row, "notes"), col(row, "executive") ? `Ejecutivo: ${col(row, "executive")}` : ""].filter(Boolean).join(" | ") || null
          };

          // Check duplicate by RUT
          const normRut = rutResult?.valid ? rutResult.normalized : null;
          const existingByRut = normRut ? rutIndex.get(normRut ?? "") : null;

          if (existingByRut) {
            // Merge: only fill empty fields, never overwrite
            await prisma.customer.update({
              where: { id: existingByRut.id },
              data: {
                phone: existingByRut.phone ?? customerData.phone,
                email: existingByRut.email ?? customerData.email,
                address: customerData.address || undefined,
                commune: customerData.commune || undefined,
                city: customerData.city || undefined,
                region: customerData.region || undefined,
                birthDate: customerData.birthDate ?? undefined,
                interestedBrand: customerData.interestedBrand || undefined,
                interestedModel: customerData.interestedModel || undefined
              }
            });

            // Register credit if data exists
            if (lastInstResult?.date) {
              await prisma.creditContract.create({
                data: {
                  customerId: existingByRut.id,
                  financialEntity: col(row, "financialEntity") || null,
                  purchaseDate: purchaseDateResult?.date ?? null,
                  installments: col(row, "installments") ? parseInt(col(row, "installments"), 10) : null,
                  lastInstallmentDate: lastInstResult.date,
                  firstInstallmentDate: firstInstResult?.date ?? null,
                  financedAmount: col(row, "financedAmount") ? parseInt(col(row, "financedAmount").replace(/\D/g, ""), 10) : null,
                  downPayment: col(row, "downPayment") ? parseInt(col(row, "downPayment").replace(/\D/g, ""), 10) : null,
                  installmentAmount: col(row, "installmentAmount") ? parseInt(col(row, "installmentAmount").replace(/\D/g, ""), 10) : null,
                  endDateSource: "IMPORTACION"
                }
              });
            }

            updated++;
          } else {
            // Create new customer
            const newCustomer = await prisma.customer.create({ data: customerData });
            if (normRut) rutIndex.set(normRut, { ...newCustomer, rut: newCustomer.rut ?? null });

            // Register credit if data exists
            if (lastInstResult?.date) {
              await prisma.creditContract.create({
                data: {
                  customerId: newCustomer.id,
                  financialEntity: col(row, "financialEntity") || null,
                  purchaseDate: purchaseDateResult?.date ?? null,
                  installments: col(row, "installments") ? parseInt(col(row, "installments"), 10) : null,
                  lastInstallmentDate: lastInstResult.date,
                  firstInstallmentDate: firstInstResult?.date ?? null,
                  financedAmount: col(row, "financedAmount") ? parseInt(col(row, "financedAmount").replace(/\D/g, ""), 10) : null,
                  downPayment: col(row, "downPayment") ? parseInt(col(row, "downPayment").replace(/\D/g, ""), 10) : null,
                  installmentAmount: col(row, "installmentAmount") ? parseInt(col(row, "installmentAmount").replace(/\D/g, ""), 10) : null,
                  endDateSource: "IMPORTACION"
                }
              });
            }

            created++;
          }
        } catch {
          errors++;
        }
      }
    }

    // Detect renovations: credits expiring in 90 days
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 86_400_000);
    const renewalOpportunities = await prisma.creditContract.count({
      where: { lastInstallmentDate: { lte: ninetyDaysFromNow, gte: new Date() } }
    });

    return NextResponse.json({
      ok: true,
      created,
      updated,
      skipped,
      errors,
      total: activeRows.length,
      renewalOpportunities,
      message: `${created} clientes nuevos, ${updated} actualizados, ${renewalOpportunities} oportunidades de renovación detectadas.`
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno durante la importación.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}
