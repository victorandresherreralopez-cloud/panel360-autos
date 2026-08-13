import { NextResponse } from "next/server";
import { readStoredDocument } from "@/lib/document-storage";
import { prisma } from "@/lib/prisma";
import { sanitizeFilename } from "@/lib/safe-paths";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      type: true,
      originalName: true,
      storedPath: true,
      extension: true,
      textSource: true,
      receivedAt: true,
      brand: { select: { name: true } }
    }
  });

  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado en el sistema." }, { status: 404 });
  }

  // Attempt to read binary stored document
  if (document.storedPath) {
    try {
      const file = await readStoredDocument(document.storedPath);
      const filename = sanitizeFilename(document.originalName || `ficha-tecnica${document.extension ?? ".pdf"}`);

      return new Response(file.buffer, {
        headers: {
          "Content-Type": document.extension === ".pdf" ? "application/pdf" : file.contentType ?? "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=60"
        }
      });
    } catch {
      // Physical file missing on serverless disk — fallback to text content summary below
    }
  }

  // Fallback: Generate text summary document for download
  const content = [
    `=================================================================`,
    `PANEL360 AUTOS — DOCUMENTO COMERCIAL OFICIAL`,
    `=================================================================`,
    `ID: ${document.id}`,
    `Documento: ${document.originalName}`,
    `Tipo: ${document.type}`,
    `Marca: ${document.brand?.name ?? "General / Derco"}`,
    `Fecha Registro: ${new Date(document.receivedAt).toLocaleString("es-CL")}`,
    `=================================================================`,
    ``,
    `CONTENIDO EXTRAÍDO / RESUMEN:`,
    `-----------------------------------------------------------------`,
    document.textSource || "Sin extracto de texto registrado en la base de datos.",
    `=================================================================`
  ].join("\n");

  const filename = sanitizeFilename(document.originalName.replace(/\.[^.]+$/, "") + "-resumen.txt");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=60"
    }
  });
}
