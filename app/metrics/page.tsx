"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchLeague } from "@/lib/data";
import { SCORING_LABELS } from "@/lib/league";
import { usePlayers } from "@/lib/players";
import type { LeagueConfig, Position } from "@/lib/types";
import { buildTradeValues } from "@/lib/trade-value";
import AppShell from "@/components/dashboard/AppShell";
import { PosBadge, Skeleton, TierBadge } from "@/components/ui";
import { ActivityIcon, SearchIcon } from "@/components/icons";

const POSITIONS: (Position | "ALL")[] = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

type SortKey = "vor" | "proj" | "adp";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "vor", label: "Value" },
  { key: "proj", label: "Projection" },
  { key: "adp", label: "ADP" },
];

/**
 * The external metrics that require live play-by-play / usage data. We don't
 * have a data vendor wired yet, so these are surfaced honestly as "coming
 * soon" rather than fabricated numbers.
 */
const EXTERNAL_METRICS: { name: string; desc: string }[] = [
  { name: "xFP", desc: "Expected fantasy points from a player's usage (targets + carries)." },
  { name: "Target share", desc: "Share of the team's targets a player commands." },
  { name: "Air yards share", desc: "Share of the team's intended air yards." },
  { name: "Route participation", desc: "% of dropbacks the player ran a route on." },
  { name: "Red-zone usage", desc: "Share of the team's red-zone targets/carries." },
  { name: "YPRR", desc: "Yards per route run — efficiency per snap in the route." },
];

export default function MetricsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [league, setLeague] = useState<LeagueConfig | null>(null);

  const { players, loading: playersLoading } = usePlayers(league?.scoring ?? "ppr");

  const [pos, setPos] = useState<Position | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("vor");

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchLeague(user.id)
      .then(setLeague)
      .catch(() => {});
  }, [user]);

  const values = useMemo(() => buildTradeValues(players, league?.teamCount ?? 12), [players, league]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const filtered = players.filter((p) => {
      if (pos !== "ALL" && p.position !== pos) return false;
      if (t && !(p.name.toLowerCase().includes(t) || p.team.toLowerCase().includes(t))) return false;
      return true;
    });
    const sorted = [...filtered].sort((x, y) => {
      if (sort === "proj") return y.projection - x.projection;
      if (sort === "adp") {
        const ax = x.adp > 0 ? x.adp : Number.MAX_SAFE_INTEGER;
        const ay = y.adp > 0 ? y.adp : Number.MAX_SAFE_INTEGER;
        return ax - ay;
      }
      return (values.get(y.id) ?? 0) - (values.get(x.id) ?? 0);
    });
    return sorted.slice(0, 60);
  }, [players, pos, q, sort, values]);

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-6xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
          <ActivityIcon size={20} />
        </span>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tracking-wide text-white">Advanced Metrics</h1>
            <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {SCORING_LABELS[league?.scoring ?? "ppr"]}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Value-over-replacement and efficiency at a glance, comparable across positions.
          </p>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name or team…"
            aria-label="Filter players"
            className="glass-input w-56 rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPos(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                pos === p
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-500/40"
                  : "glass text-zinc-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                sort === s.key
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-500/40"
                  : "glass text-zinc-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      {playersLoading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="glass-strong mt-5 overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2.5">Player</th>
                  <th className="px-3 py-2.5">Proj</th>
                  <th className="px-3 py-2.5">Wk Avg</th>
                  <th className="px-3 py-2.5">Value</th>
                  <th className="px-3 py-2.5">ADP</th>
                  <th className="px-3 py-2.5">Tier</th>
                  <th className="px-3 py-2.5">Pos Rank</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{p.name}</span>
                        <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                          {p.team}
                        </span>
                        <PosBadge position={p.position} size="xs" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-tech text-zinc-200">{p.projection.toFixed(1)}</td>
                    <td className="px-3 py-2.5 font-tech text-zinc-400">{p.weeklyAvg.toFixed(1)}</td>
                    <td className="px-3 py-2.5 font-tech font-bold text-emerald-300">
                      {(values.get(p.id) ?? 0).toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 font-tech text-zinc-400">{p.adp > 0 ? p.adp.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2.5">
                      <TierBadge tier={p.tier} size="xs" />
                    </td>
                    <td className="px-3 py-2.5 font-tech text-zinc-400">#{p.positionRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Live advanced metrics (gated honestly) ─────────── */}
      <div className="glass-strong mt-6 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Usage & efficiency metrics</h2>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Needs live data
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          These come from play-by-play and participation data we don&apos;t bundle yet. They&apos;ll be wired to
          the free <span className="text-zinc-300">nflverse</span> open datasets (snap counts, Next Gen Stats, and
          play-by-play) rather than fabricated. Until then they show as &quot;coming soon&quot;:
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_METRICS.map((m) => (
            <div key={m.name} className="rounded-lg bg-zinc-900/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-300">{m.name}</span>
                <span className="font-tech text-sm text-zinc-600">—</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
