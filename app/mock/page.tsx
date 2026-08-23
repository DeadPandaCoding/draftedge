"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { Player, Position, ScoringFormat } from "@/lib/types";
import { DEFAULT_ROSTER, SCORING_LABELS, roundForPick, rosterSize, slotForPick } from "@/lib/league";
import { buildTradeValues } from "@/lib/trade-value";
import AppShell from "@/components/dashboard/AppShell";
import { Select } from "@/components/ui";
import { BoltIcon, ResetIcon } from "@/components/icons";

interface MockPick {
  playerId: string;
  pickNumber: number;
  round: number;
  slot: number;
}

const TEAM_COUNTS = [8, 10, 12, 14];
const SCORING_OPTIONS: ScoringFormat[] = ["ppr", "half_ppr", "standard"];
const PICK_TIMER_SECONDS = 90;

/** Draft phase based on round number with positional guidance. */
function draftPhase(round: number, totalRounds: number): { label: string; tip: string } {
  const pct = round / totalRounds;
  if (pct <= 0.25)
    return { label: "Early", tip: "Secure elite RB/WR anchors — don't reach for QB/TE yet." };
  if (pct <= 0.6)
    return { label: "Mid", tip: "Build depth at RB/WR, consider Hero QB or elite TE builds." };
  if (pct <= 0.85)
    return { label: "Late", tip: "Fliers on high-ceiling backups and breakout candidates." };
  return { label: "Final", tip: "Kicker and D/ST only — never earlier than the last two rounds." };
}

/** Position counts a given draft slot has already taken. */
function countPositions(
  picks: MockPick[],
  slot: number,
  playersById: Map<string, Player>
): Record<Position, number> {
  const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  for (const p of picks) {
    if (p.slot !== slot) continue;
    const player = playersById.get(p.playerId);
    if (player) counts[player.position] += 1;
  }
  return counts;
}

/** Highest-projection undrafted player at any of the given positions (fallback: any). */
function bestAt(players: Player[], draftedIds: Set<string>, positions: Position[]): Player | null {
  const pool = players.filter((p) => !draftedIds.has(p.id) && positions.includes(p.position));
  const source = pool.length > 0 ? pool : players.filter((p) => !draftedIds.has(p.id));
  return source.sort((a, b) => b.projection - a.projection)[0] ?? null;
}

/**
 * Position-aware auto-draft for a slot: fill core starters, then flex, defer
 * K/DEF to the last two rounds, and use best-available skill players for bench.
 */
function pickForSlot(
  picks: MockPick[],
  slot: number,
  playersById: Map<string, Player>,
  players: Player[],
  draftedIds: Set<string>,
  pickNumber: number,
  teams: number,
  totalPicks: number
): Player | null {
  const counts = countPositions(picks, slot, playersById);
  const roundsLeft = Math.ceil((totalPicks - pickNumber + 1) / teams);
  const late = roundsLeft <= 2;

  // 1) Core starters.
  const core: Position[] = [];
  if (counts.QB < DEFAULT_ROSTER.qb) core.push("QB");
  if (counts.RB < DEFAULT_ROSTER.rb) core.push("RB");
  if (counts.WR < DEFAULT_ROSTER.wr) core.push("WR");
  if (counts.TE < DEFAULT_ROSTER.te) core.push("TE");
  if (core.length > 0) return bestAt(players, draftedIds, core);

  // 2) Flex (extra RB/WR/TE).
  const flexCapacity = DEFAULT_ROSTER.rb + DEFAULT_ROSTER.wr + DEFAULT_ROSTER.te + DEFAULT_ROSTER.flex;
  if (counts.RB + counts.WR + counts.TE < flexCapacity) {
    return bestAt(players, draftedIds, ["RB", "WR", "TE"]);
  }

  // 3) Kicker / defense in the closing rounds.
  const specialists: Position[] = [];
  if (late && counts.K < DEFAULT_ROSTER.k) specialists.push("K");
  if (late && counts.DEF < DEFAULT_ROSTER.def) specialists.push("DEF");
  if (specialists.length > 0) return bestAt(players, draftedIds, specialists);

  // 4) Bench — skill players only.
  return bestAt(players, draftedIds, ["QB", "RB", "WR", "TE"]);
}

export default function MockDraftPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [teams, setTeams] = useState(12);
  const [mySlot, setMySlot] = useState(4);
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [started, setStarted] = useState(false);
  const [picks, setPicks] = useState<MockPick[]>([]);
  const [mockPos, setMockPos] = useState<Position | "ALL">("ALL");
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(PICK_TIMER_SECONDS);

  const { players, loading: playersLoading } = usePlayers(scoring);
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const totalRounds = rosterSize(DEFAULT_ROSTER);
  const totalPicks = teams * totalRounds;
  const currentPick = picks.length + 1;
  const done = started && currentPick > totalPicks;
  const drafted = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);

  // Determine if it's the user's turn.
  const isMyTurn = started && !done && slotForPick(currentPick, teams) === mySlot;

  /** Advance opponents until it is the user's turn (or the draft ends). */
  const advance = useCallback((list: MockPick[], draftedIds: Set<string>): MockPick[] => {
    const result = [...list];
    let n = result.length;
    while (n < totalPicks && slotForPick(n + 1, teams) !== mySlot) {
      const slot = slotForPick(n + 1, teams);
      const best = pickForSlot(result, slot, playersById, players, draftedIds, n + 1, teams, totalPicks);
      if (!best) break;
      draftedIds.add(best.id);
      n += 1;
      result.push({ playerId: best.id, pickNumber: n, round: roundForPick(n, teams), slot });
    }
    return result;
  }, [totalPicks, teams, mySlot, playersById, players]);

  const makeMyPick = useCallback((playerId: string) => {
    setPicks((prev) => {
      const ids = new Set(prev.map((p) => p.playerId));
      if (ids.has(playerId)) return prev;
      ids.add(playerId);
      const n = prev.length + 1;
      const withMine = [
        ...prev,
        { playerId, pickNumber: n, round: roundForPick(n, teams), slot: slotForPick(n, teams) },
      ];
      return advance(withMine, ids);
    });
  }, [teams, advance]);

  const autoPick = useCallback(() => {
    const best = pickForSlot(picks, mySlot, playersById, players, drafted, currentPick, teams, totalPicks);
    if (best) makeMyPick(best.id);
  }, [picks, mySlot, playersById, players, drafted, currentPick, teams, totalPicks, makeMyPick]);

  // Pick clock: reset on each new pick, count down when it's the user's turn.
  const resetTimer = useCallback(() => {
    setSecondsLeft(PICK_TIMER_SECONDS);
    setTimerExpired(false);
  }, []);

  useEffect(() => {
    if (isMyTurn && started && !done) {
      resetTimer();
    }
  }, [currentPick, isMyTurn, started, done, resetTimer]);

  useEffect(() => {
    if (!isMyTurn || done) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimerExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, done]);

  // Auto-pick when timer expires.
  useEffect(() => {
    if (timerExpired && isMyTurn) autoPick();
  }, [timerExpired, isMyTurn, autoPick]);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  const startDraft = () => {
    setStarted(true);
    const ids = new Set<string>();
    setPicks(advance([], ids));
  };

  const simulateRest = () => {
    setPicks((prev) => {
      const result = [...prev];
      const ids = new Set(prev.map((p) => p.playerId));
      let n = result.length;
      while (n < totalPicks) {
        const slot = slotForPick(n + 1, teams);
        const best = pickForSlot(result, slot, playersById, players, ids, n + 1, teams, totalPicks);
        if (!best) break;
        ids.add(best.id);
        n += 1;
        result.push({ playerId: best.id, pickNumber: n, round: roundForPick(n, teams), slot });
      }
      return result;
    });
  };

  const reset = () => {
    setPicks([]);
    setStarted(false);
  };

  const myPicks = useMemo(() => picks.filter((p) => p.slot === mySlot), [picks, mySlot]);

  const options = useMemo(() => {
    const late = Math.ceil((totalPicks - currentPick + 1) / teams) <= 2;
    const pool = players.filter(
      (p) => !drafted.has(p.id) && (late || (p.position !== "K" && p.position !== "DEF"))
    );
    const source = pool.length > 0 ? pool : players.filter((p) => !drafted.has(p.id));
    // Sort by Value Over Replacement so QBs don't dominate the list.
    const vor = buildTradeValues(players, teams);
    return source.sort((a, b) => (vor.get(b.id) ?? 0) - (vor.get(a.id) ?? 0)).slice(0, 18);
  }, [players, drafted, currentPick, totalPicks, teams]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  const canStart = players.length > 0 && !playersLoading;

  return (
    <AppShell maxWidth="max-w-6xl" className="pt-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Mock Draft</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Practice a snake draft against position-aware auto-drafters.
          </p>
        </div>
        {started && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={simulateRest}
              disabled={done}
              className="glass glass-hover rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition disabled:opacity-40"
            >
              Simulate rest
            </button>
            <button
              type="button"
              onClick={reset}
              className="glass glass-hover inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition"
            >
              <ResetIcon size={14} />
              Reset
            </button>
          </div>
        )}
      </div>

      {!started ? (
        <div className="glass-strong mx-auto max-w-lg rounded-2xl p-7">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Scoring Format</label>
              <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1">
                {SCORING_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScoring(s)}
                    aria-pressed={scoring === s}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      scoring === s ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {SCORING_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">League Size</label>
              <div className="flex gap-1.5">
                {TEAM_COUNTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTeams(t);
                      setMySlot((s) => Math.min(s, t));
                    }}
                    aria-pressed={teams === t}
                    className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                      teams === t
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Your Draft Slot</label>
              <Select
                label="Your draft slot"
                value={String(mySlot)}
                onChange={(v) => setMySlot(Number(v))}
                options={Array.from({ length: teams }, (_, i) => ({
                  value: String(i + 1),
                  label: `Pick #${i + 1} of ${teams}`,
                }))}
              />
            </div>

            <button
              type="button"
              onClick={startDraft}
              disabled={!canStart}
              className="btn-glass-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-50"
            >
              <BoltIcon size={15} />
              {playersLoading ? "Loading players…" : "Start Mock Draft"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Draft board */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Draft Board</h2>
              <span className="font-tech text-xs text-zinc-500">
                {done ? "Complete" : `Round ${roundForPick(currentPick, teams)} · Pick ${currentPick}`}
              </span>
            </div>

            <div className="space-y-2">
              {Array.from({ length: totalRounds }).map((_, ri) => {
                const r = ri + 1;
                const roundPicks = picks.filter((p) => p.round === r);
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span className="font-tech w-9 shrink-0 text-[11px] font-bold text-zinc-500">
                      R{r}
                    </span>
                    <div
                      className="grid flex-1 gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${teams}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: teams }).map((_, si) => {
                        const slot = si + 1;
                        const pick = roundPicks.find((p) => p.slot === slot);
                        const player = pick ? playersById.get(pick.playerId) : null;
                        const mine = pick?.slot === mySlot;
                        return (
                          <div
                            key={slot}
                            className={`truncate rounded-lg border px-2 py-1.5 text-xs ${
                              mine
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                                : pick
                                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-300"
                                  : "border-zinc-800/60 bg-zinc-900/30 text-zinc-600"
                            }`}
                          >
                            <span className="block truncate font-semibold">
                              {player ? player.name : "—"}
                            </span>
                            <span className="font-tech block text-[9px] text-zinc-500">
                              {player ? `${player.position} · ${player.projection.toFixed(0)}${player.adp > 0 ? ` · ADP${player.adp.toFixed(0)}` : ""}` : `P${(r - 1) * teams + slot}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side: my turn or summary */}
          <div className="glass-strong rounded-2xl p-5">
            {done ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Your Team</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {totalRounds} rounds · pick {mySlot} · {SCORING_LABELS[scoring]}
                </p>
                <div className="mt-4 space-y-1.5">
                  {myPicks.map((pick) => {
                    const p = playersById.get(pick.playerId);
                    if (!p) return null;
                    return (
                      <div
                        key={pick.playerId}
                        className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-tech shrink-0 text-xs text-zinc-500">R{pick.round}</span>
                          <span className="truncate font-semibold text-zinc-200">{p.name}</span>
                        </div>
                        <span className="font-tech shrink-0 text-xs text-zinc-400">
                          {p.position} · {p.projection.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
                  <span className="font-tech text-xs uppercase tracking-wider text-emerald-300">
                    Projected
                  </span>
                  <span className="font-tech mt-0.5 block text-2xl font-bold text-white">
                    {myPicks
                      .reduce((s, pick) => s + (playersById.get(pick.playerId)?.projection ?? 0), 0)
                      .toFixed(1)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Your Pick</h2>
                  <span className="font-tech text-xs text-emerald-300">
                    Round {roundForPick(currentPick, teams)}
                  </span>
                </div>
                {/* Pick clock */}
                <div className={`mb-3 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 ${
                  secondsLeft <= 15
                    ? "border-rose-500/50 bg-rose-500/10"
                    : secondsLeft <= 30
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-emerald-500/30 bg-emerald-500/10"
                }`}>
                  <span className="font-tech text-[10px] uppercase tracking-wider text-zinc-500">Clock</span>
                  <span className={`font-tech text-lg font-bold ${
                    secondsLeft <= 15 ? "text-rose-300" : secondsLeft <= 30 ? "text-amber-300" : "text-emerald-300"
                  }`}>
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </span>
                </div>
                {/* Draft phase */}
                {(() => {
                  const phase = draftPhase(roundForPick(currentPick, teams), totalRounds);
                  return (
                    <div className="mb-3 rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-700/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                          {phase.label}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Round {roundForPick(currentPick, teams)}/{totalRounds}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{phase.tip}</p>
                    </div>
                  );
                })()}
                <p className="mb-3 text-xs text-zinc-500">Choose a player or auto-pick the best available.</p>
                {/* Roster needs */}
                {(() => {
                  const myCounts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
                  for (const pick of myPicks) {
                    const p = playersById.get(pick.playerId);
                    if (p) myCounts[p.position]++;
                  }
                  const needs: { pos: Position; have: number; need: number }[] = [
                    { pos: "QB", have: myCounts.QB, need: DEFAULT_ROSTER.qb },
                    { pos: "RB", have: myCounts.RB, need: DEFAULT_ROSTER.rb },
                    { pos: "WR", have: myCounts.WR, need: DEFAULT_ROSTER.wr },
                    { pos: "TE", have: myCounts.TE, need: DEFAULT_ROSTER.te },
                  ];
                  return (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {needs.map(({ pos, have, need }) => {
                        const filled = have >= need;
                        return (
                          <span
                            key={pos}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                              filled
                                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                                : "bg-zinc-800/60 text-zinc-500"
                            }`}
                          >
                            {pos} {have}/{need}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={autoPick}
                  className="btn-glass-primary mb-4 w-full rounded-xl py-2.5 text-sm font-bold transition"
                >
                  Auto-pick Best
                </button>
                <div className="mb-3 flex gap-1">
                  {(["ALL", "QB", "RB", "WR", "TE"] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setMockPos(pos)}
                      aria-pressed={mockPos === pos}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                        mockPos === pos
                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                          : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {options
                    .filter((p) => mockPos === "ALL" || p.position === mockPos)
                    .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => makeMyPick(p.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-zinc-900/60 px-3 py-2 text-left text-sm transition hover:bg-zinc-800"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-semibold text-zinc-200">{p.name}</span>
                        <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                          {p.team}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {p.adp > 0 && (
                          <span className="rounded bg-zinc-800 px-1 py-px text-[9px] font-bold text-zinc-500">
                            ADP {p.adp.toFixed(0)}
                          </span>
                        )}
                        <span className="font-tech text-xs text-zinc-400">
                          {p.position} · {p.projection.toFixed(1)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
