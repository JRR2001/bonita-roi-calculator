"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { UNITS, getEffectiveVista, vistaIncluyeOceano } from "@/data/units";
import type { Unit, Fase, Estado } from "@/data/units";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const GOLD = "#C9A96E";
const NAVY = "#0D1B2A";

const VISTA_OPTIONS = [
  "PLAYA",
  "GOLF",
  "GOLF Y PLAYA",
  "OCEANO Y GOLF",
  "OCEANO, GOLF Y PLAYA",
  "GOLF Y PISCINA",
  "GOLF, PISCINA Y OCEANO",
] as const;

const TIPOLOGIA_DISPLAY: Record<string, string> = {
  "1 Habitación": "1 Hab + Hab de Servicio",
  "2 Habitaciones": "2 Habitaciones",
  "2 Hab Family": "2 Hab + Family + Hab de Servicio",
  "2 Hab HS": "2 Hab + HS",
  "4 + Hab Servicio": "4 + Hab de Servicio",
};

function getTipologiaGroup(tipologia: string): string | null {
  const t = tipologia.trim();
  for (const [display, raw] of Object.entries(TIPOLOGIA_DISPLAY)) {
    if (raw === t) return display;
  }
  if (t.startsWith("1 Hab")) return "1 Habitación";
  if (t.startsWith("2 Habitaciones")) return "2 Habitaciones";
  if (t.includes("Family")) return "2 Hab Family";
  if (t.includes("HS")) return "2 Hab HS";
  if (t.startsWith("4 + Hab") || t.includes("4 + Hab de Servicio")) return "4 + Hab Servicio";
  return null;
}

const TIPOLOGIA_PILLS = [
  "1 Habitación",
  "2 Habitaciones",
  "2 Hab Family",
  "2 Hab HS",
  "4 + Hab Servicio",
];

function vistaIcon(vista: string) {
  const v = vista.toUpperCase();
  const ocean = vistaIncluyeOceano(vista) ? " 🌊" : "";
  if (v.includes("PLAYA") && !v.includes("GOLF")) return "🏖️" + ocean;
  if (v.includes("GOLF") || v.includes("PISCINA")) return "⛳" + ocean;
  return "🏖️" + ocean;
}

export function UnitSelector({
  onSelectUnit,
  selectedId,
}: {
  onSelectUnit?: (unit: Unit) => void;
  selectedId?: string | null;
}) {
  const [fase, setFase] = useState<Fase | null>(null);
  const [vistas, setVistas] = useState<Set<string>>(new Set());
  const [tipologias, setTipologias] = useState<Set<string>>(new Set());
  const [nivelRange, setNivelRange] = useState<[number, number]>([1, 8]);
  const [estadoDisponible, setEstadoDisponible] = useState(true);
  const [estadoReservado, setEstadoReservado] = useState(true);

  const toggleVista = (v: string) => {
    setVistas((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const toggleTipologia = (t: string) => {
    setTipologias((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  // Vista efectiva por unidad (calculada una sola vez, no en cada filtrado).
  const effectiveVistaById = useMemo(() => {
    const map = new Map<string, string>();
    UNITS.forEach((u) => map.set(u.id, getEffectiveVista(u).trim()));
    return map;
  }, []);

  // 1) Solo unidades Disponible/Reservado. 2) Aplicar fase, vista, tipología, planta y estado.
  const filteredUnits = useMemo(() => {
    const estados: Estado[] = [];
    if (estadoDisponible) estados.push("Disponible");
    if (estadoReservado) estados.push("Reservado");
    const filterByEstado = estados.length > 0;

    let list = UNITS.filter(
      (u) => u.estado === "Disponible" || u.estado === "Reservado"
    );

    if (filterByEstado) {
      list = list.filter((u) => estados.includes(u.estado));
    }
    if (fase != null) {
      list = list.filter((u) => u.fase === fase);
    }
    if (vistas.size > 0) {
      list = list.filter((u) => vistas.has(effectiveVistaById.get(u.id) ?? ""));
    }
    if (tipologias.size > 0) {
      list = list.filter((u) => {
        const group = getTipologiaGroup(u.tipologia);
        return group != null && tipologias.has(group);
      });
    }
    const [minN, maxN] = [
      Number(nivelRange[0]),
      Number(nivelRange[1]),
    ];
    list = list.filter((u) => {
      const nivel = Number(u.nivel);
      return nivel >= minN && nivel <= maxN;
    });

    return list;
  }, [fase, vistas, tipologias, nivelRange, estadoDisponible, estadoReservado, effectiveVistaById]);

  return (
    <div
      className="min-h-screen w-full px-4 py-8 md:px-6"
      style={{ backgroundColor: NAVY }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 1. FASE selector */}
        <section className="mb-8">
          <h3
            className="text-sm uppercase tracking-wider text-white/60 mb-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Fase
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(["Sunrise", "Sunset"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFase((prev) => (prev === f ? null : f))}
                className={cn(
                  "rounded-2xl p-6 text-left border-2 transition-all [font-family:var(--font-inter)]",
                  fase === f
                    ? "border-[#C9A96E] bg-[#C9A96E]/10"
                    : "border-white/20 bg-white/5 hover:border-white/30"
                )}
              >
                <span
                  className="text-xl font-semibold"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    color: fase === f ? GOLD : "rgba(255,255,255,0.9)",
                  }}
                >
                  {f.toUpperCase()}
                </span>
                <p className="text-sm text-white/60 mt-1">
                  {f === "Sunrise" ? "Golf & Beach" : "Beach"}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* 2. VISTA filter */}
        <section className="mb-8">
          <h3
            className="text-sm uppercase tracking-wider text-white/60 mb-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Vista
          </h3>
          <div className="flex flex-wrap gap-2">
            {VISTA_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVista(v)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all [font-family:var(--font-inter)]",
                  vistas.has(v)
                    ? "bg-[#C9A96E] text-[#0D1B2A]"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        {/* 3. TIPOLOGIA filter */}
        <section className="mb-8">
          <h3
            className="text-sm uppercase tracking-wider text-white/60 mb-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Tipología
          </h3>
          <div className="flex flex-wrap gap-2">
            {TIPOLOGIA_PILLS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTipologia(t)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all [font-family:var(--font-inter)]",
                  tipologias.has(t)
                    ? "bg-[#C9A96E] text-[#0D1B2A]"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* 4. NIVEL: botones rápidos + slider de rango */}
        <section className="mb-8">
          <h3
            className="text-sm uppercase tracking-wider text-white/60 mb-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Planta
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setNivelRange([1, 8])}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all [font-family:var(--font-inter)]",
                nivelRange[0] === 1 && nivelRange[1] === 8
                  ? "bg-[#C9A96E] text-[#0D1B2A]"
                  : "bg-white/10 text-white/80 hover:bg-white/15"
              )}
            >
              Todas
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
              const soloEsta = nivelRange[0] === n && nivelRange[1] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivelRange([n, n])}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-all [font-family:var(--font-inter)]",
                    soloEsta
                      ? "bg-[#C9A96E] text-[#0D1B2A]"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="max-w-md">
            <Slider
              value={nivelRange}
              onValueChange={(v) => setNivelRange(v as [number, number])}
              min={1}
              max={8}
              step={1}
              minStepsBetweenThumbs={0}
              className="py-4"
            />
            <p className="text-sm text-white/60 [font-family:var(--font-inter)] mt-1">
              {nivelRange[0] === nivelRange[1]
                ? `Solo planta ${nivelRange[0]}`
                : `Plantas ${nivelRange[0]} – ${nivelRange[1]}`}
            </p>
          </div>
        </section>

        {/* 5. ESTADO filter */}
        <section className="mb-8">
          <h3
            className="text-sm uppercase tracking-wider text-white/60 mb-3"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Estado
          </h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer [font-family:var(--font-inter)] text-white/90">
              <input
                type="checkbox"
                checked={estadoDisponible}
                onChange={(e) => setEstadoDisponible(e.target.checked)}
                className="rounded border-white/30 bg-white/10 text-[#C9A96E] focus:ring-[#C9A96E]"
              />
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                Disponible
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer [font-family:var(--font-inter)] text-white/90">
              <input
                type="checkbox"
                checked={estadoReservado}
                onChange={(e) => setEstadoReservado(e.target.checked)}
                className="rounded border-white/30 bg-white/10 text-[#C9A96E] focus:ring-[#C9A96E]"
              />
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-400" />
                Reservado
              </span>
            </label>
          </div>
        </section>

        {/* Results count — solo unidades que hacen match con los filtros */}
        <p className="text-white/60 [font-family:var(--font-inter)] text-sm mb-6">
          {filteredUnits.length} unidad{filteredUnits.length !== 1 ? "es" : ""} encontrada
          {filteredUnits.length !== 1 ? "s" : ""}
        </p>

        {/* Grid — solo las unidades que cumplen todos los filtros activos */}
        {filteredUnits.length === 0 ? (
          <p className="text-white/50 [font-family:var(--font-inter)] text-sm py-12 text-center">
            No hay unidades que coincidan con los filtros. Prueba a ampliar fase, vista, tipología o rango de planta.
          </p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUnits.map((unit, index) => {
            const vista = effectiveVistaById.get(unit.id) ?? "—";
            return (
            <motion.article
              key={unit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(index * 0.02, 0.25),
                duration: 0.2,
              }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col"
            >
              <h3
                className="text-xl font-semibold"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  color: GOLD,
                }}
              >
                {unit.id.replace(/([A-Za-z]+)(\d+)/, "$1 $2")}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className="text-xs bg-white/10 text-white/90 border-0 [font-family:var(--font-inter)]">
                  Planta {unit.nivel}
                </Badge>
                <Badge className="text-xs bg-white/10 text-white/90 border-0 [font-family:var(--font-inter)]">
                  {vistaIcon(vista)} {vista}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-white/60 [font-family:var(--font-inter)]">
                {unit.interiorM2} m² int. / {unit.totalM2} m² total
              </p>
              <p
                className="mt-2 text-xl font-semibold"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  color: GOLD,
                }}
              >
                ${unit.precioUSD.toLocaleString("en-US")}
              </p>
              <div className="mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium [font-family:var(--font-inter)]",
                    unit.estado === "Disponible" && "text-emerald-400",
                    unit.estado === "Reservado" && "text-amber-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      unit.estado === "Disponible" && "bg-emerald-400",
                      unit.estado === "Reservado" && "bg-amber-400"
                    )}
                  />
                  {unit.estado}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#C9A96E]/40 text-[#C9A96E] hover:bg-[#C9A96E]/10 hover:border-[#C9A96E]/60 [font-family:var(--font-inter)]"
                  onClick={() => onSelectUnit?.(unit)}
                >
                  VER PROYECCIÓN →
                </Button>
              </div>
            </motion.article>
          );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
