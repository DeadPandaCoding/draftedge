"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { LeagueConfig, Player, Position, ScoringFormat } from "@/lib/types";
import { SCORING_LABELS } from "@/lib/league";
import { fetchLeague } from "@/lib/data";
import { buildTradeValues } from "@/lib/trade-value";
import { playerSlug } from "@/lib/seed-data";
import { useStarredPlayers } from "@/lib/stars";
import AppShell from "@/components/dashboard/AppShell";
import { PosBadge, Skeleton, TierBadge } from "@/components/ui";
import { StarIcon } from "@/components/icons";

const SCORING_OPTIONS: ScoringFormat[] = ["ppr", "half_ppr", "standard"];

/** Core starters per team, used to compute the replacement-level baseline. */
const STARTERS_PER_TEAM: Record<Position, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  K: 1,
  DEF: 1,
};

/** Skill positions shown in the positional-depth panel. */
const DEPTH_POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];

export default function ResearchPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isStarred, toggleStar } = useStarredPlayers();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");

  const { players, loading: playersLoading } = usePlayers(scoring);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchLeague(user.id)
      .then((lg) => {
        if (!cancelled && lg) {
          setLeague(lg);
          setScoring(lg.scoring);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const teamCount = league?.teamCount ?? 12;

  const values = useMemo(() => buildTradeValues(players, teamCount), [players, teamCount]);

  const valueLeaders = useMemo(() => {
    return [...players]
      .map((p) => ({ p, value: values.get(p.id) ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [players, values]);

  const depth = useMemo(() => {
    return DEPTH_POSITIONS.map((pos) => {
      const list = players
        .filter((p) => p.position === pos)
        .sort((a, b) => b.projection - a.projection);
      const starters = STARTERS_PER_TEAM[pos] * teamCount;
      const baseline =
        list.length >= starters
          ? list[starters - 1].projection
          : list[list.length - 1]?.projection ?? 0;
      const above = list.filter((p) => p.projection > baseline).length;
      const starterAvg =
        list.slice(0, Math.min(starters, list.length)).reduce((s, p) => s + p.projection, 0) /
        Math.max(1, Math.min(starters, list.length));
      return { pos, starters, baseline, above, top: list[0], starterAvg, total: list.length };
    });
  }, [players, teamCount]);

  const tiers = useMemo(() => {
    return [1, 2, 3, 4, 5].map((tier) => {
      const list = players.filter((p) => p.tier === tier);
      const projs = list.map((p) => p.projection);
      return {
        tier,
        count: list.length,
        avg: list.length ? projs.reduce((s, v) => s + v, 0) / list.length : 0,
        min: list.length ? Math.min(...projs) : 0,
        max: list.length ? Math.max(...projs) : 0,
      };
    });
  }, [players]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  const starButton = (p: Player) => (
    <button
      type="button"
      onClick={() => toggleStar(p.name)}
      aria-pressed={isStarred(p.name)}
      aria-label={`${isStarred(p.name) ? "Remove" : "Add"} ${p.name} ${
        isStarred(p.name) ? "from" : "to"
      } starred players`}
      className={`shrink-0 rounded-md p-0.5 transition ${
        isStarred(p.name)
          ? "text-amber-400 hover:text-amber-300"
          : "text-zinc-600 hover:text-zinc-300"
      }`}
    >
      <StarIcon size={14} fill={isStarred(p.name) ? "currentColor" : "none"} />
    </button>
  );

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Research Hub</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Value over replacement, positional depth, and tier drop-offs —{" "}
            {league ? `${league.name} · ${teamCount}-team` : `${teamCount}-team baseline`}.
          </p>
        </div>
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
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Value leaders ─────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Value Leaders</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Most valuable players above a replacement starter — directly comparable across positions.
            </p>
            <div className="glass-strong overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60 text-left">
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">#</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Player</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Pos</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">ADP</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Proj</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueLeaders.map(({ p, value }, i) => (
                      <tr key={p.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/60">
                        <td className="font-tech px-4 py-2.5 text-zinc-500">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {starButton(p)}
                            <Link
                              href={`/players/${playerSlug(p.name)}`}
                              className="font-semibold text-zinc-100 transition hover:text-emerald-300"
                            >
                              {p.name}
                            </Link>
                            <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                              {p.team}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <PosBadge position={p.position} size="xs" />
                        </td>
                        <td className="font-tech px-4 py-2.5 text-zinc-400">
                          {p.adp > 0 ? p.adp.toFixed(1) : "—"}
                        </td>
                        <td className="font-tech px-4 py-2.5 text-zinc-300">{p.projection.toFixed(1)}</td>
                        <td className="font-tech px-4 py-2.5 text-right font-bold text-emerald-300">
                          {value.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── Positional depth ──────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Positional Depth</h2>
            <p className="mb-4 text-xs text-zinc-500">
              How many players at each position clear the replacement bar, and how steep the drop-off is.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {depth.map((d) => (
                <div key={d.pos} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <PosBadge position={d.pos} size="sm" />
                    <span className="text-xs text-zinc-500">{d.total} rostered</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Starters / team
                      </dt>
                      <dd className="font-tech mt-1 text-xl font-bold text-white">{d.starters}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Replacement level
                      </dt>
                      <dd className="font-tech mt-1 text-xl font-bold text-white">{d.baseline.toFixed(1)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Startable pool (above replacement)
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-300">
                        <span className="font-tech font-bold text-emerald-300">{d.above}</span>
                        <span className="text-zinc-500"> of {d.total}</span>
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Ceiling · starter average
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-300">
                        {d.top ? (
                          <Link
                            href={`/players/${playerSlug(d.top.name)}`}
                            className="font-semibold text-zinc-100 transition hover:text-emerald-300"
                          >
                            {d.top.name}
                          </Link>
                        ) : (
                          "—"
                        )}{" "}
                        <span className="text-zinc-500">
                          · {d.starterAvg.toFixed(1)} avg proj
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tier breakdown ────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Tier Breakdown</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Projection ranges per tier so you can see where the value drops off mid-draft.
            </p>
            <div className="glass-strong overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/60 text-left">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Tier</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Players</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Avg Proj</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t) => (
                    <tr key={t.tier} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/60">
                      <td className="px-4 py-2.5">
                        <TierBadge tier={t.tier} size="sm" />
                      </td>
                      <td className="font-tech px-4 py-2.5 text-zinc-300">{t.count}</td>
                      <td className="font-tech px-4 py-2.5 text-zinc-300">
                        {t.count ? t.avg.toFixed(1) : "—"}
                      </td>
                      <td className="font-tech px-4 py-2.5 text-zinc-500">
                        {t.count ? `${t.max.toFixed(1)} – ${t.min.toFixed(1)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <p className="mt-8 text-[11px] leading-relaxed text-zinc-500">
        Value = projected points above a replacement-level starter ({teamCount}-team baseline).
        Depth and tiers are derived from {SCORING_LABELS[scoring]} projections. Star a player to pin
        them to your home dashboard.
      </p>
    </AppShell>
  );
}
