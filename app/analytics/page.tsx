"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { DraftState, LeagueConfig } from "@/lib/types";
import { fetchDraftState, fetchLeague } from "@/lib/data";
import { buildRoster } from "@/lib/draft";
import AppShell from "@/components/dashboard/AppShell";
import { PosBadge, Skeleton } from "@/components/ui";
import { BarChartIcon } from "@/components/icons";

function gradeFor(avgValue: number): { letter: string; color: string } {
  if (avgValue >= 15) return { letter: "A", color: "text-emerald-300" };
  if (avgValue >= 5) return { letter: "B", color: "text-emerald-400" };
  if (avgValue >= -5) return { letter: "C", color: "text-amber-300" };
  if (avgValue >= -15) return { letter: "D", color: "text-rose-400" };
  return { letter: "F", color: "text-rose-400" };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [ready, setReady] = useState(false);

  const { players } = usePlayers(league?.scoring ?? "ppr");
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const lg = await fetchLeague(user.id);
        if (cancelled) return;
        setLeague(lg);
        if (lg) {
          const ds = await fetchDraftState(lg.id);
          if (!cancelled) setDraftState(ds);
        }
      } catch {
        // ignore — treated as no league below
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const myPicks = useMemo(
    () => (draftState?.picks ?? []).filter((p) => p.owner === "me").sort((a, b) => a.pickNumber - b.pickNumber),
    [draftState]
  );

  const roster = useMemo(
    () => (league && draftState ? buildRoster(myPicks, playersById, league.roster) : []),
    [league, draftState, myPicks, playersById]
  );

  const startersProjection = useMemo(
    () =>
      roster
        .filter((e) => !e.slot.startsWith("BENCH"))
        .reduce((s, e) => s + (playersById.get(e.playerId)?.projection ?? 0), 0),
    [roster, playersById]
  );

  const totalProjection = useMemo(
    () => myPicks.reduce((s, pick) => s + (playersById.get(pick.playerId)?.projection ?? 0), 0),
    [myPicks, playersById]
  );

  const values = useMemo(
    () =>
      myPicks.map((pick) => {
        const p = playersById.get(pick.playerId);
        return { pick, player: p, value: p && p.adp > 0 ? pick.pickNumber - p.adp : 0 };
      }),
    [myPicks, playersById]
  );

  const avgValue = useMemo(
    () => (values.length ? values.reduce((s, v) => s + v.value, 0) / values.length : 0),
    [values]
  );

  const best = useMemo(() => values.reduce<typeof values[number] | null>((m, v) => (m && m.value >= v.value ? m : v), null), [values]);
  const worst = useMemo(() => values.reduce<typeof values[number] | null>((m, v) => (m && m.value <= v.value ? m : v), null), [values]);

  if (loading || !user || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4" aria-busy="true" aria-label="Loading">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BarChartIcon size={24} />
          </span>
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <AppShell maxWidth="max-w-2xl" className="pt-20">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BarChartIcon size={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl tracking-wide text-white">Draft Analytics</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Set up a league and run a draft to unlock your team grade and value picks.
          </p>
          <Link
            href="/onboarding"
            className="btn-glass-primary mt-6 inline-block w-full rounded-xl py-3 text-sm font-bold transition"
          >
            Set Up League
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!draftState || myPicks.length === 0) {
    return (
      <AppShell maxWidth="max-w-2xl" className="pt-20">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BarChartIcon size={26} />
          </span>
          <h1 className="mt-5 font-display text-2xl tracking-wide text-white">No picks yet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Complete your draft in <span className="font-semibold text-zinc-200">{league.name}</span> and
            come back to grade your team.
          </p>
          <Link
            href="/draft"
            className="btn-glass-primary mt-6 inline-block w-full rounded-xl py-3 text-sm font-bold transition"
          >
            Open Draft Room
          </Link>
        </div>
      </AppShell>
    );
  }

  const grade = gradeFor(avgValue);

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-wide text-white">Draft Analytics</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {league.name} · {myPicks.length} picks logged
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass rounded-xl p-4">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Starters Proj</dt>
          <dd className="font-tech mt-1 text-2xl font-bold text-white">{startersProjection.toFixed(1)}</dd>
        </div>
        <div className="glass rounded-xl p-4">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Total Proj</dt>
          <dd className="font-tech mt-1 text-2xl font-bold text-white">{totalProjection.toFixed(1)}</dd>
        </div>
        <div className="glass rounded-xl p-4">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Avg Value</dt>
          <dd className={`font-tech mt-1 text-2xl font-bold ${avgValue >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
            {avgValue >= 0 ? "+" : ""}
            {avgValue.toFixed(1)}
          </dd>
        </div>
        <div className="glass rounded-xl p-4">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Draft Grade</dt>
          <dd className={`font-display mt-1 text-2xl font-bold ${grade.color}`}>{grade.letter}</dd>
        </div>
      </div>

      {/* Value table */}
      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {["Pick", "Player", "Pos", "ADP", "Proj", "Value"].map((h) => (
                  <th
                    key={h}
                    className="font-tech whitespace-nowrap bg-zinc-950/95 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map(({ pick, player, value }) => (
                <tr key={`${pick.playerId}-${pick.pickNumber}`} className="border-b border-zinc-800/60">
                  <td className="font-tech border-b border-zinc-800/60 px-3 py-2 text-xs text-zinc-400">
                    R{pick.round} · P{pick.pickNumber}
                  </td>
                  <td className="border-b border-zinc-800/60 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-100">{player?.name ?? pick.playerId}</span>
                      {player && (
                        <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                          {player.team}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-b border-zinc-800/60 px-3 py-2">
                    {player && <PosBadge position={player.position} size="xs" />}
                  </td>
                  <td className="font-tech border-b border-zinc-800/60 px-3 py-2 text-xs text-zinc-400">
                    {player && player.adp > 0 ? player.adp.toFixed(1) : "—"}
                  </td>
                  <td className="font-tech border-b border-zinc-800/60 px-3 py-2 text-xs text-zinc-200">
                    {player && player.projection > 0 ? player.projection.toFixed(1) : "—"}
                  </td>
                  <td className="border-b border-zinc-800/60 px-3 py-2">
                    <span className={`font-tech text-xs font-bold ${value > 0 ? "text-emerald-300" : value < 0 ? "text-rose-400" : "text-zinc-500"}`}>
                      {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {best && best.player && (
          <div className="glass rounded-xl p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Best value</span>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {best.player.name}{" "}
              <span className="font-tech text-emerald-300">+{best.value.toFixed(1)}</span>
            </p>
          </div>
        )}
        {worst && worst.player && (
          <div className="glass rounded-xl p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Biggest reach</span>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {worst.player.name}{" "}
              <span className="font-tech text-rose-400">{worst.value.toFixed(1)}</span>
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
