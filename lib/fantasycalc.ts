/**
 * FantasyCalc API client — free, no-auth source for consensus trade values.
 *
 * Endpoint: https://api.fantasycalc.com/values/current
 * Supports: redraft, 1QB/2QB, 8–16 teams, standard/half/full PPR.
 * Source: https://github.com/320james/ready-trade (MIT-licensed reference).
 *
 * We use this alongside our own VOR-based values so users see both a
 * projection-derived number and the community-consensus number.
 */

export interface FantasyCalcPlayer {
  id: number;
  name: string;
  position: string;
  team?: string;
  age?: number;
  yoe?: number;
}

export interface FantasyCalcEntry {
  player: FantasyCalcPlayer;
  value: number; // community trade value (raw, divide by 100 for display)
  overallRank: number;
  positionRank: number;
  trend30Day: number; // 30-day value change (positive = rising)
  redraftValue: number;
  combinedValue: number;
  starter: boolean;
  tier?: number;
}

export interface FantasyCalcSettings {
  numQbs: number;
  numTeams: number;
  ppr: number; // 0 | 0.5 | 1
}

// ── Rate limiting (token bucket) ────────────────────────────────────────
const RATE = { tokens: 10, refill: 1, last: Date.now(), available: 10 };

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

// ── In-memory cache (5 min TTL) ─────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: FantasyCalcEntry[]; ts: number }>();

function cacheKey(s: FantasyCalcSettings): string {
  return `red-${s.numQbs}qb-${s.numTeams}t-${s.ppr}`;
}

// ── Fetch ───────────────────────────────────────────────────────────────
export async function fetchFantasyCalc(
  settings: FantasyCalcSettings,
): Promise<FantasyCalcEntry[]> {
  const key = cacheKey(settings);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  await wait();

  const params = new URLSearchParams({
    isDynasty: "false",
    numQbs: String(settings.numQbs),
    numTeams: String(settings.numTeams),
    ppr: String(settings.ppr),
  });

  const res = await fetch(
    `https://api.fantasycalc.com/values/current?${params}`,
  );
  if (!res.ok) return []; // graceful degrade — never block the trade page

  const raw: unknown[] = await res.json();
  const entries: FantasyCalcEntry[] = raw.map((item) => {
    const r = item as Record<string, unknown>;
    const p = r.player as Record<string, unknown>;
    return {
      player: {
        id: p.id as number,
        name: p.name as string,
        position: p.position as string,
        team: (p.maybeTeam as string) ?? "",
        age: p.maybeAge as number | undefined,
        yoe: p.maybeYoe as number | undefined,
      },
      value: (r.value as number) ?? 0,
      overallRank: (r.overallRank as number) ?? 0,
      positionRank: (r.positionRank as number) ?? 0,
      trend30Day: (r.trend30Day as number) ?? 0,
      redraftValue: (r.redraftValue as number) ?? 0,
      combinedValue: (r.combinedValue as number) ?? 0,
      starter: (r.starter as boolean) ?? false,
      tier: (r.maybeTier as number) ?? undefined,
    };
  });

  cache.set(key, { data: entries, ts: Date.now() });
  return entries;
}

/**
 * Normalize a FantasyCalc value to a 0–100 scale for display.
 * The raw values range ~1–10 000, so we scale relative to the max
 * in the fetched dataset.
 */
export function normalizeFCValue(raw: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 100 * 10) / 10;
}

/**
 * Match a DraftEdge player to its FantasyCalc entry by name.
 * FantasyCalc uses slightly different names (e.g. "Ja'Marr Chase" vs
 * "Jamarre Chase"), so we normalize both sides.
 */
export function matchFantasyCalc(
  playerName: string,
  fcEntries: FantasyCalcEntry[],
): FantasyCalcEntry | undefined {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/jamarre/g, "jamarr"); // common FantasyCalc variant

  const target = norm(playerName);
  return fcEntries.find((e) => norm(e.player.name) === target);
}
