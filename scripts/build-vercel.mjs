import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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
  console.error("Vercel necesita DATABASE_URL con PostgreSQL. Ejemplo: postgresql://usuario:clave@host:5432/base");
  console.error("La version local puede seguir usando SQLite con npm run build.");
  process.exit(1);
}

const sourceSchemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const targetDir = path.join(process.cwd(), ".prisma-vercel");
const targetSchemaPath = path.join(targetDir, "schema.prisma");
const sourceSchema = readFileSync(sourceSchemaPath, "utf8");

if (!sourceSchema.includes('provider = "sqlite"')) {
  console.error("No pude preparar el schema de Prisma para Vercel: no encontre provider sqlite.");
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

if (directUrl && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = directUrl;
}

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

if (process.env.VERCEL_SKIP_DB_PUSH !== "1") {
  run("npx", ["prisma", "db", "push", schemaArg, "--skip-generate"]);
}

try {
  run("npx", ["prisma", "generate", schemaArg]);
} catch (e) {
  console.log("Prisma generate se saltó en entorno local con servidor activo.");
}
run("npx", ["next", "build"]);
