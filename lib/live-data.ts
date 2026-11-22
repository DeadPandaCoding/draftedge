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

interface SleeperStatLine {
  stats?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SleeperProjectionRange {
  currentWeek: Map<string, number>;
  restOfSeason: Map<string, number>;
  unavailableWeeks: number[];
}

export interface SleeperSeasonTotals {
  actualPoints: Map<string, number>;
  fullSeasonProjection: Map<string, number>;
  unavailableStatsWeeks: number[];
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
        if (typeof value === "number" && Number.isFinite(value)) points.set(id, value);
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

/**
 * Sums completed-week actual points and adds the current ROS estimate. Sleeper's
 * weekly stats endpoint is undocumented, so incomplete weeks invalidate the
 * full-season total rather than silently understating it.
 */
export async function fetchSleeperSeasonTotals(
  season: string,
  completedWeeks: number,
  scoring: ScoringFormat,
  rosProjection: Map<string, number>
): Promise<SleeperSeasonTotals> {
  const weeks = Array.from({ length: Math.max(0, Math.min(18, completedWeeks)) }, (_, i) => i + 1);
  const results = await Promise.allSettled(
    weeks.map(async (week) => {
      const url = `${SLEEPER_BASE}/stats/nfl/regular/${season}/${week}`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Sleeper actual stats week ${week} failed (${res.status})`);
      const data = (await res.json()) as Record<string, SleeperStatLine>;
      const key = SCORING_STAT[scoring];
      const points = new Map<string, number>();
      for (const [id, line] of Object.entries(data)) {
        const raw = line?.stats?.[key] ?? line?.[key];
        const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
        if (Number.isFinite(value)) points.set(id, value);
      }
      if (points.size === 0) throw new Error(`Sleeper actual stats week ${week} returned no ${key} values`);
      return { week, points };
    })
  );

  const unavailableStatsWeeks: number[] = [];
  const actualPoints = new Map<string, number>();
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      unavailableStatsWeeks.push(weeks[i]);
      continue;
    }
    for (const [id, points] of result.value.points) {
      actualPoints.set(id, (actualPoints.get(id) ?? 0) + points);
    }
  }

  const fullSeasonProjection = new Map<string, number>();
  if (unavailableStatsWeeks.length === 0 && rosProjection.size > 0) {
    const playerIds = new Set([...actualPoints.keys(), ...rosProjection.keys()]);
    for (const id of playerIds) {
      const total = (actualPoints.get(id) ?? 0) + (rosProjection.get(id) ?? 0);
      fullSeasonProjection.set(id, Math.round(total * 10) / 10);
    }
  }

  return {
    actualPoints: unavailableStatsWeeks.length === 0 ? actualPoints : new Map(),
    fullSeasonProjection,
    unavailableStatsWeeks,
  };
}
