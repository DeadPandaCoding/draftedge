"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchDraftState, fetchLeague } from "@/lib/data";
import { buildRoster } from "@/lib/draft";
import { SCORING_LABELS } from "@/lib/league";
import { usePlayers } from "@/lib/players";
import type { DraftState, LeagueConfig, Player } from "@/lib/types";
import { buildTradeValues } from "@/lib/trade-value";
import { buildMatchupContext, getWeeklyInjuryMultiplier } from "@/lib/matchup-context";
import { resolveSleeperPlayerIds, toScoringFormat, useSyncedLeagues } from "@/lib/league-context";
import AppShell from "@/components/dashboard/AppShell";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { InjuryBadge, PosBadge, Skeleton } from "@/components/ui";
import { XIcon } from "@/components/icons";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";
import { playerSlug } from "@/lib/seed-data";

/** Confidence band from the projection gap between two players. */
function confidence(diff: number) {
  const abs = Math.abs(diff);
  if (abs >= 2)
    return {
      label: "Clear start",
      detail: "The projection gap is decisive — start the higher-projected player.",
      cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    };
  if (abs >= 0.75)
    return {
      label: "Lean start",
      detail: "A real edge, but matchup or gut feel can overrule it.",
      cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    };
  return {
    label: "Coin flip",
    detail: "Essentially even on projection — tiebreak on matchup or ceiling.",
    cls: "text-zinc-200 border-zinc-600/60 bg-zinc-800/40",
  };
}

export default function StartSitPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeLeague } = useSyncedLeagues();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  const scoring = activeLeague ? toScoringFormat(activeLeague.scoring_format) : league?.scoring ?? "ppr";
  const { players, loading: playersLoading, currentWeek } = usePlayers(scoring);

  const [sideA, setSideA] = useState<string | null>(null);
  const [sideB, setSideB] = useState<string | null>(null);
  const commandPlayerHandled = useRef(false);

  useEffect(() => {
    const selectPlayer = (event: Event) => {
      const playerId = (event as CustomEvent<string>).detail;
      setSideB((id) => id === playerId ? null : id);
      setSideA(playerId);
    };
    window.addEventListener("draftedge:select-player", selectPlayer);
    return () => window.removeEventListener("draftedge:select-player", selectPlayer);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

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

  useEffect(() => {
    if (commandPlayerHandled.current || playersLoading || players.length === 0) return;
    const requestedPlayer = new URLSearchParams(window.location.search).get("player");
    if (!requestedPlayer) {
      commandPlayerHandled.current = true;
      return;
    }
    const player = players.find((candidate) => playerSlug(candidate.name) === requestedPlayer);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (player) setSideA(player.id);
    commandPlayerHandled.current = true;
  }, [players, playersLoading]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const contexts = useMemo(() => buildMatchupContext(players), [players]);
  const values = useMemo(() => buildTradeValues(players.map((p) => {
    const context = contexts.get(p.id);
    const healthFactor = 1 - (context?.healthDiscount ?? 0);
    const contextWithoutHealthDiscount = context && healthFactor > 0
      ? context.adjustedRosPoints / healthFactor
      : context?.adjustedRosPoints;
    return { ...p, projection: contextWithoutHealthDiscount ?? p.rosProjection ?? p.projection };
  }), league?.teamCount ?? 12), [players, league, contexts]);

  const a = sideA ? playersById.get(sideA) : undefined;
  const b = sideB ? playersById.get(sideB) : undefined;

  const excluded = useMemo(() => {
    const s = new Set<string>();
    if (sideA) s.add(sideA);
    if (sideB) s.add(sideB);
    return s;
  }, [sideA, sideB]);

  const myPicks = useMemo(
    () => (draftState?.picks ?? []).filter((p) => p.owner === "me"),
    [draftState]
  );

  const syncedRoster = activeLeague?.rosters.find((rosterEntry) => rosterEntry.is_user);
  const syncedPlayers = useMemo(() => {
    if (!syncedRoster) return [];
    const knownIds = resolveSleeperPlayerIds(players, syncedRoster.players);
    const starterIds = new Set(resolveSleeperPlayerIds(players, syncedRoster.starters));
    return knownIds.map((id) => ({ player: playersById.get(id), isStarter: starterIds.has(id) }))
      .filter((entry): entry is { player: Player; isStarter: boolean } => Boolean(entry.player));
  }, [syncedRoster, players, playersById]);
  const selectSyncedPlayer = (id: string) => {
    if (!sideA) setSideA(id);
    else if (!sideB && sideA !== id) setSideB(id);
    else setSideB(id);
  };
  // Never offer a player already occupying the other comparison slot.
  const selectableSyncedPlayers = syncedPlayers.filter(({ player }) => !excluded.has(player.id));

  // Prefer this week's Sleeper projection when both players have one; fall
  // back to the season projection (the only signal available in the offseason).
  const useWeek = Boolean(a && b && currentWeek != null);
  const isOnBye = useCallback(
    (player: Player) => currentWeek != null && player.bye === currentWeek,
    [currentWeek]
  );
  /** Weekly points, or null when neither a weekly projection nor a weekly avg exists. */
  const weeklyScore = useCallback((player: Player): number | null => {
    const context = contexts.get(player.id);
    const points = context?.adjustedWeeklyPoints ?? player.weekProjection ?? null;
    if (points == null) return null;
    return points * getWeeklyInjuryMultiplier(player.injuryStatus, isOnBye(player));
  }, [contexts, isOnBye]);
  const rosterPreference = useCallback((player: Player) => weeklyScore(player) ?? 0, [weeklyScore]);

  // Legal starters are chosen by highest weekly projection, not draft order.
  const roster = useMemo(
    () => (league ? buildRoster(myPicks, playersById, league.roster, rosterPreference) : []),
    [league, myPicks, playersById, rosterPreference]
  );

  const aScore = a ? (useWeek ? weeklyScore(a) : contexts.get(a.id)?.adjustedRosPoints ?? a.projection) : null;
  const bScore = b ? (useWeek ? weeklyScore(b) : contexts.get(b.id)?.adjustedRosPoints ?? b.projection) : null;
  const diff = typeof aScore === "number" && typeof bScore === "number" ? aScore - bScore : 0;

  /** Why a player cannot be started this week, or null when they are available. */
  const weeklyUnavailableReason = (player: Player): string | null => {
    if (isOnBye(player)) return `Bye (Week ${player.bye})`;
    const status = player.injuryStatus;
    if (status && getWeeklyInjuryMultiplier(status, false) === 0) return `Injury status: ${status}`;
    const score = weeklyScore(player);
    if (score == null) return "No weekly projection available";
    if (score === 0) return "Projected 0.0 this week";
    return null;
  };
  const aIssue = a && useWeek ? weeklyUnavailableReason(a) : null;
  const bIssue = b && useWeek ? weeklyUnavailableReason(b) : null;
  const aUnavailable = Boolean(aIssue);
  const bUnavailable = Boolean(bIssue);
  const bothUnavailable = Boolean(useWeek && a && b && aUnavailable && bUnavailable);
  const winner = a && b
    ? bothUnavailable
      ? null
      : aUnavailable !== bUnavailable
        ? (aUnavailable ? b : a)
        : aScore == null && bScore == null
          ? null
          : aScore == null
            ? b
            : bScore == null
              ? a
              : aScore === bScore
                ? null
                : aScore > bScore ? a : b
    : null;
  const tied = Boolean(
    a && b && !bothUnavailable && !aUnavailable && !bUnavailable &&
    aScore != null && bScore != null && aScore === bScore
  );
  const band = winner ? confidence(diff) : null;

  const statRow = (label: string, value: string, highlight = false) => (
    <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 py-2 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`font-tech text-sm font-semibold ${highlight ? "text-emerald-300" : "text-zinc-200"}`}>
        {value}
      </span>
    </div>
  );

  const playerCard = (p: Player, onClear: () => void) => (
    <div className="glass-strong flex flex-col rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {p.name === (a?.name ?? "") && p === a ? "Player A" : "Player B"}
        </h2>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${p.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
        >
          <XIcon size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="truncate text-lg font-bold text-white">{p.name}</span>
        <InjuryBadge status={p.injuryStatus} />
        <PosBadge position={p.position} size="sm" />
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {p.team} · ADP {p.adp > 0 ? p.adp.toFixed(1) : "—"}
      </div>
      <div className="mt-4">
        {statRow("ROS projection", `${(contexts.get(p.id)?.adjustedRosPoints ?? p.projection).toFixed(1)} pts`, winner === p)}
        {useWeek && statRow(
          `This week${
            getWeeklyInjuryMultiplier(p.injuryStatus, isOnBye(p)) === 0
              ? " · SIT"
              : contexts.get(p.id)?.weeklyPointsEstimated
                ? " (season-avg estimate)"
                : " (adjusted)"
          }`,
          weeklyScore(p) == null ? "Unavailable" : `${weeklyScore(p)!.toFixed(1)} pts`,
          winner === p,
        )}
        {statRow("Weekly avg", p.weeklyAvg > 0 ? `${p.weeklyAvg.toFixed(1)} pts` : "Unavailable")}
        {statRow("Season PPG", contexts.get(p.id)?.ppg == null ? "Unavailable" : `${contexts.get(p.id)!.ppg!.toFixed(1)} pts`)}
        {statRow("Opponent rank", "Unavailable")}
        {statRow("Trade value", (values.get(p.id) ?? 0).toFixed(1))}
        {statRow("Tier", `T${p.tier}`)}
        {statRow("Position rank", `#${p.positionRank}`)}
        {(contexts.get(p.id)?.reasonTags ?? []).map((tag) => <p key={tag} className="mt-2 rounded border border-white/[0.08] px-2 py-1 text-[10px] text-zinc-300">{tag}</p>)}
      </div>
    </div>
  );

  if (loading || !user) {
    return <ToolLoadingState title="Fantasy Football Start/Sit Optimizer" description="Compare fantasy football players for your weekly lineup using projections, health, matchups, and roster context." />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-wide text-white">Start/Sit Optimizer</h1>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {SCORING_LABELS[scoring]}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Head-to-head call between two players, plus your optimized starting lineup.
          </p>
        </div>
      </div>

      {activeLeague && syncedRoster && <section className="mb-5 rounded-xl border border-white/[0.08] bg-[#0D1412] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-xs font-semibold text-zinc-200">Load My Roster</p><p className="mt-0.5 text-[10px] text-zinc-500">{activeLeague.league_name} · click players to fill the comparison.</p></div>
          <span className="font-mono text-[10px] text-zinc-500">{syncedPlayers.filter((entry) => entry.isStarter).length} starters · {syncedPlayers.filter((entry) => !entry.isStarter).length} bench</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectableSyncedPlayers.map(({ player, isStarter }) => <button key={player.id} type="button" onClick={() => selectSyncedPlayer(player.id)} className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#080E0C] px-2 py-1.5 text-xs text-zinc-300 hover:border-emerald-500/30">
            <span className="font-mono text-[9px] text-zinc-500">{isStarter ? "START" : "BENCH"}</span>{player.name}
          </button>)}
        </div>
        {selectableSyncedPlayers.length === 0 && <p className="mt-2 text-[10px] text-zinc-500">Both comparison slots are filled — clear one to pick another player.</p>}
      </section>}

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Head-to-head ─────────────────────────────────── */}
          <div className="grid gap-5 md:grid-cols-2">
            {a ? (
              playerCard(a, () => setSideA(null))
            ) : (
              <div className="glass-strong rounded-2xl p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Player A</h2>
                <PlayerPicker
                  players={players}
                  exclude={excluded}
                  tradeValues={values}
                  onPick={(p) => setSideA(p.id)}
                  placeholder="Search a player…"
                />
                <p className="mt-3 text-xs text-zinc-500">Pick a player to compare.</p>
              </div>
            )}
            {b ? (
              playerCard(b, () => setSideB(null))
            ) : (
              <div className="glass-strong rounded-2xl p-5">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Player B</h2>
                <PlayerPicker
                  players={players}
                  exclude={excluded}
                  tradeValues={values}
                  onPick={(p) => setSideB(p.id)}
                  placeholder="Search a player…"
                />
                <p className="mt-3 text-xs text-zinc-500">Pick a player to compare.</p>
              </div>
            )}
          </div>

          {/* ── Verdict ──────────────────────────────────────── */}
          {a && b && bothUnavailable && (
            <div role="status" className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
              <div className="text-center">
                <span className="font-display text-xl font-bold text-amber-200">Neither player is available this week</span>
                <ul className="mt-3 space-y-1 text-left text-sm text-amber-100/90">
                  <li>• {a.name}: {aIssue}</li>
                  <li>• {b.name}: {bIssue}</li>
                </ul>
              </div>
            </div>
          )}

          {a && b && tied && (
            <div role="status" className="mt-6 rounded-2xl border border-zinc-600/60 bg-zinc-800/40 p-6">
              <div className="text-center">
                <span className="font-display text-2xl font-bold text-zinc-100">Too close to call</span>
                <p className="mt-2 text-sm text-zinc-300">
                  Both players are tied at {aScore?.toFixed(1) ?? "—"} pts.
                </p>
                <span className="mt-3 inline-flex rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {useWeek ? "This week" : "Season projection"}
                </span>
              </div>
            </div>
          )}

          {a && b && band && winner && (
            <div className={`mt-6 rounded-2xl border p-6 ${band.cls}`}>
              <div className="flex flex-col items-center gap-4 text-center">
                <span className={`font-display text-2xl font-bold ${band.cls.split(" ")[0]}`}>
                  Start {winner.name}
                </span>
                <p className="text-sm text-zinc-300">{band.detail}</p>
                <p className="font-tech text-lg font-bold text-zinc-100">
                  {aScore?.toFixed(1) ?? "—"} vs {bScore?.toFixed(1) ?? "—"} pts
                  <span className="ml-2 text-sm text-zinc-400">
                    ({diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)} gap)
                  </span>
                </p>
                <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {useWeek
                    ? contexts.get(winner.id)?.weeklyPointsEstimated
                      ? "This week · season-avg estimate"
                      : "This week"
                    : "Season projection"}
                </span>
                <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {band.label}
                </span>
                <ul className="mt-1 space-y-1 text-left text-xs text-zinc-300">
                  <li>• {useWeek ? (contexts.get(winner.id)?.weeklyPointsEstimated ? "Weekly-average estimate" : "Adjusted weekly projection") : "Season projection"}: {Math.abs(diff).toFixed(1)} point edge for {winner.name}.</li>
                  <li>• Season PPG: {contexts.get(winner.id)?.ppg == null ? "unavailable" : `${contexts.get(winner.id)!.ppg!.toFixed(1)} points`}.</li>
                  <li>• Opponent positional rank is unavailable until a schedule matchup source is connected.</li>
                  {(contexts.get(winner.id)?.reasonTags ?? []).map((tag) => <li key={tag}>• {tag}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* ── Lineup optimizer ─────────────────────────────── */}
          <div className="glass-strong mt-6 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Your Lineup</h2>
              {league && <span className="truncate text-xs text-zinc-500">{league.name}</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Your drafted players assigned to starting slots by projection.
            </p>

            {roster.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-zinc-700/60 px-3 py-5 text-center text-xs text-zinc-500">
                {league ? "Draft your team to see your optimized lineup here." : "Set up a league and draft to see your lineup."}
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl">
                {roster.map((entry) => {
                  const p = playersById.get(entry.playerId);
                  if (!p) return null;
                  const isBench = entry.slot.startsWith("BENCH");
                  return (
                    <div
                      key={entry.slot}
                      className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${
                        isBench ? "bg-zinc-900/40 text-zinc-400" : "bg-zinc-900/70 text-zinc-200"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-14 shrink-0 font-tech text-[11px] font-bold text-zinc-500">
                          {entry.slot}
                        </span>
                        <span className="truncate font-semibold">{p.name}</span>
                        <PosBadge position={p.position} size="xs" />
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-tech text-xs">{p.projection.toFixed(1)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            isBench
                              ? "bg-zinc-800 text-zinc-500"
                              : "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                          }`}
                        >
                          {isBench ? "Bench" : "Start"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
