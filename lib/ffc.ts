/**
 * FantasyFootballCalculator API client — free, no-auth source for
 * real-time ADP data from thousands of live drafts.
 *
 * Endpoint: https://fantasyfootballcalculator.com/api/v1/adp/{format}
 * Returns: 200+ players with ADP, draft range, standard deviation,
 *          times drafted, and bye weeks.
 *
 * Source: https://ready-trade (MIT-licensed reference).
 */

export interface FFCPlayer {
  playerId: number;
  name: string;
  position: string;
  team: string;
  adp: number; // average draft position (1.01 = 1st overall)
  adpFormatted: string; // e.g. "1.02"
  timesDrafted: number;
  high: number; // earliest pick taken
  low: number; // latest pick taken
  stdev: number; // ADP standard deviation
  bye: number; // bye week
}

export interface FFCMeta {
  type: string;
  teams: number;
  rounds: number;
  totalDrafts: number;
  startDate: string;
  endDate: string;
}

export interface FFCResponse {
  status: string;
  meta: FFCMeta;
  players: FFCPlayer[];
}

// ── Rate limiting (token bucket) ────────────────────────────────────────
const RATE = { tokens: 5, refill: 0.5, last: Date.now(), available: 5 };

async function wait(): Promise<void> {
  const now = Date.now();
  const elapsed = (now - RATE.last) / 1000;
  RATE.available = Math.min(RATE.tokens, RATE.available + elapsed * RATE.refill);
  RATE.last = now;
  if (RATE.available < 1) {
    const ms = ((1 - RATE.available) / RATE.refill) * 1000;
    await new Promise((r) => setTimeout(r, ms));
    return wait();
  }
  RATE.available -= 1;
}

// ── In-memory cache (10 min TTL) ────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map<string, { data: FFCResponse; ts: number }>();

// ── Fetch ───────────────────────────────────────────────────────────────
export async function fetchFFCAdp(
  scoring: "ppr" | "half" | "standard",
  teams: number,
  year: number,
): Promise<FFCResponse> {
  const key = `${scoring}-${teams}-${year}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  await wait();

  const res = await fetch(
    `https://fantasyfootballcalculator.com/api/v1/adp/${scoring}?teams=${teams}&year=${year}`,
  );
  if (!res.ok) return { status: "error", meta: {} as FFCMeta, players: [] };

  const raw: {
    status: string;
    meta: {
      type: string;
      teams: number;
      rounds: number;
      total_drafts: number;
      start_date: string;
      end_date: string;
    };
    players: Array<{
      player_id: number;
      name: string;
      position: string;
      team: string;
      adp: number;
      adp_formatted: string;
      times_drafted: number;
      high: number;
      low: number;
      stdev: number;
      bye: number;
    }>;
  } = await res.json();

  const data: FFCResponse = {
    status: raw.status,
    meta: {
      type: raw.meta.type,
      teams: raw.meta.teams,
      rounds: raw.meta.rounds,
      totalDrafts: raw.meta.total_drafts,
      startDate: raw.meta.start_date,
      endDate: raw.meta.end_date,
    },
    players: raw.players.map((p) => ({
      playerId: p.player_id,
      name: p.name,
      position: p.position,
      team: p.team,
      adp: p.adp,
      adpFormatted: p.adp_formatted,
      timesDrafted: p.times_drafted,
      high: p.high,
      low: p.low,
      stdev: p.stdev,
      bye: p.bye,
    })),
  };

  cache.set(key, { data, ts: Date.now() });
  return data;
}

/**
 * Match a DraftEdge player to an FFC ADP entry by name.
 */
export function matchFFC(
  playerName: string,
  ffcPlayers: FFCPlayer[],
): FFCPlayer | undefined {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(playerName);
  return ffcPlayers.find((p) => norm(p.name) === target);
}
