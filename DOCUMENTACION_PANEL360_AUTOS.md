# Panel360 Autos - Documentacion del sistema

Fecha de corte: 2026-08-12  
Ruta local: `V:\sistema para vender autos`  
URL local: `http://localhost:3001`  
Proyecto Vercel: `sistema-comercial-automotriz`

## 1. Resumen ejecutivo

Panel360 Autos es un sistema web privado para apoyar el trabajo comercial automotriz. Centraliza catalogo, precios, fichas tecnicas, planes comerciales, ayudas, cotizaciones, rentabilidad, clientes, creditos y apoyo con Vitoko IA.

El objetivo es reducir tiempo de busqueda, evitar errores al cotizar y ayudar al vendedor a tomar mejores decisiones frente al cliente.

## 2. Estado actual

El sistema esta instalado y funcionando localmente en `http://localhost:3001`.

Tambien esta preparado para desplegarse en Vercel con Supabase PostgreSQL. Falta configurar las credenciales reales de Supabase en Vercel y ejecutar la importacion de datos.

Datos cargados actualmente:

| Dato | Cantidad |
|---|---:|
| Marcas | 6 |
| Modelos | 68 |
| Versiones | 165 |
| Precios vigentes | 330 |
| Documentos | 141 |
| Fichas tecnicas Derco | 65 |
| Actualizaciones comerciales | 8 |
| Alertas/ayudas detectadas | 236 |
| Usuarios | 1 |

Marcas cargadas:

| Marca | Modelos | Versiones |
|---|---:|---:|
| CHANGAN | 20 | 46 |
| DEEPAL | 3 | 4 |
| DFSK | 10 | 23 |
| GWM | 17 | 38 |
| MAZDA | 10 | 31 |
| SUZUKI | 8 | 23 |

## 3. Identidad y acceso

El sistema usa identidad visual de Panel360/Pyme360 con marca `Panel360 Autos`.

Incluye:

- Logo real importado desde `V:\PYME360\public\logo-panel360.svg`.
- Login privado.
- Sesiones protegidas por cookie firmada.
- Recuperacion de clave con token temporal.
- Preparacion para envio de correo con Resend.
- Middleware que protege rutas privadas y APIs.

## 4. Modulos construidos

### Dashboard

Pantalla inicial con accesos rapidos a las areas principales: vehiculos, comparador, cotizador, rentabilidad, ayudas comerciales, clientes, creditos, WhatsApp y aprendizaje.

### Vehiculos

Modulo para buscar rapidamente por marca, modelo, version, ficha tecnica o Codigo CIT.

Incluye:

- Botones por marca.
- Buscador rapido.
- Filtros por marca/modelo.
- Imagen por modelo cuando esta disponible.
- Ficha tecnica descargable cuando existe.
- Versiones con precios, CIT y datos tecnicos.
- Alertas comerciales relacionadas al modelo.

### Comparador

Modulo corregido y mejorado para comparar hasta 3 versiones.

Incluye:

- Busqueda por marca, modelo, version o CIT.
- Primera opcion como referencia.
- Precio lista.
- Precio final/campana.
- Bono o ahorro contra lista.
- Codigo CIT.
- Diferencias tecnicas y comerciales.
- Vista `Solo diferencias` o `Todo`.
- Resumen de opcion mas conveniente, brecha de precio y mayor bono.
- Alertas comerciales relacionadas.
- Accesos directos a cotizar o calcular rentabilidad.

### Cotizador

Modulo para preparar cotizaciones de vehiculos usando datos reales del catalogo y precios vigentes.

Objetivo:

- Agilizar cotizacion.
- Dejar datos listos para rentabilidad.
- Conectar el flujo comercial con cliente, precio y version.

### Rentabilidad

Modulo inspirado en la hoja de rentabilidad del negocio.

Incluye:

- Seleccion de vehiculo/version.
- Carga automatica de precio lista, precio campana y CIT cuando existen.
- Costos por defecto modificables:
  - Flete Osorno: `$380.600`
  - Pisos de goma: `$35.988`
  - Set de Seguridad: `$23.988`
  - Trins: `$34.280`
  - Inscripcion: `$82.230`
  - Seguro Obligatorio: `$22.000`
- Preparacion para permiso de circulacion.
- Preparacion para Imp. Fuentes Movs. o impuesto verde.
- Opcion de imprimir.
- Opcion de enviar por correo.

### Permiso de circulacion e impuesto verde

Se dejaron endpoints y logica para apoyar:

- Permiso de circulacion usando precio lista final neto y fecha de factura del dia.
- Impuesto verde usando marca, modelo, Codigo CIT y precio venta con IVA.

El dato clave para SII es el Codigo CIT, por eso ahora aparece en versiones y comparador.

Nota: la automatizacion completa depende de que los sitios externos permitan consulta estable desde servidor. Si bloquean automatizacion, se debe usar integracion asistida o cache controlada.

### Ayudas comerciales

Modulo que detecta y resume informacion comercial desde documentos.

Detecta:

- Bonos compartidos.
- Bono marca.
- Bono financiamiento.
- Aporte marca.
- Aporte CES.
- Bono especial.
- Campanas 0 KM.
- Patente gratis.
- Tasas especiales.
- Gift Card.

Estas ayudas tambien aparecen contextualizadas en vehiculos y comparador.

### Plan comercial

Modulo para mantener historial de planes comerciales y campanas por mes sin perder informacion anterior.

### Clientes / Mini CRM

Base para administrar clientes y seguimiento comercial.

Incluye estructura para:

- Datos personales y contacto.
- Validacion y formato automatico de RUT chileno.
- Busqueda inmediata de clientes existentes por RUT.
- Autocompletado desde el CRM interno.
- Campos de direccion, comuna, ciudad y region.
- Registro de autorizacion del cliente para completar datos.
- Estado comercial.
- Origen.
- Vehiculo de interes.
- Presupuesto.
- Tipo de compra.
- Proximas acciones.
- Actividades.
- Recordatorios.
- Vehiculos del cliente.
- Creditos, cotizaciones y ventas.

La consulta externa por RUT queda preparada mediante `CUSTOMER_RUT_LOOKUP_URL` y `CUSTOMER_RUT_LOOKUP_TOKEN`. Debe usarse con una fuente autorizada y con autorizacion del cliente.

### Cliente frente a mi

Modulo de perfilamiento comercial para atender mejor al cliente.

Objetivo:

- Entender presupuesto, uso y prioridad.
- Sugerir modelos.
- Pasar rapidamente a comparar, cotizar, rentabilidad o credito.

### Creditos / Amicar

Se agrego una pantalla de apoyo para evaluacion de creditos y acceso a Amicar.

La integracion actual debe tratarse con cuidado:

- No guardar claves personales en codigo.
- Mantener credenciales fuera del repositorio.
- Idealmente avanzar hacia integracion formal o SSO si Amicar lo permite.

### WhatsApp

Generador de mensajes comerciales para enviar informacion de vehiculos, precios o seguimiento a clientes.

### Aprender

Modo de aprendizaje para siglas, versiones y conceptos comerciales.

### Vitoko IA

Vitoko esta integrado como asistente transversal.

Puede ayudar a:

- Buscar vehiculos.
- Resumir precios y bonos.
- Sugerir acciones comerciales.
- Revisar rentabilidad.
- Perfilar clientes.
- Detectar pendientes como CIT faltante o datos incompletos.

## 5. Datos reales integrados

Se cargaron documentos reales de agosto aunque algunos archivos tengan nombres de otros meses.

Fuentes trabajadas:

- Plan Comercial CHANGAN.
- Plan Comercial GWM.
- Plan Comercial Mazda.
- Lista de precios CHANGAN.
- Lista de precios GWM.
- Lista de precios Mazda.
- Hoja de rentabilidad.
- Fichas tecnicas desde Derco.
- Codigos CIT desde listas de precios.

## 6. Archivos y piezas importantes

| Area | Archivo |
|---|---|
| Layout y marca | `src/app/layout.tsx` |
| Shell principal | `src/components/app-shell.tsx` |
| Logo Panel360 Autos | `src/components/brand-logo.tsx` |
| Login y recuperacion | `src/app/login/page.tsx`, `src/app/recuperar-clave` |
| Auth | `src/lib/auth-core.ts`, `src/lib/auth.ts`, `src/lib/actions/auth.ts` |
| Vehiculos | `src/app/vehiculos/page.tsx`, `src/components/vehicles-explorer.tsx` |
| Comparador | `src/app/comparador/page.tsx`, `src/components/compare-client.tsx`, `src/lib/comparison.ts` |
| Rentabilidad | `src/app/rentabilidad/page.tsx`, `src/components/profitability-sheet.tsx` |
| Ayudas comerciales | `src/lib/commercial-aids.ts`, `src/components/commercial-aid-alerts.tsx` |
| Vitoko | `src/lib/vitoko.ts`, `src/components/vitoko-assistant.tsx` |
| Base de datos | `prisma/schema.prisma` |
| Deploy Vercel | `vercel.json`, `scripts/build-vercel.mjs` |
| Export/import datos | `scripts/export-vercel-data.mjs`, `scripts/import-vercel-data.mjs` |

## 7. Preparacion para Vercel + Supabase

El proyecto ya tiene:

- `vercel.json` con build `npm run build:vercel`.
- Script que convierte Prisma de SQLite a PostgreSQL para Vercel.
- Soporte para `DATABASE_URL`.
- Soporte para `DIRECT_URL`.
- Export local generado.
- Importador hacia PostgreSQL.
- `.env.example` sin secretos.

Falta:

1. Crear o elegir proyecto Supabase para Panel360 Autos.
2. Obtener `DATABASE_URL` pooler y `DIRECT_URL` directa.
3. Configurar variables en Vercel.
4. Importar datos exportados.
5. Desplegar a produccion.
6. Crear usuario demo para gerencia.

## 8. Checklist para dejarlo online

1. Crear proyecto Supabase exclusivo para Panel360 Autos.
2. Copiar connection strings:
   - Pooler/transaccional como `DATABASE_URL`.
   - Direct connection como `DIRECT_URL`.
3. En Vercel, abrir proyecto `sistema-comercial-automotriz`.
4. Agregar variables de entorno de `VERCEL_DEPLOYMENT.md`.
5. Ejecutar importacion:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:DIRECT_URL="postgresql://..."
npm run data:import:vercel -- backups/vercel/export-2026-08-12T17-05-22-541Z.json
```

6. Desplegar:

```bash
vercel --prod
```

7. Probar:
   - Login.
   - Vehiculos.
   - Comparador.
   - Rentabilidad.
   - Recuperacion de clave.
   - Descarga de fichas.

## 9. Validaciones realizadas

Ultimas validaciones ejecutadas:

- `npm.cmd run lint`
- `npm.cmd test`
- `npm.cmd run build`

Resultado: correcto.

Pruebas automatizadas actuales:

- Importador de texto.
- Comparador: precio campana como precio final y ahorro contra lista.

## 10. Riesgos y pendientes

- Supabase todavia no esta conectado para esta app.
- La app online necesita variables reales en Vercel.
- La recuperacion por correo requiere Resend configurado.
- Las fichas/documentos nuevos requieren Vercel Blob configurado.
- SII y permiso de circulacion pueden bloquear automatizacion directa; conviene tener cache o flujo asistido.
- Amicar debe integrarse sin guardar claves personales en codigo.
- Para venta a gerencia, se recomienda usuario demo y datos controlados.

## 11. Demo recomendada para gerencia

Ruta de demo de 10 minutos:

1. Login con usuario demo.
2. Dashboard y marca Panel360 Autos.
3. Buscar un vehiculo en Vehiculos.
4. Abrir ficha tecnica o revisar versiones.
5. Comparar 2 o 3 versiones.
6. Mostrar precio lista, precio final, bono, CIT y diferencias.
7. Pasar a rentabilidad.
8. Mostrar costos por defecto e impresion.
9. Preguntar a Vitoko una recomendacion comercial.
10. Cerrar con propuesta de piloto.

Frase sugerida:

> "Esto no reemplaza al vendedor. Le quita trabajo repetitivo, reduce errores y lo ayuda a cotizar con informacion real en menos tiempo."
