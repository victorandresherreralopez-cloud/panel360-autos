import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

const targetEmail = process.argv[2] || process.env.RESET_PASSWORD_EMAIL || "victorherrera@sergioescobar.cl";
const newPassword = process.argv[3] || process.env.RESET_PASSWORD_VALUE;
const productionDatabaseUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DIRECT_URL ||
  process.env.SUPABASE_DATABASE_URL;

async function main() {
  if (!newPassword) {
    console.error("Uso: node scripts/reset-password.mjs correo@dominio.cl nueva-clave");
    console.error("Tambien puedes usar RESET_PASSWORD_VALUE y DIRECT_URL/DATABASE_URL por variables de entorno.");
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await hashPassword(newPassword);

  // 1. Supabase PostgreSQL
  console.log("\nActualizando en PostgreSQL de produccion...");
  const prisma = productionDatabaseUrl
    ? new PrismaClient({ datasources: { db: { url: productionDatabaseUrl } } })
    : null;

  if (!prisma) {
    console.log("PostgreSQL omitido: falta DIRECT_URL o DATABASE_URL en el entorno.");
  } else {
    try {
      const user = await prisma.appUser.upsert({
        where: { email: targetEmail },
        update: {
          passwordHash: hashedPassword,
          status: "ACTIVO",
          role: "ADMIN"
        },
        create: {
          name: targetEmail.startsWith("demo") ? "Usuario Demo" : "Victor Herrera",
          email: targetEmail,
          passwordHash: hashedPassword,
          role: "ADMIN",
          status: "ACTIVO"
        }
      });
      console.log(`PostgreSQL: usuario ${user.email} listo con nueva contraseña.`);
    } catch (err) {
      console.error("Error en PostgreSQL:", err.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  // 2. Local SQLite
  console.log("\nActualizando en SQLite Local...");
  try {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const db = new DatabaseSync(dbPath);
    
    // Check if user exists
    const stmtCheck = db.prepare("SELECT id FROM app_users WHERE email = ?");
    const existing = stmtCheck.get(targetEmail);

    if (existing) {
      const stmtUpdate = db.prepare("UPDATE app_users SET passwordHash = ?, status = 'ACTIVO' WHERE email = ?");
      stmtUpdate.run(hashedPassword, targetEmail);
    } else {
      const stmtInsert = db.prepare("INSERT INTO app_users (id, name, email, passwordHash, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
      stmtInsert.run(`user_${Date.now()}`, targetEmail.startsWith("demo") ? "Usuario Demo" : "Victor Herrera", targetEmail, hashedPassword);
    }
    console.log(`SQLite Local: usuario ${targetEmail} listo con nueva contraseña.`);
  } catch (err) {
    console.error("Error en SQLite Local:", err.message);
  }

  console.log("\n========================================================");
  console.log(" CLAVE ACTUALIZADA");
  console.log(` Email: ${targetEmail}`);
  console.log("========================================================\n");
}

main();
