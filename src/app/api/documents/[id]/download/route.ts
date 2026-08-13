import { NextResponse } from "next/server";
import { readStoredDocument } from "@/lib/document-storage";
import { prisma } from "@/lib/prisma";
import { sanitizeFilename } from "@/lib/safe-paths";
import { formatCLP } from "@/lib/format";
import { getPricingBreakdown } from "@/lib/pricing-breakdown";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const docId = params.id;

  // 1. Try finding document by ID directly
  let document = await prisma.document.findUnique({
    where: { id: docId },
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

  // 2. Fallback: Check if params.id is a vehicleModel id
  let modelInfo: any = null;
  if (!document) {
    const model = await prisma.vehicleModel.findUnique({
      where: { id: docId },
      include: {
        brand: true,
        technicalSheet: {
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
        },
        versions: {
          include: {
            prices: { where: { status: { in: ["VIGENTE", "DETECTADO"] } } }
          }
        }
      }
    });

    if (model) {
      if (model.technicalSheet) {
        document = model.technicalSheet;
      }
      modelInfo = model;
    }
  }

  // If document found, attempt serving physical file / remote URL
  if (document) {
    // A. Direct HTTP Remote URL in storedPath (e.g. S3 PDF link)
    if (document.storedPath && /^https?:\/\//i.test(document.storedPath)) {
      return NextResponse.redirect(document.storedPath);
    }

    // B. Extract HTTP PDF URL from textSource if available
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

    // C. Attempt reading local binary file
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
        // Physical local file missing on serverless disk -> fall back to rich HTML sheet below
      }
    }
  }

  // 3. Fallback Interactive HTML Technical Sheet Generator (Never 404)
  const title = document?.originalName ? document.originalName.replace(/\.[^.]+$/, "") : (modelInfo ? `${modelInfo.brand?.name} ${modelInfo.name}` : "Ficha Técnica Comercial");
  const brandName = document?.brand?.name ?? modelInfo?.brand?.name ?? "DERCO";
  const dateStr = document ? new Date(document.receivedAt).toLocaleDateString("es-CL") : new Date().toLocaleDateString("es-CL");
  const extractedText = document?.textSource || (modelInfo ? `Catálogo de especificaciones técnicas y versiones vigentes para ${brandName} ${modelInfo.name}.` : "Información comercial registrada en Panel360 Autos.");

  // Build version specs if modelInfo exists
  let versionsHtml = "";
  if (modelInfo && modelInfo.versions?.length) {
    versionsHtml = `
      <div style="margin-top: 2rem;">
        <h2 style="font-size: 1.1rem; color: #38bdf8; text-transform: uppercase; font-weight: 800; margin-bottom: 1rem;">Versiones & Equipamiento Comercial</h2>
        <div style="display: grid; gap: 1rem;">
          ${modelInfo.versions.map((v: any) => {
            const pricing = getPricingBreakdown({
              brandName,
              modelName: modelInfo.name,
              versionName: v.name,
              segment: modelInfo.segment,
              equipmentSummary: v.equipmentSummary,
              citCode: v.sapCode,
              prices: v.prices ?? []
            });

            return `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                  <strong style="font-size: 1.05rem; color: #ffffff;">${v.name} ${v.modelYear ? `(${v.modelYear})` : ""}</strong>
                  <span style="font-size: 0.85rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.25rem 0.6rem; border-radius: 9999px; font-weight: 700;">
                    ${pricing.cashPrice ? `Contado: ${formatCLP(pricing.cashPrice)}` : "Precio a consultar"}
                  </span>
                </div>
                
                <div style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); display: grid; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.825rem; color: #94a3b8;">
                  <div>⚙️ Motor: <strong>${v.engine || v.displacement || "Standard"}</strong></div>
                  <div>🐎 Potencia: <strong>${v.power || "N/I"}</strong></div>
                  <div>🕹️ Transmisión: <strong>${v.transmission || "Manual / Aut"}</strong></div>
                  <div>⛽ Combustible: <strong>${v.fuelType || "Gasolina"}</strong></div>
                  ${pricing.isCommercialVehicle && pricing.cashNetPrice ? `<div style="color: #4ade80;">💵 Valor Neto (Sin IVA): <strong>${formatCLP(pricing.cashNetPrice)}</strong></div>` : ""}
                  ${pricing.financingPrice ? `<div style="color: #a78bfa;">💳 Crédito: <strong>${formatCLP(pricing.financingPrice)}</strong></div>` : ""}
                </div>

                ${v.equipmentSummary ? `<div style="margin-top: 0.75rem; font-size: 0.8rem; color: #cbd5e1; background: rgba(0,0,0,0.2); padding: 0.5rem 0.75rem; border-radius: 6px;">📋 <strong>Equipamiento:</strong> ${v.equipmentSummary}</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Panel360 Autos</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 1.5rem; }
    .card { max-width: 850px; margin: 0 auto; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .badge { display: inline-block; background: #e31837; color: white; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; padding: 0.35rem 0.75rem; border-radius: 9999px; letter-spacing: 0.05em; }
    h1 { font-size: 1.75rem; font-weight: 900; margin: 0.75rem 0 0.25rem 0; color: #ffffff; }
    .meta { font-size: 0.85rem; color: #94a3b8; }
    .content { font-size: 0.925rem; line-height: 1.7; color: #cbd5e1; white-space: pre-wrap; word-break: break-word; background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .actions { display: flex; gap: 1rem; margin-top: 2rem; }
    .btn-primary { background: #e31837; color: white; font-weight: 800; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-primary:hover { background: #c10c27; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: 10px; cursor: pointer; font-size: 0.9rem; text-decoration: none; }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <span class="badge">${brandName} — FICHA TÉCNICA Y ESPECIFICACIONES</span>
        <h1>${title}</h1>
        <div class="meta">Actualizado: ${dateStr}</div>
      </div>
      <img src="https://derco.cl/favicon.ico" alt="Derco Logo" style="height: 36px; opacity: 0.8; filter: brightness(2);" onerror="this.style.display='none'">
    </div>

    <div class="content">${extractedText}</div>

    ${versionsHtml}

    <div class="actions">
      <button class="btn-primary" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
      <a class="btn-secondary" href="/vehiculos">🚗 Volver al Catálogo</a>
    </div>
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
