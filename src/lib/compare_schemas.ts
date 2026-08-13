import { prisma } from './prisma';
import { readFileSync } from 'fs';
import path from 'path';

async function run() {
  console.log('===============================================================');
  console.log(' AUDITORÍA DE DIFERENCIAS ENTRE PRISMA Y SUPABASE POSTGRESQL');
  console.log('===============================================================\n');

  // 1. Obtener todas las tablas en el schema public de Supabase
  const tablesRes: any[] = await (prisma as any).$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);
  const existingTables = new Set(tablesRes.map((r: any) => r.table_name));

  // 2. Obtener todas las columnas por tabla en Supabase
  const columnsRes: any[] = await (prisma as any).$queryRawUnsafe(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public';
  `);

  const dbSchema: Record<string, Record<string, { dataType: string; isNullable: string }>> = {};
  for (const row of columnsRes) {
    if (!dbSchema[row.table_name]) {
      dbSchema[row.table_name] = {};
    }
    dbSchema[row.table_name][row.column_name] = {
      dataType: row.data_type,
      isNullable: row.is_nullable
    };
  }

  // 3. Leer schema.prisma en .prisma-vercel/schema.prisma
  const schemaPrisma = readFileSync(path.join(process.cwd(), '.prisma-vercel', 'schema.prisma'), 'utf8');

  // Parsear modelos y campos de schema.prisma
  const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/g;
  let match;

  const missingStructures: Array<{
    Tabla: string;
    EstructuraFaltante: string;
    TipoEsperado: string;
    Destructivo: string;
    AccionSQL: string;
  }> = [];

  while ((match = modelRegex.exec(schemaPrisma)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];

    const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
    const tableName = mapMatch ? mapMatch[1] : modelName;

    if (!existingTables.has(tableName)) {
      missingStructures.push({
        Tabla: tableName,
        EstructuraFaltante: '(TABLA COMPLETA)',
        TipoEsperado: 'TABLE',
        Destructivo: 'NO',
        AccionSQL: `CREATE TABLE "${tableName}"`
      });
      continue;
    }

    const fieldLines = modelBody.split('\n');
    for (const line of fieldLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;

      const fieldName = parts[0];
      const fieldType = parts[1];

      // Verificar si es un campo escalar o una relación con id escalar
      const isScalarOrRelationId =
        ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'].some(t => fieldType.includes(t)) ||
        fieldType.includes('Enum') ||
        (trimmed.includes('@relation') && trimmed.includes('fields:'));

      if (isScalarOrRelationId) {
        const fieldMapMatch = trimmed.match(/@map\("([^"]+)"\)/);
        const columnName = fieldMapMatch ? fieldMapMatch[1] : fieldName;

        if (!dbSchema[tableName]?.[columnName]) {
          missingStructures.push({
            Tabla: tableName,
            EstructuraFaltante: columnName,
            TipoEsperado: fieldType,
            Destructivo: 'NO',
            AccionSQL: `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}"`
          });
        }
      }
    }
  }

  console.log(`TOTAL ESTRUCTURAS FALTANTES EN SUPABASE: ${missingStructures.length}\n`);
  console.table(missingStructures);
}

run().catch(console.error).finally(() => prisma.$disconnect());
