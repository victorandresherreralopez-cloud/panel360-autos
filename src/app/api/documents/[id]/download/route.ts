import { NextResponse } from "next/server";
import { readStoredDocument } from "@/lib/document-storage";
import { prisma } from "@/lib/prisma";
import { sanitizeFilename } from "@/lib/safe-paths";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      type: true,
      originalName: true,
      storedPath: true,
      extension: true
    }
  });

  if (!document || document.type !== "FICHA TECNICA DERCO" || !document.storedPath) {
    return NextResponse.json({ error: "Ficha tecnica no disponible." }, { status: 404 });
  }

  const file = await readStoredDocument(document.storedPath);
  const filename = sanitizeFilename(document.originalName || `ficha-tecnica${document.extension ?? ".pdf"}`);

  return new Response(file.buffer, {
    headers: {
      "Content-Type": document.extension === ".pdf" ? "application/pdf" : file.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=60"
    }
  });
}
