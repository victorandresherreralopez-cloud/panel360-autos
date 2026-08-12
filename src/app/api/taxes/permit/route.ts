import { NextResponse } from "next/server";
import { fetchLasCondesPermit } from "@/lib/taxes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const netPrice = Number(body.netPrice ?? 0);
    const invoiceDate = String(body.invoiceDate ?? new Date().toISOString().slice(0, 10));

    if (!Number.isFinite(netPrice) || netPrice <= 0) {
      return NextResponse.json({ ok: false, message: "Falta Precio Lista Final neto." }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
      return NextResponse.json({ ok: false, message: "Fecha de factura invalida." }, { status: 400 });
    }

    const result = await fetchLasCondesPermit({ netPrice, invoiceDate });
    return NextResponse.json({ ok: true, ...result, source: "Las Condes" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "No se pudo consultar Las Condes."
      },
      { status: 500 }
    );
  }
}
