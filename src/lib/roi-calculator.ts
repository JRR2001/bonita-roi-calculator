/**
 * ROI calculator for Cap Cana / Bonita market.
 * Benchmarks corregidos: playa artificial (no beachfront); vistas MAR/OCÉANO = vistas reales al océano.
 * Fuentes: The Latin Investor 2026, PuntaCanaVilla.com 2025-2026, Airbtics 2025, Global Property Guide 2025, OwnDominican.com 2025, CONFOTUR Ley 158-01.
 */

/** Escenarios de ocupación (Airbtics 2025: mediana 49%; prime 65-75%). Por defecto: moderado. */
export const OCUPACION_SCENARIOS = {
  conservador: 0.52, // Mediana real Airbnb Punta Cana (Airbtics 2025: 49%)
  moderado: 0.65, // Propiedades bien gestionadas Cap Cana resort
  optimista: 0.75, // Premium alta temporada, gestión profesional
} as const;

export type OcupacionScenario = keyof typeof OCUPACION_SCENARIOS;

/** Fase del proyecto: determina fecha de entrega y duración de construcción. */
export type FaseROI = "Sunrise" | "Sunset";

export interface ROIInputs {
  precioUSD: number;
  totalM2: number;
  vista: string;
  nivel: number;
  tipologia: string;
  ocupacionRate?: number;
  horizonte?: number;
  /** Si se indica, se aplica modelo sobre plano: plusvalía durante construcción, renta solo desde entrega. */
  fase?: FaseROI;
}

export interface ValorFuturoYear {
  year: number;
  valor: number;
  rentaAcumulada: number;
  totalReturn: number; // percentage: (capital gain + rentaAcumulada) / precioCompra * 100
}

export interface ROIResult {
  precioCompra: number;
  precioM2: number;
  rentaBrutaMensual: number;
  rentaBrutaAnual: number;
  gastosAnuales: number;
  rentaNetaAnual: number;
  yieldBruto: number;
  yieldNeto: number;
  apreciacionAnual: number;
  valorFuturo: ValorFuturoYear[];
  totalReturnHorizonte: number;
  rentaMensualEstimada: number;
  breakEvenAños: number;
  /** CONFOTUR: ahorro por exención impuesto transferencia (3% una vez). */
  savingsCONFOTURTransfer: number;
  /** CONFOTUR: ahorro por exención 1% anual durante 15 años. */
  savingsCONFOTURAnnual: number;
  /** CONFOTUR: ahorro por exención ISR sobre rentas (10 años, 27%). */
  savingsCONFOTURISR: number;
  /** CONFOTUR: ahorro total estimado (transfer + 15 años + ISR 10 años). */
  savingsCONFOTUR: number;
  expenseBreakdown: ROIExpenseBreakdown;
  /** Solo si fase: años desde inicio obra hasta entrega (plusvalía sin renta). */
  constructionYears?: number;
  /** Solo si fase: etiqueta de fecha de entrega, p. ej. "Dic 2028". */
  deliveryLabel?: string;
  /** true cuando se usa modelo sobre plano (fase definida). */
  isOffPlan?: boolean;
}

/** Expense breakdown for display (annual and monthly). */
export interface ROIExpenseBreakdown {
  ingresoBrutoAnual: number;
  ingresoBrutoMensual: number;
  gestionAnual: number;
  gestionMensual: number;
  cuotaComunitariaAnual: number;
  cuotaComunitariaMensual: number;
  reservaMantenimientoAnual: number;
  reservaMantenimientoMensual: number;
  ingresoNetoAnual: number;
  ingresoNetoMensual: number;
}

/** Base gross rental yield (annual %) by vista. Playa = artificial resort; MAR/OCÉANO = vista real al océano. Default 7%. */
const YIELD_BY_VISTA: Record<string, number> = {
  PLAYA: 7.5, // Playa artificial de resort (laguna privada) — PuntaCanaVilla.com 2025, resort 7-8%
  "GOLF Y PLAYA": 7.5, // Golf + playa artificial — benchmarks Cap Cana resort 7-8%
  "GOLF Y PISCINA": 7, // Golf + piscina — The Latin Investor, golf Cap Cana 7-8%
  "GOLF Y PISCINA + OCEANO": 8.5, // Vista real al océano — activo premium, +1-1.5pp vs golf interior
  "MAR Y GOLF": 8, // Vista océano + golf — PuntaCanaVilla.com, ocean view premium Cap Cana
  GOLF: 7, // Solo golf — estándar Cap Cana golf course
  "MAR GOLF Y PLAYA": 8.5, // Vista oceánica + amenities — Cap Cana top-tier 8-9%
  "MAR, GOLF Y PLAYA": 8.5, // Igual (variante nombre)
};

/** Base appreciation (annual %) by vista. Playa artificial no equivale a beachfront natural. Default 8%. */
const APRECIACION_BY_VISTA: Record<string, number> = {
  PLAYA: 9, // Playa artificial resort — The Latin Investor resort sin frente mar 9-10%
  "GOLF Y PLAYA": 9, // Golf + playa artificial — resort premium Cap Cana 9-10%
  "GOLF Y PISCINA": 8.5, // Golf + amenities — The Latin Investor golf Cap Cana 8-10%
  "GOLF Y PISCINA + OCEANO": 11, // Vista real océano — driver principal; 12-15% beachfront reducido
  "MAR Y GOLF": 10.5, // Vista océano + golf — Cap Cana luxury ocean view 10-12%
  GOLF: 8.5, // Golf interior — The Latin Investor 9-12% (conservador interior)
  "MAR GOLF Y PLAYA": 11.5, // Mejor combinación — top resort Cap Cana vista mar 11-13%
  "MAR, GOLF Y PLAYA": 11.5, // Igual (variante nombre)
};

/** Gestión alquiler vacacional: 22% del ingreso bruto. Usado en calculador y desglose. */
export const MANAGEMENT_PCT = 0.22;
/** Cuota comunitaria HOA: 3.5 USD por m² por mes (Bonita Residences). */
const HOA_USD_PER_M2_PER_MONTH = 3.5;
/** 32 USD/month per bedroom (habitación) — Aprocap (Asociación de Cap Cana). Family and habitación de servicio pay 0. */
const ROOM_FEE_PER_MONTH = 32;
const MAINTENANCE_PCT = 0.01;
/** CONFOTUR: 3% exemption on property transfer tax (one-time). */
const CONFOTUR_TRANSFER_TAX_PCT = 0.03;
/** CONFOTUR: 1% annual exemption during 15 years (15% total). */
const CONFOTUR_ANNUAL_PCT = 0.01;
const CONFOTUR_ANNUAL_YEARS = 15;
/** CONFOTUR: exención ISR sobre rentas de alquiler (Ley 158-01). realestate-dominicanrepublic.com 2025. */
const CONFOTUR_ISR_YEARS = 10;
/** Tasa ISR RD (Ley 158-01) aplicable a rentas. */
const ISR_RATE = 0.27;

/** Inicio de obra: octubre 2026. Entregas: Sunrise diciembre 2028, Sunset julio 2029. */
const CONSTRUCTION_START = { year: 2026, month: 10 };
const SUNRISE_DELIVERY = { year: 2028, month: 12 };
const SUNSET_DELIVERY = { year: 2029, month: 7 };

function getConstructionYearsAndLabel(fase: FaseROI): { years: number; label: string } {
  const startMonths = CONSTRUCTION_START.year * 12 + CONSTRUCTION_START.month;
  if (fase === "Sunrise") {
    const endMonths = SUNRISE_DELIVERY.year * 12 + SUNRISE_DELIVERY.month;
    return { years: (endMonths - startMonths) / 12, label: "Dic 2028" };
  }
  const endMonths = SUNSET_DELIVERY.year * 12 + SUNSET_DELIVERY.month;
  return { years: (endMonths - startMonths) / 12, label: "Jul 2029" };
}

/**
 * Number of bedrooms that pay the 32 USD/month fee.
 * Only main "Hab" / "Habitaciones" count; Family and Hab de Servicio pay zero.
 * e.g. "1 Hab + Hab de Servicio" → 1, "2 Hab + Family + Hab de Servicio" → 2.
 */
function getBillableHabitaciones(tipologia: string): number {
  const match = tipologia.trim().match(/(\d+)\s*Hab(?:itaciones)?/i);
  if (!match) return 0;
  return Math.max(0, parseInt(match[1], 10));
}

function normalizeVista(vista: string): string {
  let key = vista.toUpperCase().trim();
  // Unificar OCEANO → MAR para lookup (las claves del mapa usan MAR)
  key = key.replace(/\bOCEANO\b/g, "MAR");
  if (key === "GOLF, PISCINA Y MAR") key = "GOLF Y PISCINA + OCEANO";
  return key;
}

function getBaseYield(vista: string): number {
  const key = normalizeVista(vista);
  return YIELD_BY_VISTA[key] ?? 7;
}

function getBaseApreciacion(vista: string): number {
  const key = normalizeVista(vista);
  return APRECIACION_BY_VISTA[key] ?? 8;
}

/** Floor multiplier: nivel >= 6 adds +0.5%, nivel >= 4 adds +0.25%. */
function getFloorYieldBonus(nivel: number): number {
  if (nivel >= 6) return 0.5;
  if (nivel >= 4) return 0.25;
  return 0;
}

/** Tipologia: "2 Hab HS" / hotel service +0.5%, "1 Hab" -0.25%. */
function getTipologiaYieldBonus(tipologia: string): number {
  const t = tipologia.toUpperCase();
  if (t.includes("HAB") && (t.includes("SERVICIO") || t.includes("HS"))) return 0.5;
  if (t.includes("1 HAB") || t.startsWith("1 HAB")) return -0.25;
  return 0;
}

export function calculateROI(input: ROIInputs): ROIResult {
  const {
    precioUSD,
    totalM2,
    vista,
    nivel,
    tipologia,
    ocupacionRate = OCUPACION_SCENARIOS.moderado,
    horizonte = 5,
    fase,
  } = input;

  const ocupacion = Math.min(0.9, Math.max(0.5, ocupacionRate));
  const años = Math.min(10, Math.max(1, Math.round(horizonte)));

  const precioCompra = precioUSD;
  const precioM2 = totalM2 > 0 ? precioCompra / totalM2 : 0;

  const yieldBruto =
    getBaseYield(vista) + getFloorYieldBonus(nivel) + getTipologiaYieldBonus(tipologia);
  const rentaBrutaAnual = (precioCompra * yieldBruto) / 100;
  const rentaBrutaMensual = rentaBrutaAnual / 12;
  const rentaMensualEstimada = rentaBrutaMensual * ocupacion;

  const managementCost = rentaBrutaAnual * MANAGEMENT_PCT;
  const hoaAnual = totalM2 * HOA_USD_PER_M2_PER_MONTH * 12;
  const roomFeeAnual = getBillableHabitaciones(tipologia) * ROOM_FEE_PER_MONTH * 12;
  const maintenanceAnual = precioCompra * MAINTENANCE_PCT;
  const gastosAnuales = managementCost + hoaAnual + roomFeeAnual + maintenanceAnual;

  const rentaNetaAnual = rentaBrutaAnual - gastosAnuales;
  const yieldNeto = precioCompra > 0 ? (rentaNetaAnual / precioCompra) * 100 : 0;

  const apreciacionAnual = getBaseApreciacion(vista);

  const valorFuturo: ValorFuturoYear[] = [];
  let valor = precioCompra;
  let rentaAcumulada = 0;
  let breakEvenAños = años + 1;
  let constructionYears: number | undefined;
  let deliveryLabel: string | undefined;
  const isOffPlan = Boolean(fase);

  if (fase) {
    const { years: constructionY, label: deliveryL } =
      getConstructionYearsAndLabel(fase);
    constructionYears = constructionY;
    deliveryLabel = deliveryL;
    // Plusvalía durante construcción (sin renta). Valor a la entrega.
    const valorAtDelivery =
      precioCompra * Math.pow(1 + apreciacionAnual / 100, constructionY);
    valorFuturo.push({
      year: 0,
      valor: Math.round(valorAtDelivery * 100) / 100,
      rentaAcumulada: 0,
      totalReturn:
        precioCompra > 0
          ? Math.round(
              ((valorAtDelivery - precioCompra) / precioCompra) * 100 * 100
            ) / 100
          : 0,
    });
    valor = valorAtDelivery;
    breakEvenAños = 0; // Plusvalía ya reflejada a la entrega
  }

  for (let year = 1; year <= años; year++) {
    valor = valor * (1 + apreciacionAnual / 100);
    const rentaAnualThisYear = (valor * (yieldBruto / 100)) * ocupacion;
    const gastosThisYear =
      rentaAnualThisYear * MANAGEMENT_PCT +
      hoaAnual +
      roomFeeAnual +
      valor * MAINTENANCE_PCT;
    rentaAcumulada += Math.max(0, rentaAnualThisYear - gastosThisYear);
    const totalReturnPct =
      precioCompra > 0
        ? ((valor - precioCompra + rentaAcumulada) / precioCompra) * 100
        : 0;

    valorFuturo.push({
      year,
      valor: Math.round(valor * 100) / 100,
      rentaAcumulada: Math.round(rentaAcumulada * 100) / 100,
      totalReturn: Math.round(totalReturnPct * 100) / 100,
    });

    if (!isOffPlan && valor >= precioCompra && breakEvenAños > year) {
      breakEvenAños = year;
    }
  }

  const valorFinal = valorFuturo.length ? valorFuturo[valorFuturo.length - 1] : null;
  const totalReturnHorizonte = valorFinal?.totalReturn ?? 0;
  const breakEven = breakEvenAños <= años ? breakEvenAños : años;

  const savingsCONFOTURTransfer = precioCompra * CONFOTUR_TRANSFER_TAX_PCT;
  const savingsCONFOTURAnnual =
    precioCompra * CONFOTUR_ANNUAL_PCT * CONFOTUR_ANNUAL_YEARS;
  // ISR: exención sobre rentas en los primeros 10 años desde la ENTREGA (no desde compra)
  const añosParaISR = Math.min(años, CONFOTUR_ISR_YEARS);
  const idxRenta10 =
    isOffPlan ? añosParaISR : añosParaISR - 1; // off-plan: valorFuturo[0]=entrega, [1..años]=post; sin fase: [0..años-1]=año 1..años
  const rentaNetaAcumuladaPrimeros10 =
    valorFuturo[idxRenta10]?.rentaAcumulada ?? valorFinal?.rentaAcumulada ?? 0;
  const savingsCONFOTURISR = rentaNetaAcumuladaPrimeros10 * ISR_RATE;
  const savingsCONFOTUR =
    savingsCONFOTURTransfer + savingsCONFOTURAnnual + savingsCONFOTURISR;

  // Ingreso neto mensual = rentaNetaAnual/12 para que la tabla cuadre (Ingreso bruto - gastos = Ingreso neto).
  const ingresoNetoMensualTabla = rentaNetaAnual / 12;
  const expenseBreakdown: ROIExpenseBreakdown = {
    ingresoBrutoAnual: Math.round(rentaBrutaAnual * 100) / 100,
    ingresoBrutoMensual: Math.round(rentaBrutaMensual * 100) / 100,
    gestionAnual: Math.round(managementCost * 100) / 100,
    gestionMensual: Math.round((managementCost / 12) * 100) / 100,
    cuotaComunitariaAnual: Math.round((hoaAnual + roomFeeAnual) * 100) / 100,
    cuotaComunitariaMensual: Math.round((hoaAnual + roomFeeAnual) / 12 * 100) / 100,
    reservaMantenimientoAnual: Math.round(maintenanceAnual * 100) / 100,
    reservaMantenimientoMensual: Math.round((maintenanceAnual / 12) * 100) / 100,
    ingresoNetoAnual: Math.round(rentaNetaAnual * 100) / 100,
    ingresoNetoMensual: Math.round(ingresoNetoMensualTabla * 100) / 100,
  };

  return {
    precioCompra,
    precioM2: Math.round(precioM2 * 100) / 100,
    rentaBrutaMensual: Math.round(rentaBrutaMensual * 100) / 100,
    rentaBrutaAnual: Math.round(rentaBrutaAnual * 100) / 100,
    gastosAnuales: Math.round(gastosAnuales * 100) / 100,
    rentaNetaAnual: Math.round(rentaNetaAnual * 100) / 100,
    yieldBruto: Math.round(yieldBruto * 100) / 100,
    yieldNeto: Math.round(yieldNeto * 100) / 100,
    apreciacionAnual: Math.round(apreciacionAnual * 100) / 100,
    valorFuturo,
    totalReturnHorizonte,
    rentaMensualEstimada: Math.round(rentaMensualEstimada * 100) / 100,
    breakEvenAños: breakEven,
    savingsCONFOTURTransfer: Math.round(savingsCONFOTURTransfer * 100) / 100,
    savingsCONFOTURAnnual: Math.round(savingsCONFOTURAnnual * 100) / 100,
    savingsCONFOTURISR: Math.round(savingsCONFOTURISR * 100) / 100,
    savingsCONFOTUR: Math.round(savingsCONFOTUR * 100) / 100,
    expenseBreakdown,
    ...(isOffPlan && {
      constructionYears,
      deliveryLabel,
      isOffPlan: true,
    }),
  };
}
