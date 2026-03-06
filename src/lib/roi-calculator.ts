/**
 * ROI calculator for Cap Cana / Bonita market.
 * Uses benchmark rules based on real Cap Cana market data.
 */

export interface ROIInputs {
  precioUSD: number;
  totalM2: number;
  vista: string;
  nivel: number;
  tipologia: string;
  ocupacionRate?: number;
  horizonte?: number;
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
  /** CONFOTUR: ahorro total estimado (transfer + 15 años). */
  savingsCONFOTUR: number;
  expenseBreakdown: ROIExpenseBreakdown;
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

/** Base gross rental yield (annual %) by vista. Default 7% for unknown vistas. */
const YIELD_BY_VISTA: Record<string, number> = {
  PLAYA: 9,
  "GOLF Y PLAYA": 8,
  "GOLF Y PISCINA": 7.5,
  "GOLF Y PISCINA + OCEANO": 8,
  "MAR Y GOLF": 7.5,
  GOLF: 7,
  "MAR GOLF Y PLAYA": 8.5,
  "MAR, GOLF Y PLAYA": 8.5,
};

/** Base appreciation (annual %) by vista. Default 7% for unknown. */
const APRECIACION_BY_VISTA: Record<string, number> = {
  PLAYA: 8,
  "GOLF Y PLAYA": 7.5,
  "GOLF Y PISCINA": 7.5,
  "GOLF Y PISCINA + OCEANO": 8,
  "MAR Y GOLF": 7.5,
  GOLF: 7.5,
  "MAR GOLF Y PLAYA": 8.5,
  "MAR, GOLF Y PLAYA": 8.5,
};

const MANAGEMENT_PCT = 0.22;
/** HOA: 3.5 USD per m² per month. */
const HOA_USD_PER_M2_PER_MONTH = 3.5;
/** 32 USD/month per bedroom (habitación) — Aprocap (Asociación de Cap Cana). Family and habitación de servicio pay 0. */
const ROOM_FEE_PER_MONTH = 32;
const MAINTENANCE_PCT = 0.01;
/** CONFOTUR: 3% exemption on property transfer tax (one-time). */
const CONFOTUR_TRANSFER_TAX_PCT = 0.03;
/** CONFOTUR: 1% annual exemption during 15 years (15% total). */
const CONFOTUR_ANNUAL_PCT = 0.01;
const CONFOTUR_ANNUAL_YEARS = 15;

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
  return APRECIACION_BY_VISTA[key] ?? 7;
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
    ocupacionRate = 0.7,
    horizonte = 5,
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

    if (valor >= precioCompra && breakEvenAños > year) {
      breakEvenAños = year;
    }
  }

  const valorFinal = valorFuturo.length ? valorFuturo[valorFuturo.length - 1] : null;
  const totalReturnHorizonte = valorFinal?.totalReturn ?? 0;
  const breakEven = breakEvenAños <= años ? breakEvenAños : años;

  const savingsCONFOTURTransfer = precioCompra * CONFOTUR_TRANSFER_TAX_PCT;
  const savingsCONFOTURAnnual =
    precioCompra * CONFOTUR_ANNUAL_PCT * CONFOTUR_ANNUAL_YEARS;
  const savingsCONFOTUR = savingsCONFOTURTransfer + savingsCONFOTURAnnual;

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
    ingresoNetoMensual: Math.round(rentaMensualEstimada * 100) / 100,
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
    savingsCONFOTUR: Math.round(savingsCONFOTUR * 100) / 100,
    expenseBreakdown,
  };
}
