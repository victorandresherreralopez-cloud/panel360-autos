import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { dataModels } from "./vercel-data-models.mjs";

const prisma = new PrismaClient();

async function main() {
  const data = {};

  for (const [key, delegateName] of dataModels) {
    data[key] = await prisma[delegateName].findMany();
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.resolve(process.argv[2] ?? path.join("backups", "vercel", `export-${stamp}.json`));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        source: "sqlite-local",
        data
      },
      null,
      2
    )
  );

  console.log(`Export listo: ${outputPath}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
