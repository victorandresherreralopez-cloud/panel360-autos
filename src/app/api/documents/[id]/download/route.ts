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

  // 1. Direct HTTP Remote URL in storedPath (e.g. S3 PDF link)
  if (document.storedPath && /^https?:\/\//i.test(document.storedPath)) {
    return NextResponse.redirect(document.storedPath);
  }

  // 2. Extract HTTP PDF URL from textSource if available
  if (document.textSource) {
    const pdfMatch = document.textSource.match(/https?:\/\/[^\s"'\)]+\.pdf/i);
    if (pdfMatch && pdfMatch[0]) {
      return NextResponse.redirect(pdfMatch[0]);
    }
    const httpMatch = document.textSource.match(/https?:\/\/[^\s"'\)]+/i);
    if (httpMatch && httpMatch[0]) {
      return NextResponse.redirect(httpMatch[0]);
    }
  }

  // 3. Attempt to read binary stored local document (for local development)
  if (document.storedPath) {
    try {
      const file = await readStoredDocument(document.storedPath);
      const filename = sanitizeFilename(document.originalName || `ficha-tecnica${document.extension ?? ".pdf"}`);

      return new Response(file.buffer, {
        headers: {
          "Content-Type": document.extension === ".pdf" ? "application/pdf" : file.contentType ?? "application/octet-stream",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "private, max-age=60"
        }
      });
    } catch {
      // Physical local file missing on serverless disk
    }
  }

  // 4. Visual Formatted Sheet Fallback (HTML document suitable for viewing and PDF printing)
  const title = document.originalName.replace(/\.[^.]+$/, "");
  const brandName = document.brand?.name ?? "DERCO";
  const dateStr = new Date(document.receivedAt).toLocaleDateString("es-CL");
  const extractedText = document.textSource || "Información de catálogo almacenada en base de datos de Panel360 Autos.";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Panel360 Autos</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .card { max-width: 800px; margin: 0 auto; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 2.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: #e31837; color: white; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; padding: 0.35rem 0.75rem; border-radius: 9999px; letter-spacing: 0.05em; }
    h1 { font-size: 1.75rem; font-weight: 900; margin: 1rem 0 0.5rem 0; color: #ffffff; }
    .meta { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; }
    .content { font-size: 0.95rem; line-height: 1.7; color: #cbd5e1; white-space: pre-wrap; word-break: break-word; background: #0f172a; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .btn-print { margin-top: 2rem; background: #e31837; color: white; font-weight: 800; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
    .btn-print:hover { background: #c10c27; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${brandName} — FICHA TÉCNICA OFICIAL</span>
    <h1>${title}</h1>
    <div class="meta">ID Documento: ${document.id} | Registrado: ${dateStr}</div>
    <div class="content">${extractedText}</div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=60"
    }
  });
}
