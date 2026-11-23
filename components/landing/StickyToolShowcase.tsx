"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SHOWCASE_ITEMS = [
  {
    id: "tiers",
    title: "Draft with tier drop-offs",
    body: "Spot position runs and compare scoring-aware rankings before your next pick.",
    ctaLabel: "Open Cheat Sheets",
    href: "/cheatsheet",
    badge: "LIVE BOARD",
  },
  {
    id: "trades",
    title: "Compare trade value",
    body: "Put both sides of a deal in context with player values and projection data.",
    ctaLabel: "Launch Trade Analyzer",
    href: "/trade",
    badge: "TRADE TOOL",
  },
  {
    id: "mock",
    title: "Practice your draft plan",
    body: "Run a mock draft, test different picks, and see how your roster takes shape.",
    ctaLabel: "Start a Mock Draft",
    href: "/mock",
    badge: "MOCK DRAFT",
  },
] as const;

const BOARD_ROWS = [
  { tier: "T1", name: "Ja'Marr Chase", team: "CIN", position: "WR", rank: "01" },
  { tier: "T1", name: "Bijan Robinson", team: "ATL", position: "RB", rank: "02" },
  { tier: "T2", name: "Jahmyr Gibbs", team: "DET", position: "RB", rank: "03" },
  { tier: "T2", name: "Puka Nacua", team: "LAR", position: "WR", rank: "04" },
];

function ToolPreview({ id }: { id: (typeof SHOWCASE_ITEMS)[number]["id"] }) {
  if (id === "tiers") {
    return (
      <div className="space-y-2.5">
        {BOARD_ROWS.map((player) => (
          <div
            key={player.name}
            className="grid grid-cols-[40px_minmax(0,1fr)_36px_30px] items-center gap-3 rounded-xl border border-white/[0.06] bg-[#080E0C] px-3 py-3 sm:px-4"
          >
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-center font-mono text-xs font-bold text-emerald-300">
              {player.tier}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{player.name}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">{player.team}</span>
            </span>
            <span className="text-right text-xs font-semibold text-zinc-300">{player.position}</span>
            <span className="text-right font-mono text-xs tabular-nums text-zinc-500">{player.rank}</span>
          </div>
        ))}
        <p className="pt-1 text-right text-[11px] text-zinc-500">Example board · rankings vary by scoring</p>
      </div>
    );
  }

  if (id === "trades") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#080E0C] p-4">
            <p className="text-xs font-medium text-zinc-500">Side A receives</p>
            <p className="mt-3 text-sm font-semibold text-white">Amon-Ra St. Brown</p>
            <p className="mt-1 text-xs text-zinc-500">WR · DET</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#080E0C] p-4">
            <p className="text-xs font-medium text-zinc-500">Side B receives</p>
            <p className="mt-3 text-sm font-semibold text-white">Kyren Williams</p>
            <p className="mt-1 text-xs text-zinc-500">RB · LAR</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FF3E9D]/25 bg-[#FF3E9D]/[0.08] px-4 py-3">
          <span className="text-xs font-semibold text-zinc-200">Trade breakdown</span>
          <span className="font-mono text-[11px] font-bold text-[#FF3E9D]">COMPARE BOTH SIDES</span>
        </div>
        <p className="text-right text-[11px] text-zinc-500">Sample offer</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#080E0C] px-4 py-3">
        <span className="text-xs font-semibold text-zinc-200">12-team · PPR</span>
        <span className="font-mono text-xs tabular-nums text-zinc-500">ROUND 02 · PICK 04</span>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#080E0C] p-4">
        <p className="text-xs font-medium text-zinc-500">Your roster so far</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["WR", "Ja'Marr Chase"],
            ["RB", "Bijan Robinson"],
          ].map(([position, player]) => (
            <span key={position} className="rounded-lg border border-white/[0.06] bg-[#0D1412] px-3 py-2 text-xs">
              <span className="mr-2 font-mono font-bold text-emerald-300">{position}</span>
              <span className="font-medium text-zinc-200">{player}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-right text-[11px] text-zinc-500">Example draft room</p>
    </div>
  );
}

export function StickyToolShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleCards = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2) -
              Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2),
          );
        const index = Number(visibleCards[0]?.target.getAttribute("data-index"));
        if (Number.isInteger(index) && index >= 0) setActiveIdx(index);
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0.1 },
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  function scrollToCard(index: number) {
    setActiveIdx(index);
    cardRefs.current[index]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "center",
    });
  }

  return (
    <section id="features" aria-labelledby="showcase-heading" className="scroll-mt-20 border-b border-white/[0.07]">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">DraftEdge tools</p>
          <h2 id="showcase-heading" className="mt-3 max-w-lg font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
            Better decisions, from the first pick to the final offer.
          </h2>

          <div className="mt-9 space-y-5">
            {SHOWCASE_ITEMS.map((item, index) => {
              const isActive = index === activeIdx;
              return (
                <div key={item.id} className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-45"}`}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => scrollToCard(index)}
                    className="group flex min-h-11 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
                  >
                    <span aria-hidden="true" className={`h-0.5 transition-all duration-300 ${isActive ? "w-5 bg-[#FF3E9D]" : "w-0 bg-transparent"}`} />
                    <span className={`font-display text-lg font-bold tracking-tight transition-colors sm:text-xl ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                      {item.title}
                    </span>
                  </button>
                  {isActive && (
                    <div className="mt-2 pl-8">
                      <p className="max-w-md text-sm leading-relaxed text-zinc-400">{item.body}</p>
                      <Link href={item.href} className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
                        {item.ctaLabel}<span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8 lg:space-y-16">
          {SHOWCASE_ITEMS.map((item, index) => (
            <article
              key={item.id}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              data-index={index}
              aria-label={`${item.title} preview`}
              className="scroll-mt-28 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-5 sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <span className="truncate font-mono text-[11px] text-zinc-500">draftedge.app{item.href}</span>
                <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-emerald-300">
                  {item.badge}
                </span>
              </div>
              <ToolPreview id={item.id} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
