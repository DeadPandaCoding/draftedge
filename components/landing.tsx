import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpIcon,
  ChevronRightIcon,
  ClockIcon,
  ListCheckIcon,
  SwapIcon,
  TableIcon,
} from "@/components/icons";
import { SiteHeader } from "@/components/ui/header";
import { Reveal } from "@/components/ui/reveal";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LandingPlayerLookup } from "@/components/landing/LandingPlayerLookup";
import { LandingPrimaryCta } from "@/components/landing/LandingPrimaryCta";
import { SpotlightStages } from "@/components/landing/SpotlightStages";
import { buildSeedPlayers, playerSlug } from "@/lib/seed-data";
import { buildTradeValues } from "@/lib/trade-value";

const GITHUB_URL = "https://github.com/DeadPandaCoding/draftedge";

const QUICK_LAUNCH = [
  { label: "Grade a trade", href: "/trade", icon: <SwapIcon size={13} /> },
  { label: "Practice a mock", href: "/mock", icon: <ClockIcon size={13} /> },
  { label: "Set a lineup", href: "/start-sit", icon: <ListCheckIcon size={13} /> },
] as const;

const TOOL_ROWS: Array<{
  n: string;
  title: string;
  body: string;
  meta: string;
  href: string;
  icon: ReactNode;
}> = [
  {
    n: "01",
    title: "Trade Analyzer",
    body: "Put both sides of a deal on the same value scale and get a grade you can defend.",
    meta: "Package values · Letter grades",
    href: "/trade",
    icon: <SwapIcon size={18} />,
  },
  {
    n: "02",
    title: "Mock Draft",
    body: "Draft against position-aware bots and practice the runs before your league starts one.",
    meta: "12-team rooms · Configurable slots",
    href: "/mock",
    icon: <ClockIcon size={18} />,
  },
  {
    n: "03",
    title: "Start/Sit",
    body: "Compare projections, matchup context, and lineup alternatives for the close calls.",
    meta: "Weekly calls · Roster-aware",
    href: "/start-sit",
    icon: <ListCheckIcon size={18} />,
  },
  {
    n: "04",
    title: "Cheat Sheets",
    body: "Build a printable board with tiers, ADP, and projections tuned to your scoring.",
    meta: "PPR · Half-PPR · Standard",
    href: "/cheatsheet",
    icon: <TableIcon size={18} />,
  },
  {
    n: "05",
    title: "Rankings",
    body: "Scan the full 2026 player board by projection, position, tier, and draft cost.",
    meta: "Full 2026 board · Rank, tier, ADP",
    href: "/rankings",
    icon: <ArrowUpIcon size={18} />,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your league",
    body: "Pull scoring, rosters, and draft slots from Sleeper or ESPN.",
  },
  {
    n: "02",
    title: "Set your board",
    body: "Rankings, tiers, and values snap to your league's exact scoring rules.",
  },
  {
    n: "03",
    title: "Make the call",
    body: "Grade a trade, run a mock, or settle a lineup decision before kickoff.",
  },
] as const;

export function LandingPage() {
  const players = buildSeedPlayers("ppr");
  const tradeValues = buildTradeValues(players, 12);
  const board = players
    .filter((player) => player.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#09090B] text-[#D4D4D8]">
      <SmoothScroll />
      <SiteHeader variant="marketing" />

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.08] bg-[#09090B]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundSize: "72px 72px",
                maskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 92%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 92%)",
              }}
            />
            <div className="absolute left-[7%] top-0 h-44 w-px bg-gradient-to-b from-emerald-400/40 to-transparent" />
            <div className="absolute right-[7%] top-32 hidden h-24 w-px bg-[#FF3E9D]/45 lg:block" />
            <div className="absolute right-[7%] top-32 hidden h-px w-24 bg-[#FF3E9D]/25 lg:block" />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
              <div className="min-w-0 max-w-xl">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-8 bg-[#FF3E9D]" />
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">
                    2026 fantasy football
                  </p>
                </div>

                <h1 className="mt-7 font-display text-[clamp(2.15rem,8.2vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.06em] text-white">
                  <span className="block">
                    Value the <span className="text-emerald-300">board.</span>
                  </span>
                  <span className="mt-1 block">
                    Make the <span className="text-[#FF3E9D]">call.</span>
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
                  Rankings, trade values, mock drafts, and start/sit calls built on one scoring-aware player board.
                </p>

                <div className="mt-8">
                  <LandingPrimaryCta
                    label="Sync Your League"
                    className="w-full min-[430px]:w-auto"
                  />
                </div>

                <div role="group" aria-label="Tool shortcuts" className="mt-8 flex flex-wrap gap-2">
                  {QUICK_LAUNCH.map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      className="group inline-flex min-h-9 items-center gap-2 border border-white/[0.1] bg-[#111214] px-3 py-2 text-[11px] font-semibold text-[#D4D4D8] transition hover:border-emerald-400/35 hover:bg-[#151719] hover:text-white"
                    >
                      <span className="text-[#71717A] transition group-hover:text-emerald-300">
                        {chip.icon}
                      </span>
                      {chip.label}
                      <ChevronRightIcon
                        size={11}
                        className="text-[#52525B] transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
                      />
                    </Link>
                  ))}
                </div>
              </div>

              <Reveal delay={120} className="min-w-0">
                <LandingPlayerLookup />
              </Reveal>
            </div>
          </div>
        </section>

        <SpotlightStages />

        <section id="features" className="scroll-mt-20 border-b border-white/[0.08] bg-[#09090B]">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
            <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
              One board. Five ways to use it.
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
              <Reveal delay={80}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TOOL_ROWS.map((tool, index) => (
                    <Link
                      key={tool.n}
                      href={tool.href}
                      className={`group relative flex min-h-[210px] flex-col border border-white/[0.12] bg-[#111214] p-5 transition-colors hover:border-white/[0.22] hover:bg-[#151719] ${
                        index === TOOL_ROWS.length - 1 ? "sm:col-span-2 sm:min-h-[170px]" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-0 h-[3px] w-12 ${
                          index % 2 === 1 ? "bg-[#FF3E9D]" : "bg-emerald-400"
                        }`}
                      />
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex size-8 items-center justify-center border border-white/[0.08] bg-[#0B0B0D] text-emerald-300">
                          {tool.icon}
                        </span>
                        <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-[#52525B]">
                          {tool.n}
                        </span>
                      </div>
                      <h3 className="mt-7 text-lg font-bold tracking-tight text-white">
                        {tool.title}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
                        {tool.body}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/[0.07] pt-4">
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#52525B]">
                          {tool.meta}
                        </span>
                        <ChevronRightIcon
                          size={15}
                          className="shrink-0 text-[#3F3F46] transition group-hover:translate-x-0.5 group-hover:text-emerald-300"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>

              <aside aria-label="Top of the 2026 PPR board" className="min-w-0">
                <div className="border border-white/[0.1] bg-[#111214]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#A1A1AA]">
                      Top of the board
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#71717A]">
                      PPR
                    </span>
                  </div>

                  <div className="grid grid-cols-[22px_minmax(0,1fr)_42px_42px] gap-2 border-b border-white/[0.08] px-4 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#52525B]">
                    <span>#</span>
                    <span>Player</span>
                    <span className="text-right">Proj</span>
                    <span className="text-right">Val</span>
                  </div>

                  {board.map((player, index) => (
                    <Link
                      key={player.id}
                      href={`/players/${playerSlug(player.name)}`}
                      className="grid grid-cols-[22px_minmax(0,1fr)_42px_42px] items-center gap-2 border-b border-white/[0.06] px-4 py-3 transition last:border-b-0 hover:bg-white/[0.035]"
                    >
                      <span className="font-mono text-[9px] tabular-nums text-[#52525B]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">
                          {player.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                          {player.position} · {player.team}
                        </span>
                      </span>
                      <span className="text-right font-mono text-[10px] tabular-nums text-[#A1A1AA]">
                        {player.projection.toFixed(0)}
                      </span>
                      <span className="text-right font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
                        {(tradeValues.get(player.id) ?? 0).toFixed(1)}
                      </span>
                    </Link>
                  ))}

                  <div className="border-t border-white/[0.08] px-4 py-3">
                    <Link
                      href="/rankings"
                      className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#A1A1AA] transition hover:text-white"
                    >
                      View all rankings <ChevronRightIcon size={11} />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b border-white/[0.08] bg-[#0B0B0D]">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
            <h2 className="max-w-xl font-display text-3xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
              Three steps. No spreadsheet.
            </h2>

            <Reveal delay={80}>
              <div className="relative mt-12 max-w-4xl md:mt-16">
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 left-[3px] top-4 w-px bg-white/[0.1] md:left-1/2 md:-translate-x-1/2"
                />
                <div className="space-y-3 md:space-y-0">
                  {STEPS.map((step, index) => {
                    const right = index === 1;
                    const accent = right ? "bg-[#FF3E9D]" : "bg-emerald-400";
                    return (
                      <div key={step.n} className="relative md:grid md:grid-cols-2 md:gap-16">
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-7 z-10 size-2 border-2 border-[#0B0B0D] md:left-1/2 md:-translate-x-1/2 ${accent}`}
                        />
                        <div
                          className={`ml-7 py-2 md:ml-0 md:py-5 ${
                            right
                              ? "md:col-start-2 md:mr-auto md:pl-10"
                              : "md:col-start-1 md:ml-auto md:pr-10"
                          }`}
                        >
                          <div className="relative w-full max-w-md border border-white/[0.12] bg-[#111214] p-5">
                            <span
                              aria-hidden="true"
                              className={`absolute left-0 top-0 h-[3px] w-12 ${accent}`}
                            />
                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#71717A]">
                              Step {step.n}
                            </p>
                            <h3 className="mt-4 text-lg font-bold tracking-tight text-white">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                              {step.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-white/[0.08] bg-[#09090B]">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="relative border border-white/[0.1] bg-[#111214] px-6 py-10 sm:px-10 sm:py-12">
              <span aria-hidden="true" className="absolute left-0 top-0 h-px w-32 bg-[#FF3E9D]" />

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
                <div>
                  <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-[1.03] tracking-[-0.045em] text-white sm:text-4xl">
                    Get the board ready before the clock starts.
                  </h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                  <Link
                    href="/cheatsheet"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[2px] bg-emerald-500 px-6 py-3.5 text-sm font-bold text-[#022C22] transition-colors hover:bg-emerald-400 active:bg-emerald-600 sm:w-auto"
                  >
                    Build a cheat sheet <ChevronRightIcon size={16} />
                  </Link>
                  <Link
                    href="/rankings"
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/[0.12] bg-transparent px-5 py-3.5 text-sm font-semibold text-[#D4D4D8] transition hover:border-white/[0.22] hover:bg-white/[0.04] hover:text-white"
                  >
                    Open the rankings <ChevronRightIcon size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-white/[0.08] bg-[#09090B]">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#71717A]">
                <li>
                  <Link href="/" className="transition hover:text-white">Home</Link>
                </li>
                <li>
                  <a href="#features" className="transition hover:text-white">Features</a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    Open source
                  </a>
                </li>
                <li>
                  <Link href="/signin" className="transition hover:text-white">Sign in</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Contact Us</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-[#71717A]">
                <li>
                  <a href="mailto:anshtolat@gmail.com" className="transition hover:text-white">
                    anshtolat@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
                <li>Not affiliated with the NFL or Sleeper</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.08]">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-5 text-xs text-[#71717A] sm:flex-row sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} DraftEdge · All rights reserved.</span>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link href="/privacy" className="transition hover:text-[#D4D4D8]">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-[#D4D4D8]">Terms of Service</Link>
              <Link href="/cookies" className="transition hover:text-[#D4D4D8]">Cookie Settings</Link>
              <Link href="/accessibility" className="transition hover:text-[#D4D4D8]">Accessibility</Link>
              <Link href="/disclaimers" className="transition hover:text-[#D4D4D8]">Disclaimers</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
