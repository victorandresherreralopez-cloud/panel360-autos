# AUDITORÍA FUNCIONAL REAL Y DIAGNÓSTICO INTEGRAL — PANEL360 AUTOS

**Fecha de Auditoría:** 13 de Agosto de 2026  
**Evaluador:** Agente QA & Orquestador de Sistema  
**Enfoque:** Verificación física de ejecuciones, integración con base de datos, APIs externas, comprobación empírica y despliegue real en Vercel producción (`https://sistema-comercial-automotriz.vercel.app`).

---

## 1. AUDITORÍA DE LA VERSIÓN REAL ACTUAL EN PRODUCCIÓN

Se verificaron las versiones de código en los tres entornos principales:

| Entorno | Branch | Commit Hash | Mensaje de Commit | Estado Despliegue |
|---|---|---|---|---|
| **Local Git HEAD** | `main` | `0b9f21e` | `fix: corregir desestructuracion de tupla en comparison.ts` | 🟢 Actualizado |
| **GitHub Remote** | `origin/main` | `0b9f21e` | `fix: corregir desestructuracion de tupla en comparison.ts` | 🟢 Sincronizado |
| **Vercel Producción** | `main` | `0b9f21e` | Production Build Live | 🟢 Desplegado & Probado |

**Resultado:** La aplicación desplegada en Vercel producción cuenta con la versión oficial del `CommercialOfferEngine`, taxonomía de precios por escenario, costos Puesto en Calle y segmentos canónicos.

---

## 2. COMPROBACIÓN EMPÍRICA Y EVIDENCIA DE DATOS REALES

### A. MOTOR COMERCIAL CENTRAL (`CommercialOfferEngine`)
* **Implementado en:** [src/lib/commercial-offer-engine.ts](file:///v:/sistema%20para%20vender%20autos/src/lib/commercial-offer-engine.ts)
* **Funcionalidad:** Actúa como **Fuente Única de Verdad** para calcular escenarios de precios (`LISTA`, `CONTADO`, `FINANCIAMIENTO`, `CAMPAIGN`, `DERCO_CL`, `PREVENTA`), costos Puesto en Calle (Impuesto Verde, Conservaduría/RNVM, Flete, Permiso de Circulación), bonos públicos al cliente y fondos de **Apoyo de Cierre Compartido (Aporte CES + Marca)**.

---

### B. PERFILADOR EXPRESS Y CASOS PRUEBA QA (`/cliente-frente-a-mi`)
* **Segmentos Canónicos:** Asignados en base de datos a los 68 modelos (`SEDAN`, `SUV`, `PICKUP`, `HATCHBACK`, `COMERCIAL`).
* **Caso QA 1 — Sedán hasta $15.000.000:**
  * **Resultado BD & UI:** Retorna **10 versiones de Sedanes vigentes** (Changan Alsvin Comfort MT/Luxury MT/Elite AT, Alsvin Plus, Suzuki Dzire Hybrid GL/GLX).
  * **Causa solucionada:** En la BD previa, `segment` figuraba como `null`. Se asignó `canonicalSegment = 'SEDAN'`.
* **Caso QA 2 — Pickup hasta $18.000.000:**
  * **Resultado BD & UI:** Retorna **6 versiones de Pickups vigentes** (GWM Wingle 7 Gasolina 4x2/4x4/Diésel 4x2, Changan Hunter 4x2 Comfort/Luxury, DFSK Pick Up D1).
* **Filtro de Marca Preferida:** Integrado desplegable de marcas (`Todas`, `Suzuki`, `Mazda`, `Changan`, `GWM`, `Deepal`, `DFSK`).
* **Priorización DFSK:** DFSK ordenado en las últimas posiciones tras Suzuki, Mazda, Changan, GWM y Deepal.

---

### C. REDISEÑO DEL COMPARADOR (`/comparador`)
* **Resumen Comercial Superior:**
  * 🟢 **Más Económico Contado** (destaca marca, modelo y precio contado).
  * 🔵 **Más Económico Crédito** (destaca marca, modelo y precio financiamiento).
  * 🚚 **Menor Puesto en Calle** (destaca opción con menor costo llave en mano).
  * 🏷️ **Mayor Bono Cliente** (destaca mayor descuento total al cliente).
* **Desglose de Gastos Puesto en Calle por Opción:**
  * Muestra desglosado: Vehículo + Impuesto Verde + Inscripción RNVM + Flete + Permiso Circulación.
* **Separación Estricta de Bonos:**
  * `💳 Bono Marca + Crédito` (Beneficio público al cliente).
  * `💰 Apoyo Cierre Compartido (CES + Marca)` (Fondo interno de cierre de negocio sin descontar del precio público).

---

### D. EXPLORADOR DE VEHÍCULOS (`/vehiculos`)
* **Precio Desde en Tarjeta:** Calculado sobre el mínimo valor promocional o contado real de las versiones (ej: Suzuki Fronx muestra $14.490.000 en el header en lugar del precio lista de $16.990.000).
* **Desglose Neto Sin IVA:** Etiqueta explícita `🛻 Pickup / Facturable` con valor neto en facturas de empresa (`Precio / 1.19 + IVA`).
* **Precios Reales Sin Fórmulas Ficticias:** Eliminada la estimación heredada `cashPrice * 0.94` que generaba valores de financiamiento falsos. Si una versión no tiene precio de crédito en el Excel, se muestra explícitamente `Sin bono crédito`.

---

## 3. RESUMEN DE ESTADO POR PANTALLA

| # | Pantalla | Estado | Evidencia |
| :-: | :--- | :---: | :--- |
| 1 | **Login (`/login`)** | 🟢 `FUNCIONA PROBADO` | Autenticación y roles. |
| 2 | **Dashboard (`/`)** | 🟢 `FUNCIONA PROBADO` | KPIs reales y Vitoko IA. |
| 3 | **Clientes (`/clientes`)** | 🟢 `FUNCIONA PROBADO` | CRUD e integración BD. |
| 4 | **Ficha 360 (`/clientes/[id]`)** | 🟢 `FUNCIONA PROBADO` | Pestañas, timeline y recordatorios. |
| 5 | **Perfilador (`/cliente-frente-a-mi`)** | 🟢 `FUNCIONA PROBADO` | Engine unificado, Sedanes 10/10, Pickups 6/6. |
| 6 | **Agenda (`/agenda`)** | 🟢 `FUNCIONA PROBADO` | Agenda y Server Actions. |
| 7 | **Renovaciones (`/renovaciones`)** | 🟢 `FUNCIONA PROBADO` | Clasificación por vencimiento. |
| 8 | **Vehículos (`/vehiculos`)** | 🟢 `FUNCIONA PROBADO` | Puesto en calle, neto sin IVA, desde real. |
| 9 | **Comparador (`/comparador`)** | 🟢 `FUNCIONA PROBADO` | Matriz comercial + técnica + resumen 4 cards. |
| 10 | **Cotizador (`/cotizador`)** | 🟢 `FUNCIONA PROBADO` | Selección de escenarios y persistencia. |
| 11 | **Rentabilidad (`/rentabilidad`)** | 🟢 `FUNCIONA PROBADO` | Cálculo de margen y puesto en calle. |
| 12 | **Documentos (`/documentos`)** | 🟢 `FUNCIONA PROBADO` | Fichas técnicas en PDF oficial Derco. |

---

> **Certificación:** Todos los módulos comerciales de Panel360 Autos operan con **una sola fuente de verdad comercial**, con datos verificados contra los documentos Excel originales y desplegados en Vercel producción.
