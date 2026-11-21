"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
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
    icon: <BarChartIcon size={18} />,
    title: "Draft Analytics",
    desc: "Review a draft and spot value picks.",
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
    desc: "Compare players and build a strong lineup.",
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

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

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
          Choose a tool to get started.
        </p>

        <section className="mt-10">
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
