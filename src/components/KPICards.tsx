"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "motion/react";
import type { ROIResult } from "@/lib/roi-calculator";
import { cn } from "@/lib/utils";

const NAVY = "#0D1B2A";
const GOLD = "#C9A96E";

interface KPICardsProps {
  roi: ROIResult;
  horizonte: number;
  /** Change when inputs change so NumberTicker re-animates */
  animationKey?: string | number;
  className?: string;
}

export function KPICards({
  roi,
  horizonte,
  animationKey = "",
  className,
}: KPICardsProps) {
  const valorEnNAnos =
    roi.valorFuturo.length >= horizonte
      ? roi.valorFuturo[horizonte - 1]?.valor ?? 0
      : roi.valorFuturo[roi.valorFuturo.length - 1]?.valor ?? 0;

  const cards = [
    {
      label: "RENTA MENSUAL ESTIMADA",
      value: roi.rentaMensualEstimada,
      prefix: "$",
      suffix: "/mes",
      decimals: 0,
      description: "Ingreso neto esperado por ocupación",
    },
    {
      label: "YIELD BRUTO ANUAL",
      value: roi.yieldBruto,
      prefix: "",
      suffix: "%",
      decimals: 1,
      description: "Renta bruta / precio de compra",
    },
    {
      label: "YIELD NETO ANUAL",
      value: roi.yieldNeto,
      prefix: "",
      suffix: "%",
      decimals: 1,
      description: "Después de gestión, HOA y mantenimiento",
    },
    {
      label: "APRECIACIÓN ANUAL",
      value: roi.apreciacionAnual,
      prefix: "",
      suffix: "%",
      decimals: 1,
      description: "Crecimiento de valor histórico Cap Cana",
    },
    {
      label: `VALOR EN ${horizonte} AÑOS`,
      value: valorEnNAnos,
      prefix: "$",
      suffix: "",
      decimals: 0,
      description: "Proyección de valor del inmueble",
    },
    {
      label: "RETORNO TOTAL",
      value: roi.totalReturnHorizonte,
      prefix: "+",
      suffix: "%",
      decimals: 1,
      description: "Plusvalía + renta acumulada sobre compra",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {cards.map((card, index) => (
        <motion.div
          key={`${animationKey}-${card.label}-${index}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="rounded-xl p-5 border-b-2 border-transparent"
          style={{
            backgroundColor: NAVY,
            borderBottomColor: GOLD,
            borderBottomWidth: 2,
          }}
        >
          <p className="text-xs font-sans uppercase tracking-wider text-white/60 font-light">
            {card.label}
          </p>
          <p className="mt-2 text-5xl font-semibold tabular-nums" style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}>
            {card.prefix}
            <NumberTicker
              key={`ticker-${animationKey}-${card.label}`}
              value={card.value}
              decimalPlaces={card.decimals}
              className="inline-block"
            />
            {card.suffix && (
              <span className="text-base font-normal text-white/40 ml-0.5">
                {card.suffix}
              </span>
            )}
          </p>
          <p className="mt-2 text-xs font-sans text-white/50">
            {card.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
