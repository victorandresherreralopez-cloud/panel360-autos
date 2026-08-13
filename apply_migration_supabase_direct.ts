import { PrismaClient } from "@prisma/client";

const SUPABASE_URL = "postgresql://postgres.vesobzvcorxxxvdxdzqk:Vitoko.2022@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: SUPABASE_URL } }
});

// Cada sentencia individualmente para evitar problemas de parsing
const SQL_STATEMENTS = [
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "canonicalSegment" TEXT`,
  `ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "technicalSheetId" TEXT`,
  `CREATE TABLE IF NOT EXISTS "commercial_offers" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "versionName" TEXT,
    "sheetName" TEXT,
    "offerType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'REGULAR',
    "paymentType" TEXT NOT NULL DEFAULT 'INDIFERENTE',
    "amountCash" DOUBLE PRECISION,
    "amountCredit" DOUBLE PRECISION,
    "amountTotal" DOUBLE PRECISION,
    "aporteCES" DOUBLE PRECISION,
    "aporteMarca" DOUBLE PRECISION,
    "aporteCESCredit" DOUBLE PRECISION,
    "aporteMarcaCredit" DOUBLE PRECISION,
    "rate" TEXT,
    "giftcard" TEXT,
    "freeLicensePlate" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceIncluded" TEXT,
    "incompatibleWith" TEXT,
    "compatibleWith" TEXT,
    "condition" TEXT,
    "title" TEXT,
    "detail" TEXT,
    "validFrom" TIMESTAMP WITH TIME ZONE,
    "validTo" TIMESTAMP WITH TIME ZONE,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_offers_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "commercial_offers_brandName_modelName_idx" ON "commercial_offers"("brandName", "modelName")`,
  `CREATE INDEX IF NOT EXISTS "commercial_offers_offerType_status_idx" ON "commercial_offers"("offerType", "status")`,
];

async function main() {
  console.log("=== MIGRACIÓN DIRECTA A SUPABASE POSTGRESQL ===\n");

  // Ejecutar cada sentencia individualmente
  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const stmt = SQL_STATEMENTS[i];
    const preview = stmt.replace(/\n\s+/g, " ").substring(0, 90);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] ${preview}...`);
    } catch (e: any) {
      console.error(`❌ [${i + 1}/${SQL_STATEMENTS.length}] ERROR ${e.code}: ${e.message.substring(0, 120)}`);
      console.error(`   SQL: ${preview}...`);
    }
  }

  // Verificar columnas
  console.log("\n--- VERIFICACIÓN POST-MIGRACIÓN ---");
  const cols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('canonicalSegment','emailVerifiedAt','technicalSheetId')
    ORDER BY table_name, column_name
  `);
  console.table(cols);

  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commercial_offers'
  `);
  console.log(tables.length > 0 ? "✅ commercial_offers EXISTE" : "❌ commercial_offers NO EXISTE");

  if (cols.length === 0) {
    throw new Error("Las columnas NO se crearon en Supabase. Abortar backfill.");
  }

  // Backfill canonicalSegment
  console.log("\n--- BACKFILL canonicalSegment ---");
  const models: any[] = await prisma.$queryRawUnsafe(`SELECT id, name, segment FROM models`);
  let updated = 0;

  for (const m of models) {
    const n = (m.name || "").toLowerCase();
    const s = (m.segment || "").toLowerCase();
    let canonical = "SUV";
    if (n.includes("alsvin") || n.includes("dzire") || s.includes("sedan") || s.includes("sedán")) canonical = "SEDAN";
    else if (n.includes("wingle") || n.includes("poer") || n.includes("hunter") || n.includes("d1") || n.includes("pick up") || s.includes("pickup")) canonical = "PICKUP";
    else if (n.includes("swift") || n.includes("baleno") || n.includes("ignis") || n.includes("celerio") || s.includes("hatchback")) canonical = "HATCHBACK";
    else if (n.includes("super carry") || n.includes("transporter") || s.includes("comercial")) canonical = "COMERCIAL";

    await prisma.$executeRawUnsafe(`UPDATE models SET "canonicalSegment" = $1 WHERE id = $2`, canonical, m.id);
    updated++;
  }
  console.log(`✅ Backfill: ${updated} modelos actualizados`);

  // Test final con Prisma Client (usa el esquema compilado)
  console.log("\n--- TEST FINAL PRISMA CLIENT ---");
  const testModel = await prisma.vehicleModel.findFirst({
    select: { id: true, name: true, canonicalSegment: true }
  });
  console.log("✅ vehicleModel:", JSON.stringify(testModel));

  const testCustomer = await prisma.customer.findFirst({
    select: { id: true, email: true, emailVerifiedAt: true }
  });
  console.log("✅ customer:", JSON.stringify(testCustomer));

  const offerCount = await prisma.commercialOffer.count();
  console.log("✅ commercialOffer.count():", offerCount);

  console.log("\n=== MIGRACIÓN EXITOSA — SUPABASE SINCRONIZADO ===");
}

main()
  .catch(e => { console.error("\n❌ FATAL:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
