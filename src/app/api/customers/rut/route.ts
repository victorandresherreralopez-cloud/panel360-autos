import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRut, isValidRut, normalizeRut, rutMatches } from "@/lib/rut";
import { lookupRutProfile } from "@/lib/rut-lookup";

export const dynamic = "force-dynamic";

async function lookupExternalProfile(rut: string, hasConsent: boolean) {
  if (!hasConsent) {
    return {
      status: "requires_consent",
      message: "Para consultar una fuente externa se requiere autorizacion del cliente."
    };
  }

  try {
    const profile = await lookupRutProfile(rut);

    if (!profile) {
      return {
        status: "empty",
        message: "No se encontraron datos para este RUT en las fuentes consultadas."
      };
    }

    return {
      status: "external_found",
      source: profile.sources.join(", ") || "FUENTE_PUBLICA",
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
        commune: profile.commune,
        city: profile.commune,
        region: ""
      },
      vehicles: profile.vehicles,
      company: profile.company
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
