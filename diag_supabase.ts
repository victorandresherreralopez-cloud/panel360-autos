import { PrismaClient } from "@prisma/client";

const SUPABASE_URL = "postgresql://postgres.vesobzvcorxxxvdxdzqk:Vitoko.2022@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: SUPABASE_URL } }
});

async function main() {
  console.log("=== DIAGNÓSTICO DIRECTO SUPABASE POSTGRESQL ===\n");

  // 1. Verificar columnas que deben existir
  console.log("1. Verificando columnas en information_schema...");
  const cols: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('canonicalSegment','emailVerifiedAt','technicalSheetId')
    ORDER BY table_name, column_name;
  `);
  console.table(cols);

  // 2. Verificar tabla commercial_offers
  console.log("\n2. Verificando tabla commercial_offers...");
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'commercial_offers';
  `);
  console.log(tables.length > 0 ? "✅ Tabla commercial_offers EXISTE" : "❌ Tabla commercial_offers NO EXISTE");

  // 3. Test consulta vehicleModel con canonicalSegment
  console.log("\n3. Test vehicleModel.findFirst() con canonicalSegment...");
  const m = await prisma.vehicleModel.findFirst({
    select: { id: true, name: true, canonicalSegment: true }
  });
  console.log("Resultado:", JSON.stringify(m));

  // 4. Test customer con emailVerifiedAt
  console.log("\n4. Test customer.findFirst() con emailVerifiedAt...");
  const c = await prisma.customer.findFirst({
    select: { id: true, email: true, emailVerifiedAt: true }
  });
  console.log("Resultado:", JSON.stringify(c));

  // 5. Test commercialOffer.count()
  console.log("\n5. Test commercialOffer.count()...");
  const oc = await prisma.commercialOffer.count();
  console.log("CommercialOffers:", oc);

  // 6. Revisar todas las columnas de models
  console.log("\n6. Columnas de la tabla models en Supabase:");
  const modelCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'models'
    ORDER BY ordinal_position;
  `);
  console.table(modelCols);

  console.log("\n=== FIN DIAGNÓSTICO ===");
}

main()
  .catch(e => { console.error("❌ ERROR:", e.code || "", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
