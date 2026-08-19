import { NextRequest, NextResponse } from "next/server";
import type { Player, Position, PlayersResponse, ScoringFormat } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { buildSeedPlayers, byeForTeam, normalizeName } from "@/lib/seed-data";

export const runtime = "nodejs";

const SLEEPER_BASE = "https://api.sleeper.app/v1";
const REVALIDATE_SECONDS = 3600; // refresh upstream data hourly

/** Max number of live-only players (not in seed) to append per position. */
const LIVE_CAPS: Record<Position, number> = {
  QB: 30,
  RB: 70,
  WR: 90,
  TE: 40,
  K: 15,
  DEF: 32,
};

interface LivePlayer {
  id: string;
  name: string;
  position: Position;
  team: string;
  searchRank: number;
}

/** Subset of the Sleeper player object we actually consume. */
interface SleeperPlayer {
  team?: string | null;
  status?: string;
  first_name?: string;
  last_name?: string;
  search_rank?: number;
}

async function fetchLivePlayers(): Promise<LivePlayer[]> {
  const results = await Promise.all(
    POSITIONS.map(async (pos) => {
      const url = `${SLEEPER_BASE}/players/nfl?position=${pos}&active=true`;
      const res = await fetch(url, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`Sleeper ${pos} request failed (${res.status})`);
      return { pos, data: (await res.json()) as Record<string, SleeperPlayer> };
    })
  );

  const out: LivePlayer[] = [];
  for (const { pos, data } of results) {
    for (const [id, p] of Object.entries(data)) {
      if (!p || typeof p !== "object") continue;
      const status: string = p.status ?? "";
      if (status === "Retired") continue;
      // Free agents arrive with a null team — keep them, labeled "FA".
      const team: string = p.team || "FA";
      let name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      if (!name) name = pos === "DEF" ? team : `Unknown ${pos}`;
      out.push({ id, name, position: pos, team, searchRank: Number(p.search_rank ?? 9999999) });
    }
  }
  return out;
}

function mergeWithSeed(live: LivePlayer[], scoring: ScoringFormat): Player[] {
  const seed = buildSeedPlayers(scoring);
  const seedById = new Map(seed.map((p) => [p.id, p]));
  const seedByName = new Map(seed.map((p) => [normalizeName(p.name), p]));

  // matchedLive: live ids that already resolved to a seed player (id or name match).
  // matchedSeed: seed ids that already received live metadata.
  const matchedLive = new Set<string>();
  const matchedSeed = new Set<string>();

  for (const l of live) {
    const match =
      seedById.get(l.id) ??
      (l.position !== "DEF" ? seedByName.get(normalizeName(l.name)) : undefined);
    if (match) {
      matchedLive.add(l.id);
      matchedSeed.add(match.id);
      // Live metadata wins for name/team; seed keeps projections/adp/bye.
      match.name = l.name;
      match.team = l.team;
      match.position = l.position;
      match.source = "live";
    }
  }

  // Second pass: name-only matches (live id differs from seed id), then
  // append remaining live-only players (draftable deep sleepers), capped.
  const capped: Player[] = [];
  for (const pos of POSITIONS) {
    const extras = live
      .filter((l) => l.position === pos && !matchedLive.has(l.id))
      .sort((a, b) => a.searchRank - b.searchRank)
      .slice(0, LIVE_CAPS[pos]);
    for (const l of extras) {
      const byName = seedByName.get(normalizeName(l.name));
      if (byName && !matchedSeed.has(byName.id)) {
        matchedLive.add(l.id);
        matchedSeed.add(byName.id);
        byName.name = l.name;
        byName.team = l.team;
        byName.source = "live";
        continue;
      }
      capped.push({
        id: l.id,
        name: l.name,
        position: l.position,
        team: l.team,
        bye: byeForTeam(l.team),
        adp: 0,
        projection: 0,
        weeklyAvg: 0,
        tier: 5,
        rank: 0,
        positionRank: 0,
        source: "live",
      });
    }
  }

  // Seed players arrive already ranked (rank 1..N, best to worst) from the
  // generated rankings. Preserve that order and slot live-only extras in at
  // the bottom with sensible rank/positionRank values.
  const maxPosRank = new Map<Position, number>();
  for (const p of seed) {
    maxPosRank.set(p.position, Math.max(maxPosRank.get(p.position) ?? 0, p.positionRank));
  }
  let nextRank = seed.length;
  for (const e of capped) {
    e.rank = ++nextRank;
    const pr = (maxPosRank.get(e.position) ?? 0) + 1;
    maxPosRank.set(e.position, pr);
    e.positionRank = pr;
  }

  return [...seed, ...capped];
}

export async function GET(req: NextRequest) {
  const scoringParam = (req.nextUrl.searchParams.get("scoring") ?? "ppr") as ScoringFormat;
  const scoring: ScoringFormat =
    scoringParam === "half_ppr" || scoringParam === "standard" ? scoringParam : "ppr";

  let live: LivePlayer[] = [];
  let source: "live" | "seed" = "seed";
  try {
    live = await fetchLivePlayers();
    source = "live";
  } catch (err) {
    console.warn("[players] Sleeper fetch failed, using seed data only:", err);
  }

  const players = mergeWithSeed(live, scoring);
  const body: PlayersResponse = {
    players,
    source,
    generatedAt: Date.now(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
