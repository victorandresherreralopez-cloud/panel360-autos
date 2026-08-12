import { prisma } from "@/lib/prisma";
import { formatCLP, normalizeText } from "@/lib/format";

export type CommercialAidAlert = {
  id: string;
  title: string;
  brandName: string;
  modelName: string;
  versionName?: string | null;
  category: string;
  detail: string;
  source: string;
  confidence: string;
  status: string;
  rawText: string;
  createdAt: Date;
  tone: "neutral" | "good" | "warn" | "bad";
};

type CommercialAidClassification = Pick<CommercialAidAlert, "title" | "detail" | "tone"> & {
  key: string;
};

const campaignCategory = "CAMPA\u00d1A";
const alertCategories = ["BONO", campaignCategory, "TASA", "PATENTE"];

function cleanVehiclePart(value?: string | null) {
  if (!value) return "";
  const normalized = normalizeText(value);
  const noise = new Set(["modelo", "precio", "incluye", "interno", "digo", "compra", "beneficios", "contexto", "campana"]);
  if (noise.has(normalized)) return "";
  return value.trim();
}

function extractMoneyLabels(rawText: string) {
  const labels = [
    "Bono marca",
    "Bono Financ.",
    "Bono Financiamiento",
    "Bono especial",
    "Aporte Marca",
    "Aporte CES",
    "Aporte total",
    "Gift Card",
    "Contado Especial",
    "Financ. Especial"
  ];

  const found: string[] = [];
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = rawText.match(new RegExp(`${escaped}\\s*:?\\s*\\$?\\s*([\\d.]{4,}|\\d{4,})`, "i"));
    if (match) {
      const amount = Number.parseInt(match[1].replace(/[^\d]/g, ""), 10);
      if (amount) found.push(`${label}: ${formatCLP(amount)}`);
    }
  }

  return found;
}

function moneyLines(rawText: string, needles: string[]) {
  const normalizedNeedles = needles.map((needle) => normalizeText(needle));
  return extractMoneyLabels(rawText).filter((line) => {
    const normalized = normalizeText(line);
    return normalizedNeedles.some((needle) => normalized.includes(needle));
  });
}

function sentenceWith(rawText: string, words: RegExp) {
  const parts = rawText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\s\|\s|,,/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.find((part) => words.test(part));
}

function compactDetail(lines: string[], fallback: string) {
  return lines.length ? lines.join(" | ") : fallback;
}

function classify(item: { category: string; rawText: string; confidence: string }) {
  const normalized = normalizeText(item.rawText);
  const results: CommercialAidClassification[] = [];
  const hasSharedBonus =
    /bonos?\s+amicar|co-financiad|aporte\s+ces|aporte\s+marca/.test(normalized) ||
    (/bono\s+marca/.test(normalized) && /bono\s+financ/.test(normalized));

  if (hasSharedBonus) {
    results.push({
      key: "shared-bonus",
      title: "Bono compartido detectado",
      detail:
        compactDetail(
          moneyLines(item.rawText, ["Bono marca", "Bono Financ.", "Aporte Marca", "Aporte CES", "Aporte total"]),
          sentenceWith(item.rawText, /co-financiad|aporte\s+ces|aporte\s+marca|bonos?\s+amicar|bono\s+financ/i) ||
            "Se detecto informacion de bono compartido o cofinanciado."
        ),
      tone: "warn"
    });
  }

  if (/bono\s+especial/.test(normalized)) {
    results.push({
      key: "special-bonus",
      title: "Bono especial detectado",
      detail: compactDetail(
        moneyLines(item.rawText, ["Bono especial", "Contado Especial", "Financ. Especial"]),
        "Se detecto bono especial; revisar condicion y vigencia antes de prometerlo."
      ),
      tone: item.confidence === "AMBIGUA" ? "warn" : "good"
    });
  }

  if (/campana\s+0\s?km|dias\s+0\s?km/.test(normalized)) {
    results.push({
      key: "0km-campaign",
      title: "Campana 0 KM detectada",
      detail: sentenceWith(item.rawText, /0\s?KM|campana|campa/i) || "Campana 0 KM detectada en plan comercial.",
      tone: "good"
    });
  }

  if (/patente\s+gratis/.test(normalized)) {
    results.push({
      key: "free-registration",
      title: "Patente gratis detectada",
      detail: sentenceWith(item.rawText, /patente gratis|excepto|solo|credito/i) || "Beneficio de patente gratis detectado.",
      tone: "good"
    });
  }

  if (/tasa/.test(normalized)) {
    results.push({
      key: "special-rate",
      title: "Tasa especial detectada",
      detail: sentenceWith(item.rawText, /tasa|0,99|0.99|subvencion/i) || "Se detecto informacion de tasa o financiamiento especial.",
      tone: "warn"
    });
  }

  if (results.length) return results;

  if (item.category === "BONO") {
    return [
      {
        key: "bonus",
        title: "Bono detectado",
        detail: compactDetail(extractMoneyLabels(item.rawText), sentenceWith(item.rawText, /bono|descuento/i) || "Bono detectado en documento comercial."),
        tone: item.confidence === "AMBIGUA" ? ("warn" as const) : ("good" as const)
      }
    ];
  }

  return [
    {
      key: "commercial-aid",
      title: "Ayuda comercial detectada",
      detail: sentenceWith(item.rawText, /bono|campana|tasa|patente|gift/i) || item.rawText.slice(0, 220),
      tone: item.confidence === "AMBIGUA" ? ("warn" as const) : ("neutral" as const)
    }
  ];
}

function dedupeKey(alert: CommercialAidAlert) {
  return [
    alert.title,
    normalizeText(alert.brandName),
    normalizeText(alert.modelName),
    normalizeText(alert.versionName ?? ""),
    normalizeText(alert.detail).replace(/\d{6,}/g, "#")
  ].join("|");
}

export function commercialAidMatchesVehicle(alert: CommercialAidAlert, brandName: string, modelName: string) {
  const brandKey = normalizeText(brandName);
  const modelKey = normalizeText(modelName);
  const alertBrand = normalizeText(alert.brandName);
  const alertModel = normalizeText(alert.modelName);

  if (!alertBrand || alertBrand.includes("no informada")) return false;
  const brandMatches = alertBrand === brandKey || alertBrand.includes(brandKey) || brandKey.includes(alertBrand);
  if (!brandMatches) return false;
  if (!alertModel || alertModel.includes("aplicacion general") || alertModel.includes("pendiente")) return false;

  return alertModel === modelKey || alertModel.startsWith(`${modelKey} `) || alertModel.includes(` ${modelKey} `) || modelKey.includes(alertModel);
}

export async function getCommercialAidAlerts(limit = 80) {
  const items = await prisma.updateItem.findMany({
    where: {
      category: { in: alertCategories },
      status: { in: ["DETECTADO", "EN_REVISION", "APROBADO", "VIGENTE"] }
    },
    include: { update: true },
    orderBy: { createdAt: "desc" },
    take: 600
  });

  const alerts = items.flatMap((item): CommercialAidAlert[] =>
    classify(item).map((classified) => ({
      id: `${item.id}:${classified.key}`,
      title: classified.title,
      brandName: item.brandName ?? "Marca no informada",
      modelName: cleanVehiclePart(item.modelName) || "Aplicacion general o pendiente de asociar",
      versionName: cleanVehiclePart(item.versionName),
      category: item.category,
      detail: classified.detail,
      source: item.update.title,
      confidence: item.confidence,
      status: item.status,
      rawText: item.rawText,
      createdAt: item.createdAt,
      tone: classified.tone
    }))
  );

  const seen = new Set<string>();
  const deduped: CommercialAidAlert[] = [];

  for (const alert of alerts) {
    const key = dedupeKey(alert);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(alert);
  }

  return deduped.slice(0, limit);
}
