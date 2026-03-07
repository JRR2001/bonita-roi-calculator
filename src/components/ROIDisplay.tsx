"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { calculateROI, OCUPACION_SCENARIOS, MANAGEMENT_PCT } from "@/lib/roi-calculator";
import type { Unit } from "@/data/units";
import { getEffectiveVista } from "@/data/units";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { ValorFuturoYear } from "@/lib/roi-calculator";
import { cn } from "@/lib/utils";

const NAVY = "#0D1B2A";
const GOLD = "#C9A96E";
const BONE = "#F8F5F0";

interface ROIDisplayProps {
  unit: Unit;
  onBack?: () => void;
}

/** Etiqueta según franja: 50–69% Conservador, 70–84% Moderado, 85%+ Optimista. */
function ocupacionLabel(pct: number): string {
  if (pct >= 85) return "Optimista";
  if (pct >= 70) return "Moderado";
  return "Conservador";
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Facade render path by fase (Sunrise / Sunset). */
function getFacadeImagePath(fase: string): string | null {
  const f = fase.toLowerCase();
  if (f === "sunrise") return "/images/facades/sunrise.png";
  if (f === "sunset") return "/images/facades/sunset.png";
  return null;
}

/** Floor plan path by tipologia. Matches unit.tipologia from data. */
function getPlanoImagePath(tipologia: string): string | null {
  const t = tipologia.trim();
  if (t === "1 Hab + Hab de Servicio") return "/images/planos/1-hab-hab-servicio.png";
  if (t === "2 Habitaciones") return "/images/planos/2-habitaciones.png";
  if (t === "2 Hab + HS") return "/images/planos/2-hab-hab-servicio.png";
  if (t === "2 Hab + Family + Hab de Servicio") return "/images/planos/2-hab-family-hab-servicio.png";
  if (t === "4 + Hab de Servicio") return null; // no plano asset yet
  if (t.includes("Family") && t.includes("Servicio")) return "/images/planos/2-hab-family-hab-servicio.png";
  if (t.includes("Hab de Servicio") && t.startsWith("1")) return "/images/planos/1-hab-hab-servicio.png";
  if (t.includes("Hab + HS") || (t.includes("Hab de Servicio") && t.startsWith("2"))) return "/images/planos/2-hab-hab-servicio.png";
  if (t.startsWith("2 Habitaciones")) return "/images/planos/2-habitaciones.png";
  return null;
}

export function ROIDisplay({ unit, onBack }: ROIDisplayProps) {
  const [ocupacionPct, setOcupacionPct] = useState(
    Math.round(OCUPACION_SCENARIOS.moderado * 100)
  );
  const [horizonte, setHorizonte] = useState(5);

  const effectiveVista = getEffectiveVista(unit);
  const roi = useMemo(
    () =>
      calculateROI({
        precioUSD: unit.precioUSD,
        totalM2: unit.totalM2,
        vista: effectiveVista,
        nivel: unit.nivel,
        tipologia: unit.tipologia,
        ocupacionRate: ocupacionPct / 100,
        horizonte,
        fase: unit.fase,
      }),
    [unit, effectiveVista, ocupacionPct, horizonte]
  );

  const animationKey = `${unit.id}-${ocupacionPct}-${horizonte}`;
  const valorEnNAnos =
    roi.isOffPlan && roi.valorFuturo.length > horizonte
      ? roi.valorFuturo[horizonte]?.valor ?? roi.valorFuturo[roi.valorFuturo.length - 1]?.valor ?? 0
      : roi.valorFuturo.length >= horizonte
        ? roi.valorFuturo[horizonte - 1]?.valor ?? 0
        : roi.valorFuturo[roi.valorFuturo.length - 1]?.valor ?? 0;
  const b = roi.expenseBreakdown;

  // Desglose según ocupación — mismo valor de referencia que el primer año de la proyección (gráfico)
  const breakdownConOcupacion = useMemo(() => {
    const ocupacion = ocupacionPct / 100;
    const valorRef = roi.valorReferenciaPrimerAño > 0 ? roi.valorReferenciaPrimerAño : roi.precioCompra;
    const ingresoBrutoAnual = (valorRef * (roi.yieldBruto / 100)) * ocupacion;
    const ingresoBrutoMensual = ingresoBrutoAnual / 12;
    const gestionAnual = ingresoBrutoAnual * MANAGEMENT_PCT;
    const gestionMensual = gestionAnual / 12;
    const cuotaAnual = b.cuotaComunitariaAnual;
    const cuotaMensual = b.cuotaComunitariaMensual;
    const mantenimientoAnual = valorRef * 0.01;
    const mantenimientoMensual = mantenimientoAnual / 12;
    const ingresoNetoAnual = ingresoBrutoAnual - gestionAnual - cuotaAnual - mantenimientoAnual;
    const ingresoNetoMensual = ingresoNetoAnual / 12;
    return {
      ingresoBrutoAnual,
      ingresoBrutoMensual,
      gestionAnual,
      gestionMensual,
      cuotaAnual,
      cuotaMensual,
      mantenimientoAnual,
      mantenimientoMensual,
      ingresoNetoAnual,
      ingresoNetoMensual,
    };
  }, [roi.valorReferenciaPrimerAño, roi.precioCompra, roi.yieldBruto, b.cuotaComunitariaAnual, ocupacionPct]);

  // Valores al horizonte seleccionado (para resumen bajo la tabla)
  const proyeccionAlHorizonte = useMemo(() => {
    const last = roi.isOffPlan
      ? roi.valorFuturo[horizonte] ?? roi.valorFuturo[roi.valorFuturo.length - 1]
      : roi.valorFuturo[horizonte - 1];
    return last
      ? { valor: last.valor, rentaNetaAcumulada: last.rentaAcumulada }
      : { valor: roi.precioCompra, rentaNetaAcumulada: 0 };
  }, [roi.valorFuturo, horizonte, roi.precioCompra, roi.isOffPlan]);

  // Punto inicial + proyección. Nombres cortos en eje X para evitar solapamientos.
  const chartData = useMemo(() => {
    if (roi.isOffPlan && roi.deliveryLabel) {
      const hasta = horizonte + 1;
      return [
        { name: "Inicio", nameTooltip: "Inicio obra (Oct 26)", year: -1, valor: roi.precioCompra, rentaAcumulada: 0 },
        ...roi.valorFuturo.slice(0, hasta).map((row: ValorFuturoYear) => ({
          name: row.year === 0 ? "Entrega" : `Año ${row.year}`,
          nameTooltip: row.year === 0 ? `Entrega (${roi.deliveryLabel})` : `Año ${row.year}`,
          year: row.year,
          valor: row.valor,
          rentaAcumulada: row.rentaAcumulada,
        })),
      ];
    }
    return [
      { name: "Hoy", nameTooltip: "Hoy", year: 0, valor: roi.precioCompra, rentaAcumulada: 0 },
      ...roi.valorFuturo.slice(0, horizonte).map((row: ValorFuturoYear) => ({
        name: `Año ${row.year}`,
        nameTooltip: `Año ${row.year}`,
        year: row.year,
        valor: row.valor,
        rentaAcumulada: row.rentaAcumulada,
      })),
    ];
  }, [roi.isOffPlan, roi.deliveryLabel, roi.precioCompra, roi.valorFuturo, horizonte]);

  const precioCompraLabel =
    roi.precioCompra >= 1_000_000
      ? `Precio compra ($${(roi.precioCompra / 1_000_000).toFixed(1)}M)`
      : `Precio compra ($${(roi.precioCompra / 1_000).toFixed(0)}k)`;

  return (
    <div className="min-h-screen bg-[#0D1B2A]" style={{ fontFamily: "var(--font-inter)" }}>
      {/* Back button */}
      {onBack && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-[#C9A96E] hover:bg-white/5 -ml-2"
            onClick={onBack}
          >
            ← Cambiar unidad
          </Button>
        </div>
      )}

      {/* SECTION 1: Unit Header */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div
          className="rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
          style={{ backgroundColor: NAVY }}
        >
          <div>
            <h1
              className="text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
            >
              {unit.id.replace(/([A-Za-z]+)(\d+)/, "$1 $2")}
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {unit.fase} · Nivel {unit.nivel} · {effectiveVista} · {unit.tipologia}
            </p>
          </div>
          <div className="text-center text-white/80 text-sm md:text-base">
            <span className="font-medium text-white">{unit.interiorM2} m²</span> interior
            <span className="mx-2">|</span>
            <span className="font-medium text-white">{unit.terrazaM2} m²</span> terraza
            <span className="mx-2">|</span>
            <span className="font-medium text-white">{unit.totalM2} m²</span> total
          </div>
          <div className="text-right">
            <p
              className="text-2xl md:text-3xl font-semibold"
              style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
            >
              ${unit.precioUSD.toLocaleString("en-US")} USD
            </p>
            <p className="text-sm text-white/60 mt-1">
              Precio por m²: ${formatUSD(roi.precioM2)}/m²
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1b: Facade render + Floor plan (squared layout) */}
      {(getFacadeImagePath(unit.fase) || getPlanoImagePath(unit.tipologia)) && (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getFacadeImagePath(unit.fase) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden border border-[#C9A96E]/20 bg-[#0D1B2A]"
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={getFacadeImagePath(unit.fase)!}
                    alt={`Fachada ${unit.fase} - Bonita Residences`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                <p
                  className="py-3 px-4 text-sm text-white/80 border-t border-white/10"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Render de fachada · {unit.fase}
                </p>
              </motion.div>
            )}
            {getPlanoImagePath(unit.tipologia) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="rounded-2xl overflow-hidden border border-[#C9A96E]/20 bg-[#0D1B2A]"
              >
                <div className="aspect-[4/3] relative bg-[#F8F5F0]">
                  <Image
                    src={getPlanoImagePath(unit.tipologia)!}
                    alt={`Plano ${unit.tipologia} - Bonita Residences`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                <p
                  className="py-3 px-4 text-sm text-white/80 border-t border-white/10"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Plano de tipología · {unit.tipologia}
                </p>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: Projection Controls */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Ocupación estimada
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(
                [
                  {
                    key: "conservador" as const,
                    label: "Conservador",
                    pct: Math.round(OCUPACION_SCENARIOS.conservador * 100),
                  },
                  {
                    key: "moderado" as const,
                    label: "Moderado",
                    pct: Math.round(OCUPACION_SCENARIOS.moderado * 100),
                  },
                  {
                    key: "optimista" as const,
                    label: "Optimista",
                    pct: Math.round(OCUPACION_SCENARIOS.optimista * 100),
                  },
                ] as const
              ).map(({ key, label, pct }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOcupacionPct(pct)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                    ocupacionPct === pct
                      ? "bg-[#C9A96E] text-[#0D1B2A]"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  )}
                >
                  {label} ({pct}%)
                </button>
              ))}
            </div>
            <Slider
              value={[ocupacionPct]}
              onValueChange={([v]) => setOcupacionPct(v)}
              min={50}
              max={95}
              step={1}
              className="py-4"
            />
            <p className="text-sm mt-1" style={{ color: GOLD }}>
              {ocupacionLabel(ocupacionPct)} · {ocupacionPct}%
            </p>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Horizonte de inversión
            </label>
            <Slider
              value={[horizonte]}
              onValueChange={([v]) => setHorizonte(v)}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
            <p className="text-sm mt-1" style={{ color: GOLD }}>
              {horizonte} año{horizonte !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: KPI Cards (2x3) */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Renta Mensual Estimada",
              value: roi.rentaMensualEstimada,
              prefix: "$",
              suffix: "/mo",
              decimals: 0,
              subtitle: "Ingreso neto esperado por ocupación",
            },
            {
              label: "Yield Bruto Anual",
              value: roi.yieldBruto,
              prefix: "",
              suffix: "%",
              decimals: 1,
              subtitle: "Renta bruta anual sobre precio de compra",
            },
            {
              label: "Yield Neto Anual",
              value: roi.yieldNeto,
              prefix: "",
              suffix: "%",
              decimals: 1,
              subtitle: "Después de gestión, cuota y mantenimiento",
            },
            {
              label: "Apreciación Anual",
              value: roi.apreciacionAnual,
              prefix: "",
              suffix: "%",
              decimals: 1,
              subtitle: "Crecimiento de valor histórico en Cap Cana",
            },
            {
              label: `Valor Estimado en ${horizonte} años`,
              value: valorEnNAnos,
              prefix: "$",
              suffix: "",
              decimals: 0,
              subtitle: roi.isOffPlan
                ? `${horizonte} años tras la entrega (${roi.deliveryLabel ?? ""})`
                : "Proyección de valor del inmueble",
            },
            {
              label: `Retorno Total en ${horizonte} años`,
              value: roi.totalReturnHorizonte,
              prefix: "+",
              suffix: "%",
              decimals: 1,
              subtitle: "Plusvalía + renta acumulada sobre compra",
            },
          ].map((card, index) => (
            <motion.div
              key={`${animationKey}-${card.label}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="rounded-xl p-5 border border-[#C9A96E]/20"
              style={{ backgroundColor: BONE }}
            >
              <p className="text-xs uppercase tracking-wider text-[#0D1B2A]/70 font-medium">
                {card.label}
              </p>
              <p
                className="mt-2 text-3xl md:text-4xl font-semibold tabular-nums"
                style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
              >
                {card.prefix}
                <NumberTicker
                  key={`ticker-${animationKey}-${card.label}`}
                  value={card.value}
                  decimalPlaces={card.decimals}
                  className="inline-block"
                />
                {card.suffix && (
                  <span className="text-lg font-normal text-[#0D1B2A]/50 ml-0.5">
                    {card.suffix}
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-[#0D1B2A]/60">{card.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Projection Chart */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2
          className="text-xl mb-1"
          style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
        >
          Proyección de valor e ingresos
        </h2>
        <p className="text-sm text-white/50 mb-4">
          Valor de la propiedad (eje izquierdo) y renta neta acumulada (eje derecho) según la
          ocupación ({ocupacionPct}%) y el horizonte ({horizonte} años) seleccionados.
          {roi.isOffPlan && roi.deliveryLabel && (
            <> Inicio obra Oct 2026. La renta comienza a la entrega ({unit.fase} {roi.deliveryLabel}).</>
          )}
        </p>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: NAVY }}>
          <div style={{ width: "100%", height: 440 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 28, right: 72, bottom: 40, left: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="rgba(255,255,255,0.06)"
                  vertical
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={40}
                  tickMargin={10}
                />
                <YAxis
                  yAxisId="valor"
                  orientation="left"
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`
                  }
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickCount={5}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="renta"
                  orientation="right"
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}k`
                  }
                  tick={{ fill: GOLD, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickCount={5}
                  tickMargin={8}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const label = (d as { nameTooltip?: string }).nameTooltip ?? d.name;
                    return (
                      <div
                        className="rounded-lg border px-4 py-3 shadow-xl text-sm z-50"
                        style={{
                          backgroundColor: NAVY,
                          borderColor: "rgba(201, 169, 110, 0.4)",
                        }}
                      >
                        <p className="text-white/90 font-medium">{label}</p>
                        <p className="text-white/85 mt-1.5">
                          Valor:{" "}
                          <span style={{ color: "rgba(255,255,255,0.95)" }}>
                            ${(d.valor as number).toLocaleString("en-US")}
                          </span>
                        </p>
                        <p className="text-white/80 mt-0.5">
                          Renta acumulada:{" "}
                          <span style={{ color: GOLD }}>
                            ${(d.rentaAcumulada as number).toLocaleString("en-US")}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  yAxisId="valor"
                  y={roi.precioCompra}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: precioCompraLabel,
                    position: "left",
                    fill: GOLD,
                    fontSize: 9,
                  }}
                />
                {roi.isOffPlan && chartData[1]?.name && (
                  <ReferenceLine
                    x={chartData[1].name}
                    stroke="rgba(255,255,255,0.3)"
                    strokeDasharray="3 3"
                    label={{
                      value: "Entrega",
                      position: "top",
                      fill: "rgba(255,255,255,0.8)",
                      fontSize: 9,
                    }}
                  />
                )}
                <Line
                  yAxisId="valor"
                  type="monotone"
                  dataKey="valor"
                  name="Valor de la propiedad"
                  stroke="rgba(255,255,255,0.92)"
                  strokeWidth={2.5}
                  dot={{ fill: NAVY, stroke: "rgba(255,255,255,0.92)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Line
                  yAxisId="renta"
                  type="monotone"
                  dataKey="rentaAcumulada"
                  name="Renta neta acumulada"
                  stroke={GOLD}
                  strokeWidth={2}
                  dot={{ fill: NAVY, stroke: GOLD, strokeWidth: 2, r: 3.5 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
                <Legend
                  wrapperStyle={{ paddingTop: 28 }}
                  formatter={(value) => (
                    <span
                      className="italic text-sm"
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        color: "rgba(255,255,255,0.82)",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 5: Rental Income Breakdown — actualiza con ocupación y horizonte */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-white/50 mb-3">
          Desglose anual y mensual según ocupación <strong className="text-white/70">{ocupacionPct}%</strong>.
          Al cambiar ocupación u horizonte arriba, esta tabla y el gráfico se actualizan.
          {roi.isOffPlan && (
            <span className="block mt-2 text-white/60">
              Los ingresos se refieren al periodo una vez entregada la unidad (Sunrise Dic 2028, Sunset Jul 2029).
              El desglose usa el mismo valor del inmueble que el punto «Año 1» del gráfico.
            </span>
          )}
        </p>
        <div
          className="rounded-xl overflow-hidden border border-[#C9A96E]/20"
          style={{ backgroundColor: BONE }}
        >
          <table className="w-full text-left" style={{ fontFamily: "var(--font-inter)" }}>
            <thead>
              <tr className="border-b border-[#0D1B2A]/10">
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-[#0D1B2A]/70 font-medium">
                  Concepto
                </th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-[#0D1B2A]/70 font-medium text-right">
                  Anual
                </th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-[#0D1B2A]/70 font-medium text-right">
                  Mensual
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-[#0D1B2A]/10">
                <td className="py-3 px-4 text-[#0D1B2A]">Ingreso bruto estimado ({ocupacionPct}% ocupación)</td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  ${formatUSD(breakdownConOcupacion.ingresoBrutoAnual)}
                </td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  ${formatUSD(breakdownConOcupacion.ingresoBrutoMensual)}
                </td>
              </tr>
              <tr className="border-b border-[#0D1B2A]/10">
                <td className="py-3 px-4 text-[#0D1B2A]">Tarifa de gestión (22%)</td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.gestionAnual)}
                </td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.gestionMensual)}
                </td>
              </tr>
              <tr className="border-b border-[#0D1B2A]/10">
                <td className="py-3 px-4 text-[#0D1B2A]">Cuota comunitaria</td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.cuotaAnual)}
                </td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.cuotaMensual)}
                </td>
              </tr>
              <tr className="border-b border-[#0D1B2A]/10">
                <td className="py-3 px-4 text-[#0D1B2A]">Reserva mantenimiento (1%)</td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.mantenimientoAnual)}
                </td>
                <td className="py-3 px-4 text-right text-[#0D1B2A]">
                  -${formatUSD(breakdownConOcupacion.mantenimientoMensual)}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-semibold text-[#0D1B2A]">Ingreso neto estimado</td>
                <td className="py-4 px-4 text-right font-semibold" style={{ color: GOLD }}>
                  ${formatUSD(breakdownConOcupacion.ingresoNetoAnual)}
                </td>
                <td className="py-4 px-4 text-right font-semibold" style={{ color: GOLD }}>
                  ${formatUSD(breakdownConOcupacion.ingresoNetoMensual)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-white/50 mt-3">
          {roi.isOffPlan ? (
            <>Proyección a <strong className="text-white/70">{horizonte} años tras la entrega</strong> (último punto del gráfico): valor estimado{" "}
            <strong style={{ color: GOLD }}>${formatUSD(proyeccionAlHorizonte.valor)}</strong>
            {" "}· Renta neta acumulada{" "}
            <strong style={{ color: GOLD }}>${formatUSD(proyeccionAlHorizonte.rentaNetaAcumulada)}</strong>.</>
          ) : (
            <>Proyección a <strong className="text-white/70">{horizonte} años</strong> (último punto del gráfico): valor estimado{" "}
            <strong style={{ color: GOLD }}>${formatUSD(proyeccionAlHorizonte.valor)}</strong>
            {" "}· Renta neta acumulada{" "}
            <strong style={{ color: GOLD }}>${formatUSD(proyeccionAlHorizonte.rentaNetaAcumulada)}</strong>.</>
          )}
        </p>
      </section>

      {/* SECTION 6: CONFOTUR Benefit */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div
          className="rounded-xl border-2 p-6"
          style={{
            backgroundColor: "rgba(201, 169, 110, 0.1)",
            borderColor: GOLD,
          }}
        >
          <h3
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
          >
            ✦ Beneficio CONFOTUR
          </h3>
          <p className="text-sm text-white/90 leading-relaxed mb-3">
            Al ser un proyecto certificado CONFOTUR, esta unidad está exenta de: (1){" "}
            <strong>impuesto de transferencia de propiedad</strong> — 3% sobre el valor total del
            inmueble (ahorro:{" "}
            <strong style={{ color: GOLD }}>${formatUSD(roi.savingsCONFOTURTransfer)} USD</strong>
            ); (2) <strong>1% anual durante 15 años</strong> (ahorro estimado:{" "}
            <strong style={{ color: GOLD }}>${formatUSD(roi.savingsCONFOTURAnnual)} USD</strong>
            ); (3) <strong>exención ISR sobre alquileres (10 años)</strong> — ahorro estimado sobre
            renta neta:{" "}
            <strong style={{ color: GOLD }}>${formatUSD(roi.savingsCONFOTURISR)} USD</strong>.
          </p>
          <p className="text-sm text-white/90">
            Ahorro total estimado CONFOTUR:{" "}
            <strong style={{ color: GOLD }}>${formatUSD(roi.savingsCONFOTUR)} USD</strong>.
          </p>
        </div>
      </section>

      {/* SECTION 7: Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <p className="text-xs text-white/40 max-w-2xl leading-relaxed mb-3">
          Compra sobre plano: inicio de obra Oct 2026; entrega Sunrise Dic 2028 y Sunset Jul 2029.
          La plusvalía se proyecta durante la construcción; la renta solo a partir de la entrega.
          La vista &quot;PLAYA&quot; corresponde a playa artificial privada de resort (no primera
          línea de mar). Las vistas &quot;MAR/OCÉANO&quot; corresponden a vistas panorámicas reales
          al océano Atlántico. Las proyecciones se basan en benchmarks de mercado y no constituyen
          garantía de rentabilidad.
        </p>
        <p className="text-xs text-white/40 max-w-2xl leading-relaxed">
          Fuentes: The Latin Investor (2026) — Apreciación Cap Cana 9-12% resort, 12-18% beachfront
          natural. Airbtics (2025) — Ocupación mediana Punta Cana 49%; propiedades prime 65-75%.
          PuntaCanaVilla.com (2025-2026) — Yield bruto 6-12% Cap Cana; HOA premium +30-40% Cap Cana.
          Global Property Guide (2025) — RD residencial +7-12% anual. OwnDominican.com (2025) — ROI
          bruto 6-12% Cap Cana. CONFOTUR Ley 158-01 — Exención transferencia 3%, IPI 1%×15 años,
          ISR alquileres 10 años.
        </p>
      </section>
    </div>
  );
}
