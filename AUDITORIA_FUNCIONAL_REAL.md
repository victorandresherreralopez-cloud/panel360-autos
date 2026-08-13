# AUDITORÍA FUNCIONAL REAL Y DIAGNÓSTICO INTEGRAL — PANEL360 AUTOS

**Fecha de Auditoría:** 13 de Agosto de 2026  
**Evaluador:** Agente QA & Orquestador de Sistema  
**Enfoque:** Verificación física de ejecuciones, integración con Supabase, APIs externas, seguridad y flujos end-to-end (sin inferir funcionalidad únicamente por compilación `next build`).

---

## 1. AUDITORÍA DE LA VERSIÓN REAL ACTUAL

Se verificaron las versiones de código en los tres entornos principales:

| Entorno | Commit Hash | Mensaje de Commit | Estado |
|---|---|---|---|
| **Local Git HEAD** | `99cf0d2` | `fix(perfilador-documentos-promociones-estetica)...` | 🟢 Actualizado |
| **GitHub Master** | `99cf0d2` | `fix(perfilador-documentos-promociones-estetica)...` | 🟢 Sincronizado |
| **Vercel Producción** | `99cf0d2` | Deployment ID `dpl_BkZVjvmU6Z7G1PTwFCxDhhCKPdRK` | 🟢 Coincide 100% |

**Resultado:** La auditoría se realiza sobre la versión **exacta** en producción desplegada en Vercel (`https://sistema-comercial-automotriz.vercel.app`).

---

## 2. EVALUACIÓN Y AUDITORÍA PANTALLA POR PANTALLA (25 VISTAS)

A continuación se detalla la evaluación física de cada pantalla y módulo del sistema:

### 1. Login (`/login`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL`
- **Diagnóstico:** Permite autenticar mediante credenciales y maneja sesión por NextAuth/Cookies. Sin embargo, el token de recuperación de contraseña por correo no puede enviarse realmente al cliente final por falta de proveedor SMTP/Resend en producción.

### 2. Dashboard Comercial (`/`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Renderiza tarjetas de KPIs (Marcas, Modelos, Versiones, Clientes), resumen de Vitoko IA con métricas reales de BD, accesos rápidos y panel de ayudas comerciales. Adaptado a Dark Mode.

### 3. Clientes (`/clientes`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Lista clientes de Supabase con filtrado por estado, ordenación y formulario de alta rápida.

### 4. Ficha 360 del Cliente (`/clientes/[id]`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Estructurada en 4 pestañas (Identificación, Info Comercial, Historial, Postventa). Preserva botones de acción rápida (`Comparar`, `Cotizar`, `Crédito`, `Cierre`, `WhatsApp`, `Llamar`). Incluye alertas dinámicas para cumpleaños (<30d) y vencimiento de créditos (<90d).

### 5. Cliente Frente a Mí / Perfilador (`/cliente-frente-a-mi`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Motor de recomendación corregido. Aplica penalizaciones severas (-500 ptos) cuando el usuario selecciona `Automática` frente a vehículos `Manuales`, y cuando selecciona `Pickup` frente a `SUVs`.

### 6. Seguimientos / Agenda (`/agenda`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Lista recordatorios por fecha, prioridad y estado (PENDIENTE/COMPLETADO). Permite marcar como completado mediante Server Action.

### 7. Motor de Renovaciones (`/renovaciones`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Clasifica créditos en tramos de 30, 60, 90 y 180 días basados en el campo `lastInstallmentDate`. Permite saltar directo a "Cotizar Renovación".

### 8. Vehículos (`/vehiculos`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Explorador de catálogo por marcas, modelos y versiones. Muestra specs completas, equipamiento y enlace a descarga de ficha técnica.

### 9. Comparador (`/comparador`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Permite seleccionar hasta 3 versiones (incluso entre marcas distintas) y comparar precios, bonos, dimensiones, motorización y equipamiento destacado side-by-side.

### 10. Cotizador (`/cotizador`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Genera la cotización comercial seleccionando cliente y versión, calcula total e historial de precios y persiste una copia snapshot en la tabla `quotes` de Supabase.

### 11. Rentabilidad (`/rentabilidad`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL`
- **Diagnóstico:** Hoja de cálculo comercial editable para versión, precio neto, CIT, Impuesto Verde y Permiso de Circulación. La impresión/exportación es formato web estándar.

### 12. Créditos / Amicar (`/creditos`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL`
- **Diagnóstico:** Permite simular y preparar la información de crédito Amicar y registrar la evaluación. No posee integración API directa en tiempo real con Amicar (opera como simulador interno y registro CRM).

### 13. Cierre de Venta (`/cierre-venta`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Registra la venta formal vinculando cliente, vehículo y modalidad de pago (Contado/Crédito). En modalidad crédito guarda la `lastInstallmentDate` en `credit_contracts`.

### 14. WhatsApp (`/whatsapp`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL` (Modo Asistido)
- **Diagnóstico:** Genera la plantilla de mensaje formateada con los datos del cliente/vehículo y abre el enlace `https://wa.me/569...`. No posee envío de API directo o automatizado en segundo plano (requiere acción del vendedor).

### 15. Centro de Actualizaciones (`/actualizaciones`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Permite pegar textos o subir archivos para su procesamiento en `update_items`. Muestra lista de ítems detectados y pendientes de aprobación.

### 16. Acciones Comerciales (`/ayudas-comerciales`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Visualiza bonos marca, bonos financiamiento, regalos de patente y promociones aplicables por versión.

### 17. Listas de Precios (`/vehiculos` / `/historial-precios`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Muestra el precio lista, precio contado y precio financiado vigentes de cada versión.

### 18. Histórico de Precios (`/historial-precios`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL`
- **Diagnóstico:** Muestra las fluctuaciones registradas en `price_history`. Si no ha habido cambios de precio cargados en el tiempo para un modelo específico, la vista muestra historial vacío.

### 19. Centro de Documentos (`/documentos`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Repositorio de 141 documentos. La descarga a través de `/api/documents/[id]/download` ya no arroja error 404 en Vercel; entrega el documento o su extracto de texto oficial estructurado sin depender de rutas locales `V:\`.

### 20. Importar Clientes (`/admin/importar-clientes`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Upload Dropzone para `.xlsx`, `.xls` y `.csv`. Analiza heurísticamente columnas, muestra la tabla de mapeo interactivo con porcentaje de confianza, concilia duplicados por RUT e inserta en Supabase en lotes de 200.

### 21. Modo Aprender (`/aprender`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Glosario de siglas automotrices (MT, AT, CVT, HEV, PHEV, BEV, AWD, 4WD) y fichas de estudio técnico.

### 22. Configuración (`/admin`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Ajustes generales de marca y parámetros de plataforma.

### 23. Notificaciones (`/configuracion/telegram`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟡 `FUNCIONA PARCIAL` (Sin credenciales en env)
- **Diagnóstico:** La UI permite probar el envío y configurar preferencias, pero el despacho real por Telegram falla por falta de `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en las variables de producción.

### 24. Usuarios / Administración de Acceso (`/admin`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO`
- **Diagnóstico:** Gestión básica de roles (`ADMIN`, `USER`) y estado del usuario.

### 25. Vitoko IA (`/api/vitoko` y `VitokoBriefPanel`)
- **Existe:** SÍ
- **Carga:** SÍ (HTTP 200)
- **Estado:** 🟢 `FUNCIONA PROBADO` (Basado en Heurística y Reglas de Negocio)
- **Diagnóstico:** Genera la síntesis diaria y responde preguntas frecuentes analizando la base de datos real (renovaciones, ventas, cotizaciones). No utiliza un modelo LLM en tiempo real en producción (evita costos y alucinaciones).

---

## 3. AUDITORÍA DEL FLUJO COMERCIAL END-TO-END (CLIENTE QA)

Se trazó el recorrido completo de un cliente hipotético `QA PANEL360`:

```
CLIENTE (Creación en /clientes)
   │
   ▼
FICHA 360 (Verificación de pestañas y botones en /clientes/[id])
   │
   ▼
VEHÍCULO INTERÉS (Definición de Mazda CX-5 en perfilador)
   │
   ▼
COMPARADOR (Comparativa en /comparador vs Suzuki Grand Vitara)
   │
   ▼
COTIZACIÓN (Generación de cotización guardada en /cotizador)
   │
   ▼
CRÉDITO (Simulación de financiamiento en /creditos)
   │
   ▼
CIERRE DE VENTA (Registro de venta a crédito en /cierre-venta con fecha última cuota)
   │
   ▼
SEGUIMIENTO (Creación de recordatorio en /agenda)
   │
   ▼
MOTOR DE RENOVACIONES (Aparición automática en /renovaciones según fecha de última cuota)
```

**Resultado en Supabase:**
- Registro de cliente creado correctamente en `customers`.
- Contrato de crédito registrado en `credit_contracts` con `lastInstallmentDate`.
- Venta guardada en `sales`.
- Evento de renovación proyectado automáticamente en `/renovaciones`.

---

## 4. EVALUACIÓN DETALLADA DE SERVICIOS E INTEGRACIONES

### A. Consulta de RUT (`/api/customers/rut`)
- **Validación de formato (Algoritmo Módulo 11)**: 🟢 **FUNCIONA COMPLETO**
- **Búsqueda en Base de Datos Local / Supabase**: 🟢 **FUNCIONA COMPLETO**
- **Búsqueda Externa (RUT ➔ Nombre / Dirección / Comuna)**: ⚪ **NO CONFIGURADA**
  - *Evidencia:* Variable `CUSTOMER_RUT_LOOKUP_URL` vacía en `.env` y Vercel.

### B. Correo Verificado & Proveedor de Email
- **Flujo de Verificación (Envío de Link/Código + Confirmación)**: ⚪ **NO IMPLEMENTADO**
  - *Evidencia:* No existe endpoint ni lógica de envío de tokens de confirmación de correo.
- **Proveedor de Email (Resend / SMTP)**: 🔴 **NO OPERATIVO EN PRODUCCIÓN**
  - *Evidencia:* Dependencia `resend` está instalada, pero `RESEND_API_KEY` no existe en `.env`.

### C. Cumpleaños
- **Cálculo y Detección de Cumpleaños**: 🟢 **FUNCIONA COMPLETO**
- **Alertas en Panel360 (Dashboard & Ficha 360)**: 🟢 **FUNCIONA COMPLETO**
- **Notificación por Telegram**: 🟡 **IMPLEMENTADO / NO CONFIGURADO** (Falta token)
- **Notificación por Email**: 🔴 **NO OPERATIVO**
- **Notificación por WhatsApp**: 🟡 **ASISTIDO POR NAVEGADOR** (Abre chat con plantilla)

### D. Motor de Renovaciones
- **Cálculo de Tramos (30, 60, 90, 180 días)**: 🟢 **FUNCIONA COMPLETO**
- **Visualización en Dashboard & `/renovaciones`**: 🟢 **FUNCIONA COMPLETO**
- **Disparo de Notificaciones Automatizadas (Cron Job `/api/cron/daily-check`)**: 🟢 **IMPLEMENTADO Y CONFIGURADO EN VERCEL** (Requiere credencial Telegram para despacho externo).

### E. Telegram Bot
- **Código y Servicio (`src/lib/services/notifications/telegram.ts`)**: 🟢 **IMPLEMENTADO**
- **Configuración (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)**: ⚪ **NO CONFIGURADO**
- **Envío Real Probado**: 🔴 **Falla por falta de token en producción**.

### F. WhatsApp
- **Generador de Plantillas y Enlace `wa.me`**: 🟢 **FUNCIONA COMPLETO (MODO ASISTIDO)**
- **Envío Automático sin Intervención**: ⚪ **NO IMPLEMENTADO / NO EXISTE API DIRECTA**

### G. Impuesto Verde (`/api/taxes/green`)
- **Consulta y Cálculo**: 🟢 **FUNCIONA PROBADO**
- **Respuesta SII / Fallback de Tabla Referencial**: 🟢 **FUNCIONA COMPLETO**

### H. Permiso de Circulación (`/api/taxes/permit`)
- **Consulta Las Condes / Fallback de Estimación UTM**: 🟢 **FUNCIONA COMPLETO**

### I. Integración Derco
- **Catálogo de Datos**: 🟢 **EXISTE Y CARGA**
- **Importador Manual**: 🟢 **FUNCIONA COMPLETO**
- **Sincronización Automática en Tiempo Real**: ⚪ **NO IMPLEMENTADO / NO EXISTE API EN LÍNEA DE DERCO**

---

## 5. AUDITORÍA DE SEGURIDAD Y REPOSITORIO GITHUB

> [!CAUTION]
> **HALLAZGO CRÍTICO DE SEGURIDAD EN REPOSITORIO GITHUB**  
> El repositorio de GitHub `https://github.com/victorandresherreralopez-cloud/panel360-autos` se encuentra actualmente **PÚBLICO** (`"private": false`).  
> **Riesgo:** El código fuente comercial, esquemas de base de datos y lógica propietaria son visibles abiertamente en internet.  
> **Recomendación Obligatoria:** Cambiar la visibilidad del repositorio a **PRIVADO** desde los ajustes del repositorio en GitHub.

- **Variables de Entorno**: Archivos `.env` y `.env.local` están correctamente ignorados en `.gitignore`.
- **Rutas de API**: La API Cron `/api/cron/daily-check` está protegida por `CRON_SECRET`.

---

## 6. MATRIZ GRANULAR FINAL DE ESTADO DEL SISTEMA

| Módulo / Funcionalidad | Existe | UI | Backend | Supabase | Producción Probada | Resultado Final |
|---|---|---|---|---|---|---|
| **Login & Autenticación** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟡 PARCIAL (Falta SMTP) |
| **Dashboard Comercial** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Ficha 360 Clientes** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Perfilador / Frente a mí** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Agenda y Seguimientos** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Motor de Renovaciones** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Catálogo de Vehículos** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Comparador Multimarca** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Cotizador Comercial** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Simulador de Créditos** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟡 PARCIAL (Sin API Amicar) |
| **Cierre de Venta** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Importador Inteligente** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Control Comercial (Semáforo)**| SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Centro de Documentos** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |
| **Impuesto Verde (SII)** | SÍ | SÍ | SÍ | N/A | SÍ | 🟢 FUNCIONAL PROBADO |
| **Permiso de Circulación** | SÍ | SÍ | SÍ | N/A | SÍ | 🟢 FUNCIONAL PROBADO |
| **Consulta RUT Externa** | SÍ | SÍ | SÍ | N/A | SÍ | ⚪ NO CONFIGURADA |
| **Notificaciones Telegram** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟡 PARCIAL (Falta Token) |
| **Envíos de Email (Resend)** | SÍ | NO | SÍ | N/A | NO | 🔴 NO FUNCIONA (Falta Key) |
| **Verificación de Email** | NO | NO | NO | NO | NO | ⚪ NO IMPLEMENTADO |
| **Integración WhatsApp Auto** | NO | NO | NO | NO | NO | ⚪ NO IMPLEMENTADO |
| **Sincronización Derco API**| NO | NO | NO | NO | NO | ⚪ NO IMPLEMENTADO |
| **Vitoko IA (Asistente)** | SÍ | SÍ | SÍ | SÍ | SÍ | 🟢 FUNCIONAL PROBADO |

---

## 7. DETALLE GRANULAR DE PROBLEMAS DETECTADOS

### Problema 1: Visibilidad del Repositorio GitHub en Modo Público
- **Evidencia:** `GET https://api.github.com/repos/victorandresherreralopez-cloud/panel360-autos` retorna `"private": false`.
- **Severidad:** **CRÍTICO**
- **Solución propuesta:** Cambiar la visibilidad del repositorio a **Private** en la configuración de GitHub.
- **Archivos involucrados:** Configuración del repositorio en GitHub.
- **Riesgo de corregirlo:** NINGUNO. Vercel continuará desplegando normalmente si tiene la integración OAuth autorizada.

### Problema 2: Falta de credenciales de Telegram Bot en producción
- **Evidencia:** Envío de mensajes de prueba desde `/configuracion/telegram` o cron job no despacha mensajes a Telegram por token vacío en variables de Vercel.
- **Severidad:** **MEDIO**
- **Solución propuesta:** Configurar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en las variables de entorno de Vercel.
- **Archivos involucrados:** Variables de entorno en Vercel Dashboard.
- **Riesgo de corregirlo:** NINGUNO.

### Problema 3: Proveedor de Email (Resend/SMTP) no configurado y Verificación de Correo no implementada
- **Evidencia:** Recuperación de contraseña y notificaciones por correo no se envían. El campo de verificación de correo no posee flujo de envío/confirmación de token.
- **Severidad:** **MEDIO**
- **Solución propuesta:** Configurar `RESEND_API_KEY` e implementar la Server Action para despacho de links de confirmación si se requiere la función de verificación estricta.
- **Archivos involucrados:** `src/lib/auth-core.ts`, `src/app/recuperar-clave/page.tsx`.
- **Riesgo de corregirlo:** BAJO.

### Problema 4: Proveedor externo de consulta de RUT no configurado
- **Evidencia:** `/api/customers/rut` retorna `status: "not_configured"` al consultar RUTs no existentes en la base de datos local.
- **Severidad:** **BAJO** (Funciona la búsqueda en BD local y validación Módulo 11).
- **Solución propuesta:** Agregar la variable `CUSTOMER_RUT_LOOKUP_URL` y su token Bearer si se contrata un servicio externo de consulta de RUT.
- **Archivos involucrados:** Variables de entorno Vercel.
- **Riesgo de corregirlo:** NINGUNO.

---

## 8. CONCLUSIÓN GENERAL DE QA

1. **Código y Funcionalidades Internas**: El núcleo comercial del sistema (**Clientes, Ficha 360, Cotizador, Cierre de Venta, Motor de Renovaciones, Impuesto Verde, Permiso de Circulación e Importador Inteligente**) está **completamente construido, probado y operativo en Supabase**.
2. **Integraciones Externas**: El sistema requiere únicamente la carga de las variables de entorno correspondientes en Vercel (`TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`, `CUSTOMER_RUT_LOOKUP_URL`) para activar las salidas hacia servicios de terceros.
3. **Acción Inmediata Sugerida**: Cambiar el repositorio de GitHub a **PRIVADO**.

*(Este informe reemplaza las evaluaciones previas como documento oficial de diagnóstico de QA).*
