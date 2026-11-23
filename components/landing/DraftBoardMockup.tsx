"use client";

import { useEffect, useMemo, useState } from "react";
import type { Player, PlayersResponse, ScoringFormat } from "@/lib/types";

const SCORING_FORMATS: { value: ScoringFormat; label: string }[] = [
  { value: "ppr", label: "PPR" },
  { value: "half_ppr", label: "Half-PPR" },
  { value: "standard", label: "Standard" },
];

const POS_BADGE_CLASSES: Record<string, string> = {
  WR: "bg-sky-500/15 text-sky-400",
  RB: "bg-emerald-500/15 text-emerald-400",
  QB: "bg-rose-500/15 text-rose-400",
  TE: "bg-amber-500/15 text-amber-400",
  K: "bg-violet-500/15 text-violet-400",
  DEF: "bg-cyan-500/15 text-cyan-400",
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

  const draftedCount = draftedIds.size;

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-3xl text-left">
      <div className="overflow-hidden rounded-[19px] border border-white/[0.08] bg-[#0B1210]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#080E0C] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#FF3E9D]/35 bg-[#FF3E9D]/10 px-2 py-1 font-mono text-[11px] font-bold tabular-nums text-[#FF3E9D]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#FF3E9D]" />
              PICK 1.{String(draftedCount + 1).padStart(2, "0")}
            </span>
            <span className="truncate font-mono text-xs text-zinc-400">
              {source === "live" ? "Current snapshot" : "Baseline snapshot"} · <span className="text-zinc-200">{scoring === "half_ppr" ? "Half-PPR" : scoring.toUpperCase()}</span>
            </span>
          </div>
          <div className="inline-flex rounded-lg border border-white/[0.08] bg-[#0D1613] p-0.5" role="group" aria-label="Scoring format">
            {SCORING_FORMATS.map((format) => (
              <button key={format.value} type="button" aria-pressed={scoring === format.value} onClick={() => changeScoring(format.value)} className={`min-h-8 rounded-md px-2 font-mono text-[10px] font-semibold transition sm:px-2.5 sm:text-[11px] ${scoring === format.value ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
                {format.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
          <div className="inline-flex rounded-lg border border-white/[0.07] bg-[#080E0C] p-0.5 text-xs" role="group" aria-label="Player filter">
            <button type="button" aria-pressed={!showAll} onClick={() => setShowAll(false)} className={`min-h-8 rounded-md px-2.5 font-medium transition ${!showAll ? "bg-white/[0.09] text-white" : "text-zinc-400 hover:text-zinc-200"}`}>Available</button>
            <button type="button" aria-pressed={showAll} onClick={() => setShowAll(true)} className={`min-h-8 rounded-md px-2.5 font-medium transition ${showAll ? "bg-white/[0.09] text-white" : "text-zinc-400 hover:text-zinc-200"}`}>All players</button>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-zinc-500">{rows.length} players</span>
        </div>

        <div className="grid grid-cols-[42px_minmax(0,1fr)_42px_32px_54px_50px] items-center border-b border-white/[0.06] bg-[#080E0C]/60 px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[48px_minmax(0,1fr)_52px_42px_64px_62px] sm:px-5 sm:text-[10px]">
          <span>Tier</span><span>Player</span><span>Pos</span><span className="text-right">Bye</span><span className="text-right">Proj</span><span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/[0.06]" aria-live="polite">
          {loading && <div className="px-4 py-8 text-center text-sm text-zinc-400">Loading player rankings…</div>}
          {!loading && loadError && <div className="px-4 py-8 text-center text-sm text-zinc-400">Player rankings are temporarily unavailable.</div>}
          {!loading && !loadError && rows.map((player) => {
            const drafted = draftedIds.has(player.id);
            const tier = Math.min(player.tier || 3, 3);
            const positionClass = POS_BADGE_CLASSES[player.position] ?? "bg-zinc-500/15 text-zinc-300";
            return (
              <button key={player.id} type="button" aria-pressed={drafted} aria-label={`${drafted ? "Mark" : "Draft"} ${player.name}, ${player.position}`} onClick={() => toggleDrafted(player.id)} className={`grid w-full grid-cols-[42px_minmax(0,1fr)_42px_32px_54px_50px] items-center px-3 py-3 text-left transition focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-400 sm:grid-cols-[48px_minmax(0,1fr)_52px_42px_64px_62px] sm:px-5 ${drafted ? "bg-black/30 opacity-50" : "hover:bg-white/[0.035]"}`}>
                <span><span className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ring-1 ring-inset ${TIER_CLASSES[tier]}`}>T{tier}</span></span>
                <span className="flex min-w-0 items-center gap-1.5 pr-1">
                  <span className={`truncate text-xs font-semibold sm:text-sm ${drafted ? "line-through text-zinc-500" : "text-white"}`}>{player.name}</span>
                  <span className="hidden shrink-0 rounded bg-white/[0.05] px-1 py-0.5 font-mono text-[9px] text-zinc-400 sm:inline">{player.team}</span>
                </span>
                <span><span className={`inline-flex rounded px-1 py-0.5 font-mono text-[9px] font-bold sm:px-1.5 sm:text-[10px] ${positionClass}`}>{player.position}</span></span>
                <span className="text-right font-mono text-[11px] tabular-nums text-zinc-400 sm:text-xs">{player.bye || "—"}</span>
                <span className="text-right font-mono text-[11px] font-semibold tabular-nums text-zinc-100 sm:text-xs">{formatPoints(player.seasonProjection ?? player.projection)}</span>
                <span className="text-right"><span className={`inline-block rounded px-1.5 py-1 font-mono text-[9px] font-bold sm:px-2 sm:text-[10px] ${drafted ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/15 text-emerald-400"}`}>{drafted ? "Taken" : "Draft"}</span></span>
              </button>
            );
          })}
          {!loading && !loadError && rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-400">All preview players are drafted. Switch to All players to reset the board.</p>}
        </div>
      </div>
    </div>
  );
}
