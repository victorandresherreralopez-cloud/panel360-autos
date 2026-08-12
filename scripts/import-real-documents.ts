import fs from "node:fs/promises";
import path from "node:path";
import { INFO_STATUS } from "../src/lib/constants";
import { parseCommercialDocument } from "../src/lib/importers";
import { prisma } from "../src/lib/prisma";
import { assertInsideWorkspace, sanitizeFilename } from "../src/lib/safe-paths";
import { createDatabaseBackup } from "../src/lib/services/backups";

const sourceFiles = [
  "V:/Sergio Escobar/Agosto/Agosto 2026 - Plan Comercial CHANGAN (9).pdf",
  "V:/Sergio Escobar/Agosto/Changan Junio 2026 (3).xlsx",
  "V:/Sergio Escobar/Agosto/Circular 14-2026 Plan Comercial Agosto.pdf",
  "V:/Sergio Escobar/Agosto/Hoja de rentabilidad.xlsx",
  "V:/Sergio Escobar/Agosto/Lista 07 20260706 lista de precio Julio (2).xlsx",
  "V:/Sergio Escobar/Agosto/Lista de Precios GWM Agosto 2026 (8).xlsx",
  "V:/Sergio Escobar/Agosto/Plan_Comercial_Agosto_Mazda.pptx",
  "V:/Sergio Escobar/Agosto/07- LISTA DE PRECIOS N2 MAZDA Julio 2026 (3).xlsx"
];

const commercialMonth = "agosto 2026";
const documentFolderMonth = "08-agosto";

function brandFromFilename(filename: string) {
  const upper = filename.toUpperCase();
  if (upper.includes("CHANGAN")) return "CHANGAN";
  if (upper.includes("GWM")) return "GWM";
  if (upper.includes("MAZDA")) return "MAZDA";
  if (upper.includes("SUZUKI")) return "SUZUKI";
  return undefined;
}

function documentType(extension: string) {
  if (extension === ".xlsx" || extension === ".xls" || extension === ".csv") return "LISTA DE PRECIOS";
  if (extension === ".pdf" || extension === ".pptx") return "PLAN COMERCIAL";
  return "DOCUMENTO";
}

async function copySourceDocument(sourcePath: string, brandName?: string) {
  const sourceName = path.basename(sourcePath);
  const targetDir = assertInsideWorkspace(
    path.join(process.cwd(), "documentos", "2026", documentFolderMonth, brandName ?? "SIN_MARCA")
  );
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = assertInsideWorkspace(path.join(targetDir, sanitizeFilename(sourceName)));
  await fs.copyFile(sourcePath, targetPath);
  return targetPath;
}

async function importOne(sourcePath: string) {
  const originalName = path.basename(sourcePath);
  const existing = await prisma.document.findFirst({
    where: { originalName },
    include: { imports: true }
  });

  if (existing) {
    return {
      originalName,
      skipped: true,
      reason: "Ya existía un documento con ese nombre en la base.",
      importId: existing.imports[0]?.id ?? null,
      updateId: null,
      changes: 0,
      detectedBrand: null,
      warnings: []
    };
  }

  const buffer = await fs.readFile(sourcePath);
  const parsed = await parseCommercialDocument(originalName, buffer);
  const detectedBrand = brandFromFilename(originalName) ?? parsed.detectedBrand;
  const brand = detectedBrand ? await prisma.brand.findFirst({ where: { name: detectedBrand } }) : null;
  const storedPath = await copySourceDocument(sourcePath, detectedBrand);
  const extension = path.extname(originalName).toLowerCase();

  const document = await prisma.document.create({
    data: {
      brandId: brand?.id,
      type: documentType(extension),
      originalName,
      storedPath,
      mimeType: extension.replace(".", ""),
      extension,
      status: INFO_STATUS.DETECTED
    }
  });

  const documentImport = await prisma.documentImport.create({
    data: {
      documentId: document.id,
      importType: parsed.importer,
      status: INFO_STATUS.IN_REVIEW,
      detectedBrand,
      detectedMonth: commercialMonth,
      summaryJson: JSON.stringify({
        mes_comercial_forzado_por_usuario: commercialMonth,
        mes_detectado_originalmente: parsed.detectedMonth ?? null,
        cambios_detectados: parsed.changes.length,
        advertencias: parsed.warnings,
        archivo_fuente_externo: sourcePath
      })
    }
  });

  if (parsed.changes.length) {
    await prisma.documentExtraction.createMany({
      data: parsed.changes.map((change) => ({
        importId: documentImport.id,
        category: change.category,
        rawText: change.rawText,
        payloadJson: JSON.stringify(change.payload ?? {}),
        confidence: change.confidence,
        status: INFO_STATUS.DETECTED
      }))
    });
  }

  const update = await prisma.update.create({
    data: {
      title: `Importación real agosto 2026: ${originalName}`,
      sourceType: document.type,
      documentId: document.id,
      rawText: parsed.rawText.slice(0, 200000),
      status: INFO_STATUS.IN_REVIEW,
      items: {
        create: parsed.changes.map((change) => ({
          category: change.category,
          brandName: change.brandName ?? detectedBrand,
          modelName: change.modelName,
          versionName: change.versionName,
          fieldName: change.fieldName,
          proposedValue: change.proposedValue,
          amount: change.amount,
          rawText: change.rawText,
          confidence: change.confidence,
          status: INFO_STATUS.DETECTED,
          ambiguityReason: change.ambiguityReason,
          payloadJson: JSON.stringify({
            ...(change.payload ?? {}),
            mes_comercial: commercialMonth
          })
        }))
      }
    }
  });

  return {
    originalName,
    skipped: false,
    reason: null,
    importId: documentImport.id,
    updateId: update.id,
    changes: parsed.changes.length,
    detectedBrand,
    warnings: parsed.warnings
  };
}

async function main() {
  const backupPath = await createDatabaseBackup("antes-importacion-real-agosto");
  const results = [];

  for (const sourcePath of sourceFiles) {
    results.push(await importOne(sourcePath));
  }

  console.log(
    JSON.stringify(
      {
        commercialMonth,
        backupPath,
        imported: results.filter((item) => !item.skipped).length,
        skipped: results.filter((item) => item.skipped).length,
        totalChangesDetected: results.reduce((sum, item) => sum + item.changes, 0),
        results
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
