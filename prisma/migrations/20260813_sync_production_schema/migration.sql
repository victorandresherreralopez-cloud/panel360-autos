-- ============================================================
-- Migración Segura: Sync Supabase PostgreSQL con Prisma Schema
-- Generada: 2026-08-13
-- Aplicar con: npx tsx final_sync_supabase.ts
-- TODOS LOS COMANDOS SON IDEMPOTENTES (IF NOT EXISTS)
-- ============================================================

-- 1. customers: columnas nuevas
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;

-- 2. models: columnas nuevas
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "canonicalSegment" TEXT;
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "technicalSheetId" TEXT;

-- 3. prices: columnas nuevas
ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "hasIva" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "bonusName" TEXT;
ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "bonusAmount" INTEGER;
ALTER TABLE "prices" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;

-- 4. commercial_offers: tabla completa con schema exacto de Prisma
-- (Se elimina la versión incorrecta creada previamente y se recrea)
DROP TABLE IF EXISTS "commercial_offers" CASCADE;

CREATE TABLE "commercial_offers" (
    "id"               TEXT        NOT NULL,
    "offerType"        TEXT        NOT NULL,
    "brandId"          TEXT,
    "modelId"          TEXT,
    "versionId"        TEXT,
    "brandName"        TEXT,
    "modelName"        TEXT,
    "versionName"      TEXT,
    "title"            TEXT        NOT NULL DEFAULT '',
    "channel"          TEXT        NOT NULL DEFAULT 'REGULAR',
    "paymentType"      TEXT        NOT NULL DEFAULT 'AMBOS',
    "amountCash"       INTEGER,
    "amountCredit"     INTEGER,
    "amountTotal"      INTEGER,
    "aporteCES"        INTEGER,
    "aporteMarca"      INTEGER,
    "aporteCESCredit"  INTEGER,
    "aporteMarcaCredit" INTEGER,
    "hasIva"           BOOLEAN     NOT NULL DEFAULT false,
    "rate"             TEXT,
    "rateContext"      TEXT,
    "validFrom"        TIMESTAMP WITH TIME ZONE,
    "validUntil"       TIMESTAMP WITH TIME ZONE,
    "condition"        TEXT,
    "incompatibleWith" TEXT,
    "compatibleWith"   TEXT,
    "exception"        TEXT,
    "sourceDocumentId" TEXT,
    "sheetName"        TEXT,
    "sourceMonth"      TEXT,
    "status"           TEXT        NOT NULL DEFAULT 'VIGENTE',
    "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commercial_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "commercial_offers_versionId_offerType_status_idx" ON "commercial_offers"("versionId", "offerType", "status");
CREATE INDEX IF NOT EXISTS "commercial_offers_modelName_offerType_status_idx" ON "commercial_offers"("modelName", "offerType", "status");
CREATE INDEX IF NOT EXISTS "commercial_offers_status_validUntil_idx" ON "commercial_offers"("status", "validUntil");
