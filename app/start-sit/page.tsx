"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchDraftState, fetchLeague } from "@/lib/data";
import { buildRoster } from "@/lib/draft";
import { SCORING_LABELS } from "@/lib/league";
import { usePlayers } from "@/lib/players";
import type { DraftState, LeagueConfig, Player } from "@/lib/types";
import { buildTradeValues } from "@/lib/trade-value";
import AppShell from "@/components/dashboard/AppShell";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { PosBadge, Skeleton } from "@/components/ui";
import { ListCheckIcon, XIcon } from "@/components/icons";

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
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);

  const { players, loading: playersLoading } = usePlayers(league?.scoring ?? "ppr");

  const [sideA, setSideA] = useState<string | null>(null);
  const [sideB, setSideB] = useState<string | null>(null);

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

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const values = useMemo(() => buildTradeValues(players, league?.teamCount ?? 12), [players, league]);

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

  const roster = useMemo(
    () => (league ? buildRoster(myPicks, playersById, league.roster) : []),
    [league, myPicks, playersById]
  );

  const diff = a && b ? a.projection - b.projection : 0;
  const band = a && b ? confidence(diff) : null;
  const winner = a && b ? (a.projection >= b.projection ? a : b) : null;

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
        <PosBadge position={p.position} size="sm" />
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {p.team} · ADP {p.adp > 0 ? p.adp.toFixed(1) : "—"}
      </div>
      <div className="mt-4">
        {statRow("Projection", `${p.projection.toFixed(1)} pts`, winner === p)}
        {statRow("Weekly avg", p.weeklyAvg.toFixed(1))}
        {statRow("Trade value", (values.get(p.id) ?? 0).toFixed(1))}
        {statRow("Tier", `T${p.tier}`)}
        {statRow("Position rank", `#${p.positionRank}`)}
      </div>
    </div>
  );

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
          <ListCheckIcon size={20} />
        </span>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-wide text-white">Start/Sit Optimizer</h1>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {SCORING_LABELS[league?.scoring ?? "ppr"]}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Head-to-head call between two players, plus your optimized starting lineup.
          </p>
        </div>
      </div>

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
                  onPick={(p) => setSideB(p.id)}
                  placeholder="Search a player…"
                />
                <p className="mt-3 text-xs text-zinc-500">Pick a player to compare.</p>
              </div>
            )}
          </div>

          {/* ── Verdict ──────────────────────────────────────── */}
          {a && b && band && winner && (
            <div className={`mt-6 rounded-2xl border p-6 ${band.cls}`}>
              <div className="flex flex-col items-center gap-4 text-center">
                <span className={`font-display text-2xl font-bold ${band.cls.split(" ")[0]}`}>
                  Start {winner.name}
                </span>
                <p className="text-sm text-zinc-300">{band.detail}</p>
                <p className="font-tech text-lg font-bold text-zinc-100">
                  {winner.projection.toFixed(1)} vs{" "}
                  {(winner === a ? b : a).projection.toFixed(1)} pts
                  <span className="ml-2 text-sm text-zinc-400">
                    ({diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)} gap)
                  </span>
                </p>
                <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {band.label}
                </span>
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
