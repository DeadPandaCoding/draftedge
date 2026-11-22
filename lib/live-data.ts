import type { ScoringFormat } from "./types";

/**
 * Sleeper API helpers — the free read-only source for live player metadata,
 * NFL state, and weekly projections. See https://docs.sleeper.com/.
 */

export const SLEEPER_BASE = "https://api.sleeper.app/v1";
const REVALIDATE_SECONDS = 3600;

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: "pre" | "regular" | "post";
  previous_season?: string;
}

export async function fetchSleeperState(): Promise<SleeperNflState> {
  const res = await fetch(`${SLEEPER_BASE}/state/nfl`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Sleeper state failed (${res.status})`);
  return (await res.json()) as SleeperNflState;
}

const SCORING_STAT: Record<ScoringFormat, string> = {
  ppr: "pts_ppr",
  half_ppr: "pts_half_ppr",
  standard: "pts_std",
};

interface SleeperProjection {
  stats?: Record<string, number | undefined>;
  [key: string]: unknown;
}

export interface SleeperProjectionRange {
  currentWeek: Map<string, number>;
  restOfSeason: Map<string, number>;
  unavailableWeeks: number[];
}

/**
 * Fetches current-through-week-18 projections. ROS is returned only when every
 * requested week has projection data, so a temporarily missing endpoint cannot
 * silently produce an understated total.
 */
export async function fetchSleeperProjectionRange(
  season: string,
  startWeek: number,
  scoring: ScoringFormat
): Promise<SleeperProjectionRange> {
  const weeks = Array.from({ length: Math.max(0, 18 - startWeek + 1) }, (_, i) => startWeek + i);
  if (weeks.length === 0) return { currentWeek: new Map(), restOfSeason: new Map(), unavailableWeeks: [] };

  const results = await Promise.allSettled(
    weeks.map(async (week) => {
      const url = `${SLEEPER_BASE}/projections/nfl/${season}/${week}?season_type=regular`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Sleeper projections week ${week} failed (${res.status})`);
      const data = (await res.json()) as Record<string, SleeperProjection>;
      const key = SCORING_STAT[scoring];
      const points = new Map<string, number>();
      for (const [id, player] of Object.entries(data)) {
        const value = player?.stats?.[key];
        if (typeof value === "number" && Number.isFinite(value) && value > 0) points.set(id, value);
      }
      return { week, points };
    })
  );

  const currentResult = results[0];
  if (currentResult.status === "rejected") throw currentResult.reason;

  const unavailableWeeks: number[] = [];
  const totals = new Map<string, number>();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected" || result.value.points.size === 0) {
      unavailableWeeks.push(weeks[i]);
      continue;
    }
    for (const [id, points] of result.value.points) {
      totals.set(id, (totals.get(id) ?? 0) + points);
    }
  }

  return {
    currentWeek: currentResult.value.points,
    restOfSeason: unavailableWeeks.length === 0 ? totals : new Map(),
    unavailableWeeks,
  };
}
