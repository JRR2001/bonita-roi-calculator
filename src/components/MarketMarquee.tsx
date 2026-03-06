"use client";

import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

const BONE = "#F8F5F0";
const NAVY = "#0D1B2A";
const GOLD = "#C9A96E";

const TICKER_ITEMS = [
  "8.4% CAGR · Cap Cana 2020–2025",
  "Yield Bruto 6–12% · Rentals Cap Cana",
  "+40–50% Plusvalía proyectada · 5 años",
  "CONFOTUR · Exención fiscal 15 años",
  "10M+ Turistas · República Dominicana 2025",
  "Cap Cana · La Marina más grande del Caribe",
  "Punta Espada Golf · Rated Top 10 Caribbean",
];

export function MarketMarquee({ className }: { className?: string }) {
  return (
    <div
      className={cn("border-y py-3", className)}
      style={{
        backgroundColor: BONE,
        borderColor: GOLD,
        borderWidth: 1,
      }}
    >
      <Marquee pauseOnHover repeat={3} className="[--duration:60s]">
        {TICKER_ITEMS.map((item, i) => (
          <span key={item} className="flex items-center gap-4 shrink-0">
            <span
              className="text-lg italic whitespace-nowrap"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: NAVY,
              }}
            >
              {item}
            </span>
            {i < TICKER_ITEMS.length - 1 && (
              <span
                className="text-[#C9A96E] opacity-80"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                ◆
              </span>
            )}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
