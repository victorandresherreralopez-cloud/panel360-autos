import { prisma } from "../src/lib/prisma";

function cleanVersionName(versionName: string, modelName: string) {
  const escaped = modelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = versionName.replace(new RegExp(`^${escaped}\\s+`, "i"), "").trim();
  return cleaned || versionName;
}

async function main() {
  const versions = await prisma.version.findMany({
    include: { model: true }
  });

  let renamed = 0;
  let skipped = 0;

  for (const version of versions) {
    const cleaned = cleanVersionName(version.name, version.model.name);
    if (cleaned === version.name) continue;

    const existing = await prisma.version.findFirst({
      where: {
        modelId: version.modelId,
        name: cleaned,
        id: { not: version.id }
      }
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.version.update({
      where: { id: version.id },
      data: { name: cleaned }
    });
    renamed += 1;
  }

  console.log(`Versiones renombradas: ${renamed}`);
  console.log(`Versiones omitidas por conflicto: ${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
