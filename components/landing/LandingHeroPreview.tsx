"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ChevronRightIcon,
  ClockIcon,
  ListCheckIcon,
  SwapIcon,
} from "@/components/icons";

export type PreviewPlayer = {
  name: string;
  position: string;
  team: string;
  projection: number;
};

export type TradePreviewPlayer = PreviewPlayer & { value: number };

export type HeroPreviewData = {
  scoring: string;
  trade: {
    sideA: TradePreviewPlayer[];
    sideB: TradePreviewPlayer[];
    valueA: number;
    valueB: number;
    grade: string;
    gradeLabel: string;
    net: number;
    tone: "positive" | "negative" | "neutral";
  };
  mock: {
    picks: Array<PreviewPlayer & { pick: string }>;
    available: PreviewPlayer[];
    onClock: string;
  };
  startSit: {
    start: PreviewPlayer;
    sit: PreviewPlayer;
    gap: number;
    verdict: string;
    confidence: string;
    startPct: number;
  };
  rankings: Array<PreviewPlayer & { rank: number; tier: number; adp: number }>;
};

const TABS = [
  { id: "trade", label: "Trade", icon: SwapIcon, href: "/trade", cta: "Open Trade Analyzer" },
  { id: "mock", label: "Mock Draft", icon: ClockIcon, href: "/mock", cta: "Enter the draft room" },
  { id: "start-sit", label: "Start/Sit", icon: ListCheckIcon, href: "/start-sit", cta: "Compare your lineup" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const POSITION_STYLES: Record<string, string> = {
  QB: "border-rose-400/25 bg-rose-500/10 text-rose-300",
  RB: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  WR: "border-sky-400/25 bg-sky-500/10 text-sky-300",
  TE: "border-amber-400/25 bg-amber-500/10 text-amber-300",
  K: "border-violet-400/25 bg-violet-500/10 text-violet-300",
  DEF: "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",
};

function positionClass(position: string) {
  return POSITION_STYLES[position] ?? "border-white/10 bg-white/[0.05] text-zinc-300";
}

function points(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function value(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function TabIcon({ id }: { id: TabId }) {
  const found = TABS.find((tab) => tab.id === id);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon size={14} />;
}

function TradeSide({
  label,
  players,
  total,
  tone,
}: {
  label: string;
  players: TradePreviewPlayer[];
  total: number;
  tone: "emerald" | "neutral";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.07] bg-[#07100D] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</span>
        <span className={`font-mono text-sm font-bold tabular-nums ${tone === "emerald" ? "text-emerald-300" : "text-zinc-200"}`}>
          {value(total)}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {players.map((player) => (
          <div key={player.name} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white/[0.035] px-2 py-1.5">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[8px] font-bold ${positionClass(player.position)}`}>
                {player.position}
              </span>
              <span className="truncate text-[11px] font-semibold text-zinc-100">{player.name}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400">{value(player.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradePanel({ data, scoring }: { data: HeroPreviewData["trade"]; scoring: string }) {
  const total = Math.max(0, data.valueA + data.valueB);
  const share = total > 0 ? Math.min(100, Math.max(0, Math.round((data.valueA / total) * 100))) : 50;
  const toneClass =
    data.tone === "positive"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
      : data.tone === "negative"
        ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-300"
        : "border-white/15 bg-white/[0.05] text-zinc-200";
  const net = `${data.net >= 0 ? "+" : ""}${value(data.net)}`;

  return (
    <div className="landing-panel-in p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">Trade Analyzer</p>
          <h3 className="mt-1 text-base font-bold tracking-tight text-white sm:text-lg">Two players in. One star out.</h3>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">{scoring}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`flex size-14 items-center justify-center rounded-2xl border font-display text-2xl font-extrabold tabular-nums ${toneClass}`}>
            {data.grade}
          </span>
          <span className="mt-1.5 block max-w-24 truncate font-mono text-[9px] font-semibold text-zinc-400">{data.gradeLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <TradeSide label="You get" players={data.sideA} total={data.valueA} tone="emerald" />
        <TradeSide label="You send" players={data.sideB} total={data.valueB} tone="neutral" />
      </div>

      <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Net value</span>
          <span className={`font-mono text-xs font-bold tabular-nums ${data.tone === "negative" ? "text-rose-300" : "text-emerald-300"}`}>
            {net} for you
          </span>
        </div>
        <div
          role="img"
          aria-label={`Your package holds ${share}% of the combined trade value`}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
        >
          <span
            className={`block h-full rounded-full ${data.tone === "negative" ? "bg-rose-400" : "bg-emerald-400"}`}
            style={{ width: `${share}%` }}
          />
        </div>
      </div>

      <Link
        href="/trade"
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
      >
        Open Trade Analyzer <ChevronRightIcon size={14} />
      </Link>
    </div>
  );
}

function MockPanel({ data }: { data: HeroPreviewData["mock"] }) {
  return (
    <div className="landing-panel-in p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">Mock Draft</p>
          <h3 className="mt-1 text-base font-bold tracking-tight text-white sm:text-lg">The board, before it gets away.</h3>
          <p className="mt-1 font-mono text-[10px] text-zinc-500">12 teams · PPR · snake</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#07100D] px-2 py-1 font-mono text-[9px] text-zinc-400">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Room live
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#07100D]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Round 1</span>
          <span className="font-mono text-[10px] font-bold tabular-nums text-zinc-300">Pick {data.onClock}</span>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
          {data.picks.map((player) => (
            <div key={player.pick} className="min-w-0 bg-[#0A1511] px-2 py-2 sm:px-2.5">
              <span className="block font-mono text-[8px] text-zinc-500">{player.pick}</span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold text-zinc-200">{player.name}</span>
              <span className={`mt-1 inline-flex rounded border px-1 py-0.5 font-mono text-[8px] font-bold ${positionClass(player.position)}`}>
                {player.position} · {player.team}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#FF3E9D]/20 bg-[#FF3E9D]/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] font-bold text-[#FF8BC4]">{data.onClock} · YOU</span>
            <span className="rounded border border-[#FF3E9D]/25 bg-[#FF3E9D]/10 px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#FF8BC4]">ON THE CLOCK</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Three names stand above the rest of the board.</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {data.available.map((player, index) => (
          <div key={player.name} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="w-4 shrink-0 font-mono text-[9px] text-zinc-600">{index + 1}</span>
              <span className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[8px] font-bold ${positionClass(player.position)}`}>
                {player.position}
              </span>
              <span className="truncate text-[11px] font-semibold text-zinc-100">{player.name}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400">{points(player.projection)}</span>
          </div>
        ))}
      </div>

      <Link
        href="/mock"
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
      >
        Enter the draft room <ChevronRightIcon size={14} />
      </Link>
    </div>
  );
}

function StartSitPanel({ data }: { data: HeroPreviewData["startSit"] }) {
  return (
    <div className="landing-panel-in p-4 sm:p-5">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">Start / Sit</p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-white sm:text-lg">Make the call with a number behind it.</h3>
        <p className="mt-1 font-mono text-[10px] text-zinc-500">Projection model · PPR</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="min-w-0 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.055] p-3">
          <span className="inline-flex rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[8px] font-bold text-emerald-300">START</span>
          <p className="mt-2 truncate text-sm font-bold text-white">{data.start.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{data.start.position} · {data.start.team}</p>
          <p className="mt-4 font-display text-3xl font-extrabold tabular-nums tracking-tight text-emerald-300">{points(data.start.projection)}</p>
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-500">Season proj</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <span className="inline-flex rounded border border-rose-400/20 bg-rose-400/[0.07] px-1.5 py-0.5 font-mono text-[8px] font-bold text-rose-300">SIT</span>
          <p className="mt-2 truncate text-sm font-bold text-zinc-200">{data.sit.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{data.sit.position} · {data.sit.team}</p>
          <p className="mt-4 font-display text-3xl font-extrabold tabular-nums tracking-tight text-zinc-400">{points(data.sit.projection)}</p>
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-600">Season proj</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#07100D] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Projected edge</span>
          <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-300">+{points(data.gap)} pts</span>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="h-full bg-emerald-400" style={{ width: `${data.startPct}%` }} />
          <span className="h-full bg-white/15" style={{ width: `${100 - data.startPct}%` }} />
        </div>
        <p className="mt-2.5 text-xs font-semibold text-zinc-100">{data.verdict}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500">{data.confidence}</p>
      </div>

      <Link
        href="/start-sit"
        className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
      >
        Compare your lineup <ChevronRightIcon size={14} />
      </Link>
    </div>
  );
}

export function LandingHeroPreview({ data }: { data: HeroPreviewData }) {
  const [activeTab, setActiveTab] = useState<TabId>("trade");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  function handleTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    let next = index;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="relative mx-auto w-full max-w-[650px] lg:max-w-none">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-8 top-16 size-56 rounded-full bg-emerald-500/[0.14] blur-[90px]" />
        <div className="absolute -right-6 bottom-16 size-52 rounded-full bg-[#FF3E9D]/[0.12] blur-[100px]" />
      </div>

      <div
        aria-hidden="true"
        className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-emerald-400/25 via-white/[0.04] to-[#FF3E9D]/20"
      />
      <div className="relative overflow-hidden rounded-[27px] border border-white/[0.07] bg-[#0A1511] shadow-[0_35px_100px_-35px_rgba(0,0,0,0.95),0_20px_60px_-35px_rgba(16,185,129,0.45)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#07100D] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-1.5 rounded-full bg-zinc-600" />
              <span className="size-1.5 rounded-full bg-emerald-400/70" />
              <span className="size-1.5 rounded-full bg-[#FF3E9D]/70" />
            </span>
            <span className="truncate font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              DraftEdge · command center
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-300">
            <span className="size-1 animate-pulse rounded-full bg-emerald-400" /> Live preview
          </span>
        </div>

        <div role="tablist" aria-label="DraftEdge tool previews" className="flex border-b border-white/[0.07] bg-[#0A1511] px-2 pt-2">
          {TABS.map((tab, index) => {
            const selected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`hero-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`hero-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`relative flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 text-[11px] font-semibold transition sm:text-xs ${
                  selected
                    ? "bg-white/[0.055] text-white"
                    : "text-zinc-500 hover:bg-white/[0.025] hover:text-zinc-300"
                }`}
              >
                <TabIcon id={tab.id} />
                <span className="truncate">{tab.label}</span>
                {selected && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        <div
          id={`hero-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`hero-tab-${activeTab}`}
          className="min-h-[430px] min-w-0 sm:min-h-[410px]"
        >
          {activeTab === "trade" && <TradePanel data={data.trade} scoring={data.scoring} />}
          {activeTab === "mock" && <MockPanel data={data.mock} />}
          {activeTab === "start-sit" && <StartSitPanel data={data.startSit} />}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-[#07100D] px-4 py-2.5">
          <span className="truncate font-mono text-[9px] text-zinc-500">Real 2026 player data · PPR</span>
          <Link href={active.href} className="inline-flex shrink-0 items-center gap-1 font-mono text-[9px] font-bold text-emerald-300 hover:text-emerald-200">
            {active.cta} <ChevronRightIcon size={11} />
          </Link>
        </div>
      </div>

      <div aria-hidden="true" className="absolute -bottom-4 -left-3 hidden rotate-[-3deg] rounded-lg border border-emerald-400/20 bg-[#0D1B16] px-3 py-2 shadow-xl sm:block">
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">Grade locked</span>
        <span className="ml-2 font-display text-sm font-extrabold text-emerald-300">{data.trade.grade}</span>
      </div>
    </div>
  );
}
