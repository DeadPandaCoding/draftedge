/**
 * One-off generator: parses "Fantasy Football Cheat Sheet with Boom Outlier
 * 2026.xlsx" and emits lib/rankings-data.ts with the real 2026 player
 * rankings for all three scoring formats, sorted best (rank 1) to worst.
 *
 * Projections: every player gets a full projected stat line. Vegas prop-bet
 * over/under lines override the markets they cover (rush/pass/rec yards + TDs);
 * the remaining markets and the ~800 players without any lines are estimated
 * from position rank, then converted to points under standard fantasy scoring
 * (so PPR > half-PPR > standard for pass-catchers).
 *
 * Usage: node scripts/generate-rankings.mjs
 * (requires `xlsx`: npm i --no-save --package-lock=false xlsx)
 */
import XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = "C:/Users/ansht/Downloads/Fantasy Football Cheat Sheet with Boom Outlier 2026.xlsx";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "rankings-data.ts");

// Scoring format → sheet name in the workbook.
const SHEETS = [
  { format: "ppr", sheet: "FULL PPR NEW" },
  { format: "half_ppr", sheet: ".5 PPR NEW" },
  { format: "standard", sheet: "STRD" },
];

// Rank-based stat curves [top-at-rank-1, bottom-at-max-rank] per position.
// Used to estimate any market a player lacks a Vegas line for.
const STAT_CURVES = {
  QB: { passYds: [4500, 2000], rushYds: [500, 0] },
  RB: { rushYds: [1300, 100], recYds: [500, 0] },
  WR: { recYds: [1400, 0], rushYds: [50, 0] },
  TE: { recYds: [950, 0], rushYds: [20, 0] },
};

// Yards per reception (→ reception points for PPR / half-PPR).
const YPC = { RB: 8.5, WR: 12.5, TE: 10.5 };

// TDs per yard, used to estimate a missing TD market from yardage.
const TD_PER_YD = {
  QB_pass: 1 / 160,
  QB_rush: 1 / 110,
  RB_rush: 1 / 110,
  RB_rec: 1 / 140,
  WR_rec: 1 / 130,
  TE_rec: 1 / 110,
};

// Kickers/defenses: points directly (no receptions).
const POINTS_ANCHOR = { K: [170, 120], DEF: [175, 125] };

// Map the sheet's 16 expert tiers down to the app's 5-tier system.
function mapTier(t) {
  if (!t || t <= 0) return 5;
  if (t <= 3) return 1;
  if (t <= 6) return 2;
  if (t <= 10) return 3;
  if (t <= 13) return 4;
  return 5;
}

// Source-name cleanups: typos + nicknames canonicalized to their real names
// so the board matches the live Sleeper feed (and reads correctly).
const NAME_FIXES = {
  "Jamhyr Gibbs": "Jahmyr Gibbs",
  "Jordon Mason": "Jordan Mason",
  "Sederrick Cunningham": "Sederrik Cunningham",
  "Hollywood Brown": "Marquise Brown",
  "Bam Knight": "Zonovan Knight",
};

function cleanName(raw) {
  let n = String(raw || "").trim().replace(/\s+/g, " ");
  // Rookie / uncertainty markers rendered as trailing asterisks.
  n = n.replace(/\*+$/g, "").trim();
  return NAME_FIXES[n] || n;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function parseSheet(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const players = [];
  for (let i = 7; i < json.length; i++) {
    const r = json[i];
    if (!r || !r[6]) continue;
    const name = cleanName(r[6]);
    if (!name) continue;
    const rawPos = String(r[7]).trim().toUpperCase();
    const position = rawPos === "DST" ? "DEF" : rawPos;
    players.push({
      name,
      position,
      team: String(r[9] || "FA").trim().toUpperCase(),
      bye: num(r[8]),
      adp: num(r[2]),
      rank: num(r[0]),
      positionRank: num(r[10]),
      tier: mapTier(num(r[1])),
      // Vegas prop-bet over/under lines (empty when that market isn't offered).
      passRecTd: num(r[25]), // QB: pass TDs · RB/WR/TE: receiving TDs
      rushTd: num(r[26]),
      passYds: num(r[27]),
      rushYds: num(r[28]),
      recYds: num(r[29]),
    });
  }
  return players;
}

function statEstimate(top, bottom, positionRank, maxRank) {
  const frac = Math.max(0, Math.min(1, (positionRank - 1) / Math.max(1, maxRank - 1)));
  return top - (top - bottom) * frac;
}

/** Full projected stat line → points for a given scoring format. */
function computeProjection(p, format, posMaxRank) {
  const maxRk = posMaxRank[p.position] || 1;

  if (p.position === "K" || p.position === "DEF") {
    const [top, bottom] = POINTS_ANCHOR[p.position];
    return statEstimate(top, bottom, p.positionRank, maxRk);
  }

  if (p.position === "QB") {
    const curve = STAT_CURVES.QB;
    const passYds = p.passYds > 0 ? p.passYds : statEstimate(curve.passYds[0], curve.passYds[1], p.positionRank, maxRk);
    const rushYds = p.rushYds > 0 ? p.rushYds : statEstimate(curve.rushYds[0], curve.rushYds[1], p.positionRank, maxRk);
    const passTd = p.passRecTd > 0 ? p.passRecTd : passYds * TD_PER_YD.QB_pass;
    const rushTd = p.rushTd > 0 ? p.rushTd : rushYds * TD_PER_YD.QB_rush;
    return passTd * 4 + rushTd * 6 + passYds * 0.04 + rushYds * 0.1;
  }

  // RB / WR / TE — format-aware via receptions.
  const curve = STAT_CURVES[p.position];
  const recYds = p.recYds > 0 ? p.recYds : statEstimate(curve.recYds[0], curve.recYds[1], p.positionRank, maxRk);
  const rushYds = p.rushYds > 0 ? p.rushYds : statEstimate(curve.rushYds[0], curve.rushYds[1], p.positionRank, maxRk);
  const recTdKey = p.position === "RB" ? "RB_rec" : p.position === "WR" ? "WR_rec" : "TE_rec";
  // Guard against clearly bogus TD cells (some rows have misaligned/errant
  // values like a RB with "19.5" rec TDs). Real rec-TD lines never exceed 15.
  const recTd = p.passRecTd > 0 && p.passRecTd <= 15 ? p.passRecTd : recYds * TD_PER_YD[recTdKey];
  const rushTd = p.rushTd > 0 ? p.rushTd : p.position === "RB" ? rushYds * TD_PER_YD.RB_rush : 0;
  const rec = recYds / YPC[p.position];
  const base = recTd * 6 + rushTd * 6 + recYds * 0.1 + rushYds * 0.1;
  if (format === "ppr") return base + rec;
  if (format === "half_ppr") return base + rec * 0.5;
  return base;
}

function finalize(players, format) {
  // Sort: real ranks ascending first, then unranked players in file order.
  const ranked = players
    .map((p, i) => ({ ...p, fileIndex: i }))
    .sort((a, b) => {
      const ra = a.rank || Infinity;
      const rb = b.rank || Infinity;
      if (ra !== rb) return ra - rb;
      return a.fileIndex - b.fileIndex;
    });

  const posMaxRank = {};
  for (const p of ranked) posMaxRank[p.position] = Math.max(posMaxRank[p.position] || 0, p.positionRank);

  return ranked.map((p, i) => {
    const projection = round1(computeProjection(p, format, posMaxRank));
    return {
      name: p.name,
      position: p.position,
      team: p.team,
      bye: p.bye,
      adp: p.adp,
      rank: i + 1,
      positionRank: p.positionRank,
      tier: p.tier,
      projection,
    };
  });
}

// Parse the sheet's "Updated M/D" header so the draft room can show a
// real "last updated" date next to the rankings source.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseUpdated(sheet) {
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const line = String(json[1]?.[0] ?? "");
  const m = line.match(/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    const month = MONTHS[Number(m[1]) - 1] ?? "?";
    return `${month} ${Number(m[2])}, 2026`;
  }
  return "2026";
}

const wb = XLSX.readFile(SRC);
const updatedLabel = parseUpdated(wb.Sheets["STRD"]);
console.log(`Updated label: ${updatedLabel}`);
const out = { ppr: [], half_ppr: [], standard: [] };
for (const { format, sheet } of SHEETS) {
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Missing sheet: ${sheet}`);
  out[format] = finalize(parseSheet(ws), format);
  console.log(`${format}: ${out[format].length} players`);
}

// Emit TypeScript. Tuples: [name, position, team, bye, adp, rank, positionRank, tier, projection]
const lines = [];
lines.push("// AUTO-GENERATED — do not edit by hand.");
lines.push("// Source: \"Fantasy Football Cheat Sheet with Boom Outlier 2026.xlsx\" (sheets STRD / .5 PPR NEW / FULL PPR NEW).");
lines.push("// Regenerate with: node scripts/generate-rankings.mjs");
lines.push("");
lines.push('import type { ScoringFormat } from "./types";');
lines.push("");
lines.push("// [name, position, team, bye, adp, rank, positionRank, tier, projection]");
lines.push('export type RankingTuple = [string, string, string, number, number, number, number, number, number];');
lines.push("");
lines.push("// Provenance for the draft-room \"last updated\" indicator.");
lines.push("export const RANKINGS_SOURCE = {");
lines.push('  label: "2026 Cheat Sheet",');
lines.push(`  updated: ${JSON.stringify(updatedLabel)},`);
lines.push("} as const;");
lines.push("");
lines.push("export const RANKINGS: Record<ScoringFormat, RankingTuple[]> = {");
for (const format of ["ppr", "half_ppr", "standard"]) {
  lines.push(`  ${format}: [`);
  for (const p of out[format]) {
    lines.push(
      `    [${JSON.stringify(p.name)}, ${JSON.stringify(p.position)}, ${JSON.stringify(p.team)}, ${p.bye}, ${p.adp}, ${p.rank}, ${p.positionRank}, ${p.tier}, ${p.projection}],`
    );
  }
  lines.push("  ],");
}
lines.push("};");
lines.push("");

fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log("Wrote", OUT);
