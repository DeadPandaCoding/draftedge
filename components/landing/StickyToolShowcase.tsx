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
    badge: "RANKINGS PREVIEW",
  },
  {
    id: "trades",
    title: "Compare trade value",
    body: "Put both sides of a deal in context with player values and projection data.",
    ctaLabel: "Launch Trade Analyzer",
    href: "/trade",
    badge: "TRADE PREVIEW",
  },
  {
    id: "mock",
    title: "Practice your draft plan",
    body: "Run a mock draft, test different picks, and see how your roster takes shape.",
    ctaLabel: "Start a Mock Draft",
    href: "/mock",
    badge: "MOCK PREVIEW",
  },
] as const;

const BOARD_ROWS = [
  { tier: "T1", rank: "01", name: "Ja'Marr Chase", team: "CIN", position: "WR", bye: "10", adp: "1.4", proj: "349.2" },
  { tier: "T1", rank: "02", name: "Bijan Robinson", team: "ATL", position: "RB", bye: "12", adp: "2.1", proj: "318.6" },
  { tier: "T2", rank: "03", name: "Jahmyr Gibbs", team: "DET", position: "RB", bye: "06", adp: "3.2", proj: "304.1" },
  { tier: "T2", rank: "04", name: "Puka Nacua", team: "LAR", position: "WR", bye: "08", adp: "4.4", proj: "289.4" },
  { tier: "T3", rank: "05", name: "Josh Allen", team: "BUF", position: "QB", bye: "07", adp: "22.1", proj: "287.6" },
];

const POSITION_BADGES: Record<string, string> = {
  WR: "bg-sky-500/15 text-sky-400",
  RB: "bg-emerald-500/15 text-emerald-400",
  QB: "bg-rose-500/15 text-rose-400",
  TE: "bg-amber-500/15 text-amber-400",
};

function ToolPreview({ id }: { id: (typeof SHOWCASE_ITEMS)[number]["id"] }) {
  if (id === "tiers") {
    return (
      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#080E0C]">
        <div className="grid grid-cols-[32px_28px_minmax(0,1fr)_32px_40px_52px] gap-1 border-b border-white/[0.07] px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[36px_30px_minmax(0,1fr)_36px_44px_58px] sm:px-3">
          <span>Tier</span><span>Rk</span><span>Player</span><span className="text-right">Bye</span><span className="text-right">ADP</span><span className="text-right">ROS Pts</span>
        </div>
        {BOARD_ROWS.map((player, index) => (
          <div key={player.name}>
            {index === 2 && <div className="border-y border-white/[0.07] bg-white/[0.025] px-3 py-1 font-mono text-[9px] font-semibold text-zinc-500">TIER DROP-OFF · T1 → T2</div>}
            {index === 4 && <div className="border-y border-white/[0.07] bg-white/[0.025] px-3 py-1 font-mono text-[9px] font-semibold text-zinc-500">TIER DROP-OFF · T2 → T3</div>}
            <div className="grid grid-cols-[32px_28px_minmax(0,1fr)_32px_40px_52px] items-center gap-1 border-b border-white/[0.05] px-2.5 py-2.5 last:border-0 sm:grid-cols-[36px_30px_minmax(0,1fr)_36px_44px_58px] sm:px-3">
              <span className="font-mono text-[10px] font-bold text-amber-300">{player.tier}</span>
              <span className="font-mono text-[10px] tabular-nums text-zinc-500">{player.rank}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={`shrink-0 rounded px-1 py-0.5 font-mono text-[9px] font-bold ${POSITION_BADGES[player.position]}`}>{player.position}</span>
                <span className="truncate text-[11px] font-semibold text-white sm:text-xs">{player.name}</span>
              </span>
              <span className="text-right font-mono text-[10px] tabular-nums text-zinc-400">{player.bye}</span>
              <span className="text-right font-mono text-[10px] tabular-nums text-zinc-400">{player.adp}</span>
              <span className="text-right font-mono text-[10px] font-semibold tabular-nums text-zinc-100">{player.proj}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "trades") {
    return (
      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#080E0C]">
        <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] border-b border-white/[0.07] px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:grid-cols-[minmax(0,1fr)_96px_96px]">
          <span>Package comparison</span><span className="text-right">Side A</span><span className="text-right">Side B</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] items-center border-b border-white/[0.06] px-3 py-3 sm:grid-cols-[minmax(0,1fr)_96px_96px]">
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded bg-sky-500/15 px-1.5 py-1 font-mono text-[9px] font-bold text-sky-400">WR</span>
            <span className="truncate text-xs font-semibold text-white">Amon-Ra St. Brown</span>
          </span>
          <span className="text-right font-mono text-xs font-semibold tabular-nums text-zinc-100">9,850</span>
          <span className="text-right font-mono text-xs tabular-nums text-zinc-600">—</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] items-center border-b border-white/[0.06] px-3 py-3 sm:grid-cols-[minmax(0,1fr)_96px_96px]">
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded bg-emerald-500/15 px-1.5 py-1 font-mono text-[9px] font-bold text-emerald-400">RB</span>
            <span className="truncate text-xs font-semibold text-white">Kyren Williams</span>
          </span>
          <span className="text-right font-mono text-xs tabular-nums text-zinc-600">—</span>
          <span className="text-right font-mono text-xs tabular-nums text-zinc-100">6,420</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] items-center px-3 py-3 sm:grid-cols-[minmax(0,1fr)_96px_96px]">
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded bg-amber-500/15 px-1.5 py-1 font-mono text-[9px] font-bold text-amber-400">PICK</span>
            <span className="truncate text-xs font-medium text-zinc-300">2027 2nd-round pick</span>
          </span>
          <span className="text-right font-mono text-xs tabular-nums text-zinc-600">—</span>
          <span className="text-right font-mono text-xs tabular-nums text-zinc-100">2,190</span>
        </div>
        <div className="border-t border-white/[0.07] bg-[#0B110F] px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[10px]">
            <span className="text-zinc-500">NET VALUE</span>
            <span className="font-bold text-[#FF3E9D]">SIDE A +1,240</span>
          </div>
          <div role="img" aria-label="Side A has a higher trade value" className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-[56%] rounded-full bg-[#FF3E9D]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-[#0B110F]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] bg-[#080E0C] px-3 py-2.5 sm:px-4">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex gap-1"><span className="size-2 rounded-full bg-zinc-700" /><span className="size-2 rounded-full bg-zinc-700" /><span className="size-2 rounded-full bg-zinc-700" /></span>
          <span className="truncate font-mono text-[10px] text-zinc-400 sm:text-xs">draftedge.vercel.app/mock</span>
        </span>
        <span className="rounded bg-white/[0.06] px-2 py-1 font-mono text-[9px] font-medium text-zinc-300 sm:text-[10px]">12-TEAM · PPR · SNAKE</span>
      </div>

      <div className="grid grid-cols-4 divide-x divide-white/[0.06] border-b border-white/[0.07] bg-[#090F0D]">
        {[
          { pick: "2.01 · TEAM 12", player: "A. St. Brown" },
          { pick: "2.02 · TEAM 11", player: "J. Gibbs" },
          { pick: "2.03 · TEAM 10", player: "P. Nacua" },
        ].map((pick) => (
          <div key={pick.pick} className="min-w-0 px-2 py-2 opacity-65 sm:px-3">
            <span className="block truncate font-mono text-[8px] text-zinc-500 sm:text-[9px]">{pick.pick}</span>
            <p className="mt-0.5 truncate text-[9px] font-medium text-zinc-300 sm:text-[10px]">{pick.player}</p>
          </div>
        ))}
        <div className="min-w-0 bg-[#FF3E9D]/10 px-2 py-2 sm:px-3">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate font-mono text-[8px] font-bold text-[#FF3E9D] sm:text-[9px]">2.04 · YOU</span>
            <span className="font-mono text-[9px] font-bold text-[#FF3E9D] sm:text-[10px]">YOUR PICK</span>
          </div>
          <p className="mt-0.5 truncate text-[9px] font-semibold text-white sm:text-[10px]">Pick 2.04</p>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:grid-cols-[1.35fr_1fr] sm:p-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-zinc-400 sm:text-[11px]">
            <span>Best Available</span><span className="font-mono text-[9px] text-zinc-500">ADP / PROJ</span>
          </div>
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-lg border border-white/[0.07] bg-[#080E0C]">
            {[
              { pos: "WR", name: "Garrett Wilson", team: "NYJ", adp: "14.2", proj: "276.4" },
              { pos: "RB", name: "Kyren Williams", team: "LAR", adp: "15.8", proj: "268.1" },
              { pos: "TE", name: "Sam LaPorta", team: "DET", adp: "18.1", proj: "234.9" },
            ].map((player, index) => (
              <div key={player.name} className="flex items-center justify-between gap-2 px-2.5 py-2.5 sm:px-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${POSITION_BADGES[player.pos]}`}>{player.pos}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-semibold text-white sm:text-xs">{player.name}</span>
                    <span className="block truncate font-mono text-[9px] text-zinc-500">{player.team} · ADP {player.adp}</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[10px] tabular-nums text-zinc-300">{player.proj}</span>
                  <span className={`rounded px-1.5 py-1 font-mono text-[9px] font-bold ${index === 0 ? "bg-emerald-500 text-zinc-950" : "bg-white/[0.06] text-zinc-300"}`}>Draft</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-zinc-400 sm:text-[11px]">
            <span>Your Lineup</span><span className="font-mono text-[9px] text-zinc-500">2 / 15</span>
          </div>
          <div className="space-y-1 rounded-lg border border-white/[0.07] bg-[#080E0C] p-2">
            {[
              { slot: "QB", player: "Empty", badge: "text-rose-400", filled: false },
              { slot: "RB1", player: "Bijan Robinson", badge: "text-emerald-400", filled: true },
              { slot: "RB2", player: "Empty", badge: "text-emerald-400", filled: false },
              { slot: "WR1", player: "Ja'Marr Chase", badge: "text-sky-400", filled: true },
              { slot: "WR2", player: "Pick 2.04 →", badge: "text-sky-400", active: true },
              { slot: "TE", player: "Empty", badge: "text-amber-400", filled: false },
              { slot: "FLEX", player: "Empty", badge: "text-violet-400", filled: false },
            ].map((slot) => (
              <div key={slot.slot} className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 ${slot.active ? "border border-dashed border-[#FF3E9D]/40 bg-[#FF3E9D]/[0.05]" : slot.filled ? "bg-white/[0.04]" : "bg-white/[0.025]"}`}>
                <span className={`font-mono text-[9px] font-bold ${slot.badge}`}>{slot.slot}</span>
                <span className={`truncate text-right text-[9px] ${slot.active ? "font-mono font-semibold text-[#FF3E9D]" : slot.filled ? "font-medium text-zinc-200" : "text-zinc-600"}`}>{slot.player}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
              className={`scroll-mt-28 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1412] ${item.id === "mock" ? "p-0" : "p-5 sm:p-7"}`}
            >
              {item.id !== "mock" && (
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <span className="truncate font-mono text-[11px] text-zinc-500">draftedge.vercel.app{item.href}</span>
                  <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-emerald-300">
                    {item.badge}
                  </span>
                </div>
              )}
              <ToolPreview id={item.id} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
