"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type SavedSheetSummary = {
  id: string;
  vehicleLabel: string;
  customerName: string | null;
  orderNumber: string | null;
  salePrice: number | null;
  marginTotal: number | null;
  createdAt: string;
  data: string;
};

type SaveInput = {
  versionId?: string | null;
  vehicleLabel: string;
  customerName?: string | null;
  customerEmail?: string | null;
  orderNumber?: string | null;
  internalNumber?: string | null;
  invoiceDate?: string | null;
  salePrice?: number | null;
  marginTotal?: number | null;
  data: string;
};

// La tabla se crea en la BD con el SQL de despliegue. Si aun no existe,
// devolvemos un motivo claro en vez de romper la pagina.
function isMissingTable(error: unknown) {
  const code = (error as { code?: string })?.code;
  return code === "P2021" || code === "P2022";
}

export async function saveProfitabilitySheet(input: SaveInput): Promise<{ ok: boolean; id?: string; reason?: string }> {
  if (!input.vehicleLabel || !input.data) {
    return { ok: false, reason: "DATOS_INCOMPLETOS" };
  }
  try {
    const user = await getCurrentUser();
    const sheet = await prisma.profitabilitySheet.create({
      data: {
        versionId: input.versionId ?? null,
        vehicleLabel: input.vehicleLabel,
        customerName: input.customerName ?? null,
        customerEmail: input.customerEmail ?? null,
        orderNumber: input.orderNumber ?? null,
        internalNumber: input.internalNumber ?? null,
        invoiceDate: input.invoiceDate ?? null,
        salePrice: input.salePrice ?? null,
        marginTotal: input.marginTotal ?? null,
        data: input.data,
        createdBy: user?.email ?? null
      }
    });
    revalidatePath("/rentabilidad");
    return { ok: true, id: sheet.id };
  } catch (error) {
    if (isMissingTable(error)) return { ok: false, reason: "TABLA_NO_CREADA" };
    return { ok: false, reason: error instanceof Error ? error.message : "ERROR_DESCONOCIDO" };
  }
}

export async function listProfitabilitySheets(limit = 30): Promise<SavedSheetSummary[]> {
  try {
    const rows = await prisma.profitabilitySheet.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return rows.map((row) => ({
      id: row.id,
      vehicleLabel: row.vehicleLabel,
      customerName: row.customerName,
      orderNumber: row.orderNumber,
      salePrice: row.salePrice,
      marginTotal: row.marginTotal,
      createdAt: row.createdAt.toISOString(),
      data: row.data
    }));
  } catch (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
}

export async function deleteProfitabilitySheet(id: string): Promise<{ ok: boolean }> {
  try {
    await prisma.profitabilitySheet.delete({ where: { id } });
    revalidatePath("/rentabilidad");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
