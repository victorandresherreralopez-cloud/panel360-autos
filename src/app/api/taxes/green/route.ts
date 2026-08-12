import { NextResponse } from "next/server";
import { calculateGreenTax } from "@/lib/taxes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const citCode = String(body.citCode ?? "").trim();
    const salePriceWithVat = Number(body.salePriceWithVat ?? 0);
    const calculationDate = String(body.calculationDate ?? new Date().toISOString().slice(0, 10));

    if (!citCode) {
      return NextResponse.json({ ok: false, message: "Falta Codigo CIT." }, { status: 400 });
    }

    if (!Number.isFinite(salePriceWithVat) || salePriceWithVat <= 0) {
      return NextResponse.json({ ok: false, message: "Falta precio de venta con IVA." }, { status: 400 });
    }

    return NextResponse.json(await calculateGreenTax({ citCode, salePriceWithVat, calculationDate }));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "No se pudo calcular el impuesto verde."
      },
      { status: 500 }
    );
  }
}
