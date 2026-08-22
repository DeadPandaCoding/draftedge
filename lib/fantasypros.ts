import type { ScoringFormat } from "./types";

/**
 * FantasyPros free-tier API for season-long projections.
 *
 * Requires a `FANTASYPROS_API_KEY` env var (free signup at fantasypros.com).
 * When unset the module silently returns an empty map — no crash, no error.
 * The code is intentionally defensive: if FantasyPros changes their response
 * shape or the key expires, the consensus falls back gracefully to whatever
 * other sources are available.
 */

const FP_BASE = "https://www.fantasypros.com/v2/json/nfl";
const REVALIDATE_SECONDS = 3600;

const SCORING_KEY: Record<ScoringFormat, string> = {
  ppr: "PPR",
  half_ppr: "HALF",
  standard: "STD",
};

function getApiKey(): string | undefined {
  return process.env.FANTASYPROS_API_KEY?.trim() || undefined;
}

export function isFantasyProsConfigured(): boolean {
  return Boolean(getApiKey());
}

interface FPPlayer {
  player_name?: string;
  player_id?: string | number;
  projected_points?: number | string;
  fantasy_points?: number | string;
  [key: string]: unknown;
}

interface FPResponse {
  players?: FPPlayer[];
  [key: string]: unknown;
}

/** Coerce a value to a finite non-negative number, or return undefined. */
function safeNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

/**
 * Fetches FantasyPros season-long projections for the given season + scoring,
 * returning a name-keyed map (normalised) → projected points.
 *
 * Returns an empty map when:
 *   - `FANTASYPROS_API_KEY` is not set
 *   - The API request fails (403, network, etc.)
 *   - The response shape doesn't match expectations
 */
export async function fetchFantasyProsProjections(
  season: number,
  scoring: ScoringFormat
): Promise<Map<string, number>> {
  const apiKey = getApiKey();
  if (!apiKey) return new Map();

  const fpScoring = SCORING_KEY[scoring];
  const url = `${FP_BASE}/${season}/projections?scoring=${fpScoring}&position=ALL&key=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[fantasypros] ${res.status} — check API key`);
      return new Map();
    }

    const data = (await res.json()) as FPResponse;
    const list = data.players;
    if (!Array.isArray(list)) return new Map();

    const out = new Map<string, number>();
    for (const p of list) {
      if (!p || typeof p !== "object") continue;
      const name = (p.player_name ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!name) continue;
      const pts = safeNum(p.projected_points) ?? safeNum(p.fantasy_points);
      if (pts != null) out.set(name, pts);
    }
    return out;
  } catch (err) {
    console.warn("[fantasypros] fetch failed:", err);
    return new Map();
  }
}
