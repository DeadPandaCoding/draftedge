import type { Player, Position } from "./types";

const DEEP_BASELINE_RANK: Record<Position, number> = {
  QB: 24, RB: 48, WR: 60, TE: 24, K: 20, DEF: 20,
};

type PlayerWithMarketValue = Player & { redraftValue?: number; redraft_value?: number };

/** Build a 0–100 estimate from market value when available, then positional depth,
 * ROS points, and ADP. This is an estimate, not a claim that points equal trade value. */
export function buildTradeValues(
  players: Player[],
  teamCount = 12,
  marketValues?: ReadonlyMap<string, number>,
): Map<string, number> {
  const grouped = new Map<Position, Player[]>();
  for (const p of players) {
    const list = grouped.get(p.position) ?? [];
    list.push(p);
    grouped.set(p.position, list);
  }

  const values = new Map<string, number>();
  for (const [position, positionPlayers] of grouped) {
    const sorted = [...positionPlayers].sort((a, b) => {
      const projectionDiff = b.projection - a.projection;
      if (projectionDiff !== 0) return projectionDiff;
      if (a.adp > 0 && b.adp > 0) return a.adp - b.adp;
      return a.adp > 0 ? -1 : b.adp > 0 ? 1 : a.name.localeCompare(b.name);
    });
    const rankById = new Map(sorted.map((player, index) => [player.id, index + 1]));
    const depthRank = Math.max(1, Math.round(DEEP_BASELINE_RANK[position] * teamCount / 12));
    const baseRank = Math.min(depthRank, sorted.length);
    const baselineProjection = sorted[baseRank - 1]?.projection ?? 0;
    const topAboveBaseline = Math.max(1, (sorted[0]?.projection ?? 0) - baselineProjection);

    for (const player of positionPlayers) {
      const isUnavailable = ["O", "IR", "PUP"].includes(player.injuryStatus ?? "");
      if (isUnavailable) {
        values.set(player.id, 0);
        continue;
      }

      const projection = Math.max(0, Number(player.projection) || 0);
      const adp = Number(player.adp) || 0;
      const rank = rankById.get(player.id) ?? sorted.length;
      const rankCurve = 66 * Math.exp(-((rank - 1) / depthRank) * 2.2);
      const vorCurve = Math.max(0, projection - baselineProjection) / topAboveBaseline * 72;
      const adpCurve = adp > 0 ? Math.max(0, 30 - Math.log2(adp + 1) * 3.8) : 0;
      const projectionFloor = projection > 0 ? Math.min(18, Math.max(4, projection * 0.12)) : 0;
      const fallback = Math.min(100, Math.max(rankCurve, vorCurve, adpCurve, projectionFloor));
      const suppliedMarket = (marketValues?.get(player.id) ?? (player as PlayerWithMarketValue).redraftValue ?? (player as PlayerWithMarketValue).redraft_value) ?? 0;
      const market = Math.max(0, Math.min(100, Number(suppliedMarket) || 0));
      const combined = market > 0 ? market * 0.7 + fallback * 0.3 : fallback;
      values.set(player.id, Math.round(combined * 10) / 10);
    }
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
