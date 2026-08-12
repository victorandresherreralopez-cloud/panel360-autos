import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const sessionDurationSeconds = 8 * 60 * 60;

export const authCookieName = "aca_session";

export type AuthSession = {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.VERCEL) {
    throw new Error("AUTH_SECRET debe configurarse en Vercel con al menos 32 caracteres.");
  }

  return "local-development-auth-secret-change-before-vercel";
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, stored] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !stored) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(stored, "base64url");
  if (derived.length !== storedBuffer.length) return false;

  return timingSafeEqual(derived, storedBuffer);
}

export function createSessionToken(user: { id: string; email: string; name: string; role: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSession = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + sessionDurationSeconds
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string | null): AuthSession | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthSession;
    if (!payload.sub || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionMaxAge() {
  return sessionDurationSeconds;
}

export function createResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function isSafeRedirect(value?: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") && !value.startsWith("/recuperar-clave"));
}
