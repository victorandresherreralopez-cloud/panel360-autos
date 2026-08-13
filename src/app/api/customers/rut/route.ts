import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRut, isValidRut, normalizeRut, rutMatches } from "@/lib/rut";

export const dynamic = "force-dynamic";

type ExternalRutProfile = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  address?: string;
  commune?: string;
  city?: string;
  region?: string;
  source?: string;
};

function splitName(profile: ExternalRutProfile) {
  if (profile.firstName || profile.lastName) {
    return {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? ""
    };
  }

  const parts = String(profile.fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -2).join(" ") || parts[0],
    lastName: parts.slice(-2).join(" ")
  };
}

async function lookupExternalProfile(rut: string, hasConsent: boolean) {
  const url = process.env.CUSTOMER_RUT_LOOKUP_URL;

  if (!url) {
    return {
      status: "not_configured",
      message: "No hay una fuente externa autorizada configurada."
    };
  }

  if (!hasConsent) {
    return {
      status: "requires_consent",
      message: "Para consultar una fuente externa se requiere autorizacion del cliente."
    };
  }

  try {
    const endpoint = new URL(url);
    endpoint.searchParams.set("rut", rut);

    const response = await fetch(endpoint, {
      headers: process.env.CUSTOMER_RUT_LOOKUP_TOKEN
        ? { Authorization: `Bearer ${process.env.CUSTOMER_RUT_LOOKUP_TOKEN}` }
        : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return {
        status: "error",
        message: `La fuente externa respondio ${response.status}.`
      };
    }

    const profile = (await response.json()) as ExternalRutProfile;
    const name = splitName(profile);

    if (!name.firstName && !profile.address) {
      return {
        status: "empty",
        message: "La fuente externa no entrego datos para este RUT."
      };
    }

    return {
      status: "external_found",
      source: profile.source ?? "FUENTE_EXTERNA_AUTORIZADA",
      profile: {
        firstName: name.firstName,
        lastName: name.lastName,
        address: profile.address ?? "",
        commune: profile.commune ?? "",
        city: profile.city ?? "",
        region: profile.region ?? ""
      }
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo consultar la fuente externa."
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rut = searchParams.get("rut") ?? "";
  const hasConsent = searchParams.get("consent") === "1";
  const normalized = normalizeRut(rut);
  const formatted = formatRut(rut);

  if (!normalized || !isValidRut(normalized)) {
    return NextResponse.json({
      ok: false,
      status: "invalid",
      rut: { raw: rut, normalized, formatted, valid: false },
      message: "RUT invalido."
    });
  }

  const existing = await prisma.customer.findFirst({
    where: {
      OR: [
        { rut: normalized },
        { rut: formatted },
        { rut: rut.trim() }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      rut: true,
      phone: true,
      whatsapp: true,
      email: true,
      address: true,
      commune: true,
      city: true,
      region: true,
      updatedAt: true
    }
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      status: "found",
      rut: { raw: rut, normalized, formatted, valid: true },
      customer: {
        id: existing.id,
        firstName: existing.firstName,
        lastName: existing.lastName ?? "",
        phone: existing.phone ?? "",
        whatsapp: existing.whatsapp ?? "",
        email: existing.email ?? "",
        address: existing.address ?? "",
        commune: existing.commune ?? "",
        city: existing.city ?? "",
        region: existing.region ?? "",
        updatedAt: existing.updatedAt
      }
    });
  }

  const external = await lookupExternalProfile(formatted, hasConsent);

  return NextResponse.json({
    ok: true,
    rut: { raw: rut, normalized, formatted, valid: true },
    ...external
  });
}
