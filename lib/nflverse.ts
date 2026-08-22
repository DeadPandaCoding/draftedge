import type { UsageMetrics } from "./types";
import { cellNumber, csvToRecords, parseCsv } from "./csv-parse";

/**
 * nflverse is the free, open NFL dataset (nflfastR/nflreadr). We pull the
 * regular-season player summary stats, which include targets, air yards, and
 * the team-relative opportunity shares (target_share, air_yards_share, WOPR).
 *
 * Files are served from GitHub releases at a stable URL pattern, e.g.:
 *   https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_2025.csv
 */

const NFLVERSE_BASE = "https://github.com/nflverse/nflverse-data/releases/download";
const REVALIDATE_SECONDS = 3600;

function usageFromRecord(r: Record<string, string>, season: number): UsageMetrics | null {
  // nflverse player stats key on `player_id`, which holds the NFL gsis_id
  // ("00-0033280") — the same id Sleeper exposes as `gsis_id`.
  const id = (r.player_id ?? r.gsis_id ?? "").trim();
  if (!id) return null;
  return {
    season,
    games: cellNumber(r.games),
    targets: cellNumber(r.targets),
    receptions: cellNumber(r.receptions),
    receivingYards: cellNumber(r.receiving_yards),
    airYards: cellNumber(r.receiving_air_yards),
    yac: cellNumber(r.receiving_yards_after_catch),
    targetShare: cellNumber(r.target_share),
    airYardsShare: cellNumber(r.air_yards_share),
    wopr: cellNumber(r.wopr),
  };
}

/**
 * Downloads + parses nflverse regular-season player stats for `season`,
 * returning a map keyed by gsis_id → usage metrics. Throws on failure so the
 * caller can fall back to no usage data.
 */
export async function fetchNflverseUsage(season: number): Promise<Map<string, UsageMetrics>> {
  const url = `${NFLVERSE_BASE}/stats_player/stats_player_reg_${season}.csv`;
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`nflverse ${season} request failed (${res.status})`);
  const text = await res.text();
  const records = csvToRecords(parseCsv(text));

  const out = new Map<string, UsageMetrics>();
  for (const r of records) {
    const id = (r.player_id ?? r.gsis_id ?? "").trim();
    if (!id) continue;
    const usage = usageFromRecord(r, season);
    if (usage) out.set(id, usage);
  }
  return out;
}
