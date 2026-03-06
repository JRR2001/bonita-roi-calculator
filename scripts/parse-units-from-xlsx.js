const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

function parseM2(v) {
  if (typeof v === "number" && !isNaN(v)) return v;
  const s = String(v || "").trim();
  if (!s) return 0;
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*m²?/i);
  if (m) return parseFloat(m[1].replace(",", "."));
  const num = parseFloat(s.replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function parseEstado(v) {
  const s = String(v || "").trim();
  if (/disponible/i.test(s)) return "Disponible";
  if (/reservado/i.test(s)) return "Reservado";
  if (/vendido/i.test(s)) return "Vendido";
  return "Disponible";
}

function parseFase(v) {
  const s = String(v || "").trim();
  if (/sunset/i.test(s)) return "Sunset";
  return "Sunrise";
}

const wb = XLSX.readFile(
  "/Users/jrodriguez/Downloads/Hoja de cálculo sin título.xlsx"
);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const header = rows[0];
const dataRows = rows.slice(1);

const units = dataRows
  .filter((row) => row[3]) // has ID
  .map((row) => {
    const fase = parseFase(row[0]);
    const nivel = Number(row[1]);
    const unidad = Number(row[2]);
    const id = String(row[3] || "").trim();
    const tipologia = String(row[4] || "").trim();
    const vista = String(row[5] || "").trim();
    const interiorM2 = parseM2(row[6]);
    const terrazaM2 = parseM2(row[7]);
    const jardinM2 = parseM2(row[8]);
    const totalM2 = parseM2(row[9]);
    const precioUSD = typeof row[10] === "number" ? row[10] : parseFloat(String(row[10] || "0").replace(/,/g, "")) || 0;
    const estado = parseEstado(row[11]);

    return {
      id,
      fase,
      nivel: isNaN(nivel) ? 0 : nivel,
      unidad: isNaN(unidad) ? 0 : unidad,
      tipologia,
      vista,
      interiorM2,
      terrazaM2,
      jardinM2,
      totalM2,
      precioUSD: isNaN(precioUSD) ? 0 : precioUSD,
      estado,
    };
  });

const outPath = path.join(__dirname, "..", "src", "data", "units.ts");
const headerTs = `export type Fase = "Sunrise" | "Sunset";
export type Estado = "Disponible" | "Reservado" | "Vendido";

export interface Unit {
  id: string;
  fase: Fase;
  nivel: number;
  unidad: number;
  tipologia: string;
  vista: string;
  interiorM2: number;
  terrazaM2: number;
  jardinM2: number;
  totalM2: number;
  precioUSD: number;
  estado: Estado;
}

/**
 * All units (all estados). Use UNITS_FOR_SELECTOR for the interactive selector.
 */
export const UNITS: Unit[] = [
`;

const footerTs = `];

/**
 * Units with estado "Disponible" or "Reservado" only — for the interactive selector.
 */
export const UNITS_FOR_SELECTOR = UNITS.filter(
  (u) => u.estado === "Disponible" || u.estado === "Reservado"
);
`;

function formatUnit(u) {
  return `  {
    id: ${JSON.stringify(u.id)},
    fase: ${JSON.stringify(u.fase)},
    nivel: ${u.nivel},
    unidad: ${u.unidad},
    tipologia: ${JSON.stringify(u.tipologia)},
    vista: ${JSON.stringify(u.vista)},
    interiorM2: ${u.interiorM2},
    terrazaM2: ${u.terrazaM2},
    jardinM2: ${u.jardinM2},
    totalM2: ${u.totalM2},
    precioUSD: ${u.precioUSD},
    estado: ${JSON.stringify(u.estado)},
  }`;
}

const body = units.map(formatUnit).join(",\n");
const content = headerTs + body + "\n" + footerTs;
fs.writeFileSync(outPath, content, "utf8");
console.log("Wrote", units.length, "units to", outPath);
