import { NextRequest, NextResponse } from "next/server";
import type { InjuryStatus, Player, Position, PlayersResponse, ScoringFormat, UsageMetrics } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { buildSeedPlayers, byeForTeam, normalizeName } from "@/lib/seed-data";
import { fetchNflverseUsage } from "@/lib/nflverse";
import { fetchSleeperProjectionRange, fetchSleeperSeasonTotals, fetchSleeperState } from "@/lib/live-data";
import { fetchFantasyProsProjections } from "@/lib/fantasypros";
import { fetchWeeklyRankings, type WeeklyRankings } from "@/lib/fantasypros-weekly-rankings";
import { fetchFFCAdp, matchFFC, type FFCPlayer } from "@/lib/ffc";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SLEEPER_BASE = "https://api.sleeper.app/v1";
const REVALIDATE_SECONDS = 3600; // refresh upstream data hourly
const SNAPSHOT_MAX_AGE_MS = 36 * 60 * 60 * 1000;
// v7: canonical, scoring-independent player IDs (see lib/seed-data.ts).
const SNAPSHOT_SCHEMA_VERSION = 7;

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
  gsisId: string;
  injuryStatus: InjuryStatus | null;
  injuryBodyPart: string | null;
}

/** Subset of the Sleeper player object we actually consume. */
interface SleeperPlayer {
  team?: string | null;
  status?: string;
  first_name?: string;
  last_name?: string;
  search_rank?: number;
  gsis_id?: string | null;
  injury_status?: string | null;
  injury_body_part?: string | null;
}

function normalizeInjuryStatus(raw?: string | null): InjuryStatus | null {
  const value = raw?.trim().toUpperCase();
  if (!value) return null;
  if (value === "Q" || value.includes("QUESTIONABLE")) return "Q";
  if (value === "D" || value.includes("DOUBTFUL")) return "D";
  if (value === "O" || value === "OUT") return "O";
  if (value === "IR" || value.includes("INJURED RESERVE")) return "IR";
  if (value === "PUP" || value.includes("PHYSICALLY UNABLE")) return "PUP";
  if (value === "SUS" || value.includes("SUSPEND")) return "SUS";
  return null;
}

async function fetchLivePlayers(): Promise<LivePlayer[]> {
  const results = await Promise.allSettled(
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
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      console.warn(`[players] Sleeper ${POSITIONS[i]} fetch failed:`, result.reason);
      continue;
    }
    const { pos, data } = result.value;
    for (const [id, p] of Object.entries(data)) {
      if (!p || typeof p !== "object") continue;
      const status: string = p.status ?? "";
      if (status === "Retired") continue;
      // Free agents arrive with a null team — keep them, labeled "FA".
      const team: string = p.team || "FA";
      let name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      if (!name) name = pos === "DEF" ? team : `Unknown ${pos}`;
      out.push({
        id,
        name,
        position: pos,
        team,
        searchRank: Number(p.search_rank ?? 9999999),
        gsisId: p.gsis_id ?? "",
        injuryStatus: normalizeInjuryStatus(p.injury_status || (status.toLowerCase().includes("suspend") ? "SUS" : null)),
        injuryBodyPart: p.injury_body_part ?? null,
      });
    }
  }
  if (out.length === 0) throw new Error("All Sleeper position requests failed");
  return out;
}

function mergeWithSeed(
  live: LivePlayer[],
  scoring: ScoringFormat,
  usage: Map<string, UsageMetrics>,
  weekProj: Map<string, number>,
  rosProj: Map<string, number>,
  actualPoints: Map<string, number>,
  seasonProj: Map<string, number>,
  fpProj: Map<string, number>,
  fpWeeklyRanks: WeeklyRankings["byName"],
  ffcPlayers: FFCPlayer[],
): Player[] {
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
      match.sleeperId = l.id;
      match.injuryStatus = l.injuryStatus;
      match.injuryBodyPart = l.injuryBodyPart;
      if (l.gsisId) match.usage = usage.get(l.gsisId);
      const wp0 = weekProj.get(l.id);
      if (wp0 != null) match.weekProjection = wp0;
      const ros0 = rosProj.get(l.id);
      if (ros0 != null) match.rosProjection = ros0;
      const actual0 = actualPoints.get(l.id);
      if (actual0 != null) match.actualPoints = actual0;
      const season0 = seasonProj.get(l.id);
      if (season0 != null) match.seasonProjection = season0;
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
        byName.sleeperId = l.id;
        byName.injuryStatus = l.injuryStatus;
        byName.injuryBodyPart = l.injuryBodyPart;
        if (l.gsisId) byName.usage = usage.get(l.gsisId);
        const wp1 = weekProj.get(l.id);
        if (wp1 != null) byName.weekProjection = wp1;
        const ros1 = rosProj.get(l.id);
        if (ros1 != null) byName.rosProjection = ros1;
        const actual1 = actualPoints.get(l.id);
        if (actual1 != null) byName.actualPoints = actual1;
        const season1 = seasonProj.get(l.id);
        if (season1 != null) byName.seasonProjection = season1;
        continue;
      }
      capped.push({
        id: l.id,
        sleeperId: l.id,
        name: l.name,
        position: l.position,
        team: l.team,
        bye: byeForTeam(l.team),
        adp: 0,
        projection: seasonProj.get(l.id) ?? 0,
        weeklyAvg: seasonProj.has(l.id) ? Math.round(((seasonProj.get(l.id) ?? 0) / 17) * 10) / 10 : 0,
        tier: 5,
        rank: 0,
        positionRank: 0,
        source: "live",
        injuryStatus: l.injuryStatus,
        injuryBodyPart: l.injuryBodyPart,
        usage: l.gsisId ? usage.get(l.gsisId) : undefined,
        weekProjection: weekProj.get(l.id),
        rosProjection: rosProj.get(l.id),
        actualPoints: actualPoints.get(l.id),
        seasonProjection: seasonProj.get(l.id),
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

  const result = [...seed, ...capped];

  // Enrich with FantasyCalc ADP: live ADP from thousands of drafts overrides
  // seed ADP (which may be stale). Only update if FFC has a match.
  for (const p of result) {
    const ffc = matchFFC(p.name, ffcPlayers);
    if (ffc && ffc.adp > 0) {
      p.adp = ffc.adp;
    }
  }

  // Keep season projections separate from this week's point projections. Only
  // average sources that both estimate a full season; projecting one week over
  // 17 games produced a misleading season total in the previous implementation.
  for (const p of result) {
    if (p.seasonProjection != null) {
      p.projection = p.seasonProjection;
      p.consensus = p.seasonProjection;
      p.weeklyAvg = Math.round((p.seasonProjection / 17) * 10) / 10;
      continue;
    }
    const sources: number[] = [];
    if (p.projection > 0) sources.push(p.projection);
    const fp = fpProj.get(normalizeName(p.name));
    if (fp != null && fp > 0) sources.push(fp);
    if (sources.length > 0) {
      p.consensus = Math.round((sources.reduce((a, b) => a + b, 0) / sources.length) * 10) / 10;
      if (fp != null && fp > 0) {
        p.projection = p.consensus;
        p.weeklyAvg = Math.round((p.projection / 17) * 10) / 10;
      }
    }
  }

  if (fpWeeklyRanks.size > 0) {
    for (const p of result) {
      const ranking = fpWeeklyRanks.get(normalizeName(p.name));
      p.weekPositionRank = ranking?.position === p.position ? ranking.positionRank : undefined;
    }

    const byWeeklyProjection = [...result]
      .filter((p) => p.weekProjection != null && p.weekProjection > 0)
      .sort(
        (a, b) =>
          (b.weekProjection ?? 0) - (a.weekProjection ?? 0) ||
          (a.weekPositionRank ?? Number.MAX_SAFE_INTEGER) -
            (b.weekPositionRank ?? Number.MAX_SAFE_INTEGER) ||
          a.rank - b.rank,
      );
    const rankedIds = new Set<string>();
    byWeeklyProjection.forEach((p, index) => {
      p.weekRank = index + 1;
      rankedIds.add(p.id);
    });

    [...result]
      .filter((p) => !rankedIds.has(p.id))
      .sort(
        (a, b) =>
          (a.weekPositionRank ?? Number.MAX_SAFE_INTEGER) -
            (b.weekPositionRank ?? Number.MAX_SAFE_INTEGER) ||
          a.rank - b.rank,
      )
      .forEach((p, index) => {
        p.weekRank = byWeeklyProjection.length + index + 1;
      });

    const byPosition = new Map<Position, Player[]>();
    for (const p of result) {
      const list = byPosition.get(p.position) ?? [];
      list.push(p);
      byPosition.set(p.position, list);
    }
    for (const players of byPosition.values()) {
      const ordered = [...players].sort(
        (a, b) =>
          (a.weekPositionRank ?? Number.MAX_SAFE_INTEGER) -
            (b.weekPositionRank ?? Number.MAX_SAFE_INTEGER) ||
          (b.weekProjection ?? 0) - (a.weekProjection ?? 0) ||
          a.rank - b.rank,
      );
      ordered.forEach((p, index) => {
        p.weekTier = Math.min(5, Math.ceil(((index + 1) / ordered.length) * 5));
      });
    }
  }

  if (fpProj.size > 0 || seasonProj.size > 0) {
    const overall = [...result].sort((a, b) => b.projection - a.projection || a.rank - b.rank);
    overall.forEach((p, index) => {
      p.rank = index + 1;
    });
    const byPosition = new Map<Position, Player[]>();
    for (const p of result) {
      const list = byPosition.get(p.position) ?? [];
      list.push(p);
      byPosition.set(p.position, list);
    }
    for (const players of byPosition.values()) {
      const ordered = [...players].sort((a, b) => b.projection - a.projection || a.rank - b.rank);
      ordered.forEach((p, index) => {
        p.positionRank = index + 1;
        p.tier = Math.min(5, Math.ceil(((index + 1) / ordered.length) * 5));
      });
    }
  }

  const rosPlayers = result.filter((p) => p.rosProjection != null && p.rosProjection > 0);
  rosPlayers.sort((a, b) => (b.rosProjection ?? 0) - (a.rosProjection ?? 0) || a.rank - b.rank);
  rosPlayers.forEach((p, index) => {
    p.rosRank = index + 1;
  });
  const byRosPosition = new Map<Position, Player[]>();
  for (const p of rosPlayers) {
    const list = byRosPosition.get(p.position) ?? [];
    list.push(p);
    byRosPosition.set(p.position, list);
  }
  for (const players of byRosPosition.values()) {
    players
      .sort((a, b) => (b.rosProjection ?? 0) - (a.rosProjection ?? 0) || a.rank - b.rank)
      .forEach((p, index) => {
        p.rosPositionRank = index + 1;
        p.rosTier = Math.min(5, Math.ceil(((index + 1) / players.length) * 5));
      });
  }

  return result;
}

async function readLatestSnapshot(scoring: ScoringFormat): Promise<PlayersResponse | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  // The admin client is intentionally untyped because this repo doesn't yet
  // generate Supabase database types for its migrations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("projections_snapshots")
    .select("created_at, data")
    .eq("scoring", scoring)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[players] Supabase snapshot read failed:", error.message);
    return null;
  }

  const row = data as { created_at: string; data: unknown } | null;
  const snapshot = row?.data as Partial<PlayersResponse> | null;
  if (!row || !snapshot || snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION || !Array.isArray(snapshot.players)) return null;

  const generatedAt = Number(snapshot.generatedAt) || Date.parse(row.created_at);
  const age = Date.now() - generatedAt;
  if (!Number.isFinite(generatedAt) || age < 0 || age > SNAPSHOT_MAX_AGE_MS) return null;

  return {
    players: snapshot.players,
    source: snapshot.source === "seed" ? "seed" : "live",
    generatedAt,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    weeklyRankingsUpdated: snapshot.weeklyRankingsUpdated,
    currentWeek: snapshot.currentWeek ?? null,
  };
}

export async function GET(req: NextRequest) {
  const scoringParam = (req.nextUrl.searchParams.get("scoring") ?? "ppr") as ScoringFormat;
  const scoring: ScoringFormat =
    scoringParam === "half_ppr" || scoringParam === "standard" ? scoringParam : "ppr";
  const refreshRequested = req.nextUrl.searchParams.get("refresh") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (
    refreshRequested &&
    (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!refreshRequested) {
    const snapshot = await readLatestSnapshot(scoring);
    if (snapshot) {
      return NextResponse.json(snapshot, {
        headers: {
          "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`,
        },
      });
    }
  }

  let live: LivePlayer[] = [];
  let source: "live" | "seed" = "seed";
  try {
    live = await fetchLivePlayers();
    source = "live";
  } catch (err) {
    console.warn("[players] Sleeper fetch failed, using seed data only:", err);
  }

  // Enrichment from free sources (nflverse usage + Sleeper weekly projections).
  // All non-fatal — players still load (just without those fields) on failure.
  const usage = new Map<string, UsageMetrics>();
  const weekProj = new Map<string, number>();
  const rosProj = new Map<string, number>();
  const actualPoints = new Map<string, number>();
  const seasonProj = new Map<string, number>();
  const fpProj = new Map<string, number>();
  let fpWeeklyRanks: WeeklyRankings["byName"] = new Map();
  let weeklyRankingsUpdated: string | undefined;
  let state: Awaited<ReturnType<typeof fetchSleeperState>> | undefined;
  try {
    state = await fetchSleeperState();
  } catch (err) {
    console.warn("[players] Sleeper state fetch failed:", err);
  }

  const season = Number(state?.season) || new Date().getFullYear();
  const usageSeason = Number(
    state?.season_type === "pre" ? state.previous_season ?? season - 1 : season,
  );
  if (Number.isFinite(usageSeason) && usageSeason >= 1999) {
    try {
      const usageData = await fetchNflverseUsage(usageSeason);
      for (const [k, v] of usageData) usage.set(k, v);
    } catch (err) {
      console.warn("[players] nflverse usage fetch failed:", err);
    }
  }

  if (state?.season_type === "regular" && state.week >= 1) {
    try {
      const projections = await fetchSleeperProjectionRange(state.season, state.week, scoring);
      for (const [k, v] of projections.currentWeek) weekProj.set(k, v);
      for (const [k, v] of projections.restOfSeason) rosProj.set(k, v);
      if (projections.unavailableWeeks.length > 0) {
        console.warn("[players] Sleeper ROS projections unavailable for weeks:", projections.unavailableWeeks);
      }
    } catch (err) {
      console.warn("[players] Sleeper weekly projections failed:", err);
    }

    try {
      const actualAndSeason = await fetchSleeperSeasonTotals(
        state.season,
        state.week - 1,
        scoring,
        rosProj,
      );
      for (const [id, points] of actualAndSeason.actualPoints) actualPoints.set(id, points);
      for (const [id, points] of actualAndSeason.fullSeasonProjection) seasonProj.set(id, points);
      if (actualAndSeason.unavailableStatsWeeks.length > 0) {
        console.warn("[players] Full-season totals unavailable for completed weeks:", actualAndSeason.unavailableStatsWeeks);
      }
    } catch (err) {
      console.warn("[players] Sleeper actual stats failed:", err);
    }

    try {
      const rankings = await fetchWeeklyRankings();
      fpWeeklyRanks = rankings.byName;
      weeklyRankingsUpdated = rankings.byName.size > 0 ? rankings.updatedAt : undefined;
    } catch (err) {
      console.warn("[players] weekly consensus rankings failed:", err);
    }
  }

  try {
    const projections = await fetchFantasyProsProjections(season, scoring);
    for (const [k, v] of projections) fpProj.set(k, v);
  } catch (err) {
    console.warn("[players] FantasyPros season projections failed:", err);
  }

  // FantasyFootballCalculator ADP: live draft data from thousands of mocks.
  const teamCount = Number(req.nextUrl.searchParams.get("teams")) || 12;
  let ffcPlayers: FFCPlayer[] = [];
  try {
    const ffcScoring = scoring === "half_ppr" ? "half" : scoring;
    const ffc = await fetchFFCAdp(ffcScoring, teamCount, season);
    ffcPlayers = ffc.players;
  } catch (err) {
    console.warn("[players] FFC ADP fetch failed:", err);
  }

  const players = mergeWithSeed(live, scoring, usage, weekProj, rosProj, actualPoints, seasonProj, fpProj, fpWeeklyRanks, ffcPlayers);
  const body: PlayersResponse = {
    players,
    source,
    generatedAt: Date.now(),
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    weeklyRankingsUpdated,
    currentWeek: state?.season_type === "regular" ? state.week : null,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": refreshRequested
        ? "private, no-store"
        : `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`,
    },
  });
}
