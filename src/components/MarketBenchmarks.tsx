"use client";

import { cn } from "@/lib/utils";

const BONE = "#F8F5F0";
const NAVY = "#0D1B2A";
const GOLD = "#C9A96E";

const STATS = [
  {
    value: "8.4%",
    label: "Apreciación anual media",
    sublabel: "Cap Cana 2020–2025",
  },
  {
    value: "6–12%",
    label: "Yield bruto estimado",
    sublabel: "Propiedades en Cap Cana",
  },
  {
    value: "+50%",
    label: "Plusvalía acumulada",
    sublabel: "Proyección a 5 años",
  },
  {
    value: "CONFOTUR",
    label: "Exención fiscal",
    sublabel: "Hasta 15 años",
  },
];

export function MarketBenchmarks({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl",
        className
      )}
      style={{ backgroundColor: BONE }}
    >
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <p
            className="text-2xl font-semibold"
            style={{
              fontFamily: "var(--font-cormorant)",
              color: GOLD,
            }}
          >
            {stat.value}
          </p>
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: NAVY }}
          >
            {stat.label}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: NAVY, opacity: 0.7 }}>
            {stat.sublabel}
          </p>
        </div>
      ))}
    </div>
  );
}
