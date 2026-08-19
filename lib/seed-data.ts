import type { Player, Position, ScoringFormat } from "./types";
import { RANKINGS, type RankingTuple } from "./rankings-data";

/**
 * Bundled 2026 player dataset, generated from the user's cheat sheet
 * ("Fantasy Football Cheat Sheet with Boom Outlier 2026.xlsx" — STRD / .5 PPR
 * / FULL PPR sheets). Each scoring format has its own expert-ranked board,
 * sorted best (rank 1) to worst. See scripts/generate-rankings.cjs.
 *
 * Tuple: [name, position, team, bye, adp, rank, positionRank, tier, projection]
 */

/** Team → bye week map (fallback for live-only players; rankings already carry byes). */
export const BYE_WEEKS: Record<string, number> = {
  ARI: 6, ATL: 12, BAL: 14, BUF: 12, CAR: 11, CHI: 7, CIN: 12, CLE: 10,
  DAL: 7, DEN: 14, DET: 5, GB: 10, HOU: 14, IND: 14, JAX: 12, KC: 6,
  LAC: 5, LAR: 6, LV: 10, MIA: 6, MIN: 6, NE: 14, NO: 12, NYG: 11,
  NYJ: 12, PHI: 5, PIT: 9, SF: 9, SEA: 10, TB: 11, TEN: 5, WAS: 14,
};

export function byeForTeam(team: string): number {
  return BYE_WEEKS[team] ?? 0;
}

function toPlayer(t: RankingTuple, index: number): Player {
  const [name, position, team, bye, adp, rank, positionRank, tier, projection] = t;
  return {
    id: position === "DEF" ? team : `r${index + 1}`,
    name,
    position: position as Position,
    team,
    bye,
    adp,
    projection,
    weeklyAvg: Math.round((projection / 17) * 10) / 10,
    tier,
    rank,
    positionRank,
    source: "seed" as const,
  };
}

export function buildSeedPlayers(scoring: ScoringFormat = "ppr"): Player[] {
  return RANKINGS[scoring].map(toPlayer);
}

/** Fresh copy of the fully-built seed roster (already ranked + tiered). */
export function getSeedPlayers(scoring: ScoringFormat = "ppr"): Player[] {
  return buildSeedPlayers(scoring);
}

/**
 * Normalized key used to match seed players against live API records.
 * Strips punctuation and generational suffixes (Jr., Sr., III, etc.) so
 * "Brian Robinson Jr." matches Sleeper's "Brian Robinson".
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v|vi)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}
