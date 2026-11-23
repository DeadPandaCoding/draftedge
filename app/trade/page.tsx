"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchDraftState, fetchLeague } from "@/lib/data";
import { buildRoster } from "@/lib/draft";
import { SCORING_LABELS } from "@/lib/league";
import { usePlayers } from "@/lib/players";
import { normalizeName } from "@/lib/seed-data";
import { resolveSleeperPlayerIds, toScoringFormat, useSyncedLeagues } from "@/lib/league-context";
import type {
  DraftPick,
  DraftState,
  LeagueConfig,
  Player,
  RosterEntry,
  RosterTemplate,
} from "@/lib/types";
import { buildMatchupContext, MATCHUP_DATA_UNAVAILABLE } from "@/lib/matchup-context";
import { buildTradeValues, gradeTrade } from "@/lib/trade-value";
import {
  fetchFantasyCalc,
  normalizeFCValue,
  matchFantasyCalc,
  type FantasyCalcEntry,
} from "@/lib/fantasycalc";
import AppShell from "@/components/dashboard/AppShell";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { ShareButtons } from "@/components/dashboard/ShareButtons";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";
import { InjuryBadge, PosBadge, Skeleton } from "@/components/ui";
import { XIcon } from "@/components/icons";

type Side = "A" | "B";

const GROUPS = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF"] as const;

interface RosterSnapshot {
  counts: Record<string, number>;
  starterProj: number;
  missing: string[];
}

function snapshotRoster(
  entries: RosterEntry[],
  playersById: Map<string, Player>,
  roster: RosterTemplate
): RosterSnapshot {
  const counts: Record<string, number> = {};
  let starterProj = 0;
  for (const e of entries) {
    const group = e.slot.replace(/\d+$/, "");
    counts[group] = (counts[group] ?? 0) + 1;
    if (group !== "BENCH") starterProj += playersById.get(e.playerId)?.projection ?? 0;
  }
  const reqs: [string, number][] = [
    ["QB", roster.qb],
    ["RB", roster.rb],
    ["WR", roster.wr],
    ["TE", roster.te],
    ["FLEX", roster.flex],
    ["K", roster.k],
    ["DEF", roster.def],
  ];
  const missing: string[] = [];
  for (const [g, need] of reqs) {
    for (let i = counts[g] ?? 0; i < need; i++) missing.push(g);
  }
  return { counts, starterProj, missing };
}

export default function TradePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeLeague } = useSyncedLeagues();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  const scoring = activeLeague ? toScoringFormat(activeLeague.scoring_format) : league?.scoring ?? "ppr";
  const teamCount = activeLeague?.total_teams ?? league?.teamCount ?? 12;
  const { players, loading: playersLoading } = usePlayers(scoring);

  const [sideA, setSideA] = useState<string[]>([]);
  const [sideB, setSideB] = useState<string[]>([]);
  const [selectedMyTeamId, setSelectedMyTeamId] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [fcEntries, setFcEntries] = useState<FantasyCalcEntry[]>([]);
  const fcRequested = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  // Load the user's league (baseline team count) and saved roster.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const lg = await fetchLeague(user.id);
        if (cancelled) return;
        setLeague(lg);
        if (lg) {
          const ds = await fetchDraftState(lg.id);
          if (!cancelled) setDraftState(ds);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Restore a shared trade from ?get=...&send=... on first load.
  useEffect(() => {
    if (initialized.current) return;
    if (playersLoading || players.length === 0) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const resolve = (raw: string): string[] =>
      raw
        .split(",")
        .filter(Boolean)
        .map((slug) => players.find((p) => normalizeName(p.name) === normalizeName(slug)))
        .filter((p): p is Player => Boolean(p))
        .map((p) => p.id);

    const getIds = resolve(params.get("get") ?? "");
    const sendIds = resolve(params.get("send") ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getIds.length > 0) setSideA(getIds);
    if (sendIds.length > 0) setSideB(sendIds);
  }, [players, playersLoading]);

  // Fetch FantasyCalc consensus values (dynasty mode for the community).
  useEffect(() => {
    const requestKey = `${teamCount}:${scoring}`;
    if (fcRequested.current === requestKey) return;
    fcRequested.current = requestKey;
    let cancelled = false;
    fetchFantasyCalc({
      isDynasty: false,
      numQbs: 1,
      numTeams: teamCount,
      ppr: scoring === "ppr" ? 1 : scoring === "half_ppr" ? 0.5 : 0,
    })
      .then((d) => { if (!cancelled) setFcEntries(d); })
      .catch(() => { /* graceful degrade */ });
    return () => { cancelled = true; };
  }, [teamCount, scoring]);

  const fcMax = useMemo(() => {
    if (fcEntries.length === 0) return 1;
    return Math.max(...fcEntries.map((e) => e.value));
  }, [fcEntries]);

  /** Map DraftEdge player id → FantasyCalc normalized value (0–100). */
  const fcValueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of players) {
      const match = matchFantasyCalc(p.name, fcEntries);
      if (match) m.set(p.id, normalizeFCValue(match.value, fcMax));
    }
    return m;
  }, [players, fcEntries, fcMax]);

  /** Map DraftEdge player id → FantasyCalc entry (for rank/trend display). */
  const fcEntryMap = useMemo(() => {
    const m = new Map<string, FantasyCalcEntry>();
    for (const p of players) {
      const match = matchFantasyCalc(p.name, fcEntries);
      if (match) m.set(p.id, match);
    }
    return m;
  }, [players, fcEntries]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const contexts = useMemo(() => buildMatchupContext(players, league?.format ?? "redraft"), [players, league?.format]);
  const values = useMemo(() => buildTradeValues(
    players.map((p) => {
      const context = contexts.get(p.id);
      const healthFactor = 1 - (context?.healthDiscount ?? 0);
      const contextWithoutHealthDiscount = context && healthFactor > 0
        ? context.adjustedRosPoints / healthFactor
        : context?.adjustedRosPoints;
      return { ...p, projection: contextWithoutHealthDiscount ?? p.rosProjection ?? p.projection };
    }),
    teamCount,
    fcValueMap,
  ), [players, teamCount, contexts, fcValueMap]);
  const excluded = useMemo(() => new Set([...sideA, ...sideB]), [sideA, sideB]);

  const aPlayers = sideA.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const bPlayers = sideB.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const importedRosters = activeLeague?.rosters ?? [];
  const mySyncedRoster = importedRosters.find((roster) => roster.is_user);
  const myTeamRoster = importedRosters.find((roster) => roster.owner_id === selectedMyTeamId) ?? mySyncedRoster;
  const partnerOptions = importedRosters.filter((roster) => !roster.is_user && roster.owner_id && roster.owner_id !== myTeamRoster?.owner_id);
  const partnerRoster = partnerOptions.find((roster) => roster.owner_id === selectedPartnerId) ?? partnerOptions[0];
  const resolveSleeperIds = (ids: string[]) => resolveSleeperPlayerIds(players, ids).map((id) => playersById.get(id)).filter((player): player is Player => Boolean(player));
  const myTeamPlayers = resolveSleeperIds(myTeamRoster?.players ?? []);
  const partnerPlayers = resolveSleeperIds(partnerRoster?.players ?? []);

  const toggleSyncedPlayer = (tradeSide: Side, player: Player) => {
    const current = tradeSide === "A" ? sideA : sideB;
    const setter = tradeSide === "A" ? setSideA : setSideB;
    const otherSetter = tradeSide === "A" ? setSideB : setSideA;
    if (current.includes(player.id)) setter((previous) => previous.filter((id) => id !== player.id));
    else {
      otherSetter((previous) => previous.filter((id) => id !== player.id));
      setter((previous) => previous.includes(player.id) ? previous : [...previous, player.id]);
    }
  };

  const myPicks = useMemo(
    () => (draftState?.picks ?? []).filter((p) => p.owner === "me"),
    [draftState]
  );

  const myPlayerIds = useMemo(() => new Set(myPicks.map((p) => p.playerId)), [myPicks]);

  const myRosterPlayers = useMemo(
    () =>
      myPicks
        .map((pick) => playersById.get(pick.playerId))
        .filter((p): p is Player => Boolean(p))
        .sort((a, b) => b.projection - a.projection),
    [myPicks, playersById]
  );

  const currentRoster = useMemo(
    () => (league ? buildRoster(myPicks, playersById, league.roster) : []),
    [league, myPicks, playersById]
  );

  const afterRoster = useMemo(() => {
    if (!league) return [];
    const kept = myPicks.filter((p) => !sideB.includes(p.playerId));
    const keptIds = new Set(kept.map((p) => p.playerId));
    const added: DraftPick[] = aPlayers
      .filter((p) => !keptIds.has(p.id))
      .map((p, i) => ({ playerId: p.id, pickNumber: 100000 + i, round: 0, owner: "me", timestamp: 0 }));
    return buildRoster([...kept, ...added], playersById, league.roster);
  }, [league, myPicks, aPlayers, sideB, playersById]);

  const currentSnap = useMemo(
    () => (league ? snapshotRoster(currentRoster, playersById, league.roster) : null),
    [league, currentRoster, playersById]
  );

  const afterSnap = useMemo(
    () => (league ? snapshotRoster(afterRoster, playersById, league.roster) : null),
    [league, afterRoster, playersById]
  );

  const deltaProj = (afterSnap?.starterProj ?? 0) - (currentSnap?.starterProj ?? 0);

  const valueOf = (id: string) => values.get(id) ?? 0;
  const aValue = aPlayers.reduce((s, p) => s + valueOf(p.id), 0);
  const bValue = bPlayers.reduce((s, p) => s + valueOf(p.id), 0);
  const aProj = aPlayers.reduce((s, p) => s + (contexts.get(p.id)?.adjustedRosPoints ?? p.projection), 0);
  const bProj = bPlayers.reduce((s, p) => s + (contexts.get(p.id)?.adjustedRosPoints ?? p.projection), 0);

  // FantasyCalc totals (FC value 0–100 scale)
  const fcValueOf = (id: string) => fcValueMap.get(id) ?? 0;
  const aFcTotal = aPlayers.reduce((s, p) => s + fcValueOf(p.id), 0);
  const bFcTotal = bPlayers.reduce((s, p) => s + fcValueOf(p.id), 0);
  const fcNet = aFcTotal - bFcTotal;

  const net = aValue - bValue;
  const total = aValue + bValue;
  const grade = gradeTrade(net, total);
  const aPct = total > 0 ? (aValue / total) * 100 : 50;

  const add = (side: Side, player: Player) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => (prev.includes(player.id) ? prev : [...prev, player.id]));
  };

  const remove = (side: Side, id: string) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => prev.filter((x) => x !== id));
  };

  const playerSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const buildShareUrl = () => {
    const params = new URLSearchParams();
    if (aPlayers.length > 0) params.set("get", aPlayers.map((p) => playerSlug(p.name)).join(","));
    if (bPlayers.length > 0) params.set("send", bPlayers.map((p) => playerSlug(p.name)).join(","));
    const qs = params.toString();
    const base = `${window.location.origin}${window.location.pathname}`;
    return qs ? `${base}?${qs}` : base;
  };

  const playerRow = (p: Player, side: Side) => {
    const fcVal = fcValueOf(p.id);
    const fcEntry = fcEntryMap.get(p.id);
    return (
      <div key={p.id} className="rounded-lg bg-zinc-900/60 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-zinc-200">{p.name}</span>
            <InjuryBadge status={p.injuryStatus} />
            <PosBadge position={p.position} size="xs" />
            {side === "A" && myPlayerIds.has(p.id) && (
              <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/30">
                Already owned
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-tech text-sm font-bold text-emerald-300">{valueOf(p.id).toFixed(1)}</span>
            {fcVal > 0 && (
              <span className="font-tech text-[11px] font-semibold text-cyan-300/80">
                {fcVal.toFixed(1)} <span className="text-[9px] text-zinc-500">FC</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(side, p.id)}
              aria-label={`Remove ${p.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-500">
          {(contexts.get(p.id)?.adjustedRosPoints ?? p.projection).toFixed(1)} ROS pts · ADP {p.adp > 0 ? p.adp.toFixed(1) : "—"}
          {fcEntry && (
            <>
              <span className="mx-1">·</span>
              FC Rank #{fcEntry.overallRank}
              {fcEntry.trend30Day !== 0 && (
                <span className={`ml-1 ${fcEntry.trend30Day > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {fcEntry.trend30Day > 0 ? "↑" : "↓"}{Math.abs(fcEntry.trend30Day)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const sideColumn = (side: Side, title: string, list: Player[], totalValue: number, totalProj: number, fcTotal: number) => (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h2>
        <div className="text-right">
          <span className="font-mono text-lg font-bold tabular-nums text-emerald-300">
            {totalValue.toFixed(1)} <span className="text-[10px] font-semibold text-zinc-500">VALUE</span>
          </span>
          {fcTotal > 0 && (
            <span className="ml-2 font-tech text-sm font-semibold text-cyan-300/80">
              {fcTotal.toFixed(1)} <span className="text-[10px] text-zinc-500">FC</span>
            </span>
          )}
        </div>
      </div>
      {side === "B" && myRosterPlayers.length > 0 && (
        <div className="mb-3">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Your roster
          </span>
          <div className="flex flex-wrap gap-1.5">
            {myRosterPlayers.map((p) => {
              const added = excluded.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(side, p)}
                  disabled={added}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    added
                      ? "border-zinc-700 bg-zinc-800/40 text-zinc-500"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/60 hover:bg-emerald-500/20"
                  }`}
                >
                  {p.name}
                  <span className="text-[10px] text-zinc-400">{p.position}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mb-3">
        <PlayerPicker
          players={players}
          exclude={excluded}
          tradeValues={values}
          onPick={(p) => add(side, p)}
          placeholder={side === "A" ? "Add players you receive…" : "Add players you give up…"}
        />
      </div>
      <div className="space-y-1.5">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700/60 px-3 py-4 text-center text-xs text-zinc-500">
            No players added yet.
          </p>
        ) : (
          list.map((p) => playerRow(p, side))
        )}
      </div>
      {list.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <span>Projection</span>
          <span className="font-tech font-semibold text-zinc-200">{totalProj.toFixed(1)} pts</span>
        </div>
      )}
    </div>
  );

  if (loading || !user) {
    return <ToolLoadingState title="Fantasy Football Trade Analyzer" description="Compare fantasy football trade packages by player value, rest-of-season projections, roster fit, and matchup context." />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl tracking-wide text-white">Trade Analyzer</h1>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {SCORING_LABELS[scoring]}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Compare both sides by trade value and get an instant grade.
            </p>
          </div>
        </div>
        {(aPlayers.length > 0 || bPlayers.length > 0) && (
          <ShareButtons
            url={buildShareUrl()}
            text={`I ${grade.label.toLowerCase()} this trade on DraftEdge${
              net !== 0 ? ` (${net >= 0 ? "+" : ""}${net.toFixed(1)} net value)` : ""
            }`}
            title="Check out this DraftEdge trade"
          />
        )}
      </div>

      {activeLeague && (
        <section className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-sm font-semibold text-white">League Trade Builder</h2><p className="mt-1 text-xs text-zinc-500">Choose individual roster players to add to each trade package.</p></div>
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-emerald-300">Auto-set league scoring · {SCORING_LABELS[scoring]}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Side A · Your Team · Adds to You Give Up</label>
              <select aria-label="Side A your team" value={myTeamRoster?.owner_id ?? ""} onChange={(event) => setSelectedMyTeamId(event.target.value)} className="mb-2 w-full rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs text-zinc-200">
                {importedRosters.map((roster) => <option key={roster.owner_id} value={roster.owner_id ?? ""}>{roster.is_user ? `${roster.team_name} (You)` : roster.team_name}</option>)}
              </select>
              <div className="max-h-72 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080E0C]">
                {myTeamPlayers.map((player) => {
                  const added = sideB.includes(player.id);
                  const otherSide = sideA.includes(player.id);
                  return <div key={player.id} className="flex items-center gap-2.5 px-3 py-2">
                    <PosBadge position={player.position} size="xs" />
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="truncate text-xs font-semibold text-zinc-100">{player.name}</span><InjuryBadge status={player.injuryStatus} /></div><p className="font-mono text-[10px] tabular-nums text-zinc-500">{player.team} · {valueOf(player.id).toFixed(1)} value</p></div>
                    <button type="button" onClick={() => toggleSyncedPlayer("B", player)} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${added ? "bg-white/[0.08] text-zinc-300" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"}`}>{added ? "Added" : otherSide ? "Move →" : "+ Add"}</button>
                  </div>;
                })}
                {myTeamPlayers.length === 0 && <p className="px-3 py-4 text-xs text-zinc-500">No matched players in this roster.</p>}
              </div>
            </div>
            <div className="min-w-0">
              <label htmlFor="trade-partner-roster" className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Side B · Trading Partner · Adds to You Receive</label>
              <select id="trade-partner-roster" aria-label="Side B trading partner" value={partnerRoster?.owner_id ?? ""} onChange={(event) => setSelectedPartnerId(event.target.value)} className="mb-2 w-full rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs text-zinc-200">
                {partnerOptions.map((roster) => <option key={roster.owner_id} value={roster.owner_id ?? ""}>{roster.team_name}</option>)}
              </select>
              <div className="max-h-72 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080E0C]">
                {partnerPlayers.map((player) => {
                  const added = sideA.includes(player.id);
                  const otherSide = sideB.includes(player.id);
                  return <div key={player.id} className="flex items-center gap-2.5 px-3 py-2">
                    <PosBadge position={player.position} size="xs" />
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="truncate text-xs font-semibold text-zinc-100">{player.name}</span><InjuryBadge status={player.injuryStatus} /></div><p className="font-mono text-[10px] tabular-nums text-zinc-500">{player.team} · {valueOf(player.id).toFixed(1)} value</p></div>
                    <button type="button" onClick={() => toggleSyncedPlayer("A", player)} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${added ? "bg-white/[0.08] text-zinc-300" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"}`}>{added ? "Added" : otherSide ? "Move →" : "+ Add"}</button>
                  </div>;
                })}
                {partnerPlayers.length === 0 && <p className="px-3 py-4 text-xs text-zinc-500">Choose a partner with matched roster players.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {sideColumn("A", "You receive", aPlayers, aValue, aProj, aFcTotal)}
            {sideColumn("B", "You give up", bPlayers, bValue, bProj, bFcTotal)}
          </div>

          {/* Verdict */}
          {(aPlayers.length > 0 || bPlayers.length > 0) && (
            <div className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className={`font-display text-5xl font-bold ${grade.text}`}>{grade.letter}</span>
                  <div>
                    <p className={`font-display text-xl tracking-wide ${grade.text}`}>{grade.label}</p>
                    <p className="text-sm text-zinc-400">
                      {aPlayers.length + bPlayers.length} players compared
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Net value</p>
                  <p className={`font-tech text-2xl font-bold ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {net >= 0 ? "+" : ""}
                    {net.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Value split bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="text-emerald-300">Receive</span>
                  <span className="text-rose-300">Give up</span>
                </div>
                <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: `${aPct}%` }} />
                  <div className="bg-rose-500" style={{ width: `${100 - aPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-tech">{aValue.toFixed(1)} value</span>
                  <span className="font-tech">{bValue.toFixed(1)} value</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
                {([["You receive", aPlayers, aValue, aProj], ["You give up", bPlayers, bValue, bProj]] as const).map(([label, list, value, ros]) => {
                  const ppgValues = list.map((p) => contexts.get(p.id)?.ppg).filter((n): n is number => n != null);
                  const ppg = ppgValues.length ? ppgValues.reduce((sum, n) => sum + n, 0) / ppgValues.length : null;
                  return <div key={label} className="space-y-1 rounded-lg border border-white/[0.06] bg-[#0D1412] p-3 text-xs">
                    <p className="font-semibold text-zinc-200">{label}</p>
                    <p className="text-zinc-400">Trade value <span className="float-right font-mono tabular-nums text-zinc-100">{value.toFixed(1)}</span></p>
                    <p className="text-zinc-400">Adjusted ROS points <span className="float-right font-mono tabular-nums text-zinc-100">{ros.toFixed(1)}</span></p>
                    <p className="text-zinc-400">Avg PPG <span className="float-right font-mono tabular-nums text-zinc-100">{ppg == null ? "—" : ppg.toFixed(1)}</span></p>
                    <p className="text-zinc-400" title={MATCHUP_DATA_UNAVAILABLE}>ROS SOS <span className="float-right text-zinc-500">Unavailable</span></p>
                    {list.flatMap((p) => (contexts.get(p.id)?.reasonTags ?? []).map((tag) => <span key={`${p.id}-${tag}`} className="mr-1 mt-1 inline-flex rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-zinc-300">{p.name}: {tag}</span>))}
                  </div>;
                })}
              </div>

              {aPlayers.length !== bPlayers.length && (
                <p className="mt-4 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400">
                  {aPlayers.length < bPlayers.length
                    ? "You're consolidating several players into fewer — real markets usually demand a premium for that."
                    : "You're splitting one player into several — depth can be valuable, but the market often discounts it."}
                </p>
              )}

              {/* FantasyCalc cross-check */}
              {fcEntries.length > 0 && (
                <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/80">
                      FantasyCalc consensus
                    </span>
                    {fcNet !== 0 && (
                      <span className={`font-tech text-sm font-bold ${fcNet >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {fcNet >= 0 ? "+" : ""}{fcNet.toFixed(1)}
                        <span className="ml-1 text-[10px] text-zinc-500">net</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                    <div className="bg-cyan-500" style={{ width: `${aFcTotal + bFcTotal > 0 ? (aFcTotal / (aFcTotal + bFcTotal)) * 100 : 50}%` }} />
                    <div className="bg-cyan-700" style={{ width: `${aFcTotal + bFcTotal > 0 ? (bFcTotal / (aFcTotal + bFcTotal)) * 100 : 50}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-500">
                    FantasyCalc consensus is shown as an independent cross-check of DraftEdge VALUE.
                  </p>
                </div>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                <span className="text-zinc-300">VALUE</span> = market trade value when available, blended with a projection and positional-depth estimate otherwise.
                <span className="ml-2 text-cyan-300/80">FC</span> = community consensus from FantasyCalc.com.
              </p>
            </div>
          )}

          {/* Roster fit */}
          {league && myPicks.length > 0 && (aPlayers.length > 0 || bPlayers.length > 0) && currentSnap && afterSnap && (
            <div className="glass-strong mt-6 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Roster Fit</h2>
                <span className="truncate text-xs text-zinc-500">{league.name}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">How this trade reshapes your starting lineup.</p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GROUPS.map((g) => {
                  const before = currentSnap.counts[g] ?? 0;
                  const after = afterSnap.counts[g] ?? 0;
                  const delta = after - before;
                  return (
                    <div key={g} className="rounded-lg bg-zinc-900/60 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{g}</span>
                      <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                        {before} <span className="text-zinc-500">→</span> {after}
                        {delta !== 0 && (
                          <span
                            className={`ml-1.5 text-xs font-bold ${delta > 0 ? "text-emerald-300" : "text-rose-300"}`}
                          >
                            {delta > 0 ? "+" : ""}
                            {delta}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {bPlayers.length > 0 && (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Leaving your roster
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {bPlayers.map((p) => {
                      const owned = myPlayerIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm ${
                            owned
                              ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30"
                              : "bg-zinc-900/60 opacity-60"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`truncate font-semibold ${owned ? "text-emerald-200" : "text-zinc-400"}`}>
                              {p.name}
                            </span>
                            <PosBadge position={p.position} size="xs" />
                          </div>
                          {owned ? (
                            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              On your roster
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Not drafted
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Starters projection
                </span>
                <p className="font-tech text-sm font-semibold text-zinc-200">
                  {currentSnap.starterProj.toFixed(1)}
                  <span className="text-zinc-500"> → </span>
                  {afterSnap.starterProj.toFixed(1)}
                  <span
                    className={`font-tech ml-1.5 text-xs font-bold ${deltaProj >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {deltaProj >= 0 ? "+" : ""}
                    {deltaProj.toFixed(1)}
                  </span>
                </p>
              </div>

              {afterSnap.missing.length > 0 ? (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                  Missing starters: {afterSnap.missing.join(", ")}
                </p>
              ) : (
                <p className="mt-3 text-xs font-medium text-emerald-300/80">All starting slots filled.</p>
              )}
            </div>
          )}

          {league && myPicks.length === 0 && (aPlayers.length > 0 || bPlayers.length > 0) && (
            <div className="glass-strong mt-6 rounded-2xl p-5 text-center text-xs text-zinc-500">
              Draft your team in {league.name} to see how a trade fits your roster.
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
