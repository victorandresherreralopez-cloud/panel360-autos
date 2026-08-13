import { NextResponse } from "next/server";
import { fetchLasCondesPermit } from "@/lib/taxes";

export const dynamic = "force-dynamic";

function estimateCirculationPermitFallback(netPrice: number, invoiceDate: string) {
  const month = Number.parseInt(invoiceDate.slice(5, 7), 10);
  const utmByMonth2026: Record<number, number> = {
    1: 69650, 2: 70100, 3: 70600, 4: 71000, 5: 71200, 6: 71400,
    7: 71500, 8: 71649, 9: 71800, 10: 72000, 11: 72200, 12: 72400
  };
  const utm = utmByMonth2026[month] ?? 71649;
  const priceInUtm = netPrice / utm;
  let annualPermit = 0;
  if (priceInUtm > 0 && priceInUtm <= 60) annualPermit = Math.round(netPrice * 0.01);
  if (priceInUtm > 60 && priceInUtm <= 120) annualPermit = Math.round(netPrice * 0.02 - 0.6 * utm);
  if (priceInUtm > 120 && priceInUtm <= 250) annualPermit = Math.round(netPrice * 0.03 - 1.8 * utm);
  if (priceInUtm > 250 && priceInUtm <= 400) annualPermit = Math.round(netPrice * 0.04 - 4.3 * utm);
  if (priceInUtm > 400) annualPermit = Math.round(netPrice * 0.045 - 6.3 * utm);

  return Math.round((annualPermit / 12) * (13 - (month || 8)));
}

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

    try {
      const result = await fetchLasCondesPermit({ netPrice, invoiceDate });
      return NextResponse.json({ ok: true, ...result, isEstimated: false, source: "OFICIAL_LAS_CONDES" });
    } catch {
      const fallbackAmount = estimateCirculationPermitFallback(netPrice, invoiceDate);
      return NextResponse.json({
        ok: true,
        amount: fallbackAmount,
        isEstimated: true,
        source: "ESTIMACION_REFERENCIAL",
        message: "Servicio externo Las Condes no disponible. Valor calculado mediante fórmula de estimación referencial."
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "No se pudo consultar ni calcular el permiso de circulación."
      },
      { status: 500 }
    );
  }
}
