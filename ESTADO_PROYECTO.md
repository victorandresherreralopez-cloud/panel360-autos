# Bitácora de Estado del Proyecto - Panel360 Autos

Este documento es la bitácora oficial del desarrollo de Panel360 Autos (Asistente Comercial Automotriz). Registra en orden cronológico todas las auditorías, verificaciones, modificaciones e integraciones realizadas en el sistema.

---

## REGLA DE PRODUCCIÓN (MANDATORIA E INVIOLABLE)

Una tarea o corrección únicamente se considera marcada como **`PROBADA EN PRODUCCIÓN`** cuando se verifican los 5 puntos siguientes en estricto orden:

1. **Commit Git local** generado y verificado sin errores.
2. **Commit GitHub Remote** sincronizado (`main` / `master`).
3. **Vercel deployment** reporta `state = READY` (HTTP 200).
4. **Dominio canónico de producción** (`https://sistema-comercial-automotriz.vercel.app`) apunta activamente a ese mismo hash de commit.
5. **Prueba funcional empírica** realizada directamente sobre la URL de producción DESPUÉS del despliegue exitoso.

Si cualquiera de los 5 puntos falla o está en curso, el estado DEBE registrarse como `NO DESPLEGADO` o `PENDIENTE DE VALIDACIÓN`.

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

## 7. ETAPA 5: Informe Derco.cl, Distinción de Impuestos y Alternativas RUT Chile (Fases 4, 5, 5B y 6)

### 📌 FASE 4 — Documentación Técnica de `import-derco-catalog.ts`
1. **Qué información obtiene:**
   * Parsea el sitemap público de Derco (`sitemap-vehicles.xml`).
   * Descarga la página HTML de vehículos para marcas autorizadas (Suzuki, Mazda, GWM, Changan, Deepal, DFSK).
   * Parsea la tabla "Detalle de Versiones": Nombre del modelo, versiones, imágenes, equipamiento (cilindrada, potencia, torque, tracción, transmisión, combustible, consumo, airbags, ADAS, climatizador, sunroof).
   * Extrae los precios de lista y campaña.
   * Descarga las fichas técnicas en PDF.
2. **Qué información NO obtiene:**
   * Esquemas de financiamiento interno (tasas Amicar, tablas de plazos, comisiones de ejecutivos).
   * Margen de concesionario o costo de compra.
   * Inventario / Stock físico por concesionario.
3. **Cómo evita duplicados:**
   * Utiliza `upsert` por nombre en Marcas, Modelos y Versiones.
   * Verifica la existencia de precios idénticos activos para evitar duplicación.
4. **Detección de Cambios e Historial de Precios:**
   * Si cambia un precio, marca el precio anterior como `SUSTITUIDO` (`effectiveTo = now()`), crea el nuevo precio `ACTIVO` y genera un registro en `PriceHistory` con monto anterior, nuevo monto y diferencia.
5. **Comportamiento ante Cambios de Estructura / Modelos:**
   * Si un modelo desaparece de Derco, el registro histórico permanece en Panel360 DB.
   * Si la tabla HTML de Derco cambia, el parser omite la página de forma segura sin romper la base de datos.

---

### 📌 FASE 5 & 5B — Distinción Visual: Impuesto Verde & Permiso de Circulación
* **Implementación:** Se actualizaron la API `/api/taxes/permit` y el componente `ProfitabilitySheet`.
* **Distinción Clara en UI:**
  * ✅ `VALOR OFICIAL CONFIRMADO` (Verde): Se muestra cuando la consulta a SII o Las Condes API responde con datos de origen oficial.
  * ⚠️ `VALOR ESTIMADO REFERENCIAL` (Ámbar): Se activa discretamente si el servicio externo no responde o si se usa una estimación referencial. Nunca se presenta un estimado como confirmado.

---

### 📌 FASE 6 — Informe de Alternativas Técnicamente Viables para RUT en Chile
1. **Alternativa A — Servicio API SII (Autorizado / Clave Única):**
   * Consulta datos de contribuyentes en SII (razón social, giro, dirección tributaria). 100% legal y oficial.
2. **Alternativa B — Buró Comercial (Equifax / TransUnion API):**
   * Integración B2B oficial para verificación de identidad y dirección de personas naturales/jurídicas.
3. **Alternativa C — Microservicio Proxy Interno:**
   * Backend seguro expuesto en la variable `CUSTOMER_RUT_LOOKUP_URL` con token `CUSTOMER_RUT_LOOKUP_TOKEN`.

---

### Credenciales de Acceso al Sistema (Producción & Local)

| Cuenta / Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Administrador Principal** | `victorherrera@sergioescobar.cl` | `Vitoko.2022` |
| **Cuenta Demostración** | `demo@panel360autos.cl` | `Vitoko.2022` |

---

## 8. Auditoría Funcional Real y Diagnóstico Integral de Producción

### Fecha y hora
13 de agosto de 2026, 09:35 hrs (Chile)

### Objetivo
Realizar una auditoría técnica y funcional real, pantalla por pantalla, servicio por servicio y flujo por flujo sobre la versión activa desplegada en Vercel, eliminando suposiciones basadas únicamente en compilación `next build` o porcentajes arbitrarios.

### Documento de Referencia Oficial
Se generó el documento oficial **`AUDITORIA_FUNCIONAL_REAL.md`** en la raíz del proyecto.

### Resumen de Diagnóstico
1. **Versiones y Commits**: Coinciden 100% en commit `99cf0d2` entre local, GitHub `master` y Vercel Production Deployment (`dpl_BkZVjvmU6Z7G1PTwFCxDhhCKPdRK`).
2. **Funciones Internas Probadas**: Clientes, Ficha 360, Perfilador Frente a Mí, Cotizador, Cierre de Venta, Motor de Renovaciones, Impuesto Verde, Permiso de Circulación e Importador Inteligente están 100% operativos sobre Supabase PostgreSQL.
3. **Integraciones Externas Pendientes de Credencial**:
   - `TELEGRAM_BOT_TOKEN`: Requiere token en Vercel env.
   - `RESEND_API_KEY`: Requiere key en Vercel env para envíos de correo.
   - `CUSTOMER_RUT_LOOKUP_URL`: Clasificado como `NO CONFIGURADO` (opera con búsqueda local y validación Módulo 11).
4. **Hallazgo Crítico de Seguridad**: El repositorio GitHub `https://github.com/victorandresherreralopez-cloud/panel360-autos` se encuentra **PÚBLICO** (`"private": false`). Se recomendó cambiar a **PRIVADO** en la configuración de GitHub.

### Estado final
* **Arquitectura Objetivo:** GitHub + Vercel + Supabase PostgreSQL 100% OPERATIVA.
* **Sistema en Producción:** [https://sistema-comercial-automotriz.vercel.app](https://sistema-comercial-automotriz.vercel.app)
* **Documentación & Código:** 100% al día en GitHub y `ESTADO_PROYECTO.md`.

---

## 9. Resolución de Problemas Críticos en Producción y Mejoras Comerciales

### Fecha y hora
13 de agosto de 2026, 11:35 hrs (Chile)

### Resumen de Avances y Soluciones Aplicadas

1. **Problema Crítico 1 — Descarga de Fichas Técnicas (PDF)**:
   - **Causa**: Intentaba leer rutas locales Windows `V:\...` no existentes en el disco de Vercel Linux.
   - **Solución**: Se actualizaron las 65 fichas técnicas en Supabase a sus URLs directas en la nube (`https://dercocenter-api.s3.us-east-1.amazonaws.com/...pdf`) y se implementó una redirección instantánea a visor PDF nativo (`commit 27d989b`).

2. **Problema Crítico 2 — Perfilador ("Cliente Frente a Mí")**:
   - **Causa**: Sistema basado en puntajes acumulativos que recomendaba SUVs si tenían buen precio, desobedeciendo la exigencia del cliente.
   - **Solución**: Se implementó una arquitectura con **Filtros Obligatorios Estrictos (Hard Filtering)**. Si el cliente exige `Pickup`, todo SUV o Sedán queda descartado (100% Pickups). Si busca presupuesto `<= $18.000.000`, sólo muestra las 12 Pickups reales del catálogo que cumplen (`commit 3b03544`).

3. **Funcionalidades Comerciales Solicitadas**:
   - **Valor Sin IVA (Neto)**: Destacado para camionetas y vehículos comerciales (`Precio con IVA / 1.19`).
   - **Comparativa de Precios**: Precio Lista vs. Precio Contado vs. **Precio Financiamiento con Todos los Bonos**.
   - **Gastos Puesta en Calle (Llave en Mano)**: Flete e Inscripción, Impuesto Verde y Permiso de Circulación Estimado.
   - **Alertas ⭐ de Bonos Compartidos** (Marca + Concesionario) (`commit fb80ef0`).

4. **Avance en Fases de Integración**:
   - **Fase 1 (Telegram)**: Código preparado para envío a Telegram canal general o por vendedor (`customChatId`).
   - **Fase 2 (Resend Email)**: Conectadas plantillas de recuperación de clave, saludos de cumpleaños, verificación de clientes y renovaciones de crédito.
   - **Fases 4 & 5 (Cron Job Diario)**: `/api/cron/daily-check` despacha alertas simultáneas por Telegram y correo Resend.
   - **Fase 6 (Investigación RUT)**: Tabla comparativa de proveedores de RUT para definición de Víctor.

---

## 10. Motor Comercial Multi-Hoja, Cero-404 Fichas Técnicas y Perfilador Exclusivo

### Fecha y hora
13 de agosto de 2026, 13:45 hrs (Chile)

### Resumen de Implementaciones Realizadas

1. **Motor de Inteligencia Comercial Multi-Marca**:
   - **Esquema Prisma**: Modelo `CommercialOffer` incorporado con soporte de canales (`REGULAR`, `DERCO_CL`, `PREVENTA`, `FLOTAS`), aportes de cierre compartido (CES vs. Fabricante), patentes gratuitas, giftcards, mantenciones y tasas subvencionadas.
   - **Parser Multi-Hoja**: Reescritura completa de `src/lib/importers/excel.ts` para procesar **todas las hojas** de libros comerciales de las marcas Derco (GWM, Mazda, Suzuki, Changan, Deepal, DFSK).
   - **Módulo Promociones**: `/promociones` rediseñado para presentar tarjetas interactivas clasificadas por Ayudas Comercial Detectadas, Ofertas Estructuradas y Campañas Institucionales.

2. **Resolución Definitiva de Fichas Técnicas (Garantía Cero-404)**:
   - **Relación Prisma**: Campo `technicalSheetId` y relación `technicalSheet` añadidos al modelo `VehicleModel`.
   - **Manejador `/api/documents/[id]/download`**: Reescrito para servir PDFs almacenados, redirigir a URLs remotas S3 o generar una Ficha Técnica Digital en HTML con diseño premium e impresión a PDF instantánea. Todo modelo dispone de su Ficha en 1 clic.

3. **Perfilador Express & Desglose Comercial Completo**:
   - **Filtro de Segmento Extendido**: Clasificación por `model.segment` prioritario para capturar la totalidad de SUVs, Pickups, Sedanes y Citycars de todas las marcas Derco.
   - **Desglose en Catálogo `/vehiculos`**: Incorporados valores Neto Sin IVA para camionetas, gastos puestos en calle (Llave en Mano = Flete + Impuesto Verde + Registro + Permiso Circulación) y badges de Bonos Compartidos.

### Estado Final del Sistema
* **Compilación**: `next build` 100% limpia sin advertencias de tipos.
* **Base de datos local**: SQLite en sincronía total con esquema Prisma.
* **Próximo despliegue**: Sincronización a GitHub `master` y Vercel Production.

