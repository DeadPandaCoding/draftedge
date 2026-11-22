"use client";

import { useEffect, useMemo, useState } from "react";
import { BoltIcon } from "@/components/icons";
import type { Player, PlayersResponse, ScoringFormat } from "@/lib/types";

const SCORING_FORMATS: { value: ScoringFormat; label: string }[] = [
  { value: "ppr", label: "PPR" },
  { value: "half_ppr", label: "Half-PPR" },
  { value: "standard", label: "Standard" },
];

const POS_CLASSES: Record<string, string> = {
  WR: "text-emerald-300",
  RB: "text-sky-300",
  QB: "text-rose-300",
  TE: "text-violet-300",
  K: "text-amber-300",
  DEF: "text-cyan-300",
};

const TIER_CLASSES: Record<number, string> = {
  1: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
  2: "bg-sky-400/15 text-sky-300 ring-sky-400/40",
  3: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40",
};

function formatPoints(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

export function DraftBoardMockup() {
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [players, setPlayers] = useState<Player[]>([]);
  const [source, setSource] = useState<PlayersResponse["source"]>("seed");
  const [draftedIds, setDraftedIds] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/players?scoring=${scoring}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Player snapshot returned ${response.status}`);
        return response.json() as Promise<PlayersResponse>;
      })
      .then((data) => {
        setPlayers(data.players);
        setSource(data.source);
        setDraftedIds(new Set());
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [scoring]);

  const visiblePlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => {
      const rankA = a.seasonProjection ?? a.projection;
      const rankB = b.seasonProjection ?? b.projection;
      return rankB - rankA;
      })
      .slice(0, 6);
  }, [players]);

  const rows = showAll ? visiblePlayers : visiblePlayers.filter((player) => !draftedIds.has(player.id));

  function toggleDrafted(playerId: string) {
    setDraftedIds((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  function changeScoring(format: ScoringFormat) {
    setLoading(true);
    setLoadError(false);
    setScoring(format);
  }

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <BoltIcon size={16} />
            </span>
            <span className="font-display text-base tracking-wide text-zinc-100">DraftEdge</span>
            <span className="hidden text-xs font-medium text-zinc-500 sm:inline">
              {source === "live" ? "Live player snapshot" : "Player snapshot"}
            </span>
          </div>
          <div className="flex rounded-lg border border-zinc-700/70 bg-zinc-900/70 p-1" role="group" aria-label="Scoring format">
            {SCORING_FORMATS.map((format) => (
              <button
                key={format.value}
                type="button"
                aria-pressed={scoring === format.value}
                onClick={() => changeScoring(format.value)}
                className={`min-h-8 rounded-md px-2 text-[11px] font-semibold transition sm:px-2.5 ${
                  scoring === format.value ? "bg-emerald-500/15 text-emerald-200" : "text-zinc-400 hover:text-white"
                }`}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-4 sm:px-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-300">Tap a player to mark drafted</span>
            <div className="flex rounded-lg border border-zinc-700/70 bg-zinc-900/70 p-1" role="group" aria-label="Filter preview players">
              <button type="button" aria-pressed={!showAll} onClick={() => setShowAll(false)} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${!showAll ? "bg-emerald-500/15 text-emerald-200" : "text-zinc-400 hover:text-white"}`}>
                Available
              </button>
              <button type="button" aria-pressed={showAll} onClick={() => setShowAll(true)} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${showAll ? "bg-emerald-500/15 text-emerald-200" : "text-zinc-400 hover:text-white"}`}>
                All players
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[42px_minmax(0,1fr)_48px_48px_58px] gap-1.5 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[52px_minmax(0,1fr)_58px_58px_72px] sm:gap-2 sm:text-xs">
            <span>Tier</span><span>Player</span><span className="text-right">Pos</span><span className="text-right">Bye</span><span className="text-right">Proj</span>
          </div>
          <div className="space-y-1" aria-live="polite">
            {loading && <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-6 text-center text-sm text-zinc-400">Loading live player rankings…</div>}
            {!loading && loadError && <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-6 text-center text-sm text-zinc-400">Live rankings are temporarily unavailable.</div>}
            {!loading && !loadError && rows.map((player) => {
              const drafted = draftedIds.has(player.id);
              const tier = Math.min(player.tier || 3, 3);
              return (
                <button
                  key={player.id}
                  type="button"
                  aria-pressed={drafted}
                  aria-label={`${player.name}, ${player.position}, ${formatPoints(player.seasonProjection ?? player.projection)} projected points${drafted ? ", drafted" : ", available"}`}
                  onClick={() => toggleDrafted(player.id)}
                  className={`grid w-full grid-cols-[42px_minmax(0,1fr)_48px_48px_58px] items-center gap-1.5 rounded-lg border px-2 py-2.5 text-left text-sm transition hover:border-emerald-400/35 hover:bg-zinc-800/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:grid-cols-[52px_minmax(0,1fr)_58px_58px_72px] sm:gap-2 ${drafted ? "border-zinc-800 bg-zinc-900/35 opacity-50" : "border-zinc-800 bg-zinc-900/70"}`}
                >
                  <span className={`w-fit rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset sm:px-2 ${TIER_CLASSES[tier]}`}>
                    T{tier}
                  </span>
                  <span className={`flex min-w-0 items-center gap-1.5 font-semibold ${drafted ? "line-through" : "text-zinc-100"}`}>
                    <span className="truncate">{player.name}</span>
                    <span className="hidden rounded bg-zinc-800 px-1.5 text-[10px] font-bold text-zinc-400 sm:inline">{player.team}</span>
                    {drafted && <span className="hidden text-[10px] font-bold uppercase text-rose-400/80 sm:inline">Drafted</span>}
                  </span>
                  <span className={`text-right text-xs font-bold sm:text-sm ${POS_CLASSES[player.position]}`}>{player.position}</span>
                  <span className="font-tech text-right text-zinc-400">{player.bye || "—"}</span>
                  <span className="font-tech text-right text-xs font-semibold text-zinc-200 sm:text-sm">{formatPoints(player.seasonProjection ?? player.projection)}</span>
                </button>
              );
            })}
            {!loading && !loadError && rows.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">All preview players are drafted. Switch to All players to reset the board.</p>}
          </div>
          <p className="mt-3 text-right text-[10px] text-zinc-500">Season points · {scoring === "half_ppr" ? "Half-PPR" : scoring.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
