import path from "node:path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INFO_STATUS_ACTIVE = "VIGENTE";
const INFO_STATUS_REPLACED = "REEMPLAZADO";
const effectiveFrom = new Date("2026-08-01T12:00:00-04:00");

const sourceFiles = {
  changan: "V:/Sergio Escobar/Agosto/Changan Junio 2026 (3).xlsx",
  gwm: "V:/Sergio Escobar/Agosto/Lista de Precios GWM Agosto 2026 (8).xlsx",
  mazda: "V:/Sergio Escobar/Agosto/07- LISTA DE PRECIOS N2 MAZDA Julio 2026 (3).xlsx",
  suzuki: "V:/Sergio Escobar/Agosto/Lista 07 20260706 lista de precio Julio (2).xlsx"
};

function asText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalize(value) {
  return asText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/\blux\b/g, "luxury")
    .replace(/\b(automatico|automatica|auto)\b/g, "at")
    .replace(/\b(manual)\b/g, "mt")
    .replace(/\b(hibrido|hybrid)\b/g, "hev")
    .replace(/\b(electrico|electric|ev)\b/g, "ev")
    .replace(/\b(nuevo|nueva|new|changan|mazda|gwm|great wall|haval|ipm|e6c|e6b|touch|ex|bmc)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !["con", "sin", "del", "los", "las", "awd", "2wd", "4wd"].includes(token));
}

const trimTokens = new Set([
  "active",
  "comfort",
  "core",
  "deluxe",
  "elite",
  "entry",
  "gl",
  "gls",
  "glx",
  "high",
  "limited",
  "luxury",
  "premium",
  "prime",
  "signature",
  "sport"
]);

const VAT_RATE = 1.19;

function trimSet(value) {
  return new Set(tokens(value).filter((token) => trimTokens.has(token)));
}

function grossAmount(value, hasIva) {
  const amount = money(value);
  if (!amount) return null;
  return hasIva ? amount : Math.round(amount * VAT_RATE);
}

function hasToken(value, patterns) {
  const normalized = normalize(value);
  return patterns.some((pattern) => normalized.includes(pattern));
}

function tractionCode(value) {
  const normalized = normalize(value).replace(/\s+/g, "");
  if (normalized.includes("4x4") || normalized.includes("4wd") || normalized.includes("awd")) return "4x4";
  if (normalized.includes("4x2") || normalized.includes("2wd") || normalized.includes("fwd") || normalized.includes("rwd")) return "4x2";
  return null;
}

function transmissionCode(value) {
  const normalized = normalize(value);
  if (hasToken(normalized, [" mt", " 5mt", " 6mt", " manual"])) return "mt";
  if (hasToken(normalized, [" at", " 6at", " 8at", " automatic"])) return "at";
  return null;
}

function shouldApplyMismatchPenalty(sourceText, candidateText, detector) {
  const source = detector(sourceText);
  const candidate = detector(candidateText);
  return Boolean(source && candidate && source !== candidate);
}

function money(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(Math.abs(value));
  const text = asText(value);
  const cleaned = text.replace(/[^\d]/g, "");
  const amount = Number.parseInt(cleaned, 10);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function sheetRows(file, sheetName) {
  const workbook = XLSX.readFile(file, { cellDates: false });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No existe la hoja "${sheetName}" en ${file}`);
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
}

function compactModelName(value) {
  return asText(value)
    .replace(/\(NUEVO!\)/gi, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseChanganRows() {
  const rows = sheetRows(sourceFiles.changan, "1. Lista de Precios Oficial");
  const entries = [];
  let currentModel = "";
  let currentHasIva = true;

  for (const row of rows.slice(3)) {
    const model = compactModelName(row[0]);
    if (model) currentModel = model;

    const versionName = asText(row[1]);
    const iva = normalize(row[3]);
    if (iva === "neto") currentHasIva = false;
    if (iva.includes("iva")) currentHasIva = true;

    const listPrice = grossAmount(row[4], currentHasIva);
    const cashPrice = grossAmount(row[6], currentHasIva);
    const financingPrice = grossAmount(row[8], currentHasIva);
    if (!versionName || !listPrice || !cashPrice) continue;

    entries.push({
      brandHint: undefined,
      modelName: currentModel,
      versionName,
      sapCode: asText(row[2]),
      citCode: null,
      hasIva: true,
      listPrice,
      brandBonus: grossAmount(row[5], currentHasIva),
      cashPrice,
      financingBonus: grossAmount(row[7], currentHasIva),
      financingPrice,
      sourceFile: sourceFiles.changan,
      sourceSheet: "1. Lista de Precios Oficial",
      sourceName: "Lista precios Changan/Deepal Agosto 2026"
    });
  }

  return entries;
}

function parseGwmPriceSheet(sheetName, channel) {
  const rows = sheetRows(sourceFiles.gwm, sheetName);
  const entries = [];
  let currentModel = "";

  for (const row of rows.slice(7)) {
    const model = compactModelName(row[2]);
    if (model && !normalize(model).includes("linea de productos")) currentModel = model;

    const versionName = asText(row[4]);
    const listPrice = money(row[8]);
    const cashPrice = money(row[13]);
    const financingPrice = money(row[17]);
    if (!versionName || !listPrice || !cashPrice) continue;

    entries.push({
      brandHint: "GWM",
      modelName: currentModel,
      versionName,
      sapCode: asText(row[6]),
      citCode: asText(row[7]),
      hasIva: true,
      listPrice,
      brandBonusName: asText(row[10]) || "Bono marca",
      brandBonus: money(row[11]),
      cashPrice,
      financingBonus: money(row[15]),
      financingPrice,
      channel,
      sourceFile: sourceFiles.gwm,
      sourceSheet: sheetName,
      sourceName: `Lista precios GWM Agosto 2026 - ${sheetName}`
    });
  }

  return entries;
}

function parseMazdaRows() {
  const rows = sheetRows(sourceFiles.mazda, "Mazda");
  const entries = [];

  for (const row of rows.slice(11)) {
    const versionName = asText(row[2]);
    const listPrice = money(row[3]);
    const cashPrice = money(row[6]);
    const financingPrice = money(row[7]);
    if (!versionName || !listPrice || !cashPrice) continue;

    entries.push({
      brandHint: "MAZDA",
      modelName: inferMazdaModel(versionName),
      versionName,
      sapCode: asText(row[1]),
      citCode: asText(row[10]),
      hasIva: true,
      listPrice,
      brandBonus: money(row[4]),
      cashPrice,
      financingBonus: money(row[5]),
      financingPrice,
      sourceFile: sourceFiles.mazda,
      sourceSheet: "Mazda",
      sourceName: "Lista precios Mazda Julio/Agosto 2026"
    });
  }

  return entries;
}

function inferMazdaModel(versionName) {
  const text = normalize(versionName);
  if (text.startsWith("3 sdn")) return "Mazda3 Sedán";
  if (text.startsWith("3 sp")) return "Mazda3 Sport";
  if (text.startsWith("cx 3")) return "Mazda CX-3";
  if (text.startsWith("cx 30")) return "Mazda CX-30";
  if (text.startsWith("cx 5")) return "Mazda CX-5";
  if (text.startsWith("cx 60")) return "Mazda CX-60";
  if (text.startsWith("cx 90")) return "Mazda CX-90";
  if (text.startsWith("mx 5")) return versionName.includes("RF") ? "Mazda MX-5 RF" : "Mazda MX-5";
  if (text.includes("bt 50")) return "Mazda BT-50";
  return "";
}

function parseSuzukiRows() {
  const rows = sheetRows(sourceFiles.suzuki, "Precios Julio 2026");
  const entries = [];
  let currentModel = "";

  for (const row of rows.slice(6)) {
    const model = compactModelName(row[1]);
    if (model) currentModel = model;

    const versionName = asText(row[3]);
    const listPrice = money(row[23]);
    const cashPrice = money(row[25]);
    const financingPrice = money(row[27]) || money(row[29]);
    if (!versionName || !listPrice || !cashPrice) continue;

    entries.push({
      brandHint: "SUZUKI",
      modelName: currentModel,
      versionName,
      sapCode: asText(row[2]),
      citCode: asText(row[4]),
      hasIva: true,
      listPrice,
      brandBonus: money(row[24]),
      cashPrice,
      financingBonus: money(row[26]),
      financingPrice,
      sourceFile: sourceFiles.suzuki,
      sourceSheet: "Precios Julio 2026",
      sourceName: "Lista precios Suzuki Julio/Agosto 2026"
    });
  }

  return entries;
}

function buildEntries() {
  return [
    ...parseChanganRows(),
    ...parseGwmPriceSheet("Precios Agosto 2026", "REGULAR"),
    ...parseGwmPriceSheet("Preventa ORA 5", "PREVENTA"),
    ...parseGwmPriceSheet("Días 0KM GWM en DCR.CL", "DERCO_CL"),
    ...parseMazdaRows(),
    ...parseSuzukiRows()
  ];
}

function scoreCandidate(entry, version) {
  const sourceText = normalize(`${entry.modelName} ${entry.versionName}`);
  const sourceModel = normalize(entry.modelName);
  const modelName = normalize(version.model.name);
  const versionName = normalize(version.name);
  const candidateText = normalize(`${version.model.name} ${version.name}`);
  const citMatches = entry.citCode && version.sapCode && normalize(entry.citCode) === normalize(version.sapCode);
  const brandMatches = entry.brandHint && normalize(entry.brandHint) === normalize(version.brand.name);
  const strongModelMatch = Boolean(sourceModel && modelName && (sourceModel.includes(modelName) || modelName.includes(sourceModel)));
  let score = 0;

  if (brandMatches) score += 15;
  if (citMatches) score += 40;
  if (sourceModel && modelName && sourceModel === modelName) {
    score += 60;
  } else if (strongModelMatch) {
    score += 30;
  } else if (sourceText.includes(modelName) && modelName.length > 4) {
    score += 20;
  }
  if (versionName && (sourceText.includes(versionName) || versionName.includes(sourceText))) {
    score += 35;
  }

  const modelTokens = tokens(version.model.name);
  const versionTokens = tokens(version.name);
  const matchedModelTokens = modelTokens.filter((token) => sourceText.includes(token)).length;
  const matchedVersionTokens = versionTokens.filter((token) => sourceText.includes(token)).length;
  if (modelTokens.length) score += Math.round((matchedModelTokens / modelTokens.length) * 25);
  if (versionTokens.length) score += Math.round((matchedVersionTokens / versionTokens.length) * 45);

  if (entry.brandHint && !brandMatches) score -= 30;
  if (entry.citCode && version.sapCode && !citMatches) score -= 5;
  if (shouldApplyMismatchPenalty(sourceText, candidateText, tractionCode)) score -= 85;
  if (shouldApplyMismatchPenalty(sourceText, candidateText, transmissionCode)) score -= 55;
  if (sourceText.includes("reev") !== candidateText.includes("reev")) score -= 45;

  const sourceTrim = trimSet(entry.versionName);
  const candidateTrim = trimSet(version.name);
  if (sourceTrim.size && candidateTrim.size) {
    const sharedTrim = [...sourceTrim].some((token) => candidateTrim.has(token));
    if (!sharedTrim) score -= 45;
  }
  if (!strongModelMatch && !citMatches) score = Math.min(score, 52);

  return score;
}

function findVersion(entry, versions) {
  const scored = versions
    .map((version) => ({ version, score: scoreCandidate(entry, version) }))
    .sort((left, right) => right.score - left.score);
  const best = scored[0];
  const runnerUp = scored[1];

  if (!best || best.score < 80) {
    return { match: null, score: best?.score ?? 0, runnerUp: runnerUp?.version ?? null };
  }

  return { match: best.version, score: best.score, runnerUp: runnerUp?.version ?? null };
}

async function ensureDocument(entry) {
  const originalName = `${path.basename(entry.sourceFile)} :: ${entry.sourceSheet}`;
  const existing = await prisma.document.findFirst({ where: { originalName } });
  if (existing) return existing;

  return prisma.document.create({
    data: {
      type: "LISTA DE PRECIOS",
      originalName,
      storedPath: entry.sourceFile,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: ".xlsx",
      status: INFO_STATUS_ACTIVE
    }
  });
}

async function upsertPrice({ version, entry, document, priceType, amount, bonusName, bonusAmount, channel = "REGULAR" }) {
  if (!amount) return null;
  const previous = await prisma.price.findFirst({
    where: { versionId: version.id, priceType, channel, status: INFO_STATUS_ACTIVE },
    orderBy: { effectiveFrom: "desc" }
  });

  if (
    previous &&
    previous.amount === amount &&
    previous.bonusName === (bonusName ?? null) &&
    previous.bonusAmount === (bonusAmount ?? null)
  ) {
    return previous;
  }

  await prisma.price.updateMany({
    where: { versionId: version.id, priceType, channel, status: INFO_STATUS_ACTIVE },
    data: { status: INFO_STATUS_REPLACED, effectiveTo: effectiveFrom }
  });

  const price = await prisma.price.create({
    data: {
      versionId: version.id,
      priceType,
      amount,
      channel,
      bonusName,
      bonusAmount,
      hasIva: entry.hasIva,
      effectiveFrom,
      status: INFO_STATUS_ACTIVE,
      documentId: document.id,
      approvedBy: "IMPORTACION_PRECIOS_REALES_AGOSTO_2026"
    }
  });

  await prisma.priceHistory.create({
    data: {
      versionId: version.id,
      priceId: price.id,
      priceType,
      previousAmount: previous?.amount ?? null,
      newAmount: amount,
      difference: previous ? amount - previous.amount : null,
      changedAt: new Date(),
      sourceName: entry.sourceName,
      observation: `${entry.sourceSheet}: ${entry.modelName} / ${entry.versionName}`
    }
  });

  return price;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const entries = buildEntries();
  const versions = await prisma.version.findMany({
    include: { brand: true, model: true }
  });

  const matched = [];
  const unmatched = [];

  for (const entry of entries) {
    const { match, score, runnerUp } = findVersion(entry, versions);
    if (!match) {
      unmatched.push({ entry, score, runnerUp });
      continue;
    }

    matched.push({ entry, version: match, score });
  }

  console.log(`Entradas fuente: ${entries.length}`);
  console.log(`Coincidencias: ${matched.length}`);
  console.log(`Sin match: ${unmatched.length}`);

  if (unmatched.length) {
    console.log("\nSin match (primeras 30):");
    for (const item of unmatched.slice(0, 30)) {
      console.log(`- ${item.entry.sourceSheet} | ${item.entry.modelName} | ${item.entry.versionName} | score ${item.score} | runner-up ${item.runnerUp ? `${item.runnerUp.brand.name} ${item.runnerUp.model.name} ${item.runnerUp.name}` : "n/a"}`);
    }
  }

  console.log("\nMuestra matches:");
  for (const item of matched.slice(0, 20)) {
    console.log(`- ${item.entry.modelName} / ${item.entry.versionName} -> ${item.version.brand.name} ${item.version.model.name} ${item.version.name} (${item.score})`);
  }

  if (isDryRun) return;

  let pricesCreatedOrUpdated = 0;
  for (const item of matched) {
    const { entry, version } = item;
    const document = await ensureDocument(entry);
    const channel = entry.channel ?? "REGULAR";

    if (channel === "REGULAR") {
      await prisma.price.updateMany({
        where: { versionId: version.id, priceType: "CAMPAIGN", channel: "REGULAR", status: INFO_STATUS_ACTIVE },
        data: { status: INFO_STATUS_REPLACED, effectiveTo: effectiveFrom }
      });
    }

    const list = channel === "REGULAR"
      ? await upsertPrice({ version, entry, document, channel, priceType: "LIST", amount: entry.listPrice })
      : null;
    const cash = await upsertPrice({
      version,
      entry,
      document,
      channel,
      priceType: channel === "REGULAR" ? "CASH" : channel,
      amount: entry.cashPrice,
      bonusName: entry.brandBonusName ?? "Bono marca",
      bonusAmount: entry.brandBonus ?? null
    });
    const financing = await upsertPrice({
      version,
      entry,
      document,
      channel,
      priceType: channel === "REGULAR" ? "FINANCING" : `${channel}_FINANCING`,
      amount: entry.financingPrice,
      bonusName: "Bono financiamiento",
      bonusAmount: entry.financingBonus ?? null
    });

    if (list) pricesCreatedOrUpdated += 1;
    if (cash) pricesCreatedOrUpdated += 1;
    if (financing) pricesCreatedOrUpdated += 1;

    if (entry.citCode && !version.sapCode) {
      await prisma.version.update({ where: { id: version.id }, data: { sapCode: entry.citCode } });
    }
  }

  console.log(`\nPrecios procesados: ${pricesCreatedOrUpdated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
