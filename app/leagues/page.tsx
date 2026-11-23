"use client";

import { useEffect, useState } from "react";
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
  const [guidePlatform, setGuidePlatform] = useState<"sleeper" | "espn">("sleeper");
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
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">League Sync</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">Connect Sleeper or ESPN to bring league scoring, rosters, and draft picks into your DraftEdge tools.</p>
          </div>
          <Link href="/home" className="rounded-lg border border-white/[0.1] bg-[#0D1412] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-emerald-500/30 hover:text-white">Back to dashboard</Link>
        </div>

        <LeagueSyncCard />

        <section className="mt-5 rounded-xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5" aria-labelledby="connect-guide-heading">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">Quick Guide</p>
            <h2 id="connect-guide-heading" className="mt-1 text-sm font-semibold text-white">How to connect your league</h2>
          </div>
          <div className="mt-4 inline-flex rounded-lg border border-white/[0.08] bg-[#080E0C] p-0.5" role="tablist" aria-label="League connection instructions">
            {(["sleeper", "espn"] as const).map((platform) => (
              <button key={platform} type="button" role="tab" aria-selected={guidePlatform === platform} onClick={() => setGuidePlatform(platform)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${guidePlatform === platform ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>
                {platform === "espn" ? "ESPN" : "Sleeper"}
              </button>
            ))}
          </div>
          {guidePlatform === "sleeper" ? (
            <ol className="mt-4 grid gap-3 text-xs leading-relaxed text-zinc-400 sm:grid-cols-3">
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">01</span><span>Open the Sleeper app or sleeper.com and find your <strong className="font-semibold text-zinc-200">@username</strong> in your profile settings. No password is needed.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">02</span><span>Enter your exact Sleeper username in the form above and select <strong className="font-semibold text-zinc-200">Connect Sleeper</strong>.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">03</span><span>Select your active league under Saved leagues. DraftEdge imports your roster and settings, including PPR, Half-PPR, Superflex slots, and TE Premium when applicable.</span></li>
            </ol>
          ) : (
            <ol className="mt-4 grid gap-3 text-xs leading-relaxed text-zinc-400 sm:grid-cols-3">
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">01</span><span>Open your ESPN Fantasy Football league. Find your League ID in the URL, for example <code className="rounded bg-[#080E0C] px-1 py-0.5 text-zinc-300">leagueId=12345678</code>. Copy the number.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">02</span><span>For a public league, paste the League ID above and select <strong className="font-semibold text-zinc-200">Connect ESPN</strong>.</span></li>
              <li className="flex gap-2"><span className="font-mono font-bold text-emerald-400">03</span><span>For a private league, ask your league manager to enable <strong>Make League Viewable to Public</strong> in League Settings, or enter espn_s2 and SWID under <strong>Add ESPN cookies</strong>.</span></li>
            </ol>
          )}
        </section>

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
