"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { Position, ScoringFormat } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { SCORING_LABELS } from "@/lib/league";
import AppShell from "@/components/dashboard/AppShell";
import { PlayersTable } from "@/components/dashboard/PlayersTable";
import { Skeleton } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { exportPlayersCsv } from "@/lib/csv";

const SCORING_OPTIONS: ScoringFormat[] = ["ppr", "half_ppr", "standard"];
const POSITION_FILTERS = ["ALL", ...POSITIONS] as (Position | "ALL")[];

export default function RankingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { players, loading: playersLoading } = usePlayers(scoring);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  const filtered = useMemo(() => {
    let list = players;
    if (position !== "ALL") list = list.filter((p) => p.position === position);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    return list;
  }, [players, position, search]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Player Rankings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Browse projections, tiers, and ADP across every position.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1">
            {SCORING_OPTIONS.map((s) => (
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
            onClick={() => exportPlayersCsv(filtered, null)}
            disabled={playersLoading || filtered.length === 0}
            className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 transition disabled:opacity-40"
          >
            <DownloadIcon size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {POSITION_FILTERS.map((pos) => (
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

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <PlayersTable players={filtered} />
      )}
    </AppShell>
  );
}
