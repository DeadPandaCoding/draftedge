"use client";

import type { Position } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { RANKINGS_SOURCE } from "@/lib/rankings-data";
import { ClockIcon, DownloadIcon, GridIcon, ResetIcon, SearchIcon, TableIcon, XIcon } from "@/components/icons";

export type ViewMode = "table" | "tiers";

const POSITION_COLORS: Record<Position, string> = {
  QB: "data-[on=true]:border-rose-500/60 data-[on=true]:bg-rose-500/15 data-[on=true]:text-rose-300",
  RB: "data-[on=true]:border-sky-500/60 data-[on=true]:bg-sky-500/15 data-[on=true]:text-sky-300",
  WR: "data-[on=true]:border-emerald-500/60 data-[on=true]:bg-emerald-500/15 data-[on=true]:text-emerald-300",
  TE: "data-[on=true]:border-violet-500/60 data-[on=true]:bg-violet-500/15 data-[on=true]:text-violet-300",
  K: "data-[on=true]:border-amber-500/60 data-[on=true]:bg-amber-500/15 data-[on=true]:text-amber-300",
  DEF: "data-[on=true]:border-zinc-500/60 data-[on=true]:bg-zinc-500/15 data-[on=true]:text-zinc-200",
};

export function ControlPanel({
  search,
  onSearch,
  position,
  onPosition,
  view,
  onView,
  hideDrafted,
  onToggleHideDrafted,
  counts,
  onReset,
  onExport,
  source,
  loading,
}: {
  search: string;
  onSearch: (v: string) => void;
  position: Position | "ALL";
  onPosition: (p: Position | "ALL") => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  hideDrafted: boolean;
  onToggleHideDrafted: () => void;
  counts: Record<Position, number>;
  onReset: () => void;
  onExport: () => void;
  source: string;
  loading: boolean;
}) {
  return (
    <div className="glass flex min-w-0 flex-col gap-3 p-3 md:min-h-0 md:w-60 md:p-4">
      <div className="flex items-center gap-2 md:flex-col md:items-stretch">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search players…"
            maxLength={100}
            className="glass-input w-full rounded-lg py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 transition hover:bg-zinc-700/60 hover:text-zinc-200"
            >
              <XIcon size={13} />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="glass flex shrink-0 items-center gap-1 rounded-lg p-1">
          <button
            onClick={() => onView("table")}
            title="Table view"
            className={`flex h-7 w-8 items-center justify-center rounded-md transition ${
              view === "table" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <TableIcon size={14} />
          </button>
          <button
            onClick={() => onView("tiers")}
            title="Tier view"
            className={`flex h-7 w-8 items-center justify-center rounded-md transition ${
              view === "tiers" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <GridIcon size={14} />
          </button>
        </div>
      </div>

      {/* Position pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        <button
          data-on={position === "ALL"}
          onClick={() => onPosition("ALL")}
          className="glass glass-hover font-tech shrink-0 rounded-full px-3 py-1 text-xs font-bold text-zinc-400 data-[on=true]:border-emerald-500/60 data-[on=true]:bg-emerald-500/15 data-[on=true]:text-emerald-300"
        >
          ALL
        </button>
        {POSITIONS.map((p) => (
          <button
            key={p}
            data-on={position === p}
            onClick={() => onPosition(p)}
            className={`glass glass-hover font-tech shrink-0 rounded-full px-3 py-1 text-xs font-bold text-zinc-400 ${POSITION_COLORS[p]}`}
          >
            {p}
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{counts[p]}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch md:gap-1.5 md:pt-1">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-400">
          <input
            type="checkbox"
            checked={hideDrafted}
            onChange={onToggleHideDrafted}
            className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 accent-emerald-500"
          />
          Hide drafted players
        </label>
        <div className="flex items-center gap-1.5 md:flex-col md:items-stretch">
          <button
            onClick={onExport}
            className="glass glass-hover flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-300"
          >
            <DownloadIcon size={13} />
            Export Roster CSV
          </button>
          <button
            onClick={onReset}
            className="btn-glass-danger flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            <ResetIcon size={13} />
            Reset Draft Board
          </button>
        </div>
        <div
          className="hidden md:block"
          title={
            loading
              ? "Loading player data…"
              : source === "live"
                ? "Player metadata synced with Sleeper"
                : "Offline — bundled rankings"
          }
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loading ? "animate-pulse bg-amber-400" : source === "live" ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
            <span className="text-[10px] font-medium text-zinc-500">
              {loading ? "Loading data…" : source === "live" ? "Synced with Sleeper" : "Bundled baseline data"}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-600">
            <ClockIcon size={11} className="shrink-0" />
            <span>
              Rankings: {RANKINGS_SOURCE.label} · updated {RANKINGS_SOURCE.updated}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
