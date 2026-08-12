# Despliegue en Vercel con Supabase

Esta app funciona localmente con SQLite, pero en Vercel debe usar una base PostgreSQL persistente. La opcion recomendada es Supabase, igual que Panel360.

## Estado actual

- Proyecto Vercel creado: `sistema-comercial-automotriz`
- Project ID: `prj_pr7IbiFkqZX4QyafuPJRGoIEr3g3`
- Team/Org ID: `team_5cunxTBnXO1WZclQMfxFXJwI`
- Build command configurado en `vercel.json`: `npm run build:vercel`
- Export local generado: `backups/vercel/export-2026-08-12T17-05-22-541Z.json`
- Pendiente principal: configurar `DATABASE_URL` y `DIRECT_URL` de Supabase en Vercel.

## Variables necesarias en Vercel

Configurar en Production y Preview:

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
APP_TIMEZONE="America/Santiago"
AUTH_SECRET="usa-un-secreto-largo-de-32-caracteres-o-mas"
INITIAL_ADMIN_NAME="Victor Herrera"
INITIAL_ADMIN_EMAIL="victorherrera@sergioescobar.cl"
INITIAL_ADMIN_PASSWORD=""
RESEND_API_KEY=""
RESEND_FROM=""
BLOB_READ_WRITE_TOKEN=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
NEXT_PUBLIC_APP_URL="https://tu-dominio.vercel.app"
CUSTOMER_RUT_LOOKUP_URL=""
CUSTOMER_RUT_LOOKUP_TOKEN=""
```

`DATABASE_URL` debe ser la conexion pooler/transaccional de Supabase para runtime.

`DIRECT_URL` debe ser la conexion directa de Supabase para `prisma db push`.

`AUTH_SECRET` es obligatorio en produccion. Debe tener minimo 32 caracteres y no compartirse.

`INITIAL_ADMIN_PASSWORD` se usa para crear el primer usuario si la base esta vacia. Despues se debe cambiar desde recuperacion de clave o admin.

`RESEND_API_KEY` y `RESEND_FROM` habilitan recuperacion de clave por correo.

`BLOB_READ_WRITE_TOKEN` permite guardar documentos y fichas tecnicas en Vercel Blob.

`CUSTOMER_RUT_LOOKUP_URL` y `CUSTOMER_RUT_LOOKUP_TOKEN` son opcionales. Permiten conectar una API autorizada para completar datos de cliente por RUT cuando el cliente lo autoriza.

## Build en Vercel

Vercel ejecuta:

```bash
npm run build:vercel
```

Ese script:

1. Toma el schema local SQLite.
2. Genera un schema temporal PostgreSQL en `.prisma-vercel/schema.prisma`.
3. Aplica tablas en Supabase con `prisma db push`.
4. Genera Prisma Client.
5. Compila Next.js.

## Migrar datos locales a Supabase

Exportar datos desde SQLite local:

```bash
npm run data:export:vercel
```

Importar datos a Supabase:

```powershell
$env:DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
$env:DIRECT_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
npm run data:import:vercel -- backups/vercel/export-2026-08-12T17-05-22-541Z.json
```

Despues del import, desplegar:

```bash
vercel --prod
```

O usar el conector Vercel desde Codex una vez que las variables esten configuradas.

## Notas de seguridad

- No subir `.env` al repositorio.
- No pegar credenciales en chats compartidos.
- Usar un usuario demo para gerencia.
- Cambiar la clave inicial despues del primer despliegue.
- Si se conecta Amicar, mantenerlo como enlace externo o integracion segura; no guardar claves personales en codigo.
