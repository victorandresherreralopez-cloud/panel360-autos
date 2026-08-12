import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CitRecord = {
  brandName: string;
  modelName: string;
  versionName: string;
  sapCode?: string;
  citCode: string;
  source: string;
};

type VersionCandidate = {
  id: string;
  brandName: string;
  modelName: string;
  versionName: string;
  sapCode: string | null;
};

const sourceDir = "V:/Sergio Escobar/Agosto";

const sourceFiles = [
  "07- LISTA DE PRECIOS N2 MAZDA Julio 2026 (3).xlsx",
  "Lista 07 20260706 lista de precio Julio (2).xlsx",
  "Lista de Precios GWM Agosto 2026 (8).xlsx",
  "Changan Junio 2026 (3).xlsx"
];

function asText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !["new", "nuevo", "nueva", "plus", "the", "de", "la"].includes(token));
}

function compactVehicleName(value: string) {
  return normalize(value)
    .replace(/\bautomatica\b/g, "at")
    .replace(/\bautomatico\b/g, "at")
    .replace(/\bdiesel\b/g, "td")
    .replace(/\bdiésel\b/g, "td")
    .replace(/\bmazda\b/g, "")
    .replace(/\bhaval\b/g, "")
    .replace(/\bgreat wall\b/g, "")
    .replace(/\bchangan\b/g, "")
    .replace(/\bsuzuki\b/g, "")
    .replace(/\beuro\s*6[ce]?\b/g, "")
    .replace(/\be6[ce]?\b/g, "")
    .replace(/\b7g\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function modelFromMazdaVersion(versionName: string) {
  const text = normalize(versionName);
  if (text.includes("bt 50")) return "Mazda BT-50";
  if (text.includes("cx 90")) return "Mazda CX-90";
  if (text.includes("cx 60")) return "Mazda CX-60";
  if (text.includes("cx 5")) return "Mazda CX-5";
  if (text.includes("cx 30")) return "Mazda CX-30";
  if (text.includes("cx 3")) return "Mazda CX-3";
  if (text.includes("mx 5 rf")) return "Mazda MX-5 RF";
  if (text.includes("mx 5")) return "Mazda MX-5";
  if (text.includes("mazda3 sp")) return "Mazda3 Sport";
  if (text.includes("mazda3 sdn")) return "Mazda3 Sedan";
  return "MAZDA";
}

function canonicalBrand(value: string) {
  const normalized = normalize(value);
  if (["great wall", "haval", "ora", "tank", "gwm"].some((brand) => normalized.includes(brand))) return "GWM";
  if (normalized.includes("mazda")) return "MAZDA";
  if (normalized.includes("suzuki")) return "SUZUKI";
  if (normalized.includes("changan")) return "CHANGAN";
  return value.toUpperCase();
}

function pushRecord(records: CitRecord[], record: CitRecord) {
  const citCode = asText(record.citCode);
  if (!citCode || !/[A-Z]{2}\d+/i.test(citCode)) return;
  records.push({
    ...record,
    brandName: canonicalBrand(record.brandName),
    modelName: asText(record.modelName),
    versionName: asText(record.versionName),
    sapCode: asText(record.sapCode),
    citCode
  });
}

function rowsFor(fileName: string, sheetName: string) {
  const fullPath = path.join(sourceDir, fileName);
  const workbook = XLSX.readFile(fullPath, { cellDates: true });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
}

function readMazda(records: CitRecord[]) {
  const fileName = sourceFiles[0];
  const rows = rowsFor(fileName, "Mazda");
  for (const row of rows.slice(10)) {
    const versionName = asText(row[2]);
    const citCode = asText(row[10]);
    if (!versionName || !citCode) continue;
    pushRecord(records, {
      brandName: "MAZDA",
      modelName: modelFromMazdaVersion(versionName),
      versionName,
      sapCode: asText(row[1]),
      citCode,
      source: fileName
    });
  }
}

function readSuzuki(records: CitRecord[]) {
  const fileName = sourceFiles[1];
  const rows = rowsFor(fileName, "Precios Julio 2026");
  let currentModel = "";
  for (const row of rows.slice(6)) {
    currentModel = asText(row[1]) || currentModel;
    const versionName = asText(row[3]);
    const citCode = asText(row[4]);
    if (!currentModel || !versionName || !citCode) continue;
    pushRecord(records, {
      brandName: "SUZUKI",
      modelName: currentModel,
      versionName,
      sapCode: asText(row[2]),
      citCode,
      source: fileName
    });
  }
}

function readGwm(records: CitRecord[]) {
  const fileName = sourceFiles[2];
  for (const sheetName of ["Precios Agosto 2026", "Preventa ORA 5"]) {
    const rows = rowsFor(fileName, sheetName);
    let currentModel = "";
    for (const row of rows.slice(7)) {
      currentModel = asText(row[2]) || currentModel;
      const brandName = asText(row[3]) || "GWM";
      const versionName = asText(row[4]);
      const description = asText(row[5]);
      const citCode = asText(row[7]);
      if (!currentModel || !versionName || !citCode) continue;
      pushRecord(records, {
        brandName,
        modelName: currentModel,
        versionName: `${versionName} ${description}`.trim(),
        sapCode: asText(row[6]),
        citCode,
        source: `${fileName} / ${sheetName}`
      });
    }
  }
}

function readChangan(records: CitRecord[]) {
  const fileName = sourceFiles[3];
  const rows = rowsFor(fileName, "3. CIT por modelo");
  let currentModel = "";
  for (const row of rows.slice(4)) {
    currentModel = asText(row[0]) || currentModel;
    const versionName = asText(row[1]);
    const citCode = asText(row[3]);
    if (!currentModel || !versionName || !citCode) continue;
    pushRecord(records, {
      brandName: "CHANGAN",
      modelName: currentModel,
      versionName,
      sapCode: asText(row[2]),
      citCode,
      source: fileName
    });
  }
}

function scoreRecord(record: CitRecord, candidate: VersionCandidate) {
  if (canonicalBrand(candidate.brandName) !== canonicalBrand(record.brandName)) return 0;

  const recordModel = compactVehicleName(record.modelName);
  const recordVersion = compactVehicleName(record.versionName);
  const candidateModel = compactVehicleName(candidate.modelName);
  const candidateVersion = compactVehicleName(candidate.versionName);
  const candidateFull = `${candidateModel} ${candidateVersion}`;
  const recordFull = `${recordModel} ${recordVersion}`;

  let score = 0;
  if (recordModel && (candidateModel.includes(recordModel) || recordModel.includes(candidateModel))) score += 0.35;
  if (recordVersion && (candidateVersion.includes(recordVersion) || recordVersion.includes(candidateVersion))) score += 0.35;

  const recordTokens = tokens(recordFull);
  const candidateTokens = new Set(tokens(candidateFull));
  const overlap = recordTokens.filter((token) => candidateTokens.has(token)).length;
  const overlapRatio = recordTokens.length ? overlap / recordTokens.length : 0;
  score += overlapRatio * 0.55;

  if (record.sapCode && candidate.sapCode && normalize(record.sapCode) === normalize(candidate.sapCode)) score += 0.4;
  return score;
}

function manualCit(candidate: VersionCandidate) {
  const vehicle = `${normalize(candidate.brandName)} ${normalize(candidate.modelName)} ${normalize(candidate.versionName)}`;
  const directMappings: Array<[RegExp, string]> = [
    [/gwm nueva poer plus automatica 2 0t diesel 4x2 elite/, "GW9828E60625M01-5"],
    [/gwm nueva poer plus automatica 2 0t diesel 4x4 elite/, "GW9828E60225M00-5"],
    [/gwm nueva poer plus automatica 2 0t diesel 4x4 deluxe/, "GW9828E60225M00-5"],
    [/gwm nueva poer plus automatica 2 4t elite 4x4/, "GW9731E61124M00-6"],
    [/gwm nueva poer plus automatica 2 4t deluxe 4x4/, "GW9731E61124M00-6"],
    [/gwm nueva poer p500 phev 4wd deluxe/, "GW10199E60825M00-8"]
  ];

  return directMappings.find(([pattern]) => pattern.test(vehicle))?.[1] ?? null;
}

async function main() {
  const missing = sourceFiles.filter((fileName) => !fs.existsSync(path.join(sourceDir, fileName)));
  if (missing.length) {
    throw new Error(`No se encontraron fuentes CIT: ${missing.join(", ")}`);
  }

  const records: CitRecord[] = [];
  readMazda(records);
  readSuzuki(records);
  readGwm(records);
  readChangan(records);

  const candidates = await prisma.version.findMany({
    include: { brand: true, model: true }
  });

  const normalizedCandidates: VersionCandidate[] = candidates.map((version) => ({
    id: version.id,
    brandName: version.brand.name,
    modelName: version.model.name,
    versionName: version.name,
    sapCode: version.sapCode
  }));

  let updated = 0;
  let skipped = 0;
  const details: string[] = [];

  for (const candidate of normalizedCandidates) {
    const directCit = manualCit(candidate);
    if (directCit && candidate.sapCode !== directCit) {
      await prisma.version.update({
        where: { id: candidate.id },
        data: { sapCode: directCit }
      });
      updated += 1;
      details.push(`${candidate.brandName} ${candidate.modelName} ${candidate.versionName} -> ${directCit} (manual)`);
      continue;
    }

    const ranked = records
      .map((record) => ({ record, score: scoreRecord(record, candidate) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.score < 0.55) {
      skipped += 1;
      continue;
    }

    if (candidate.sapCode === best.record.citCode) continue;

    await prisma.version.update({
      where: { id: candidate.id },
      data: { sapCode: best.record.citCode }
    });
    updated += 1;
    details.push(`${candidate.brandName} ${candidate.modelName} ${candidate.versionName} -> ${best.record.citCode} (${best.score.toFixed(2)})`);
  }

  console.log(
    JSON.stringify(
      {
        records: records.length,
        updated,
        skipped,
        examples: details.slice(0, 25)
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
