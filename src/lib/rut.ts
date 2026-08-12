export function cleanRut(value: string) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function rutCheckDigit(body: string) {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number.parseInt(body[index], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

export function normalizeRut(value: string) {
  const cleaned = cleanRut(value);
  if (cleaned.length < 2) return "";
  return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
}

export function formatRut(value: string) {
  const normalized = normalizeRut(value);
  if (!normalized) return "";

  const [body, verifier] = normalized.split("-");
  const formattedBody = [...body].reverse().join("").match(/.{1,3}/g)?.join(".").split("").reverse().join("") ?? body;
  return `${formattedBody}-${verifier}`;
}

export function isValidRut(value: string) {
  const normalized = normalizeRut(value);
  if (!normalized) return false;

  const [body, verifier] = normalized.split("-");
  if (!/^\d{6,8}$/.test(body) || !/^[0-9K]$/.test(verifier)) return false;
  return rutCheckDigit(body) === verifier;
}

export function rutMatches(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  return normalizeRut(left) === normalizeRut(right);
}
