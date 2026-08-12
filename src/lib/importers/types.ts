export type ExtractionConfidence = "ALTA_CONFIANZA" | "REQUIERE_REVISION" | "AMBIGUA";

export type DetectedChange = {
  category: "PRECIO" | "BONO" | "BENEFICIO" | "CAMPAÑA" | "TASA" | "PATENTE" | "VERSION" | "OTRO";
  brandName?: string;
  modelName?: string;
  versionName?: string;
  fieldName?: string;
  proposedValue?: string;
  amount?: number;
  rawText: string;
  confidence: ExtractionConfidence;
  ambiguityReason?: string;
  payload?: Record<string, unknown>;
};

export type ImportResult = {
  importer: "excel" | "csv" | "pdf" | "powerpoint" | "text";
  detectedBrand?: string;
  detectedMonth?: string;
  rawText: string;
  changes: DetectedChange[];
  warnings: string[];
};
