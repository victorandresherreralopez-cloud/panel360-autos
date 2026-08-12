export function formatCLP(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Informacion pendiente de cargar";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "Fecha no informada";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeZone: "America/Santiago"
  }).format(new Date(value));
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "Fecha no informada";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago"
  }).format(new Date(value));
}

export function missing(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Informacion pendiente de cargar";
  }

  return String(value);
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function parseMoney(value: FormDataEntryValue | string | number | null | undefined) {
  if (typeof value === "number") return Math.round(value);
  if (!value) return null;
  const normalized = String(value).replace(/[^\d-]/g, "");
  if (!normalized) return null;
  return Number.parseInt(normalized, 10);
}

export function fullName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}
