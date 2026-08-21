"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { LeagueConfig, Position } from "@/lib/types";
import { POSITIONS } from "@/lib/types";
import { SCORING_LABELS } from "@/lib/league";
import { fetchLeague } from "@/lib/data";
import { exportPlayersCsv } from "@/lib/csv";
import AppShell from "@/components/dashboard/AppShell";
import { PlayersTable } from "@/components/dashboard/PlayersTable";
import { Skeleton } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";

const POSITION_FILTERS = ["ALL", ...POSITIONS] as (Position | "ALL")[];

export default function CheatSheetPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [leagueLoaded, setLeagueLoaded] = useState(false);
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const scoring = league?.scoring ?? "ppr";
  const { players, loading: playersLoading } = usePlayers(scoring);

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
          <h1 className="font-display text-3xl tracking-wide text-white">Cheat Sheet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {league
              ? `${league.name} · ${SCORING_LABELS[league.scoring]} · ${league.teamCount}-team`
              : "Default PPR board — set up a league to personalize it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportPlayersCsv(filtered, league)}
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
      ) : !league ? (
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
