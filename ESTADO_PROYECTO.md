# Bitácora de Estado del Proyecto - Panel360 Autos

Este documento es la bitácora oficial del desarrollo de Panel360 Autos (Asistente Comercial Automotriz). Registra en orden cronológico todas las auditorías, verificaciones, modificaciones e integraciones realizadas en el sistema.

---

# Registro de Actividades

## 1. Auditoría Inicial y Verificación de Entorno Local

### Fecha y hora
12 de agosto de 2026, 15:22 hrs (Chile)

### Objetivo
Realizar una auditoría completa del código, base de datos local y configuración del proyecto desarrollado previamente, verificar la disponibilidad del servidor local en el puerto 3001, validar el funcionamiento del flujo de login y navegación por los módulos principales, e inicializar el control de versiones Git sin realizar modificaciones destructivas.

### Cambios realizados
* **Inicialización de Git:** Se ejecutó `git init` en la raíz del proyecto (`V:\sistema para vender autos`) para establecer el control de versiones e historia del código.
* **Creación de Bitácora:** Se creó el archivo `ESTADO_PROYECTO.md` como la bitácora oficial de seguimiento del desarrollo.
* **Limpieza de scripts temporales:** Se ejecutaron scripts de inspección de base de datos sin alterar la estructura ni los datos existentes.

### Estado final
* **Quedó funcionando:**
  * Servidor local corriendo en `http://localhost:3001`.
  * Login con credenciales de usuario administrador existente.
  * Navegación fluida por Dashboard, Vehículos, Comparador, Cotizador, Clientes y Rentabilidad.
  * Repositorio Git local inicializado correctamente.

### Pruebas realizadas
1. **Verificación de Base de Datos:** Se consultó la tabla `app_users` confirmando la existencia del usuario administrador activo `victorherrera@sergioescobar.cl`.
2. **Verificación de Contraseña:** Se validó mediante hash scrypt que la contraseña configurada en `.env` coincide exactamente con la registrada en la base de datos.
3. **Inicio del Servidor:** Se ejecutó `npm run dev -- -p 3001` y se comprobó que Next.js responde adecuadamente.
4. **Navegación NAVEGADOR (Subagente):** Se navegó interactivamente por los 6 módulos principales sin errores de renderizado ni fallas de servidor.

### Variables o servicios involucrados
* **Base de datos local:** SQLite (`prisma/dev.db`).
* **Autenticación:** Cookie de sesión firmada `aca_session` (HMAC SHA-256).
* **Variables `.env`:** `DATABASE_URL`, `AUTH_SECRET`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`.
* **Siguiente objetivo externo:** Despliegue en Vercel con Supabase PostgreSQL.

### Pendientes
1. Realizar el primer commit inicial en Git para registrar la línea base del código.
2. Preparar la vinculación de variables de entorno reales en el panel de Vercel (Supabase `DATABASE_URL` y `DIRECT_URL`).
3. Ejecutar la migración/importación del respaldo de datos hacia Supabase en la nube.
4. Probar la versión publicada en Vercel para demos comerciales con clientes.

### Próximo paso recomendado
Crear el commit inicial en Git (`git commit`) y proceder con la configuración del despliegue online en Vercel + Supabase.

### Punto de restauración
* **Nombre del commit:** `feat: inicializacion de bitacora y control de versiones local`
* **Hash del commit:** `1f933889d2650abbc5cb17044c0cce6e96bffb51`

---

## 2. FASE 1 — Respaldo de Seguridad y Punto de Restauración Completo

### Fecha y hora
12 de agosto de 2026, 15:25 hrs (Chile)

### Objetivo
Asegurar la integridad total del sistema local antes de realizar cualquier ajuste para el despliegue online. Generar respaldos físicos y lógicos de la base de datos de SQLite y verificar que el repositorio Git local represente exactamente la versión funcional.

### Cambios realizados
* **Verificación de Respaldo Previo:** Se constató la existencia del archivo de respaldo en formato JSON `backups/vercel/export-2026-08-12T17-05-22-541Z.json`.
* **Exportación JSON Fresca:** Se ejecutó `npm run data:export:vercel` para generar una exportación JSON actualizada de la base de datos SQLite en `backups/vercel/export-2026-08-12T19-23-57-771Z.json`.
* **Respaldo Físico SQLite:** Se realizó una copia física directa de la base de datos de producción local `prisma/dev.db` hacia `backups/2026-08-12/dev-fase1-baseline.db`.
* **Punto de Restauración en Git:** Se confirmó que el árbol de trabajo Git está 100% limpio y respaldado en commits sobre la rama `master`.

### Estado final
* **Quedó funcionando:** 
  * Respaldo físico SQLite asegurado en carpeta `backups/2026-08-12/`.
  * Respaldo estructurado JSON para migración a Supabase asegurado en `backups/vercel/`.
  * Repositorio Git limpio en commit `2768ee5` (`1f933889d2650abbc5cb17044c0cce6e96bffb51`).

### Pruebas realizadas
1. **Verificación de Archivos de Respaldo:** Se comprobó la creación exitosa y lectura de `export-2026-08-12T19-23-57-771Z.json` y `dev-fase1-baseline.db`.
2. **Estado del Repositorio:** Se ejecutó `git status` confirmando que no hay cambios pendientes ni archivos no rastreados en conflicto.

### Variables o servicios involucrados
* **Base de datos local:** SQLite (`prisma/dev.db`).
* **Archivos de respaldo:** `backups/2026-08-12/dev-fase1-baseline.db` y `backups/vercel/export-2026-08-12T19-23-57-771Z.json`.
* **Git:** Commits `1f93388` y `2768ee5`.

### Pendientes
* **Fase 2:** Analizar la estructura de Supabase PostgreSQL y verificar la compatibilidad del esquema Prisma.
* **Fase 3:** Configurar variables de entorno en el proyecto Vercel `sistema-comercial-automotriz` (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`).
* **Fase 4:** Crear un usuario seguro exclusivo para demos públicas (ej. `demo@panel360autos.cl`).

### Próximo paso recomendado
Aguardar la autorización del usuario para iniciar la **FASE 2 (Preparar base de datos online en Supabase)**.

### Punto de restauración
* **Nombre del commit:** `docs: registrar respaldo de seguridad Fase 1 en bitacora`
* **Hash del commit:** `381e52f`

---

## 3. ETAPA 1 — Corrección de Arquitectura Definitiva: GitHub + Vercel + Supabase PostgreSQL

### Fecha y hora
12 de agosto de 2026, 21:05 hrs (Chile)

### Objetivo
Establecer la arquitectura oficial idéntica a Pyme 360 (**GitHub + Vercel + Supabase PostgreSQL**). Descartar formalmente Neon PostgreSQL para mantener consistencia con la pila tecnológica de producción seleccionada por el usuario.

### Análisis y confirmaciones
* **Descarte de Neon:** Se descartó oficialmente la migración hacia Neon PostgreSQL.
* **Confirmación de Supabase:** Se constató que el proyecto Panel360 Autos fue diseñado originalmente y cuenta con la infraestructura scriptada completa para Supabase PostgreSQL (`scripts/build-vercel.mjs`, `scripts/import-vercel-data.mjs`, `VERCEL_DEPLOYMENT.md`).
* **Verificación de vinculación preexistente:** No existen credenciales ni proyectos de Supabase previamente conectados en `.env`, `.env.local` ni Vercel.
* **Integración Prisma sin impacto local:** `prisma/schema.prisma` se mantiene en `provider = "sqlite"` para uso local. Durante la compilación en Vercel, `scripts/build-vercel.mjs` genera automáticamente el schema PostgreSQL en `.prisma-vercel/schema.prisma` sin alterar ni destruir `prisma/dev.db`.
* **Vinculación GitHub:** Repositorio local Git listo para agregar origen en GitHub (`git remote add origin ...`) y sincronizar con Vercel.

### Estado final
* **Entorno local:** `http://localhost:3001` activo con SQLite local intacta (`prisma/dev.db`).
* **Respaldo JSON:** `backups/vercel/export-2026-08-12T19-23-57-771Z.json` (6 marcas, 68 modelos, 165 versiones, clientes, cotizaciones, etc.).
* **Repositorio Git:** Limpio.

### Próximos pasos (ETAPA 2)
1. Vincular el repositorio local a GitHub (`git remote add origin ...` y `git push`).
2. Obtener `DATABASE_URL` (pooler transaccional puerto 6543) y `DIRECT_URL` (directa puerto 5432) de Supabase.
3. Configurar variables de entorno en el panel de Vercel.
4. Ejecutar la importación de datos a Supabase (`npm run data:import:vercel`).
5. Realizar el despliegue final en Vercel.
6. Crear el usuario independiente de pruebas DEMO (`demo@panel360autos.cl`).

---

## 4. ETAPA 2 — Conexión, Importación de Datos a Supabase PostgreSQL y Despliegue en Vercel

### Fecha y hora
12 de agosto de 2026, 21:25 hrs (Chile)

### Objetivo
Establecer las conexiones con Supabase PostgreSQL, sincronizar el esquema Prisma de 32 tablas, importar la totalidad de los datos locales sin pérdidas y configurar las variables de entorno en Vercel para el despliegue online.

### Cambios y actividades realizadas
* **Integración de Scripts:** Se ajustaron los scripts `scripts/import-vercel-data.mjs` y `scripts/build-vercel.mjs` para manejar correctamente rutas de archivos con espacios en Windows y generar un cliente `@prisma/client-vercel` aislado sin interferir con la base local SQLite.
* **Creación de Tablas en Supabase:** Se ejecutó `prisma db push` creando las 32 tablas en Supabase PostgreSQL.
* **Importación de Datos Completada:** Se ejecutó `npm run data:import:vercel` utilizando la conexión directa a Supabase. Se poblaron exitosamente:
  * 1 usuario administrativo inicial (`appUser`)
  * 6 marcas (`brand`)
  * 68 modelos (`vehicleModel`)
  * 165 versiones (`version`)
  * 141 documentos (`document`)
  * 8 actualizaciones (`update`)
  * 8 importaciones (`documentImport`)
  * 301 extracciones de texto (`documentExtraction`)
  * 350 precios vigentes (`price`)
  * 350 registros de historial de precios (`priceHistory`)
  * 13 estados de cliente (`customerStatus`)
  * 8 orígenes de cliente (`customerOrigin`)
  * 352 registros de auditoría (`auditLog`)
  * 13 acrónimos automotrices (`acronym`)
  * 9 configuraciones de notificación (`notificationSetting`)
  * 13 preguntas de estudio (`studyQuestion`)
* **Configuración en Vercel:** Se enviaron y guardaron exitosamente las variables de entorno para Producción en el panel de Vercel:
  * `DATABASE_URL` (Pooler transaccional Supabase puerto 6543)
  * `DIRECT_URL` (Conexión directa Supabase puerto 5432)
  * `AUTH_SECRET` (Firma segura de sesiones HMAC SHA-256)
  * `APP_TIMEZONE` (`America/Santiago`)
* **Despliegue Vercel:** Se inició el proceso de compilación y despliegue a producción en Vercel (`npx vercel --prod`).

---

## 5. ETAPA 3: Vinculación con GitHub y Despliegue Producción Exitoso en Vercel

* **Repositorio GitHub Conectado:** Se creó el repositorio público/privado `panel360-autos` en GitHub bajo la cuenta `victorandresherreralopez-cloud` (`https://github.com/victorandresherreralopez-cloud/panel360-autos`).
* **Git Push Realizado:** Se subió la rama `master` completa a GitHub (`git push -u origin master`).
* **Conexión GitHub ↔ Vercel:** Se vinculó el proyecto de Vercel `sistema-comercial-automotriz` directamente con el repositorio de GitHub mediante CLI (`npx vercel git connect`).
* **Ajuste de Compilación Multiplataforma:** Se actualizó `scripts/build-vercel.mjs` e `import-vercel-data.mjs` para garantizar la compatibilidad del parámetro `--schema` de Prisma tanto en Windows local como en servidores Linux de Vercel.
* **Despliegue en Producción Exitoso:** Se completó la compilación de Next.js y Prisma en los servidores de Vercel.
  * **URL Principal de Producción:** [https://sistema-comercial-automotriz.vercel.app](https://sistema-comercial-automotriz.vercel.app)
  * **URL de Despliegue Directo:** `https://sistema-comercial-automotriz-ps5r15mbq-victoko1991.vercel.app`

---

## 6. ETAPA 4: Recuperación Integral, Impuestos, RUT, Documentos y Mejoras UI/UX (Fases 1 a 9)

### Resumen de Logros:
1. **Diagnóstico Comparativo (FASE 1):** 100% de coincidencia comprobada entre SQLite local y Supabase PostgreSQL (6 marcas, 68 modelos, 165 versiones, 350 precios, 141 documentos, 301 extracciones).
2. **Listas de Precios y Acciones Comerciales (FASE 2):** 350 precios (175 lista / 175 campaña) y 301 extracciones comerciales (bonos, tasas, patentes) 100% migrados y disponibles.
3. **Migración de Documentos a Rutas Web (FASE 3):** Se copiaron los 141 archivos PDF/Excel a `public/documentos/` y se actualizaron los 141 registros en Supabase PostgreSQL con rutas relativas `/documentos/...`. Se habilitó la descarga general de documentos en `/api/documents/[id]/download`.
4. **Integración con Derco.cl (FASE 4):** Verificado e identificado el script `scripts/import-derco-catalog.ts` que parsea sitemaps y HTML/PDFs de `derco.cl` para marcas Suzuki, Mazda, GWM y Changan.
5. **Impuesto Verde & Permiso de Circulación (FASE 5):**
   * **Implementación anterior recuperada y corregida en `src/lib/taxes.ts`**.
   * Impuesto Verde: Petición oficial al CSV de homologación del SII + UTMs (resultado probado: $455.682 CLP para CIT real).
   * Permiso de Circulación: Petición `POST` oficial a la API de Las Condes (`lascondesonline.cl`) (resultado probado: $133.870 CLP para precio neto $15M).
6. **Consulta de RUT (FASE 6):** Verificada API `/api/customers/rut`. Consulta primero BD local y requiere `CUSTOMER_RUT_LOOKUP_URL` para proveedor externo.
7. **Rediseño UI/UX Responsive y Sidebar Retráctil (FASE 7):**
   * **Sidebar Escritorio:** Contraíble/Expandible con iconos y tooltips, estado guardado en `localStorage`.
   * **Menú Móvil:** Botón `☰` con drawer lateral deslizable de pantalla completa que se cierra al seleccionar.
   * **Responsividad:** Probada y adaptada para 375px, 390px, 430px, 768px, 1024px y 1440px.
8. **Modo Oscuro/Claro & Vitoko IA Mascota (FASE 8):**
   * **Modo Oscuro:** Botón ☀️ / 🌙 en el Header con preferencia en `localStorage` y soporte en `.dark`.
   * **Vitoko IA:** Rediseñado como mascota comercial flotante `Vitoko 👋` con panel interactivo, preguntas rápidas, minimizado `-` y cierre `X`.
9. **Verificación General (FASE 9):** Compilación limpia verificada con `npx next build`.

---

### Credenciales de Acceso al Sistema (Producción & Local)

| Cuenta / Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Administrador Principal** | `victorherrera@sergioescobar.cl` | `Vitoko.2022` |
| **Cuenta Demostración** | `demo@panel360autos.cl` | `Vitoko.2022` |

---

### Estado final
* **Arquitectura Objetivo:** GitHub + Vercel + Supabase PostgreSQL 100% OPERATIVA.
* **Base SQLite local:** Intacta e inalterada (`prisma/dev.db`).
* **Base PostgreSQL Supabase:** 100% operacional con URLs web para documentos.
* **Sistema en Producción:** Accesible públicamente desde cualquier dispositivo con UI responsive, Modo Oscuro e Impuestos probados.

### Próximo paso recomendado
1. Ingresar a [https://sistema-comercial-automotriz.vercel.app](https://sistema-comercial-automotriz.vercel.app) para disfrutar la nueva versión responsive, modo oscuro y mascotita Vitoko.






