/**
 * Módulo de normalización de datos para el Importador Inteligente de Clientes
 */

import { cleanRut, formatRut, isValidRut, normalizeRut } from "@/lib/rut";

// ------- RUT -------
export function normalizeImportedRut(raw: string): {
  normalized: string | null;
  formatted: string | null;
  valid: boolean;
  original: string;
} {
  const original = raw.trim();
  try {
    const normalized = normalizeRut(original);
    const valid = normalized ? isValidRut(normalized) : false;
    const formatted = valid ? formatRut(original) : null;
    return { normalized: normalized || null, formatted, valid, original };
  } catch {
    return { normalized: null, formatted: null, valid: false, original };
  }
}

// ------- TELÉFONO -------
const CHILE_PHONE_REGEX = /^(\+?56\s?)?(9\s?\d{4}\s?\d{4}|\d{8,9})$/;

export function normalizePhone(raw: string): {
  normalized: string | null;
  valid: boolean;
  original: string;
} {
  const original = raw.trim();
  const clean = original.replace(/[\s\-().]/g, "");

  // Already E.164 Chilean format
  if (/^\+569\d{8}$/.test(clean)) {
    return { normalized: clean, valid: true, original };
  }

  // Remove country code prefix
  let digits = clean;
  if (digits.startsWith("569") && digits.length === 11) digits = digits.slice(2);
  if (digits.startsWith("56") && digits.length === 10) digits = digits.slice(2);

  // Mobile Chilean number
  if (/^9\d{8}$/.test(digits)) {
    return { normalized: `+56${digits}`, valid: true, original };
  }

  // Landline (old format 8 digits)
  if (/^\d{8}$/.test(digits)) {
    return { normalized: `+562${digits}`, valid: true, original };
  }

  return { normalized: null, valid: false, original };
}

// ------- CORREO -------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): {
  normalized: string | null;
  valid: boolean;
  original: string;
} {
  const original = raw.trim();
  const lower = original.toLowerCase().replace(/\s/g, "");
  const valid = EMAIL_REGEX.test(lower);
  return { normalized: valid ? lower : null, valid, original };
}

// ------- FECHA -------
type DateParseResult = {
  date: Date | null;
  ambiguous: boolean;
  original: string;
  needsReview: boolean;
};

export function parseImportedDate(raw: string): DateParseResult {
  const original = raw.trim();
  if (!original) return { date: null, ambiguous: false, original, needsReview: false };

  // Excel serial date number
  if (/^\d{4,5}$/.test(original)) {
    const serial = parseInt(original, 10);
    if (serial > 25000 && serial < 50000) {
      // Excel epoch: Jan 1 1900 = serial 1
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return { date, ambiguous: false, original, needsReview: false };
    }
  }

  // ISO format YYYY-MM-DD
  const isoMatch = original.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return { date, ambiguous: false, original, needsReview: false };
  }

  // DD/MM/YYYY or DD-MM-YYYY (Chilean common format)
  const dmy = original.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += year < 30 ? 2000 : 1900;

    // Ambiguous: if day <= 12, could be MM/DD/YYYY
    const ambiguous = day <= 12 && month <= 12 && day !== month;
    if (day > 31 || month > 12) return { date: null, ambiguous: false, original, needsReview: true };

    const date = new Date(Date.UTC(year, month - 1, day));
    return { date, ambiguous, original, needsReview: ambiguous };
  }

  return { date: null, ambiguous: false, original, needsReview: true };
}

// ------- NOMBRE -------
type NameParseResult = {
  firstName: string;
  lastName: string;
  fullOriginal: string;
};

export function parseFullName(raw: string): NameParseResult {
  const fullOriginal = raw.trim();
  const words = fullOriginal.split(/\s+/).filter(Boolean);

  if (words.length === 0) return { firstName: "", lastName: "", fullOriginal };
  if (words.length === 1) return { firstName: capitalize(words[0]), lastName: "", fullOriginal };
  if (words.length === 2) {
    return { firstName: capitalize(words[0]), lastName: capitalize(words[1]), fullOriginal };
  }

  // 3+ words: first word(s) = firstName, last 2 = apellido paterno + materno combined
  const lastTwo = words.slice(-2).map(capitalize).join(" ");
  const firstNames = words.slice(0, -2).map(capitalize).join(" ");
  return { firstName: firstNames, lastName: lastTwo, fullOriginal };
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
