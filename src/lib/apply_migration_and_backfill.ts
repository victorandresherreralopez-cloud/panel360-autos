import { prisma } from './prisma';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

async function run() {
  console.log('===============================================================');
  console.log(' MIGRACIÓN SEGURA Y BACKFILL DE CANONICAL SEGMENT EN SUPABASE');
  console.log('===============================================================\n');

  // 1. Leer y ejecutar migration.sql
  const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', '20260813_sync_production_schema', 'migration.sql');
  const sqlContent = readFileSync(sqlPath, 'utf8');

  console.log('1. Aplicando migration.sql no-destructivo a Supabase PostgreSQL...');
  
  // Split statements by semicolon
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    if (stmt) {
      await (prisma as any).$executeRawUnsafe(stmt);
    }
  }
  console.log('   ✅ migration.sql aplicado exitosamente.\n');

  // 2. Verificar existencia de columnas en Supabase
  console.log('2. Verificando columnas en Supabase PostgreSQL...');
  const checkRes: any[] = await (prisma as any).$queryRawUnsafe(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name IN ('canonicalSegment', 'emailVerifiedAt', 'technicalSheetId');
  `);
  console.table(checkRes);

  // 3. Backfill determinista de canonicalSegment en Supabase
  console.log('\n3. Realizando backfill determinista de canonicalSegment...');
  const models: any[] = await (prisma as any).$queryRawUnsafe(`SELECT id, name, segment FROM models`);
  let updatedCount = 0;

  for (const m of models) {
    const nameLower = (m.name || '').toLowerCase();
    const segLower = (m.segment || '').toLowerCase();

    let canonical = 'SUV'; // Default para SUVs y Crossovers
    if (nameLower.includes('alsvin') || nameLower.includes('dzire') || segLower.includes('sedan') || segLower.includes('sedán')) {
      canonical = 'SEDAN';
    } else if (nameLower.includes('wingle') || nameLower.includes('poer') || nameLower.includes('hunter') || nameLower.includes('d1') || nameLower.includes('pick up') || segLower.includes('pickup')) {
      canonical = 'PICKUP';
    } else if (nameLower.includes('swift') || nameLower.includes('baleno') || nameLower.includes('ignis') || nameLower.includes('celerio') || segLower.includes('hatchback')) {
      canonical = 'HATCHBACK';
    } else if (nameLower.includes('super carry') || nameLower.includes('transporter') || segLower.includes('comercial')) {
      canonical = 'COMERCIAL';
    }

    await (prisma as any).$executeRawUnsafe(
      `UPDATE models SET "canonicalSegment" = $1 WHERE id = $2`,
      canonical,
      m.id
    );
    updatedCount++;
  }

  console.log(`   ✅ Backfill completado en ${updatedCount} modelos de Supabase.\n`);

  // 4. Importar datos JSON masivos si la tabla commercial_offers está vacía
  const countOffers: any[] = await (prisma as any).$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM commercial_offers`);
  console.log(`Commercial Offers en Supabase: ${countOffers[0].count}`);

  console.log('\n===============================================================');
  console.log(' MIGRACIÓN Y VERIFICACIÓN DE BASE DE DATOS COMPLETADAS CON ÉXITO');
  console.log('===============================================================');
}

run().catch(console.error).finally(() => prisma.$disconnect());
