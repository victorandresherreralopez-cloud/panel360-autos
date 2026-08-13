import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Detect PostgreSQL database URL from Vercel / Supabase environment variables
const rawDbUrl =
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

const isPostgres = /^postgres(?:ql)?:\/\//i.test(rawDbUrl);
const dummyPostgresUrl = "postgresql://postgres:postgres@localhost:5432/postgres";
const effectiveDbUrl = isPostgres ? rawDbUrl : dummyPostgresUrl;

// Set DATABASE_URL environment variable for Prisma Client generation
process.env.DATABASE_URL = effectiveDbUrl;
if (directUrl) {
  process.env.DIRECT_URL = directUrl;
}

console.log(`[Vercel Build Script] Usando motor PostgreSQL para Prisma. URL activa: ${isPostgres ? "CONFIGURADA" : "FALLBACK_BUILD"}`);

const sourceSchemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const targetDir = path.join(process.cwd(), ".prisma-vercel");
const targetSchemaPath = path.join(targetDir, "schema.prisma");
const sourceSchema = readFileSync(sourceSchemaPath, "utf8");

if (!sourceSchema.includes('provider = "sqlite"')) {
  console.error("No pude preparar el schema de Prisma para Vercel: no encontré provider sqlite.");
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
const postgresSchema = sourceSchema.replace(
  /datasource db \{\s+provider = "sqlite"\s+url\s+= env\("DATABASE_URL"\)\s+\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")${directUrl ? '\n  directUrl = env("DIRECT_URL")' : ""}
}`
);

writeFileSync(targetSchemaPath, postgresSchema);

function run(command, args) {
  execFileSync(command, args, {
    shell: process.platform === "win32",
    stdio: "inherit"
  });
}

const schemaArg = process.platform === "win32" && targetSchemaPath.includes(" ")
  ? `--schema="${targetSchemaPath}"`
  : `--schema=${targetSchemaPath}`;

// 1. Generar cliente de Prisma para PostgreSQL (SIN ejecutar db push para proteger Supabase)
console.log("[Vercel Build Script] Generando cliente de Prisma PostgreSQL...");
run("npx", ["prisma", "generate", schemaArg]);

// 2. Compilar aplicación Next.js
console.log("[Vercel Build Script] Compilando Next.js...");
run("npx", ["next", "build"]);
