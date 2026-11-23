"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui";
import { SiteHeader } from "@/components/ui/header";
import { useSyncedLeagues } from "@/lib/league-context";
import { usePlayers } from "@/lib/players";
import {
  ArrowUpIcon,
  ChevronRightIcon,
  ClockIcon,
  ListCheckIcon,
  LogoutIcon,
  SwapIcon,
  TableIcon,
} from "@/components/icons";

const TOOLS = [
  {
    icon: <SwapIcon size={18} />,
    title: "Trade Analyzer",
    desc: "Compare both sides and see who wins.",
    href: "/trade",
  },
  {
    icon: <TableIcon size={18} />,
    title: "Cheat Sheets",
    desc: "Browse player values, tiers, and ADP.",
    href: "/cheatsheet",
  },
  {
    icon: <ClockIcon size={18} />,
    title: "Mock Drafts",
    desc: "Practice against realistic pick simulations.",
    href: "/mock",
  },
  {
    icon: <ArrowUpIcon size={18} />,
    title: "Player Rankings",
    desc: "Projections, tiers, and ADP by position.",
    href: "/rankings",
  },
  {
    icon: <ListCheckIcon size={18} />,
    title: "Start/Sit",
    desc: "Compare players and build a strong lineup.",
    href: "/start-sit",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { activeLeague } = useSyncedLeagues();
  const { currentWeek } = usePlayers("ppr");

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4" aria-busy="true" aria-label="Loading">
          <span aria-hidden="true" className="size-8 animate-spin rounded-full border-2 border-white/[0.12] border-t-emerald-400" />
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];
  const weekContext = currentWeek
    ? `Week ${currentWeek} · Set your lineup and check player values before kickoff.`
    : "Offseason · Build your board and compare player values.";

  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      <SiteHeader
        variant="app"
        actions={
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            aria-label="Log out"
            className="glass glass-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            <LogoutIcon size={14} />
            Log Out
          </button>
        }
      />

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-12 sm:px-6">
        {/* ── Welcome ────────────────────────────────────── */}
        <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {weekContext}
        </p>
        <Link href="/leagues" className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0D1412] px-3 py-2 text-xs text-zinc-400 transition hover:border-emerald-500/25 hover:text-zinc-100">
          <span className={`size-1.5 shrink-0 rounded-full ${activeLeague ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className="truncate">{activeLeague ? `Synced: ${activeLeague.league_name} (${activeLeague.total_teams}-Team ${activeLeague.scoring_format}${activeLeague.te_premium ? " · TEP" : ""})` : "No league synced · Sync in League Sync"}</span>
          <span className="shrink-0 font-semibold text-emerald-400">{activeLeague ? "Manage →" : "→"}</span>
        </Link>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-300">Tools</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className={`group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-5 transition hover:border-emerald-500/30 hover:bg-[#131D1A] ${t.title === "Start/Sit" ? "sm:col-span-2" : ""}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 transition group-hover:text-emerald-400">
                  {t.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-100 transition group-hover:text-white">
                    {t.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">{t.desc}</p>
                </div>
                <ChevronRightIcon size={15} className="shrink-0 text-zinc-600 transition group-hover:text-emerald-400" />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-emerald-400/10 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
      </footer>
    </div>
  );
}
