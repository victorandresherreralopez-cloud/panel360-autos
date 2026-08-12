import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataModels } from "./vercel-data-models.mjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.SUPABASE_DATABASE_URL ??
  "";
const directUrl =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.SUPABASE_DIRECT_URL ??
  "";

if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  console.error("Import cancelado: DATABASE_URL debe apuntar a PostgreSQL.");
  process.exit(1);
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Uso: DATABASE_URL=postgresql://... node scripts/import-vercel-data.mjs backups/vercel/export.json");
  process.exit(1);
}

const sourceSchemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const targetDir = path.join(process.cwd(), ".prisma-vercel");
const targetSchemaPath = path.join(targetDir, "schema.prisma");
const sourceSchema = readFileSync(sourceSchemaPath, "utf8");

mkdirSync(targetDir, { recursive: true });
const postgresSchema = sourceSchema.replace(
  /datasource db \{\s+provider = "sqlite"\s+url\s+= env\("DATABASE_URL"\)\s+\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")${directUrl ? '\n  directUrl = env("DIRECT_URL")' : ""}
}`
);

if (directUrl && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = directUrl;
}

writeFileSync(targetSchemaPath, postgresSchema);

execFileSync("npx", ["prisma", "db", "push", `--schema=${targetSchemaPath}`, "--skip-generate"], {
  shell: process.platform === "win32",
  stdio: "inherit"
});
execFileSync("npx", ["prisma", "generate", `--schema=${targetSchemaPath}`], {
  shell: process.platform === "win32",
  stdio: "inherit"
});

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

async function createMany(delegateName, rows) {
  if (!rows?.length) return;
  await prisma[delegateName].createMany({
    data: rows,
    skipDuplicates: true
  });
}

async function main() {
  const raw = await fs.readFile(path.resolve(inputPath), "utf8");
  const payload = JSON.parse(raw);
  const data = payload.data ?? {};

  for (const [, delegateName] of [...dataModels].reverse()) {
    await prisma[delegateName].deleteMany();
  }

  for (const [key, delegateName] of dataModels) {
    await createMany(delegateName, data[key] ?? []);
  }

  console.log("Import a PostgreSQL listo.");
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
