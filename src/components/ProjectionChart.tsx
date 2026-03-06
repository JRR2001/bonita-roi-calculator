"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { ValorFuturoYear } from "@/lib/roi-calculator";

const GOLD = "#C9A96E";
const NAVY_LIGHT = "#1A2F47";
const BLUE = "#3B82F6";

interface ProjectionChartProps {
  valorFuturo: ValorFuturoYear[];
  horizonte: number;
  precioCompra: number;
  className?: string;
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export function ProjectionChart({
  valorFuturo,
  horizonte,
  precioCompra,
  className,
}: ProjectionChartProps) {
  const data = valorFuturo.slice(0, horizonte).map((row) => ({
    name: `Año ${row.year}`,
    year: row.year,
    valor: row.valor,
    rentaAcumulada: row.rentaAcumulada,
    total: row.valor - precioCompra + row.rentaAcumulada,
  }));

  return (
    <div className={className} style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
          <defs>
            <linearGradient id="areaValor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="areaRenta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY_LIGHT} stopOpacity={0.6} />
              <stop offset="100%" stopColor={NAVY_LIGHT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div
                  className="rounded-lg border px-4 py-3 shadow-xl font-sans text-sm"
                  style={{
                    backgroundColor: "#0D1B2A",
                    borderColor: "rgba(201, 169, 110, 0.3)",
                  }}
                >
                  <p className="text-white/90">
                    {d.name} · Valor:{" "}
                    <span style={{ color: GOLD }}>
                      ${(d.valor as number).toLocaleString("en-US")}
                    </span>
                  </p>
                  <p className="text-white/80 mt-1">
                    Renta acumulada: $
                    {(d.rentaAcumulada as number).toLocaleString("en-US")}
                  </p>
                  <p className="text-white/80">
                    Total: $
                    {(d.valor - precioCompra + (d.rentaAcumulada as number)).toLocaleString("en-US")}
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={precioCompra}
            stroke={GOLD}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{
              value: "Precio de compra",
              position: "right",
              fill: GOLD,
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="valor"
            name="Valor propiedad"
            fill={GOLD}
            fillOpacity={0.2}
            stroke={GOLD}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="rentaAcumulada"
            name="Renta acumulada"
            fill={NAVY_LIGHT}
            fillOpacity={0.6}
            stroke={BLUE}
            strokeWidth={1.5}
          />
          <Legend
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => (
              <span
                className="italic text-sm"
                style={{ fontFamily: "var(--font-cormorant)", color: "rgba(255,255,255,0.8)" }}
              >
                {value}
              </span>
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
