import dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";

for (const ep of [".env.local", ".env"]) {
  if (existsSync(ep)) {
    const content = readFileSync(ep, "utf8");
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#") && t.includes("=")) {
        const idx = t.indexOf("=");
        const k = t.substring(0, idx).trim();
        let v = t.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const dbUrl = process.env.SUPABASE_DIRECT_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.DATABASE_URL = dbUrl;
console.log("DB URL prefix:", dbUrl ? dbUrl.substring(0, 35) + "..." : "NOT FOUND");

import { prisma } from "./src/lib/prisma.ts";

async function main() {
  console.log("--- Test 1: vehicleModel.count() ---");
  const count = await prisma.vehicleModel.count();
  console.log("Modelos:", count);

  console.log("--- Test 2: vehicleModel con canonicalSegment ---");
  const m = await prisma.vehicleModel.findFirst({
    select: { id: true, name: true, canonicalSegment: true, technicalSheetId: true }
  });
  console.log(JSON.stringify(m));

  console.log("--- Test 3: customer con emailVerifiedAt ---");
  const c = await prisma.customer.findFirst({
    select: { id: true, email: true, emailVerifiedAt: true }
  });
  console.log(JSON.stringify(c));

  console.log("--- Test 4: commercialOffer.count() ---");
  const oc = await prisma.commercialOffer.count();
  console.log("CommercialOffers:", oc);

  console.log("=== TODAS LAS CONSULTAS PRISMA OK ===");
}

main()
  .catch(e => { console.error("ERROR Prisma:", e.code, e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
