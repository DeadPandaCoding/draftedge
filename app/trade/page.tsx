"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchDraftState, fetchLeague } from "@/lib/data";
import { buildRoster } from "@/lib/draft";
import { SCORING_LABELS } from "@/lib/league";
import { usePlayers } from "@/lib/players";
import { normalizeName } from "@/lib/seed-data";
import type {
  DraftPick,
  DraftState,
  LeagueConfig,
  Player,
  RosterEntry,
  RosterTemplate,
} from "@/lib/types";
import { buildTradeValues, gradeTrade } from "@/lib/trade-value";
import AppShell from "@/components/dashboard/AppShell";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { PosBadge, Skeleton } from "@/components/ui";
import { LinkIcon, SwapIcon, XIcon } from "@/components/icons";

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
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  const { players, loading: playersLoading } = usePlayers(league?.scoring ?? "ppr");

  const [sideA, setSideA] = useState<string[]>([]);
  const [sideB, setSideB] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
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

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const values = useMemo(() => buildTradeValues(players, league?.teamCount ?? 12), [players, league]);
  const excluded = useMemo(() => new Set([...sideA, ...sideB]), [sideA, sideB]);

  const aPlayers = sideA.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const bPlayers = sideB.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));

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
  const aProj = aPlayers.reduce((s, p) => s + p.projection, 0);
  const bProj = bPlayers.reduce((s, p) => s + p.projection, 0);

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

  const copyLink = async () => {
    const url = buildShareUrl();
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the shareable URL is still in the address bar.
    }
  };

  const playerRow = (p: Player, side: Side) => (
    <div key={p.id} className="rounded-lg bg-zinc-900/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-zinc-200">{p.name}</span>
          <PosBadge position={p.position} size="xs" />
          {side === "A" && myPlayerIds.has(p.id) && (
            <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/30">
              Already owned
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-tech text-sm font-bold text-emerald-300">{valueOf(p.id).toFixed(1)}</span>
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
        {p.projection.toFixed(1)} pts · ADP {p.adp > 0 ? p.adp.toFixed(1) : "—"}
      </div>
    </div>
  );

  const sideColumn = (side: Side, title: string, list: Player[], totalValue: number, totalProj: number) => (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h2>
        <span className="font-tech text-lg font-bold text-emerald-300">
          {totalValue.toFixed(1)} <span className="text-[10px] font-semibold text-zinc-500">VAL</span>
        </span>
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
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <SwapIcon size={20} />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl tracking-wide text-white">Trade Analyzer</h1>
              <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {SCORING_LABELS[league?.scoring ?? "ppr"]}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Compare both sides by trade value and get an instant grade.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={copyLink}
          disabled={aPlayers.length === 0 && bPlayers.length === 0}
          className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition disabled:opacity-40"
        >
          <LinkIcon size={15} />
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {sideColumn("A", "You receive", aPlayers, aValue, aProj)}
            {sideColumn("B", "You give up", bPlayers, bValue, bProj)}
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

              {aPlayers.length !== bPlayers.length && (
                <p className="mt-4 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400">
                  {aPlayers.length < bPlayers.length
                    ? "You're consolidating several players into fewer — real markets usually demand a premium for that."
                    : "You're splitting one player into several — depth can be valuable, but the market often discounts it."}
                </p>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
                Value = projected points above a replacement-level starter (
                {league ? `${league.teamCount}-team` : "12-team"} baseline), shown alongside ADP as a
                market cross-check.
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
