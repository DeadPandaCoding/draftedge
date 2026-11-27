import type { Player, Position, RosterTemplate } from "./types";
import { DEFAULT_ROSTER } from "./league";
import type { PlayerMatchupContext } from "./matchup-context";

const tenth = (n: number) => Math.round(n * 10) / 10;
const positions: Position[] = ["QB", "RB", "WR", "TE", "K", "DEF"];
const adpValue = (pick: number) => 100 / (1 + (pick / 24) ** 1.25);

export function buildTradeValues(
  players: Player[], teamCount = 12, marketValues?: ReadonlyMap<string, number>,
  roster: RosterTemplate = DEFAULT_ROSTER, contexts?: ReadonlyMap<string, PlayerMatchupContext>,
): Map<string, number> {
  // Callers without matchup context supply a consistently scaled projection board.
  const points = (p: Player) => {
    const c = contexts?.get(p.id);
    const value = c ? c.rosPoints * (1 + c.teammateUsageBoost) * (1 - c.backupQbDiscount) : p.projection;
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const slots: Record<Position, number> = {
    QB: roster.qb, RB: roster.rb, WR: roster.wr, TE: roster.te, K: roster.k, DEF: roster.def,
  };
  const reserves = new Map<Position, Player[]>();
  for (const pos of positions) {
    const board = players.filter(p => p.position === pos && points(p) > 0).sort((a,b) => points(b) - points(a));
    reserves.set(pos, board.slice(Math.round(slots[pos] * teamCount)));
  }
  // Fill flexible starting jobs from the best still-eligible players, once each.
  const starters = new Set<string>();
  for (const [eligible, slotsPerTeam] of [
    [["RB", "WR", "TE"], roster.flex], [["QB", "RB", "WR", "TE"], roster.superflex],
  ] as const) {
    const pool = eligible.flatMap(pos => reserves.get(pos)!).filter(p => !starters.has(p.id));
    pool.sort((a,b) => points(b) - points(a)).slice(0, Math.round(slotsPerTeam * teamCount))
      .forEach(p => starters.add(p.id));
  }
  const surplus = new Map<string, number>();
  for (const pos of positions) {
    const replacement = reserves.get(pos)!.find(p => !starters.has(p.id));
    const baseline = replacement ? points(replacement) : 0;
    for (const p of players.filter(p => p.position === pos)) surplus.set(p.id, Math.max(0, points(p) - baseline));
  }
  const best = Math.max(1, ...surplus.values());
  const values = new Map<string, number>();
  for (const p of players) {
    const vorp = surplus.get(p.id) ?? 0;
    const health = p.injuryStatus === "IR" || p.injuryStatus === "PUP" ? .6 :
      p.injuryStatus === "D" || p.injuryStatus === "O" ? .92 : 1;
    let value: number;
    if (p.position === "K" || p.position === "DEF") {
      value = Math.min(5, vorp * .15);
    } else {
      const model = 100 * vorp / best;
      const market = marketValues?.get(p.id);
      const consensus = market && Number.isFinite(market) ? Math.max(0, Math.min(100, market)) : undefined;
      const anchor = p.adp > 0 && Number.isFinite(p.adp) ? adpValue(p.adp) : consensus ?? model;
      value = .9 * anchor + .1 * model;
      if (consensus !== undefined) value = .9 * value + .1 * consensus;
    }
    values.set(p.id, tenth(value * health));
  }
  return values;
}

// Each unmatched asset must clear a five-point bench replacement cost; the
// remaining surplus counts at 75%, then progressively less for deeper packages.
export function packageTradeValue(values: number[], opposingCount: number): number {
  const matched = Math.max(1, opposingCount);
  return tenth([...values].sort((a,b) => b - a).reduce((sum, value, index) => {
    if (index < matched) return sum + value;
    return sum + Math.max(0, value - 5) * .75 ** (index - matched + 1);
  }, 0));
}

export interface TradeGrade {
  letter: string;
  label: string;
  text: string;
  ring: string;
}

/** Letter grade for "your side" (Side A) from net value over total value.
 * `bothSidesPopulated` must be false whenever either side has no resolved
 * players — a one-sided package is incomplete, not a grade. When both sides do
 * have players but every value is zero, the trade is even and grades as a
 * neutral C rather than an empty placeholder. */
export function gradeTrade(net: number, total: number, bothSidesPopulated = true): TradeGrade {
  if (!bothSidesPopulated) {
    return {
      letter: "—",
      label: "Add players to both sides",
      text: "text-zinc-300",
      ring: "border-zinc-600/60 bg-zinc-800/40",
    };
  }
  if (total <= 0) {
    return {
      letter: "C",
      label: "Fair trade",
      text: "text-zinc-200",
      ring: "border-zinc-600/60 bg-zinc-800/40",
    };
  }
  const pct = net / Math.max(40, total); // -1..1
  if (pct >= 0.22)
    return { letter: "A+", label: "Clear win", text: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" };
  if (pct >= 0.12)
    return { letter: "A", label: "Clear win", text: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" };
  if (pct >= 0.04)
    return { letter: "B", label: "Slight edge", text: "text-emerald-400", ring: "border-emerald-500/30 bg-emerald-500/5" };
  if (pct > -0.04)
    return { letter: "C", label: "Fair trade", text: "text-zinc-200", ring: "border-zinc-600/60 bg-zinc-800/40" };
  if (pct > -0.12)
    return { letter: "D", label: "Slight loss", text: "text-rose-300", ring: "border-rose-500/30 bg-rose-500/5" };
  return { letter: "F", label: "Clear loss", text: "text-rose-300", ring: "border-rose-500/40 bg-rose-500/10" };
}
