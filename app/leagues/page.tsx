"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeagueSyncCard } from "@/components/dashboard/LeagueSyncCard";
import { SiteHeader } from "@/components/ui/header";
import { Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useSyncedLeagues } from "@/lib/league-context";
import { LogoutIcon } from "@/components/icons";

export default function LeaguesPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { leagues, activeLeague, setActiveLeagueId } = useSyncedLeagues();

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Loading leagues">
        <div className="flex flex-col items-center gap-4">
          <span aria-hidden="true" className="size-8 animate-spin rounded-full border-2 border-white/[0.12] border-t-emerald-400" />
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col text-zinc-200">
      <SiteHeader variant="app" actions={
        <button type="button" onClick={() => { signOut(); router.push("/"); }} aria-label="Log out" className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0D1412] px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white">
          <LogoutIcon size={14} /> Log Out
        </button>
      } />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-10 sm:px-6 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">League Manager</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Your Leagues</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">Connect Sleeper or ESPN to bring league scoring, rosters, and draft picks into your DraftEdge tools.</p>
          </div>
          <Link href="/home" className="rounded-lg border border-white/[0.1] bg-[#0D1412] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-emerald-500/30 hover:text-white">Back to dashboard</Link>
        </div>

        <LeagueSyncCard />

        <section className="mt-8" aria-labelledby="saved-leagues-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="saved-leagues-heading" className="text-sm font-semibold text-zinc-200">Saved leagues</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{leagues.length} connected</span>
          </div>
          {leagues.length ? (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D1412]">
              {leagues.map((league, index) => {
                const isActive = league.id === activeLeague?.id;
                const superflex = league.roster_positions.some((slot) => slot.toUpperCase().replace(/[^A-Z]/g, "").includes("SUPERFLEX"));
                return (
                  <div key={league.id ?? `${league.platform}-${league.platform_league_id}-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">{league.league_name}</h3>
                        {isActive && <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-300">Active</span>}
                        <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-zinc-400">{league.platform}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded bg-[#080E0C] px-2 py-1 font-mono text-[10px] text-zinc-300">{league.total_teams} teams</span>
                        <span className="rounded bg-[#080E0C] px-2 py-1 font-mono text-[10px] text-zinc-300">{league.scoring_format}</span>
                        {league.te_premium && <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-300">TE Premium</span>}
                        {superflex && <span className="rounded bg-sky-500/10 px-2 py-1 font-mono text-[10px] text-sky-300">Superflex</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isActive && league.id && <button type="button" onClick={() => setActiveLeagueId(league.id!)} className="rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-white">Set active</button>}
                      <Link href="/start-sit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">Start/Sit</Link>
                      <Link href="/trade" className="rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-emerald-500/30 hover:text-white">Trade Analyzer</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D1412] px-5 py-8 text-center">
              <p className="text-sm font-medium text-zinc-200">No leagues connected yet</p>
              <p className="mt-1 text-xs text-zinc-500">Use the form above to connect a Sleeper username or ESPN league.</p>
            </div>
          )}
        </section>
      </main>
      <footer className="mt-auto border-t border-white/[0.06] py-5 text-center text-xs text-zinc-500">© {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper</footer>
    </div>
  );
}
