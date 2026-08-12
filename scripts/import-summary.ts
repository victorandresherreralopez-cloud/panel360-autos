import { prisma } from "../src/lib/prisma";

function group<T>(items: T[], key: (item: T) => string | null | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = key(item) || "SIN_DATO";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function main() {
  const docs = await prisma.document.findMany({
    include: { imports: true },
    orderBy: { receivedAt: "desc" }
  });
  const items = await prisma.updateItem.findMany({
    select: { category: true, confidence: true, status: true, brandName: true }
  });

  console.log(
    JSON.stringify(
      {
        documents: docs.map((document) => ({
          name: document.originalName,
          type: document.type,
          status: document.status,
          detectedMonth: document.imports[0]?.detectedMonth,
          detectedBrand: document.imports[0]?.detectedBrand,
          storedPath: document.storedPath
        })),
        byBrand: group(items, (item) => item.brandName),
        byCategory: group(items, (item) => item.category),
        byConfidence: group(items, (item) => item.confidence),
        byStatus: group(items, (item) => item.status)
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
