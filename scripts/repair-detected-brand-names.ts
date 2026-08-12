import { prisma } from "../src/lib/prisma";

const knownBrands = new Set(["SUZUKI", "MAZDA", "GWM", "CHANGAN", "DEEPAL", "DFSK"]);

async function main() {
  const items = await prisma.updateItem.findMany({
    include: {
      update: true
    }
  });

  let repaired = 0;
  const brandByDocumentId = new Map<string, string>();

  for (const item of items) {
    if (!item.update.documentId) continue;
    let detectedBrand = brandByDocumentId.get(item.update.documentId);
    if (!detectedBrand) {
      const documentImport = await prisma.documentImport.findFirst({
        where: { documentId: item.update.documentId },
        select: { detectedBrand: true }
      });
      detectedBrand = documentImport?.detectedBrand ?? undefined;
      if (detectedBrand) brandByDocumentId.set(item.update.documentId, detectedBrand);
    }
    if (!detectedBrand) continue;
    if (item.brandName && knownBrands.has(item.brandName.toUpperCase())) continue;

    await prisma.updateItem.update({
      where: { id: item.id },
      data: { brandName: detectedBrand }
    });
    repaired += 1;
  }

  console.log(`Brand names reparados: ${repaired}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
