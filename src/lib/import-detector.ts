/**
 * Motor Heurístico de Detección de Columnas para el Importador Inteligente de Clientes
 * Detecta tipo de datos por nombre de encabezado + patrones regex en el contenido
 */

export type FieldType =
  | "rut"
  | "firstName"
  | "lastName"
  | "fullName"
  | "phone"
  | "phone2"
  | "email"
  | "birthDate"
  | "address"
  | "commune"
  | "city"
  | "region"
  | "brand"
  | "model"
  | "version"
  | "plate"
  | "purchaseDate"
  | "saleDate"
  | "financialEntity"
  | "installments"
  | "installmentAmount"
  | "firstInstallmentDate"
  | "lastInstallmentDate"
  | "financedAmount"
  | "downPayment"
  | "executive"
  | "branch"
  | "status"
  | "origin"
  | "notes"
  | "ignore"
  | "unknown";

export type MappingConfidence = {
  field: FieldType;
  confidence: number; // 0-100
  label: string;
};

export type ColumnMapping = {
  originalHeader: string;
  colIndex: number;
  detectedField: FieldType;
  confidence: number;
  label: string;
  sample: string[];
};

// --- HEADER SYNONYM MAPS ---
const HEADER_SYNONYMS: Record<FieldType, string[]> = {
  rut: ["rut", "run", "rut cliente", "run cliente", "rut_cliente", "run_cliente", "rut del cliente", "identificacion", "id cliente", "numero documento", "documento", "cedula"],
  firstName: ["nombre", "nombres", "primer nombre", "first name", "nombre1", "nom", "nombre_cliente"],
  lastName: ["apellido", "apellidos", "apellido paterno", "apellido_paterno", "ape pat", "primer apellido"],
  fullName: ["nombre completo", "nombre y apellido", "cliente", "nombre cliente", "nom cli", "razon social", "titular", "nombre_completo", "razón social"],
  phone: ["telefono", "fono", "celular", "movil", "cel", "cel1", "fono1", "tel", "phone", "tel1", "telefono 1", "telefono1", "movil 1", "numero telefono", "fono_cliente"],
  phone2: ["telefono 2", "fono2", "cel2", "celular2", "telefono secundario", "tel2", "otro telefono"],
  email: ["email", "mail", "correo", "e-mail", "email cliente", "mail_cliente", "correo electronico", "correo_cliente", "e mail"],
  birthDate: ["fecha nacimiento", "nacimiento", "fecha nac", "fec nac", "fecha_nac", "birth date", "fecha de nacimiento", "cumpleanos"],
  address: ["direccion", "domicilio", "calle", "address", "dir", "dir cliente", "direccion_cliente"],
  commune: ["comuna", "commune", "com"],
  city: ["ciudad", "city"],
  region: ["region", "region_cliente"],
  brand: ["marca", "brand", "marca vehiculo", "marca_vehiculo"],
  model: ["modelo", "model", "modelo vehiculo", "vehiculo", "auto", "automovil", "veh"],
  version: ["version", "variante", "trim"],
  plate: ["patente", "plate", "ppu", "placa"],
  purchaseDate: ["fecha compra", "fecha_compra", "compra", "fecha adquisicion", "fecha adq"],
  saleDate: ["fecha venta", "fecha_venta", "venta", "fecha de venta"],
  financialEntity: ["financiera", "banco", "institucion financiera", "entidad financiera", "credito banco", "financiero"],
  installments: ["cuotas", "num cuotas", "numero cuotas", "n cuotas", "cant cuotas", "plazo"],
  installmentAmount: ["valor cuota", "cuota mensual", "monto cuota", "importe cuota"],
  firstInstallmentDate: ["primera cuota", "fecha primera cuota", "inicio credito"],
  lastInstallmentDate: ["ultima cuota", "fecha ultima cuota", "termino credito", "vencimiento credito", "fin credito"],
  financedAmount: ["monto financiado", "credito", "monto credito", "importe financiado", "prestamo"],
  downPayment: ["pie", "entrada", "cuota inicial", "enganche"],
  executive: ["ejecutivo", "vendedor", "asesor", "executive"],
  branch: ["sucursal", "tienda", "local", "branch"],
  status: ["estado", "status", "estado cliente"],
  origin: ["origen", "procedencia", "fuente"],
  notes: ["notas", "observaciones", "obs", "comentarios", "comentario", "detalle", "nota"],
  ignore: [],
  unknown: []
};

// --- REGEX PATTERNS ---
const RUT_REGEX = /^\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]$/;
const PHONE_REGEX = /^(\+?56\s?)?(9\s?\d{4}\s?\d{4}|\d{8,9})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/;
const NUMERIC_REGEX = /^\d+$/;

// --- LABEL MAP ---
const FIELD_LABELS: Record<FieldType, string> = {
  rut: "RUT / RUN",
  firstName: "Nombre",
  lastName: "Apellido",
  fullName: "Nombre Completo",
  phone: "Teléfono",
  phone2: "Teléfono 2",
  email: "Correo Electrónico",
  birthDate: "Fecha de Nacimiento",
  address: "Dirección",
  commune: "Comuna",
  city: "Ciudad",
  region: "Región",
  brand: "Marca Vehículo",
  model: "Modelo Vehículo",
  version: "Versión",
  plate: "Patente",
  purchaseDate: "Fecha Compra",
  saleDate: "Fecha Venta",
  financialEntity: "Financiera",
  installments: "Nº Cuotas",
  installmentAmount: "Valor Cuota",
  firstInstallmentDate: "Primera Cuota",
  lastInstallmentDate: "Última Cuota",
  financedAmount: "Monto Financiado",
  downPayment: "Pie",
  executive: "Ejecutivo / Vendedor",
  branch: "Sucursal",
  status: "Estado Cliente",
  origin: "Origen",
  notes: "Notas / Observaciones",
  ignore: "Ignorar",
  unknown: "Desconocido"
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[_\-]/g, " ").replace(/\s+/g, " ");
}

function detectByHeader(header: string): { field: FieldType; confidence: number } {
  const norm = normalizeHeader(header);
  for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
    for (const synonym of synonyms) {
      if (norm === synonym) return { field: field as FieldType, confidence: 95 };
      if (norm.includes(synonym) || synonym.includes(norm)) {
        return { field: field as FieldType, confidence: 75 };
      }
    }
  }
  return { field: "unknown", confidence: 0 };
}

function detectByContent(samples: string[]): { field: FieldType; confidence: number } {
  const nonEmpty = samples.filter(Boolean);
  if (!nonEmpty.length) return { field: "unknown", confidence: 0 };

  const rutMatches = nonEmpty.filter((v) => RUT_REGEX.test(v.trim())).length;
  const phoneMatches = nonEmpty.filter((v) => PHONE_REGEX.test(v.replace(/\s/g, ""))).length;
  const emailMatches = nonEmpty.filter((v) => EMAIL_REGEX.test(v.trim())).length;
  const dateMatches = nonEmpty.filter((v) => DATE_REGEX.test(v.trim())).length;

  const total = nonEmpty.length;

  if (rutMatches / total >= 0.6) return { field: "rut", confidence: Math.round((rutMatches / total) * 100) };
  if (emailMatches / total >= 0.6) return { field: "email", confidence: Math.round((emailMatches / total) * 100) };
  if (phoneMatches / total >= 0.6) return { field: "phone", confidence: Math.round((phoneMatches / total) * 100) };
  if (dateMatches / total >= 0.6) return { field: "birthDate", confidence: 60 };

  return { field: "unknown", confidence: 0 };
}

export function detectColumnMappings(headers: string[], rows: string[][]): ColumnMapping[] {
  return headers.map((header, colIndex) => {
    const samples = rows.slice(0, 10).map((row) => row[colIndex] ?? "").filter(Boolean);

    const byHeader = detectByHeader(header);
    const byContent = detectByContent(samples);

    let detectedField: FieldType;
    let confidence: number;

    if (byContent.confidence >= 80) {
      // Content pattern is very strong — override header
      detectedField = byContent.field;
      confidence = byContent.confidence;
    } else if (byHeader.confidence > 0) {
      detectedField = byHeader.field;
      confidence = byContent.confidence > 0
        ? Math.round((byHeader.confidence * 0.6) + (byContent.confidence * 0.4))
        : byHeader.confidence;
    } else if (byContent.confidence > 0) {
      detectedField = byContent.field;
      confidence = byContent.confidence;
    } else {
      detectedField = "unknown";
      confidence = 0;
    }

    return {
      originalHeader: header,
      colIndex,
      detectedField,
      confidence,
      label: FIELD_LABELS[detectedField],
      sample: samples.slice(0, 3)
    };
  });
}

export function getFieldLabel(field: FieldType): string {
  return FIELD_LABELS[field];
}

export const ALL_FIELD_TYPES: FieldType[] = Object.keys(FIELD_LABELS) as FieldType[];
