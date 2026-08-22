"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import { buildTradeValues } from "@/lib/trade-value";
import { findPlayerBySlug } from "@/lib/seed-data";
import { SCORING_LABELS } from "@/lib/league";
import { fetchLeague } from "@/lib/data";
import type { LeagueConfig, ScoringFormat } from "@/lib/types";
import { useStarredPlayers } from "@/lib/stars";
import AppShell from "@/components/dashboard/AppShell";
import { PosBadge, Skeleton, TierBadge } from "@/components/ui";
import { StarIcon } from "@/components/icons";

const SCORING_OPTIONS: ScoringFormat[] = ["ppr", "half_ppr", "standard"];

export default function PlayerProfilePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { user, loading } = useAuth();
  const { isStarred, toggleStar } = useStarredPlayers();
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [league, setLeague] = useState<LeagueConfig | null>(null);

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const teamCount = league?.teamCount ?? 12;

  const player = useMemo(() => (slug ? findPlayerBySlug(players, slug) : undefined), [players, slug]);
  const values = useMemo(() => buildTradeValues(players, teamCount), [players, teamCount]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-3xl" className="pt-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/rankings"
          className="text-sm font-semibold text-zinc-400 transition hover:text-white"
        >
          ← Back to rankings
        </Link>
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
      </div>

      {playersLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 max-w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : !player ? (
        <div className="glass-strong rounded-2xl p-8 text-center">
          <h1 className="font-display text-2xl tracking-wide text-white">Player not found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            We couldn&apos;t find that player in the {SCORING_LABELS[scoring]} board.
          </p>
          <Link
            href="/rankings"
            className="btn-glass-primary mt-6 inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition"
          >
            Browse Rankings
          </Link>
        </div>
      ) : (
        <div className="glass-strong rounded-2xl p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl tracking-wide text-white">{player.name}</h1>
                <PosBadge position={player.position} size="sm" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                  {player.team}
                </span>
                {player.bye > 0 && <span>Bye week {player.bye}</span>}
                <TierBadge tier={player.tier} size="sm" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleStar(player.name)}
              aria-pressed={isStarred(player.name)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isStarred(player.name)
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white"
              }`}
            >
              <StarIcon size={15} fill={isStarred(player.name) ? "currentColor" : "none"} />
              {isStarred(player.name) ? "Starred" : "Star"}
            </button>
          </div>

          {/* Metrics */}
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Overall Rank</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-white">{player.rank}</dd>
            </div>
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Position Rank</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-white">
                {player.positionRank}
                <span className="text-sm font-semibold text-zinc-500"> {player.position}</span>
              </dd>
            </div>
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">ADP</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-white">
                {player.adp > 0 ? player.adp.toFixed(1) : "—"}
              </dd>
            </div>
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Projection</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-white">{player.projection.toFixed(1)}</dd>
            </div>
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Weekly Avg</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-white">{player.weeklyAvg.toFixed(1)}</dd>
            </div>
            <div className="glass rounded-xl p-4">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Trade Value</dt>
              <dd className="font-tech mt-1 text-2xl font-bold text-emerald-300">
                {(values.get(player.id) ?? 0).toFixed(1)}
              </dd>
            </div>
          </div>

          {/* 2025 Usage — only for positions with receiving data */}
          {player.usage && (player.usage.targets > 0 || player.usage.receptions > 0) && (
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  {player.usage.season} Season Usage
                </h2>
                <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                  nflverse
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Games", value: String(player.usage.games) },
                  { label: "Targets", value: String(player.usage.targets) },
                  { label: "Target %", value: player.usage.targetShare > 0 ? `${(player.usage.targetShare * 100).toFixed(1)}%` : "—" },
                  { label: "Receptions", value: String(player.usage.receptions) },
                  { label: "Rec Yards", value: player.usage.receivingYards > 0 ? player.usage.receivingYards.toLocaleString() : "—" },
                  { label: "Air Yards", value: player.usage.airYards > 0 ? player.usage.airYards.toLocaleString() : "—" },
                  { label: "Air %", value: player.usage.airYardsShare > 0 ? `${(player.usage.airYardsShare * 100).toFixed(1)}%` : "—" },
                  { label: "YAC", value: player.usage.yac > 0 ? player.usage.yac.toLocaleString() : "—" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-zinc-900/60 px-3 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{s.label}</span>
                    <p className="font-tech mt-0.5 text-lg font-bold text-zinc-200">{s.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Usage metrics sourced from the free nflverse dataset (regular-season totals).
              </p>
            </div>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-zinc-500">
            Trade value = projected points above a replacement starter ({teamCount}-team baseline) in{" "}
            {SCORING_LABELS[scoring]} scoring. Add this player to a trade in the{" "}
            <Link href="/trade" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Trade Analyzer
            </Link>
            .
          </p>
        </div>
      )}
    </AppShell>
  );
}
