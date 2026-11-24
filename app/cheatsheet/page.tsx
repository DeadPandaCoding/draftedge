"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { LeagueConfig, Player, Position } from "@/lib/types";
import { POSITION_FILTERS } from "@/lib/types";
import { SCORING_LABELS } from "@/lib/league";
import { fetchLeague } from "@/lib/data";
import { exportPlayersCsv } from "@/lib/csv";
import AppShell from "@/components/dashboard/AppShell";
import { PlayersTable } from "@/components/dashboard/PlayersTable";
import { Skeleton } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { resolveSleeperPlayerIds, toScoringFormat, useSyncedLeagues } from "@/lib/league-context";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";


export default function CheatSheetPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [leagueLoaded, setLeagueLoaded] = useState(false);
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [hideOutIr, setHideOutIr] = useState(false);
  const [showKDef, setShowKDef] = useState(true);
  const [syncLiveDraft, setSyncLiveDraft] = useState(false);
  // Mirrors the table's current sort order so CSV export matches the screen.
  const [sortedRows, setSortedRows] = useState<Player[]>([]);
  const { activeLeague, syncNow, loading: syncLoading, error: syncError } = useSyncedLeagues();

  const scoring = activeLeague ? toScoringFormat(activeLeague.scoring_format) : league?.scoring ?? "ppr";
  const { players, loading: playersLoading } = usePlayers(scoring);
  const providerLabel = activeLeague?.platform === "espn" ? "ESPN" : "Sleeper";
  const lastRefreshed = (() => {
    const raw = activeLeague?.last_synced_at;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  })();

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchLeague(user.id)
      .then((lg) => {
        if (!cancelled) setLeague(lg);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLeagueLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    let list = players;
    if (hideOutIr) list = list.filter((p) => !["O", "IR", "PUP"].includes(p.injuryStatus ?? ""));
    if (!showKDef) list = list.filter((p) => p.position !== "K" && p.position !== "DEF");
    if (position !== "ALL") list = list.filter((p) => p.position === position);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    return list;
  }, [players, position, search, hideOutIr, showKDef]);
  const draftedPlayerIds = useMemo(() => syncLiveDraft ? new Set(resolveSleeperPlayerIds(players, activeLeague?.drafted_player_ids ?? [])) : undefined, [syncLiveDraft, activeLeague?.drafted_player_ids, players]);

  if (loading || !user) {
    return <ToolLoadingState title="Fantasy Football Cheat Sheets" description="Build a fantasy football draft cheat sheet with player rankings, tiers, projections, ADP, and synced league settings." />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Cheat Sheet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {activeLeague
              ? `${activeLeague.league_name} · ${SCORING_LABELS[scoring]} · ${activeLeague.total_teams}-team`
              : league
                ? `${league.name} · ${SCORING_LABELS[scoring]} · ${league.teamCount}-team`
                : "Default PPR board — connect a Sleeper league to personalize it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportPlayersCsv(sortedRows.length > 0 ? sortedRows : filtered, league, {
            horizon: "season",
            scoring,
          })}
          className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition"
        >
          <DownloadIcon size={15} />
          Export CSV
        </button>
      </div>

      {!leagueLoaded ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : !league && !activeLeague ? (
        <div className="glass-strong mb-6 flex flex-col items-start gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            This board is using default PPR scoring. Create a league to tune it to your format.
          </p>
          <Link
            href="/onboarding"
            className="glass glass-hover shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-200 transition"
          >
            Set Up League
          </Link>
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {activeLeague && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0D1412] px-3 py-2.5">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300">
          <input type="checkbox" checked={syncLiveDraft} onChange={(event) => setSyncLiveDraft(event.target.checked)} className="accent-emerald-500" />
          Sync {providerLabel} Draft Picks
        </label>
        <span className="text-[10px] text-zinc-500">
          {activeLeague.league_name} · {activeLeague.drafted_player_ids.length} picks synced ·{" "}
          {lastRefreshed ? `Last refreshed ${lastRefreshed.toLocaleString()}` : "Not refreshed yet"}
        </span>
        <button type="button" disabled={syncLoading} onClick={() => void syncNow(activeLeague.platform_league_id).catch(() => {})} className="ml-auto rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/[0.04] disabled:opacity-50">{syncLoading ? "Refreshing…" : `Refresh ${providerLabel} Picks`}</button>
        {syncError && <p role="alert" className="basis-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">{syncError}</p>}
      </div>}

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <PlayersTable players={filtered} draftedPlayerIds={draftedPlayerIds} onSortedChange={setSortedRows} />
      )}
    </AppShell>
  );
}
