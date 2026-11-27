"use client";

import { TradeVerdictSummary } from "@/components/dashboard/TradeVerdictSummary";
import { indexPlayersById } from "@/lib/player-display";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchLeague } from "@/lib/data";
import Link from "next/link";
import { starterImpact, suggestTrades, teamVerdict } from "@/lib/trade-recommendations";
import {
  SCORING_LABELS,
  hasRosterSlots,
  numQbsForRoster,
  rosterFromPositions,
} from "@/lib/league";
import { usePlayers } from "@/lib/players";
import { normalizeName, playerSlug } from "@/lib/seed-data";
import { resolveSleeperPlayerIds, toScoringFormat, useSyncedLeagues } from "@/lib/league-context";
import type {
  LeagueConfig,
  Player,
  RosterTemplate,
} from "@/lib/types";
import { buildMatchupContext, MATCHUP_DATA_UNAVAILABLE } from "@/lib/matchup-context";
import { buildTradeValues, gradeTrade, packageTradeValue } from "@/lib/trade-value";
import {
  fetchFantasyCalc,
  normalizeFCValue,
  matchFantasyCalc,
  type FantasyCalcEntry,
} from "@/lib/fantasycalc";
import AppShell from "@/components/dashboard/AppShell";
import { TradeSide } from "@/components/dashboard/TradeSide";
import { ShareButtons } from "@/components/dashboard/ShareButtons";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";
import { InjuryBadge, PosBadge, Skeleton } from "@/components/ui";

type Side = "A" | "B";

function subscribePreference(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("draftedge:trade-preference", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("draftedge:trade-preference", notify);
  };
}

export default function TradePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeLeague } = useSyncedLeagues();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const preferenceKey = user && activeLeague && (!activeLeague.user_id || activeLeague.user_id === user.id)
    ? "draftedge.trade-context." + JSON.stringify([user.id, activeLeague.platform, activeLeague.platform_league_id]) : "";
  const useTeamContext = useSyncExternalStore(subscribePreference, () => {
    if (!preferenceKey) return false;
    try { return localStorage.getItem(preferenceKey) === "on" || Boolean(preferences[preferenceKey]); }
    catch { return Boolean(preferences[preferenceKey]); }
  }, () => false);
  function toggleTeamContext(enabled: boolean) {
    if (!preferenceKey) return;
    try {
      if (enabled) localStorage.setItem(preferenceKey, "on");
      else localStorage.removeItem(preferenceKey);
      setPreferences({});
      window.dispatchEvent(new Event("draftedge:trade-preference"));
    } catch {
      setPreferences(previous => ({ ...previous, [preferenceKey]: enabled }));
    }
  }

  const scoring = activeLeague ? toScoringFormat(activeLeague.scoring_format) : league?.scoring ?? "ppr";
  const teamCount = activeLeague?.total_teams ?? league?.teamCount ?? 12;
  const { players, currentWeek, loading: playersLoading } = usePlayers(scoring);

  // QB pricing must follow the active league: SUPERFLEX and 2QB leagues need
  // 2QB FantasyCalc values, and the cache key has to include that choice.
  const leagueRoster = useMemo<RosterTemplate | null>(() => {
    if (activeLeague) {
      const parsed = rosterFromPositions(activeLeague.roster_positions);
      if (hasRosterSlots(parsed)) return parsed;
    }
    return league?.roster ?? null;
  }, [activeLeague, league]);
  const numQbs = leagueRoster ? numQbsForRoster(leagueRoster) : 1;

  const [sideA, setSideA] = useState<string[]>([]);
  const [sideB, setSideB] = useState<string[]>([]);
  const [unresolvedIds, setUnresolvedIds] = useState<string[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [fcEntries, setFcEntries] = useState<FantasyCalcEntry[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    const selectPlayer = (event: Event) => {
      const playerId = (event as CustomEvent<string>).detail;
      setSideB((ids) => ids.filter((id) => id !== playerId));
      setSideA((ids) => ids.includes(playerId) ? ids : [...ids, playerId]);
    };
    window.addEventListener("draftedge:select-player", selectPlayer);
    return () => window.removeEventListener("draftedge:select-player", selectPlayer);
  }, []);

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
    const byId = indexPlayersById(players);
    const resolve = (raw: string): { ids: string[]; unresolved: string[] } => {
      const ids: string[] = [];
      const unresolved: string[] = [];
      for (const token of raw.split(",").filter(Boolean)) {
        // Canonical ID first, then canonical slug, then normalized display name
        // (older links dropped generational suffixes like "III" / "Jr.").
        const match =
          byId.get(token) ??
          byId.get(token.toLowerCase()) ??
          players.find((p) => playerSlug(p.name) === token.toLowerCase()) ??
          players.find((p) => normalizeName(p.name) === normalizeName(token));
        if (match) ids.push(match.id);
        else unresolved.push(token);
      }
      return { ids: [...new Set(ids)], unresolved };
    };

    const requested = resolve(params.get("get") ?? "");
    const offered = resolve(params.get("send") ?? "");
    const getIds = requested.ids;
    const sendIds = offered.ids.filter((id) => !getIds.includes(id));
    const unresolved = [...new Set([...requested.unresolved, ...offered.unresolved])];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getIds.length > 0) setSideA(getIds);
    if (sendIds.length > 0) setSideB(sendIds);
    if (unresolved.length > 0) setUnresolvedIds(unresolved);
  }, [players, playersLoading]);

  // Fetch FantasyCalc consensus redraft values.
  useEffect(() => {
    let cancelled = false;
    fetchFantasyCalc({
      numQbs,
      numTeams: teamCount,
      ppr: scoring === "ppr" ? 1 : scoring === "half_ppr" ? 0.5 : 0,
    })
      .then((d) => { if (!cancelled) setFcEntries(d); })
      .catch(() => { /* graceful degrade */ });
    return () => { cancelled = true; };
  }, [teamCount, scoring, numQbs]);

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

  const playersById = useMemo(() => indexPlayersById(players), [players]);
  const contexts = useMemo(() => buildMatchupContext(players, currentWeek), [players, currentWeek]);
  const values = useMemo(() => buildTradeValues(
    players, teamCount, fcValueMap, leagueRoster ?? undefined, contexts,
  ), [players, teamCount, contexts, fcValueMap, leagueRoster]);
  const excluded = useMemo(() => new Set([...sideA, ...sideB]), [sideA, sideB]);

  const aPlayers = sideA.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const bPlayers = sideB.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const teamData = useMemo(() => {
    if (!useTeamContext || !activeLeague) return null;
    const resolve = (ids: string[]) => [...new Set(resolveSleeperPlayerIds(players, ids))]
      .map(id => playersById.get(id)).filter((p): p is Player => Boolean(p));
    const rosters = activeLeague.rosters ?? [];
    const mine = rosters.find(r => r.is_user);
    const slots = rosterFromPositions(activeLeague.roster_positions);
    const myPlayers = resolve(mine?.players ?? []);
    const partners = rosters.flatMap(r => !r.is_user && r.owner_id
      ? [{ id: r.owner_id, name: r.team_name, players: resolve(r.players ?? []) }] : []);
    const validSlots = Object.entries(slots).some(([key, count]) => key !== "bench" && count > 0);
    return { mine, myPlayers, partners, slots, validSlots, suggestions: validSlots
      ? suggestTrades(myPlayers, partners, slots, values, currentWeek) : [] };
  }, [useTeamContext, activeLeague, players, playersById, values, currentWeek]);
  const myTeamPlayers = teamData?.myPlayers ?? [];
  const partnerRoster = teamData?.partners.find(r => r.id === selectedPartnerId) ?? teamData?.partners[0];
  const partnerPlayers = partnerRoster?.players ?? [];
  const impact = teamData?.validSlots
    ? starterImpact(myTeamPlayers, aPlayers, bPlayers, teamData.slots, currentWeek) : null;

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

  const valueOf = (id: string) => values.get(id) ?? 0;
  const aValue = packageTradeValue(aPlayers.map(p => valueOf(p.id)), bPlayers.length);
  const bValue = packageTradeValue(bPlayers.map(p => valueOf(p.id)), aPlayers.length);
  const aProj = aPlayers.reduce((s, p) => s + (contexts.get(p.id)?.adjustedRosPoints ?? p.projection), 0);
  const bProj = bPlayers.reduce((s, p) => s + (contexts.get(p.id)?.adjustedRosPoints ?? p.projection), 0);

  // FantasyCalc totals (FC value 0–100 scale)
  const fcValueOf = (id: string) => fcValueMap.get(id) ?? 0;
  const aFcTotal = aPlayers.reduce((s, p) => s + fcValueOf(p.id), 0);
  const bFcTotal = bPlayers.reduce((s, p) => s + fcValueOf(p.id), 0);
  const fcNet = aFcTotal - bFcTotal;

  const net = aValue - bValue;
  const total = aValue + bValue;
  // Completeness comes from resolved players on both sides, never from value:
  // a one-sided package has no grade even if the single player has value, and
  // unresolved share-link players keep the grade withheld.
  const tradeComplete = aPlayers.length > 0 && bPlayers.length > 0 && unresolvedIds.length === 0;
  const grade = gradeTrade(net, total, tradeComplete);
  const add = (side: Side, player: Player) => {
    if (excluded.has(player.id)) return;
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => (prev.includes(player.id) ? prev : [...prev, player.id]));
  };

  const remove = (side: Side, id: string) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => prev.filter((x) => x !== id));
  };

  const buildShareUrl = () => {
    const params = new URLSearchParams();
    // Canonical IDs preserve every character of names like "James Cook III" and
    // "Travis Etienne Jr.", so shared links never drop generational suffixes.
    if (aPlayers.length > 0) params.set("get", aPlayers.map((p) => p.id).join(","));
    if (bPlayers.length > 0) params.set("send", bPlayers.map((p) => p.id).join(","));
    // Shared links carry the valuation settings too, so the recipient can see
    // exactly which scoring / team count / QB mode produced the grade.
    params.set("scoring", scoring);
    params.set("teams", String(teamCount));
    params.set("qb", String(numQbs));
    const qs = params.toString();
    const base = `${window.location.origin}${window.location.pathname}`;
    return qs ? `${base}?${qs}` : base;
  };

  const sideProps = { players, excluded, values, contexts, fcEntryMap, fcValueOf, myPlayerIds: new Set(myTeamPlayers.map(p => p.id)), myRosterPlayers: myTeamPlayers, add, remove };

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
              {SCORING_LABELS[scoring]} · {teamCount} teams · {numQbs}QB
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Compare both sides by trade value and get an instant grade.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            <input type="checkbox" role="switch" checked={useTeamContext} disabled={!preferenceKey}
              onChange={event => toggleTeamContext(event.target.checked)}
              className="h-4 w-4 accent-emerald-500" />
            Factor in my team
          </label>
          {activeLeague ? <span className="text-zinc-400">{activeLeague.league_name}</span>
            : <Link className="text-emerald-400 underline" href="/leagues">Sync a league to unlock</Link>}
        </div>
        {tradeComplete && (
          <ShareButtons
            url={buildShareUrl()}
            text={`DraftEdge grades this trade: ${grade.label}${
              net !== 0 ? ` (${net >= 0 ? "+" : ""}${net.toFixed(1)} net value)` : ""
            }`}
            title="Check out this DraftEdge trade"
          />
        )}
      </div>

      {unresolvedIds.length > 0 && (
        <div role="alert" className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              Could not match {unresolvedIds.length === 1 ? "a shared player" : "shared players"}:{" "}
              <span className="font-semibold">{unresolvedIds.join(", ")}</span>. The trade grade and share
              links are withheld until this is resolved.
            </p>
            <button
              type="button"
              onClick={() => setUnresolvedIds([])}
              className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
            >
              Grade matched players
            </button>
          </div>
        </div>
      )}

      {teamData && (
        <section className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-sm font-semibold text-white">League Trade Builder</h2><p className="mt-1 text-xs text-zinc-500">Choose individual roster players to add to each trade package.</p></div>
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-emerald-300">Auto-set league scoring · {SCORING_LABELS[scoring]}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Side A · Your Team · Adds to You Give Up</label>
              <p className="mb-2 text-xs text-zinc-200">{teamData.mine?.team_name ?? "Your synced team"}</p>
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
              <select id="trade-partner-roster" aria-label="Side B trading partner" value={partnerRoster?.id ?? ""} onChange={(event) => setSelectedPartnerId(event.target.value)} className="mb-2 w-full rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs text-zinc-200">
                {teamData.partners.map((roster) => <option key={roster.id} value={roster.id}>{roster.name}</option>)}
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
          <div className="mt-4 border-t border-white/[0.08] pt-4">
            <h3 className="text-sm font-semibold">Suggested trades</h3>
            {teamData.suggestions.map(({ partner, receive, send, gain }) => (
              <button key={receive.id} type="button" onClick={() => {
                setSelectedPartnerId(partner.id); setSideA([receive.id]); setSideB([send.id]); setUnresolvedIds([]);
              }} className="mt-2 block w-full rounded-lg border border-white/10 p-3 text-left text-xs hover:border-emerald-500">
                Receive {receive.name} from {partner.name} for {send.name} · +{gain.delta.toFixed(1)} pts/wk
              </button>
            ))}
            {!teamData.suggestions.length && <p className="mt-1 text-xs text-zinc-400">No lineup-improving swaps found among the matched rosters.</p>}
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
            <TradeSide {...sideProps} side="A" title="You receive" list={aPlayers} totalValue={aValue} totalProj={aProj} fcTotal={aFcTotal} />
            <TradeSide {...sideProps} side="B" title="You give up" list={bPlayers} totalValue={bValue} totalProj={bProj} fcTotal={bFcTotal} />
          </div>

          {/* Verdict */}
          {tradeComplete && (
            <div className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
              <TradeVerdictSummary grade={grade} count={aPlayers.length + bPlayers.length} aValue={aValue} bValue={bValue} />

              {teamData && <div className="mt-4 rounded-lg border border-white/10 p-3 text-sm">
                <h3 className="font-semibold">Weekly Starter Impact</h3>
                {impact ? <p className="mt-1 text-zinc-300"><span className="font-mono">{impact.delta > 0 ? "+" : ""}{impact.delta.toFixed(1)} pts/wk</span>
                  {impact.slot && ` · ${impact.delta > 0 ? "Upgrades" : "Downgrades"} ${impact.slot}`}
                  {" · Team verdict: "}{teamVerdict(net, total, impact.delta)}</p>
                : <p className="text-xs text-zinc-400">Requires synced lineup slots, outgoing players from your roster, and incoming players outside it.</p>}
              </div>}

              <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
                {([["You receive", aPlayers, aValue, aProj], ["You give up", bPlayers, bValue, bProj]] as const).map(([label, list, value, ros]) => {
                  const ppgValues = list.map((p) => contexts.get(p.id)?.ppg).filter((n): n is number => n != null);
                  const ppg = ppgValues.length ? ppgValues.reduce((sum, n) => sum + n, 0) / ppgValues.length : null;
                  return <div key={label} className="space-y-1 rounded-lg border border-white/[0.06] bg-[#0D1412] p-3 text-xs">
                    <p className="font-semibold text-zinc-200">{label}</p>
                    <p className="text-zinc-400">Trade value <span className="float-right font-mono tabular-nums text-zinc-100">{value.toFixed(1)}</span></p>
                    <p className="text-zinc-400">Adjusted ROS points <span className="float-right font-mono tabular-nums text-zinc-100">{ros.toFixed(1)}</span></p>
                    {list.length > (label === "You receive" ? bPlayers.length : aPlayers.length) && <p className="text-zinc-400">Package adjustment <span className="float-right font-mono tabular-nums text-zinc-100">{(value - list.reduce((sum, p) => sum + valueOf(p.id), 0)).toFixed(1)}</span></p>}
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
                <span className="text-zinc-300">VALUE</span> blends market data with projections and positional depth when market data is available. K and DEF earn 0.15 value per projected point above replacement, capped at 5.0. Each extra player costs 5 value for the displaced bench spot. Remaining value counts at 75% for the first extra player, then 56.25% for the next.
                <span className="ml-2 text-cyan-300/80">FC</span> = community consensus from FantasyCalc.com.
              </p>
            </div>
          )}

        </>
      )}
    </AppShell>
  );
}
