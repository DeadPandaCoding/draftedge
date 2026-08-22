"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LeagueConfig } from "@/lib/types";
import { DEFAULT_ROSTER, SCORING_LABELS, rosterSize } from "@/lib/league";
import { fetchLeague, persistLeague } from "@/lib/data";
import KineticGrid from "@/components/ui/kinetic-grid";
import { Skeleton } from "@/components/ui";
import { SiteHeader } from "@/components/ui/header";
import {
  ActivityIcon,
  ArrowUpIcon,
  BarChartIcon,
  BoltIcon,
  ChevronRightIcon,
  ClockIcon,
  FlaskIcon,
  ListCheckIcon,
  LogoutIcon,
  PollIcon,
  SwapIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";
import { useStarredPlayers } from "@/lib/stars";
import { playerSlug } from "@/lib/seed-data";

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
    desc: "Personalized draft board for your league.",
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
    icon: <BarChartIcon size={18} />,
    title: "Draft Analytics",
    desc: "Review your draft and spot value picks.",
    href: "/analytics",
  },
  {
    icon: <FlaskIcon size={18} />,
    title: "Research Hub",
    desc: "Value leaders and positional depth.",
    href: "/research",
  },
  {
    icon: <ListCheckIcon size={18} />,
    title: "Start/Sit",
    desc: "Head-to-head player comparisons.",
    href: "/start-sit",
  },
  {
    icon: <ActivityIcon size={18} />,
    title: "Advanced Metrics",
    desc: "Usage data and efficiency across positions.",
    href: "/metrics",
  },
  {
    icon: <PollIcon size={18} />,
    title: "Community Polls",
    desc: "Vote and see the crowd consensus.",
    href: "/polls",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { starred, toggleStar } = useStarredPlayers();

  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [startingDemo, setStartingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (!cancelled) setLoadingLeague(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4" aria-busy="true" aria-label="Loading">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={24} />
          </span>
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  const startDemo = async () => {
    setError(null);
    setStartingDemo(true);
    try {
      const demo: LeagueConfig = {
        id: `lg_demo_${user.id}`,
        name: "Demo League",
        scoring: "ppr",
        teamCount: 12,
        draftPosition: 4,
        rounds: rosterSize(DEFAULT_ROSTER),
        roster: { ...DEFAULT_ROSTER },
        status: "pre_draft",
        pickTimerSeconds: 90,
        createdAt: Date.now(),
      };
      await persistLeague(user.id, demo);
      router.replace("/draft");
    } catch {
      setError("Couldn't start the demo league. Try again.");
      setStartingDemo(false);
    }
  };

  const firstName = user.name.split(" ")[0];

  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

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

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-20 pt-12">
        {/* ── Welcome ────────────────────────────────────── */}
        <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          What would you like to do?
        </p>

        {/* ── Starred players ────────────────────────────── */}
        {starred.length > 0 && (
          <section className="mt-8" aria-label="Starred players">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Starred players</h2>
              <span className="text-xs text-zinc-500">{starred.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {starred.map((name) => (
                <div
                  key={name}
                  className="glass flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm"
                >
                  <Link
                    href={`/players/${playerSlug(name)}`}
                    className="font-semibold text-zinc-100 transition hover:text-emerald-300"
                  >
                    {name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleStar(name)}
                    aria-label={`Remove ${name} from starred players`}
                    className="rounded-full p-1 text-zinc-500 transition hover:text-rose-300"
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Primary actions ─────────────────────────────── */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {/* Demo League */}
          <button
            onClick={startDemo}
            disabled={startingDemo}
            className="group glass-strong relative flex items-center gap-4 rounded-2xl p-5 text-left ring-1 ring-inset ring-emerald-500/30 transition hover:-translate-y-0.5 hover:ring-emerald-500/50"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
              <BoltIcon size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-white">Demo League</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                {startingDemo ? "Starting…" : "Jump into a pre-built PPR draft in seconds."}
              </p>
            </div>
            <ChevronRightIcon size={16} className="shrink-0 text-zinc-500 transition group-hover:text-emerald-300" />
          </button>

          {/* Your League */}
          <Link
            href={league ? "/draft" : "/onboarding"}
            className="group glass-strong flex items-center gap-4 rounded-2xl p-5 ring-1 ring-inset ring-zinc-700/60 transition hover:-translate-y-0.5 hover:ring-zinc-600"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-300 ring-1 ring-inset ring-zinc-700/60 transition group-hover:text-emerald-300">
              <UsersIcon size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-white">
                {league ? "Your League" : "Set Up a League"}
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                {loadingLeague ? (
                  <Skeleton className="inline-block h-3 w-32" />
                ) : league ? (
                  <>
                    {league.name} · {SCORING_LABELS[league.scoring]} · {league.teamCount} teams
                  </>
                ) : (
                  "Configure scoring, roster, and draft position."
                )}
              </p>
            </div>
            <ChevronRightIcon size={16} className="shrink-0 text-zinc-500 transition group-hover:text-emerald-300" />
          </Link>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300">
            {error}
          </p>
        )}

        {/* ── Tools ───────────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold text-zinc-300">Tools</h2>
          <div className="mt-3 divide-y divide-zinc-800/60 rounded-2xl ring-1 ring-inset ring-zinc-800/60">
            {TOOLS.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-800/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition group-hover:text-emerald-300">
                  {t.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-100 transition group-hover:text-white">
                    {t.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.desc}</p>
                </div>
                <ChevronRightIcon size={14} className="shrink-0 text-zinc-600 transition group-hover:text-emerald-400" />
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
