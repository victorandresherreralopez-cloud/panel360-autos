-- Safe Additive Migration: Sync Production Supabase PostgreSQL Schema
-- Generated on: 2026-08-13
-- Target: Supabase PostgreSQL (Production)

-- 1. Add emailVerifiedAt column to customers table (NULLABLE)
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE;

-- 2. Add canonicalSegment column to models table (NULLABLE)
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "canonicalSegment" TEXT;

-- 3. Add technicalSheetId column to models table (NULLABLE)
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "technicalSheetId" TEXT;

-- 4. Create commercial_offers table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "commercial_offers" (
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
);

-- Indices for commercial_offers
CREATE INDEX IF NOT EXISTS "commercial_offers_brandName_modelName_idx" ON "commercial_offers"("brandName", "modelName");
CREATE INDEX IF NOT EXISTS "commercial_offers_offerType_status_idx" ON "commercial_offers"("offerType", "status");
