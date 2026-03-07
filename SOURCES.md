# Fuentes y metodología – Bonita ROI Calculator

Este documento lista **todas las fuentes y supuestos** usados para los benchmarks, rentabilidades y proyecciones de la herramienta.

**Contexto del proyecto:** Bonita Residences tiene una playa **artificial** privada (laguna/playa de resort), no primera línea de playa natural. Las vistas "MAR/OCÉANO" son vistas **panorámicas reales al océano** (activo premium). Los yields y apreciación de "PLAYA" están corregidos a la baja frente a beachfront natural.

---

## 1. Fuentes citadas en la app

En el disclaimer del panel de proyección (ROIDisplay) se mencionan:

- **The Latin Investor (2026)** — Apreciación Cap Cana 9-12% resort; 12-18% beachfront natural.
- **Airbtics (2025)** — Ocupación mediana Punta Cana 49%; propiedades prime 65-75%.
- **PuntaCanaVilla.com (2025-2026)** — Yield bruto 6-12% Cap Cana; HOA premium +30-40% Cap Cana.
- **Global Property Guide (2025)** — RD residencial +7-12% anual.
- **OwnDominican.com (2025)** — ROI bruto 6-12% Cap Cana.
- **CONFOTUR Ley 158-01** — Exención transferencia 3%, IPI 1%×15 años, ISR alquileres 10 años.

---

## 2. Parámetros del calculador (`src/lib/roi-calculator.ts`)

### 2.1 Yield bruto anual por vista (%)

| Vista                    | Yield bruto | Origen / nota |
|--------------------------|------------|----------------|
| PLAYA                    | 7.5%       | Playa artificial de resort (laguna privada). PuntaCanaVilla.com 2025, resort 7-8%. |
| GOLF Y PLAYA             | 7.5%       | Golf + playa artificial. Benchmarks Cap Cana resort 7-8%. |
| GOLF Y PISCINA           | 7%         | Golf + piscina. The Latin Investor, golf Cap Cana 7-8%. |
| GOLF Y PISCINA + OCEANO  | 8.5%       | Vista real al océano — activo premium. +1-1.5pp vs golf interior. |
| MAR/OCEANO Y GOLF        | 8%         | Vista océano + golf. PuntaCanaVilla.com, ocean view premium Cap Cana. |
| GOLF                     | 7%         | Solo golf. Estándar Cap Cana golf course. |
| MAR/OCEANO GOLF Y PLAYA  | 8.5%       | Vista oceánica + amenities. Cap Cana top-tier 8-9%. |
| MAR/OCEANO, GOLF Y PLAYA | 8.5%       | Igual (variante nombre). |
| *Cualquier otra*         | 7%         | Valor por defecto. |

### 2.2 Apreciación anual por vista (%)

| Vista                    | Apreciación anual | Origen / nota |
|--------------------------|-------------------|----------------|
| PLAYA                    | 9%                | Playa artificial resort. The Latin Investor resort sin frente mar 9-10%. |
| GOLF Y PLAYA             | 9%                | Golf + playa artificial. Resort premium Cap Cana 9-10%. |
| GOLF Y PISCINA           | 8.5%              | Golf + amenities. The Latin Investor golf Cap Cana 8-10%. |
| GOLF Y PISCINA + OCEANO  | 11%               | Vista real océano — driver principal. 12-15% beachfront reducido. |
| MAR/OCEANO Y GOLF        | 10.5%             | Vista océano + golf. Cap Cana luxury ocean view 10-12%. |
| GOLF                     | 8.5%              | Golf interior. The Latin Investor 9-12% (conservador). |
| MAR/OCEANO GOLF Y PLAYA  | 11.5%             | Mejor combinación. Top resort Cap Cana vista mar 11-13%. |
| MAR/OCEANO, GOLF Y PLAYA | 11.5%             | Igual (variante nombre). |
| *Cualquier otra*         | 8%                | Valor por defecto. |

### 2.3 Bonos y ajustes

- **Planta (nivel):** Planta ≥ 6: +0,5% al yield bruto; Planta ≥ 4: +0,25%. Criterio interno (plantas altas, mejor vista/demanda).
- **Tipología:** Con "Hab de Servicio" / HS: +0,5% al yield; 1 Hab (principal): −0,25%. Criterio interno (rental program).

### 2.4 Gastos y costes

| Concepto               | Valor                    | Origen / nota |
|------------------------|--------------------------|---------------|
| Gestión (management)   | 22% del ingreso bruto    | Estándar gestión alquiler vacacional. |
| Cuota comunitaria HOA  | **4,5 USD/m²/mes**       | PuntaCanaVilla.com 2026, Cap Cana premium +30-40% sobre base. |
| Cuota por habitación   | 32 USD/mes por hab.      | Aprocap (Asociación de Cap Cana). Solo habitaciones principales. |
| Reserva mantenimiento  | 1% del valor de compra/año | Supuesto estándar. |

### 2.5 CONFOTUR

| Concepto                         | Valor        | Origen / nota |
|----------------------------------|-------------|---------------|
| Exención impuesto transferencia  | 3% una vez  | Régimen CONFOTUR. |
| Exención anual (IPI)             | 1% anual × 15 años | Régimen CONFOTUR. |
| Exención ISR sobre alquileres    | 10 años, tasa 27% | CONFOTUR Ley 158-01. realestate-dominicanrepublic.com 2025. |

**Ahorro ISR:** Se calcula sobre la renta neta acumulada en los primeros 10 años (o horizonte si menor) × 27% (ISR RD Ley 158-01).

### 2.6 Escenarios de ocupación

| Escenario    | Tasa | Origen / nota |
|-------------|------|----------------|
| Conservador | 52%  | Mediana real Airbnb Punta Cana (Airbtics 2025: 49%). |
| Moderado    | 65%  | Propiedades bien gestionadas Cap Cana resort. **Por defecto.** |
| Optimista   | 75%  | Premium alta temporada, gestión profesional. |

Constante en código: `OCUPACION_SCENARIOS` (`src/lib/roi-calculator.ts`).

---

## 3. Cronograma del proyecto (compra sobre plano)

- **Inicio de obra:** Octubre 2026.
- **Entrega por fase:**
  - **Sunrise:** Diciembre 2028 (aprox. 26 meses de construcción).
  - **Sunset:** Julio 2029 (aprox. 33 meses de construcción).

En el modelo de proyección:

- **Durante la construcción** (desde Oct 2026 hasta la entrega de cada fase): solo se aplica **apreciación** al valor del inmueble (plusvalía sobre plano). No hay ingresos por alquiler ni gastos de gestión/HOA de uso hasta la entrega.
- **A partir de la entrega:** se aplica apreciación año a año y se suman **renta bruta × ocupación** menos gastos (gestión 22%, HOA, cuota hab., mantenimiento). La renta neta acumulada y el retorno total incluyen solo el periodo post-entrega.
- **CONFOTUR ISR:** Los 10 años de exención sobre rentas se cuentan desde la **primera renta** (a partir de la entrega), no desde la compra.

Constantes en código: `CONSTRUCTION_START`, `SUNRISE_DELIVERY`, `SUNSET_DELIVERY`, `getConstructionYearsAndLabel()` en `src/lib/roi-calculator.ts`.

---

## 4. Cómo se generan las proyecciones

### 4.1 Rentas

- **Renta bruta anual** = Precio de compra × (Yield bruto / 100).
- **Renta bruta mensual** = Renta bruta anual / 12.
- **Renta mensual estimada (con ocupación)** = Renta bruta mensual × Tasa de ocupación (por defecto **65%** — escenario moderado).

El yield bruto es el de la tabla por vista + bonos de planta y tipología.

### 4.2 Gastos anuales

- Gestión = Renta bruta anual × 22%.
- HOA = m² × **4,5** USD/m²/mes × 12.
- Cuota habitaciones = Número de habitaciones que pagan × 32 USD/mes × 12.
- Mantenimiento = Precio compra × 1%.

**Renta neta anual** = Renta bruta anual − Gastos anuales.  
**Yield neto** = (Renta neta anual / Precio compra) × 100.

### 4.3 Proyección año a año (valor + renta acumulada)

Con **fase** (Sunrise/Sunset) — modelo sobre plano:

1. **Valor a la entrega:** Precio compra × (1 + Apreciación anual / 100)^(años de construcción). Duración construcción: Sunrise 26/12 años, Sunset 33/12 años.
2. **Año 0 (entrega):** Valor = valor a la entrega; renta acumulada = 0.
3. **Años 1 a horizonte (post-entrega):** Para cada año: valor = valor anterior × (1 + Apreciación / 100); ingresos por alquiler = valor × (Yield bruto / 100) × Ocupación; gastos = 22% gestión, HOA, cuota hab., 1% sobre valor; renta acumulada += (ingresos − gastos). **Retorno total (%)** = (Valor − Precio compra + Renta acumulada) / Precio compra × 100.

Sin fase (modelo legacy): mismo bucle desde año 1 con valor inicial = precio de compra.

### 4.4 Ahorro CONFOTUR

- Ahorro transferencia = Precio compra × 3%.
- Ahorro 15 años (IPI) = Precio compra × 1% × 15.
- Ahorro ISR = Renta neta acumulada (primeros 10 años desde la entrega, o horizonte si menor) × 27%.
- **Ahorro total CONFOTUR** = suma de los tres.

---

## 5. Dónde aparece cada cosa en el código

| Concepto                | Archivo                    | Variable / constante |
|-------------------------|----------------------------|----------------------|
| Yield por vista         | `src/lib/roi-calculator.ts`| `YIELD_BY_VISTA`     |
| Apreciación por vista   | `src/lib/roi-calculator.ts`| `APRECIACION_BY_VISTA` |
| Escenarios ocupación    | `src/lib/roi-calculator.ts`| `OCUPACION_SCENARIOS` |
| Gestión 22%             | `src/lib/roi-calculator.ts`| `MANAGEMENT_PCT`     |
| HOA 4,5 USD/m²/mes      | `src/lib/roi-calculator.ts`| `HOA_USD_PER_M2_PER_MONTH` |
| Cuota 32 USD/hab/mes    | `src/lib/roi-calculator.ts`| `ROOM_FEE_PER_MONTH` |
| CONFOTUR 3% / 1%×15 / ISR | `src/lib/roi-calculator.ts`| `CONFOTUR_*`, `ISR_RATE` |
| Bonos planta/tipología  | `src/lib/roi-calculator.ts`| `getFloorYieldBonus`, `getTipologiaYieldBonus` |
| Disclaimer y fuentes    | `src/components/ROIDisplay.tsx` | Sección Disclaimer |
| Botones escenario ocupación | `src/components/ROIDisplay.tsx` | Conservador / Moderado / Optimista + slider |

---

## 6. Resumen

- **Contexto:** PLAYA = playa artificial de resort; MAR/OCÉANO = vistas reales al océano. Yields y apreciación de playa corregidos a la baja vs. beachfront natural.
- **Fuentes:** The Latin Investor 2026, Airbtics 2025, PuntaCanaVilla.com 2025-2026, Global Property Guide 2025, OwnDominican.com 2025, CONFOTUR Ley 158-01.
- **Ocupación por defecto:** 65% (moderado). Escenarios: conservador 52%, moderado 65%, optimista 75%.
- **HOA:** 4,5 USD/m²/mes (Cap Cana premium).
- **CONFOTUR:** Transferencia 3%, IPI 1%×15 años, **exención ISR sobre rentas 10 años (27%)**.
- **Cronograma:** Inicio obra Oct 2026; entrega Sunrise Dic 2028, Sunset Jul 2029. Plusvalía durante construcción; renta solo desde la entrega. CONFOTUR ISR 10 años desde la entrega.
- Las proyecciones se generan con las fórmulas anteriores; no son garantía de rentabilidad.
