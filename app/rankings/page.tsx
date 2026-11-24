"use client";

import { SCORING_FORMATS } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { Player, Position, ScoringFormat } from "@/lib/types";
import { POSITION_FILTERS } from "@/lib/types";
import { SCORING_LABELS } from "@/lib/league";
import AppShell from "@/components/dashboard/AppShell";
import { PlayersTable } from "@/components/dashboard/PlayersTable";
import { Skeleton } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { exportPlayersCsv } from "@/lib/csv";
import { RANKINGS_SOURCE } from "@/lib/rankings-data";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";


export default function RankingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [projectionView, setProjectionView] = useState<"season" | "week" | "ros">("week");
  const [hideOutIr, setHideOutIr] = useState(false);
  const [showKDef, setShowKDef] = useState(true);
  // Mirrors the table's current sort order so CSV export matches the screen.
  const [sortedRows, setSortedRows] = useState<Player[]>([]);

  const { players, loading: playersLoading, weeklyRankingsUpdated } = usePlayers(scoring);
  const hasRosProjections = players.some((player) => player.rosProjection != null);
  const activeProjectionView = projectionView === "week" && !weeklyRankingsUpdated ? "season" : projectionView;

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  const filtered = useMemo(() => {
    let list = players;
    if (hideOutIr) list = list.filter((p) => !["O", "IR", "PUP"].includes(p.injuryStatus ?? ""));
    if (!showKDef) list = list.filter((p) => p.position !== "K" && p.position !== "DEF");
    if (position !== "ALL") list = list.filter((p) => p.position === position);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    return list;
  }, [players, position, search, hideOutIr, showKDef]);

  if (loading || !user) {
    return <ToolLoadingState title="Fantasy Football Player Rankings" description="Compare fantasy football player rankings, projections, position tiers, and ADP across PPR, Half-PPR, and Standard scoring." />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Player Rankings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Browse projections, tiers, and ADP across every position.
          </p>
          <p className="mt-1 text-xs text-zinc-500" aria-live="polite">
            {weeklyRankingsUpdated
              ? `FantasyPros weekly ranks · Sleeper weekly projections · updated ${new Date(`${weeklyRankingsUpdated}T00:00:00`).toLocaleDateString()}`
              : `Weekly rankings unavailable · showing ${RANKINGS_SOURCE.label} from ${RANKINGS_SOURCE.updated}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1">
            {SCORING_FORMATS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScoring(s)}
                aria-pressed={scoring === s}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  scoring === s ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {SCORING_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => exportPlayersCsv(sortedRows.length > 0 ? sortedRows : filtered, null, {
              horizon: activeProjectionView,
              scoring,
            })}
            disabled={playersLoading || filtered.length === 0}
            className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition disabled:opacity-40"
          >
            <DownloadIcon size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1" aria-label="Projection view">
          {(["season", "week", "ros"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setProjectionView(view)}
              disabled={(view === "week" && !weeklyRankingsUpdated) || (view === "ros" && !hasRosProjections)}
              aria-pressed={activeProjectionView === view}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                activeProjectionView === view ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {view === "ros" ? "Rest of season" : view === "week" ? "This week" : "Season"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POSITION_FILTERS.filter((pos) => showKDef || (pos !== "K" && pos !== "DEF")).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(pos)}
              aria-pressed={position === pos}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                position === pos
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={hideOutIr} onChange={(e) => setHideOutIr(e.target.checked)} className="accent-emerald-500" />
          Hide Out/IR
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
          <input type="checkbox" checked={showKDef} onChange={(e) => {
            const checked = e.target.checked;
            setShowKDef(checked);
            if (!checked && (position === "K" || position === "DEF")) setPosition("ALL");
          }} className="accent-emerald-500" />
          K/DEF
        </label>
        <div className="relative sm:ml-auto sm:w-64">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players or teams"
            aria-label="Search players or teams"
            className="glass-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-zinc-500" aria-live="polite">
        {activeProjectionView === "ros"
          ? "ROS points sum Sleeper weekly projections from the current NFL week through Week 18."
          : activeProjectionView === "week"
            ? "Weekly points use Sleeper projections; weekly ranks use the latest available consensus."
            : "Season points are full-season estimates from the available projection sources."}
      </p>

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <PlayersTable
          players={filtered}
          weekly={activeProjectionView === "week"}
          ros={activeProjectionView === "ros"}
          onSortedChange={setSortedRows}
        />
      )}
    </AppShell>
  );
}
