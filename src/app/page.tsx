"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { UnitSelector } from "@/components/UnitSelector";
import { ROIDisplay } from "@/components/ROIDisplay";
import { MarketMarquee } from "@/components/MarketMarquee";
import type { Unit } from "@/data/units";
import { ChevronDown } from "lucide-react";

const NAVY = "#0D1B2A";
const GOLD = "#C9A96E";
const BONE = "#F8F5F0";

const MARKET_STATS = [
  { value: "8.4%", label: "Apreciación anual media en Cap Cana (2020-2025)" },
  { value: "6–12%", label: "Yield bruto estimado en Cap Cana" },
  { value: "+40–50%", label: "Plusvalía acumulada proyectada a 5 años" },
  { value: "CONFOTUR", label: "Exención fiscal hasta 15 años" },
];

export default function Home() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. HEADER — fixed top */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 backdrop-blur-md"
        style={{ backgroundColor: "rgba(13, 27, 42, 0.92)" }}
      >
        <div>
          <p
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)", color: "white" }}
          >
            BONITA RESIDENCES
          </p>
          <p
            className="text-xs md:text-sm font-thin tracking-[0.2em] uppercase mt-0.5"
            style={{ fontFamily: "var(--font-inter)", color: GOLD }}
          >
            Luxury Living
          </p>
        </div>
        <p
          className="text-sm font-light text-white/60 hidden sm:block"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Cap Cana · República Dominicana
        </p>
      </header>

      {/* 2. HERO — 60vh, overlay + content */}
      <section
        className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 text-center pt-24"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(13,27,42,0.75) 0%, rgba(13,27,42,0.5) 50%, rgba(13,27,42,0.85) 100%), url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span
          className="text-xs uppercase tracking-[0.25em] mb-4"
          style={{ fontFamily: "var(--font-inter)", color: GOLD }}
        >
          Herramienta exclusiva para inversores
        </span>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-semibold max-w-4xl leading-tight text-white"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Calcula el retorno de tu inversión en Bonita Residences
        </h1>
        <p
          className="text-base md:text-lg text-white/85 max-w-2xl mt-6 leading-relaxed"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Selecciona tu unidad y obtén una proyección detallada de rentabilidad y plusvalía basada
          en benchmarks reales de Cap Cana.
        </p>
        <a
          href="#main-tool"
          className="mt-12 inline-flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
          aria-label="Ir al selector de unidades"
        >
          <ChevronDown className="w-8 h-8 animate-bounce" strokeWidth={1.5} />
        </a>
      </section>

      {/* 3. MARKET CONTEXT BAR — bone, 4 stats */}
      <section
        className="border-y border-[#C9A96E]/20 py-4 md:py-5"
        style={{ backgroundColor: BONE }}
      >
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {MARKET_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="text-xl md:text-2xl font-semibold"
                style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs md:text-sm mt-1 text-[#0D1B2A]/80"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Marquee (optional strip below market bar) */}
      <section className="border-b border-[#C9A96E]/10">
        <MarketMarquee />
      </section>

      {/* 4. MAIN TOOL SECTION — bone when selector, ROIDisplay has its own theme */}
      <main
        id="main-tool"
        className="flex-1 min-h-[50vh]"
        style={{ backgroundColor: selectedUnit ? "transparent" : BONE }}
      >
        <AnimatePresence mode="wait">
          {selectedUnit ? (
            <motion.div
              key="roi-display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ROIDisplay
                unit={selectedUnit}
                onBack={() => setSelectedUnit(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="unit-selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="py-8"
            >
              <h2
                className="text-2xl md:text-3xl text-center mb-6 px-4"
                style={{ fontFamily: "var(--font-cormorant)", color: GOLD }}
              >
                Selecciona tu unidad
              </h2>
              <UnitSelector
                onSelectUnit={setSelectedUnit}
                selectedId={null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. FOOTER — navy */}
      <footer
        className="py-8 px-4 text-center"
        style={{ backgroundColor: NAVY }}
      >
        <p
          className="text-sm text-white/80"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          © 2026 Bonita Luxury Residences · Cap Cana, República Dominicana
        </p>
        <p
          className="text-xs text-white/50 mt-2 max-w-xl mx-auto"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Esta herramienta es de uso exclusivo para el equipo de ventas y clientes de Bonita
          Residences.
        </p>
        <p
          className="text-xs text-white/40 mt-3"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          bonita.luxury
        </p>
      </footer>
    </div>
  );
}
