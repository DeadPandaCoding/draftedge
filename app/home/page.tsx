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
    icon: <SwapIcon size={20} />,
    title: "Trade Analyzer",
    desc: "Compare both sides of a trade and see who comes out ahead.",
    href: "/trade",
  },
  {
    icon: <TableIcon size={20} />,
    title: "Cheat Sheets",
    desc: "Build and export a personalized cheat sheet tuned to your league.",
    href: "/cheatsheet",
  },
  {
    icon: <ClockIcon size={20} />,
    title: "Mock Drafts",
    desc: "Practice against realistic pick simulations before the real thing.",
    href: "/mock",
  },
  {
    icon: <ArrowUpIcon size={20} />,
    title: "Player Rankings",
    desc: "Browse projections, tiers, and ADP across every position.",
    href: "/rankings",
  },
  {
    icon: <BarChartIcon size={20} />,
    title: "Draft Analytics",
    desc: "Review your draft, spot value picks, and grade your team.",
    href: "/analytics",
  },
  {
    icon: <FlaskIcon size={20} />,
    title: "Research Hub",
    desc: "Value leaders, positional depth, and tier breakdowns at a glance.",
    href: "/research",
  },
  {
    icon: <ListCheckIcon size={20} />,
    title: "Start/Sit Optimizer",
    desc: "Compare two players head-to-head and see your best starting lineup.",
    href: "/start-sit",
  },
  {
    icon: <ActivityIcon size={20} />,
    title: "Advanced Metrics",
    desc: "Value-over-replacement and efficiency, comparable across positions.",
    href: "/metrics",
  },
  {
    icon: <PollIcon size={20} />,
    title: "Community Polls",
    desc: "Vote on trades and breakout calls, and see the crowd consensus.",
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

  // Guards: must be signed in to see the home hub.
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  // Load the user's existing league (cloud or local demo storage).
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
      {/* Kinetic grid background — warps toward the pointer, ripples on click */}
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
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

      {/* ── Main hub ─────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">
            Welcome, {firstName}!
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Pick a tool to get started — more are on the way.</p>
        </div>

        {starred.length > 0 && (
          <section className="mb-8" aria-label="Starred players">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Starred players</h2>
              <span className="text-xs text-zinc-500">{starred.length} saved</span>
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* ── Demo League (primary) ─────────────────────────── */}
          <div className="glass-strong relative flex flex-col overflow-hidden rounded-2xl p-6 ring-1 ring-inset ring-emerald-500/30">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                <BoltIcon size={20} />
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Try it now
              </span>
            </div>
            <h2 className="relative mt-4 text-lg font-bold text-white">Demo League</h2>
            <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">
              Jump straight into a pre-configured PPR league and explore the draft room in seconds.
            </p>
            <button
              onClick={startDemo}
              disabled={startingDemo}
              className="btn-glass-primary relative mt-5 w-full rounded-xl py-3 text-sm font-bold transition"
            >
              {startingDemo ? "Starting…" : "Start the Demo"}
            </button>
          </div>

          {/* ── Your League ───────────────────────────────────── */}
          <div className="glass-strong flex flex-col rounded-2xl p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-300 ring-1 ring-inset ring-zinc-700/60">
              <UsersIcon size={20} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-white">
              {league ? "Your League" : "Create a League"}
            </h2>
            {loadingLeague ? (
              <div className="mt-3 flex-1 space-y-2.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : league ? (
              <>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">
                  {league.name} · {SCORING_LABELS[league.scoring]} · {league.teamCount}-team · pick{" "}
                  {league.draftPosition}
                </p>
                <Link
                  href="/draft"
                  className="btn-glass-primary mt-5 w-full rounded-xl py-3 text-center text-sm font-bold transition"
                >
                  Open Draft Room
                </Link>
                <Link
                  href="/onboarding"
                  className="mt-2 w-full rounded-xl py-2 text-center text-xs font-semibold text-zinc-400 transition hover:text-white"
                >
                  Edit league config
                </Link>
              </>
            ) : (
              <>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">
                  Set up your scoring, roster, and draft position to build a custom cheat sheet.
                </p>
                <Link
                  href="/onboarding"
                  className="glass glass-hover mt-5 w-full rounded-xl py-3 text-center text-sm font-semibold text-zinc-200 transition"
                >
                  Set Up League
                </Link>
              </>
            )}
          </div>

          {/* ── Tools ─────────────────────────────────────────── */}
          {TOOLS.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="glass-strong group flex flex-col rounded-2xl p-6 transition hover:-translate-y-0.5 hover:border-emerald-500/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-300 ring-1 ring-inset ring-zinc-700/60 transition group-hover:text-emerald-300">
                {t.icon}
              </span>
              <h2 className="mt-4 text-lg font-bold text-white">{t.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">{t.desc}</p>
              <span className="mt-5 text-sm font-semibold text-emerald-400 transition group-hover:text-emerald-300">
                Open →
              </span>
            </Link>
          ))}
        </div>

        {error && (
          <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-300">
            {error}
          </p>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-emerald-400/10 py-5 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
      </footer>
    </div>
  );
}
