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

/**
 * Fetches Sleeper's weekly projections for `season`/`week`, returning a map of
 * player_id → projected points in `scoring`. Returns an empty map (rather than
 * throwing) when Sleeper hasn't published projections yet — e.g. during the
 * preseason, when every player's stats object is empty.
 */
export async function fetchSleeperWeeklyProjections(
  season: string,
  week: number,
  scoring: ScoringFormat
): Promise<Map<string, number>> {
  const url = `${SLEEPER_BASE}/projections/nfl/${season}/${week}?season_type=regular`;
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Sleeper projections failed (${res.status})`);

  const data = (await res.json()) as Record<string, SleeperProjection>;
  const key = SCORING_STAT[scoring];
  const out = new Map<string, number>();
  for (const [id, obj] of Object.entries(data)) {
    if (!obj || typeof obj !== "object") continue;
    const v = obj.stats?.[key];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out.set(id, v);
  }
  return out;
}
