import type { Player, Position } from "./types";

/**
 * Trade value = projected points above a replacement-level starter at the
 * player's position (value over replacement). Replacement players are worth 0,
 * so the number is directly comparable across positions — the closest proxy we
 * have for RosterAudit-style market value using bundled projections.
 */

/** Replacement baseline: starters per position in a 12-team league. */
const STARTERS: Record<Position, number> = {
  QB: 12,
  RB: 24,
  WR: 24,
  TE: 12,
  K: 12,
  DEF: 12,
};

export function buildTradeValues(players: Player[]): Map<string, number> {
  const grouped = new Map<Position, Player[]>();
  for (const p of players) {
    const list = grouped.get(p.position) ?? [];
    list.push(p);
    grouped.set(p.position, list);
  }

  const baseline = new Map<Position, number>();
  for (const [pos, list] of grouped) {
    const sorted = [...list].sort((a, b) => b.projection - a.projection);
    const idx = Math.min(STARTERS[pos], sorted.length) - 1;
    baseline.set(pos, idx >= 0 ? sorted[idx].projection : 0);
  }

  const values = new Map<string, number>();
  for (const p of players) {
    const b = baseline.get(p.position) ?? 0;
    values.set(p.id, Math.max(0, p.projection - b));
  }
  return values;
}

export interface TradeGrade {
  letter: string;
  label: string;
  text: string;
  ring: string;
}

/** Letter grade for "your side" (Side A) from net value over total value. */
export function gradeTrade(net: number, total: number): TradeGrade {
  if (total <= 0) {
    return {
      letter: "—",
      label: "Add players to both sides",
      text: "text-zinc-300",
      ring: "border-zinc-600/60 bg-zinc-800/40",
    };
  }
  const pct = net / total; // -1..1
  if (pct >= 0.25)
    return { letter: "A+", label: "You win big", text: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" };
  if (pct >= 0.1)
    return { letter: "A", label: "Clear win", text: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" };
  if (pct >= 0.03)
    return { letter: "B", label: "Slight edge", text: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/5" };
  if (pct > -0.03)
    return { letter: "C", label: "Fair trade", text: "text-zinc-200", ring: "border-zinc-600/60 bg-zinc-800/40" };
  if (pct > -0.1)
    return { letter: "D", label: "Slight loss", text: "text-rose-300", ring: "border-rose-500/30 bg-rose-500/5" };
  return { letter: "F", label: "Bad trade for you", text: "text-rose-300", ring: "border-rose-500/40 bg-rose-500/10" };
}
