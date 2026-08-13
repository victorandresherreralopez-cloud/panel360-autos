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

const targetEmail = process.argv[2] || "victorherrera@sergioescobar.cl";
const newPassword = process.argv[3] || "Vitoko.2022";

async function main() {
  const hashedPassword = await hashPassword(newPassword);

  // 1. Supabase PostgreSQL
  console.log("\nActualizando en Supabase PostgreSQL (Producción)...");
  const directUrl = "postgresql://postgres.vesobzvcorxxxvdxdzqk:Vitoko.2022@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } }
  });

  try {
    const user = await prisma.appUser.upsert({
      where: { email: targetEmail },
      update: {
        passwordHash: hashedPassword,
        status: "ACTIVO",
        role: "ADMIN"
      },
      create: {
        name: "Victor Herrera",
        email: targetEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
        status: "ACTIVO"
      }
    });
    console.log(`✅ Supabase: Usuario ${user.email} listo con nueva contraseña.`);
  } catch (err) {
    console.error("❌ Error en Supabase:", err.message);
  } finally {
    await prisma.$disconnect();
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
    console.log(`✅ SQLite Local: Usuario ${targetEmail} listo con nueva contraseña.`);
  } catch (err) {
    console.error("❌ Error en SQLite Local:", err.message);
  }

  console.log("\n========================================================");
  console.log(` CREDENCIALES CONFIGURADAS (PRODUCCIÓN & LOCAL):`);
  console.log(` Email:      ${targetEmail}`);
  console.log(` Contraseña: ${newPassword}`);
  console.log("========================================================\n");
}

main();
