"use client";

import Link from "next/link";
import { DemoPlayback } from "./DemoPlayback";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { getSeedPlayers } from "@/lib/seed-data";

import type { Player } from "@/lib/types";

const SURFACE = "bg-[#0E0E11]";
const INNER_SURFACE = "bg-[#141418]";
const HAIRLINE = "border-[#27272A]";

const POSITION_STYLES: Record<string, string> = {
  QB: "border-pink-400/30 bg-pink-400/10 text-pink-300",
  RB: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  WR: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  TE: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  K: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  DEF: "border-white/20 bg-white/[0.04] text-[#D4D4D8]",
};

const POSITION_BORDERS: Record<string, string> = {
  QB: "border-l-pink-400/70",
  RB: "border-l-emerald-500/80",
  WR: "border-l-sky-400/70",
  TE: "border-l-amber-400/70",
  K: "border-l-cyan-400/70",
  DEF: "border-l-white/30",
};

const SEED_PLAYERS = getSeedPlayers("ppr");
const SEED_BY_ID = new Map(SEED_PLAYERS.map((player) => [player.id, player]));
const DEALS = [
  { send: "jahmyr-gibbs", receive: ["puka-nacua", "james-cook-iii"], grade: "A" },
  { send: "jamarr-chase", receive: ["breece-hall", "brock-bowers"], grade: "B+" },
];

function aboveReplacement(player: Player) {
  const depth = player.position === "WR" ? 60 : player.position === "RB" ? 48 : 24;
  const group = SEED_PLAYERS.filter(p => p.position === player.position)
    .sort((a, b) => b.projection - a.projection);
  return Math.max(0, player.projection - group[Math.min(depth, group.length) - 1].projection);
}

const START_SIT_MATCHUPS = [
  { playerId: "kyren-williams", opponent: "ARI" },
  { playerId: "james-cook-iii", opponent: "MIA" },
];

const DRAFT_PICK_NUMBERS = [1, 2, 3, 4, 13, 14, 15, 16];

function playerFor(id: string): Player {
  return SEED_BY_ID.get(id) ?? SEED_PLAYERS[0];
}


function format(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "N/A";
}

function pickLabel(pickNumber: number): string {
  const round = Math.ceil(pickNumber / 12);
  const pickInRound = ((pickNumber - 1) % 12) + 1;
  return `${round}.${String(pickInRound).padStart(2, "0")}`;
}

function teamForPick(pickNumber: number): number {
  const round = Math.ceil(pickNumber / 12);
  const pickInRound = ((pickNumber - 1) % 12) + 1;
  return round % 2 === 1 ? pickInRound : 13 - pickInRound;
}

function PositionTag({ position }: { position: string }) {
  return (
    <span
      className={`inline-flex h-6 w-8 shrink-0 items-center justify-center border font-mono text-[9px] font-bold ${
        POSITION_STYLES[position] ?? "border-white/15 bg-white/[0.04] text-[#D4D4D8]"
      }`}
    >
      {position}
    </span>
  );
}

type Accent = {
  text: string;
  rule: string;
  frame: string;
};

const ACCENTS: Record<"emerald" | "pink", Accent> = {
  emerald: {
    text: "text-[#10B981]",
    rule: "bg-emerald-500",
    frame: "border-emerald-500/25 ring-1 ring-inset ring-emerald-500/10",
  },
  pink: {
    text: "text-[#EC4899]",
    rule: "bg-[#EC4899]",
    frame: "border-[#EC4899]/25 ring-1 ring-inset ring-[#EC4899]/10",
  },
};

function SpotlightStage({
  number,
  eyebrow,
  headline,
  description,
  href,
  linkLabel,
  accent,
  reverse = false,
  children,
}: {
  number: string;
  eyebrow: string;
  headline: [string, string];
  description: string;
  href: string;
  linkLabel: string;
  accent: "emerald" | "pink";
  reverse?: boolean;
  children: ReactNode;
}) {
  const tone = ACCENTS[accent];
  const headingId = `spotlight-stage-${number}`;

  return (
    <article aria-labelledby={headingId} className={`relative border-t border-white/10`}>
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-24">
          <div className={`min-w-0  ${reverse ? "lg:order-2" : ""}`}>
            <h2
              id={headingId}
              className="max-w-lg font-display text-[clamp(2rem,4.2vw,3.6rem)] font-extrabold leading-[1.03] tracking-[-0.055em] text-white"
            >
              {headline[0]} <span className={`decoration-[.085em] underline underline-offset-[.12em] ${tone.text}`}>{headline[1]}</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#A1A1AA]">
              {description}
            </p>

            <Link
              href={href}
              className={`group mt-6 inline-flex min-h-11 items-center gap-2 border border-[#27272A] bg-[#111113] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/30 hover:bg-[#18181B] active:bg-[#0E0E11] ${tone.text}`}
            >
              {linkLabel}
              <ChevronRightIcon
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className={`min-w-0  ${reverse ? "lg:order-1" : ""}`}>
            <div className={`relative border ${tone.frame} ${SURFACE} p-3 sm:p-4`}>
              <span aria-hidden="true" className={`absolute left-0 top-0 h-[2px] w-24 ${tone.rule}`} />

              <DemoPlayback title={eyebrow} draft={href === "/mock"}>{children}</DemoPlayback>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function TradeStage() {
  const [index, select] = useState(0);
  const deal = DEALS[index];
  const send = playerFor(deal.send);
  const receive = deal.receive.map(playerFor);
  const sent = aboveReplacement(send);
  const received = receive.reduce((sum, p) => sum + aboveReplacement(p), 0);
  const net = received - sent;
  return (
    <div>
      <div className="mb-4 flex gap-2">{DEALS.map((d, i) => <button key={d.send} data-demo-choice aria-pressed={index === i} onClick={() => select(i)} className="border border-white/20 px-3 py-2 text-sm aria-pressed:border-[#10B981] aria-pressed:text-[#10B981]">{playerFor(d.send).name.split(" ").at(-1)} deal</button>)}</div>
      <div aria-live="polite">
        {[send, ...receive].map((p, i) => <div key={p.id} className="demo-change flex items-center gap-3 border-t border-white/10 py-3 text-sm"><PositionTag position={p.position} /><strong>{p.name}</strong><span className="ml-auto font-mono text-xs text-zinc-400">{i ? "Receive" : "Send"}</span></div>)}
        <div className="mt-2 flex items-center gap-5 bg-[#17171A] p-4">
          <div><p className="text-xs text-zinc-400">Sample grade</p><strong key={deal.grade} className="demo-change inline-block font-display text-5xl text-[#10B981]">{deal.grade}</strong></div>
          <div className="flex-1"><p className="flex justify-between text-xs">Net VORP <b>{net >= 0 ? "+" : ""}{net.toFixed(1)}</b></p><div className="mt-2 h-2 bg-zinc-700"><div className="h-full bg-[#10B981] motion-safe:transition-[width] motion-safe:duration-500" style={{ width: Math.abs(net) / Math.max(1, sent + received) * 100 + "%" }} /></div></div>
        </div>
      </div>
    </div>
  );
}

const DRAFT_POOL = [...SEED_PLAYERS].filter(p => p.adp > 0).sort((a, b) => a.adp - b.adp);

function MockDraftStage() {
  const [lastPick, setLastPick] = useState(15);
  const next = DRAFT_POOL[lastPick];
  const complete = lastPick >= 36;
  const visible = lastPick <= 16 ? DRAFT_PICK_NUMBERS : [...DRAFT_PICK_NUMBERS.slice(0, 4), ...Array.from({ length: 4 }, (_, i) => lastPick - 3 + i)];
  return (
    <div>
      <p className="mb-3 font-mono text-xs text-zinc-400">3-round snake · 12 teams</p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{visible.map(pick => {
        const player = pick <= lastPick ? DRAFT_POOL[pick - 1] : null;
        return <div key={pick} className={`min-w-0 border-l-2 bg-[#18181B] p-2 ${player ? POSITION_BORDERS[player.position] : "border-l-[#EC4899]"}`}>
          <p className="font-mono text-xs">{pickLabel(pick)}</p>
          <p className="mb-2 text-[10px] text-zinc-400">Team {teamForPick(pick)}</p>
          <p key={player?.id ?? "open"} className="demo-change mb-2 text-xs font-bold">{player?.name ?? "On the clock"}</p>
          {player && <PositionTag position={player.position} />}
        </div>;
      })}</div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
        <div data-demo-player aria-live="polite"><p className="font-mono text-xs text-zinc-400">{complete ? "3 rounds complete" : "Next pick · " + pickLabel(lastPick + 1)}</p>
        <p className="mt-1 font-semibold">{complete ? "Draft complete" : next.name}</p></div>
        <button data-demo-draft onClick={() => setLastPick(complete ? 15 : lastPick + 1)} className="bg-[#EC4899] px-5 py-2 font-mono text-sm font-bold text-black">{complete ? "Reset" : "DRAFT"}</button>
      </div>
    </div>
  );
}

function StartSitStage() {
  const matchups = START_SIT_MATCHUPS.map((entry) => ({
    ...entry,
    player: playerFor(entry.playerId),
  }));
  const [selectedId, setSelectedId] = useState(matchups[0].player.id);
  const selected = matchups.find((entry) => entry.player.id === selectedId) ?? matchups[0];
  const other = matchups.find((entry) => entry.player.id !== selected.player.id) ?? matchups[1];

  const selectedWeekly = selected.player.weekProjection ?? selected.player.weeklyAvg;
  const otherWeekly = other.player.weekProjection ?? other.player.weeklyAvg;
  const edge = selectedWeekly - otherWeekly;

  return (
    <div className="grid gap-3  lg:items-start">
      <div className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE}`}>
        <div className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Weekly matchup
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            Select a row
          </span>
        </div>

        <div className="relative isolate" role="group" aria-label="Select a player for the start verdict">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/2 border-l-2 border-[#10B981] bg-emerald-500/10 motion-safe:transition-transform motion-safe:duration-500" style={{ transform: selectedId === matchups[0].player.id ? "none" : "translateY(100%)" }} />
          {matchups.map(({ player, opponent }) => {
            const active = player.id === selected.player.id;
            const weekly = player.weekProjection ?? player.weeklyAvg;
            return (
              <button
                key={player.id}
                data-demo-choice
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(player.id)}
                className={`grid w-full grid-cols-[32px_minmax(0,1fr)_58px] items-center gap-3 border-b border-[#27272A] px-3 py-4 text-left transition-colors last:border-b-0 ${
                  active
                    ? "bg-transparent"
                    : "hover:bg-white/[0.03] active:bg-white/[0.05]"
                }`}
              >
                <PositionTag position={player.position} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {player.name}
                    </span>
                    {active ? (
                      <span className="shrink-0 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-emerald-300">
                        Start
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                    vs {opponent} / {player.team} / RB{player.positionRank}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-[11px] font-semibold tabular-nums text-white">
                    {format(weekly)}
                  </span>
                  <span className="mt-0.5 block font-mono text-[7px] uppercase tracking-[0.08em] text-[#52525B]">
                    Proj
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className={`border-t ${HAIRLINE} px-3 py-2 font-mono text-[8px] uppercase tracking-[0.08em] text-[#52525B]`}>
          Weekly projection uses the 2026 season average until weekly data is active.
        </p>
      </div>

      <div
        aria-live="polite"
        className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE} lg:mt-5 lg:translate-x-2`}
      >
        <div className={`flex items-center justify-between gap-2 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Start verdict
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-400">
            Active
          </span>
        </div>

        <div key={selectedId} className="demo-change p-4">
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#71717A]">
            Start
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold leading-[0.95] tracking-[-0.04em] text-white">
            {selected.player.name}
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
            {selected.player.team} / vs {selected.opponent}
          </p>

          <dl className={`mt-4 divide-y divide-[#27272A] border-y ${HAIRLINE}`}>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                Weekly proj
              </dt>
              <dd className="font-mono text-sm font-bold tabular-nums text-emerald-300">
                {format(selectedWeekly)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                Matchup
              </dt>
              <dd className="font-mono text-sm font-bold text-white">
                vs {selected.opponent}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                Proj edge
              </dt>
              <dd
                className={`font-mono text-sm font-bold tabular-nums ${
                  edge >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {edge >= 0 ? "+" : ""}
                {format(edge)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-[9px] leading-relaxed text-[#71717A]">
            Compared with {other.player.name}. Weekly projection is the season average divided across 17 games.
          </p>
        </div>
      </div>
    </div>
  );
}

function LeaguePreview() {
  const [provider, select] = useState("Sleeper");
  const [loaded, setLoaded] = useState("Sleeper");
  const syncing = loaded !== provider;
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(provider), 650);
    return () => clearTimeout(timer);
  }, [provider]);
  return (
    <div className="p-2">
      <div className="mb-4 flex gap-2">{["Sleeper", "ESPN"].map(name => <button key={name} data-demo-choice aria-pressed={name === provider} onClick={() => select(name)} className="border border-white/20 px-4 py-2 text-sm aria-pressed:border-[#EC4899] aria-pressed:text-[#EC4899]">{name}</button>)}</div>
      <div aria-live="polite"><p className="border-y border-white/15 py-3 font-mono text-xs">{syncing ? "Syncing " + provider + "…" : provider + " sample import"}</p>
      <dl key={loaded} aria-busy={syncing} className={`demo-change divide-y divide-white/10 ${syncing ? "opacity-40" : ""}`}>{[["Scoring format", "PPR"], ["Roster slot", "Superflex"], ["League size", "12-Team"]].map(([k,v]) => <div key={k} className="flex justify-between py-3 text-sm"><dt className="text-zinc-400">{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className="bg-[#17171A] p-3 text-sm font-semibold">PPR · Superflex · 12-Team</p></div>
    </div>
  );
}

export function SpotlightStages() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef<SVGRectElement>(null);
  useEffect(() => {
    const root = section.current!;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("walk-entered");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .08 });
    root.querySelectorAll("article").forEach(row => observer.observe(row));
    let frame = 0;
    function draw() {
      frame = 0;
      const box = root.getBoundingClientRect();
      const fraction = (innerHeight * .65 - box.top) / box.height;
      progress.current?.setAttribute("height", String(1000 * Math.min(1, Math.max(0, fraction))));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <section ref={section} aria-label="Interactive product walkthrough" className="relative">
      <svg aria-hidden="true" viewBox="0 0 80 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 left-1/2 hidden text-[#45454b] h-full w-20 -translate-x-1/2 lg:block"><defs><clipPath id="walk-progress"><rect ref={progress} width="80" height="0" /></clipPath></defs><path id="walk-spine" d="M40 0 C-40 100 120 180 40 270 S0 440 40 510 S85 690 40 760 S5 920 40 1000" fill="none" stroke="currentColor" className="text-inherit" strokeDasharray="4 7" vectorEffect="non-scaling-stroke" /><use href="#walk-spine" clipPath="url(#walk-progress)" className="walk-progress" /></svg>
      <SpotlightStage number="01" eyebrow="Trade Analyzer" headline={["Win every trade", "before you accept."]} description="Compare both sides of a two-for-one offer. Switch deals to see the change in projected points above replacement." href="/trade" linkLabel="Open Trade Analyzer" accent="emerald"><TradeStage /></SpotlightStage>
      <SpotlightStage number="02" eyebrow="Mock Draft Room" headline={["Mock drafts that", "adapt to your league."]} description="Practice a snake draft with a 12-team board. Make a pick to see the next available player." href="/mock" linkLabel="Start Mock Draft" accent="pink" reverse><MockDraftStage /></SpotlightStage>
      <SpotlightStage number="03" eyebrow="Start/Sit Evaluator" headline={["Settle every", "lineup call."]} description="Compare two running backs using their weekly PPR projections. Select a starter to see the projected difference." href="/start-sit" linkLabel="Compare Players" accent="emerald"><StartSitStage /></SpotlightStage>
      <SpotlightStage number="04" eyebrow="Sleeper & ESPN Sync" headline={["Synced to your", "exact scoring."]} description="Import roster slots and scoring settings from Sleeper or ESPN. Preview the settings for a 12-team superflex league." href="/leagues" linkLabel="Connect League" accent="pink" reverse><LeaguePreview /></SpotlightStage>
    </section>
  );
}
