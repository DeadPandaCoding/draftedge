"use client";

import { LeagueSummary } from "@/components/dashboard/LeagueSummary";
import { slotForPick } from "@/lib/league";
import { formatPositiveStat, indexPlayersById } from "@/lib/player-display";
import Link from "next/link";
import { DemoPlayback, useDemoStep } from "./DemoPlayback";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { buildSeedPlayers } from "@/lib/seed-data";

import { PosBadge } from "@/components/ui";
import { TradeVerdictSummary } from "@/components/dashboard/TradeVerdictSummary";
import { DraftBoardTile } from "@/components/draft/DraftBoardTile";
import { buildTradeValues, gradeTrade, packageTradeValue } from "@/lib/trade-value";
import { buildMatchupContext, startSitConfidence } from "@/lib/matchup-context";
import styles from "@/app/mock/room.module.css";
import type { Player } from "@/lib/types";

const SEED_PLAYERS = buildSeedPlayers("ppr");
const SEED_BY_ID = indexPlayersById(SEED_PLAYERS);
const DEALS = [
  { send: "jahmyr-gibbs", receive: ["puka-nacua", "james-cook-iii"] },
  { send: "jamarr-chase", receive: ["breece-hall", "brock-bowers"] },
];

function playerFor(id: string): Player {
  return SEED_BY_ID.get(id) ?? SEED_PLAYERS[0];
}


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
  const accentText = accent === "emerald" ? "text-[#10B981]" : "text-[#EC4899]";
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
              {headline[0]} <span className={`decoration-[.085em] underline underline-offset-[.12em] ${accentText}`}>{headline[1]}</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#A1A1AA]">
              {description}
            </p>

            <Link
              href={href}
              className={`group mt-6 inline-flex min-h-11 items-center gap-2 border border-[#27272A] bg-[#111113] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/30 hover:bg-[#18181B] active:bg-[#0E0E11] ${accentText}`}
            >
              {linkLabel}
              <ChevronRightIcon
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className={`min-w-0  ${reverse ? "lg:order-1" : ""}`}>
            <div className="@container relative overflow-clip rounded-2xl border border-white/[0.08] bg-[#111113] p-3 sm:p-4">
              <DemoPlayback title={eyebrow} draft={href === "/mock"}>{children}</DemoPlayback>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const CONTEXTS = buildMatchupContext(SEED_PLAYERS);
const VALUES = buildTradeValues(SEED_PLAYERS.map(p => ({ ...p, projection: CONTEXTS.get(p.id)!.adjustedRosPoints })), 12);
const DRAFT_POOL = [...SEED_PLAYERS].filter(p => p.adp > 0).sort((a, b) => a.adp - b.adp);

function Choices({ labels }: { labels: string[] }) {
  const { step, select } = useDemoStep();
  return (
    <div className="mb-3 inline-flex rounded-lg border border-white/[0.08] bg-[#080E0C] p-0.5">
      {labels.map((label, i) => (
        <button key={label} type="button" data-demo-choice data-active={step % 2 === i}
          aria-pressed={step % 2 === i} onClick={() => select(i)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-200 aria-pressed:bg-white/[0.1] aria-pressed:text-white">
          {label}
        </button>
      ))}
    </div>
  );
}

function TradeStage() {
  const { step } = useDemoStep();
  const deal = DEALS[step % 2];
  const receive = deal.receive.map(playerFor);
  const give = [playerFor(deal.send)];
  const value = (p: Player) => VALUES.get(p.id) ?? 0;
  const aValue = packageTradeValue(receive.map(value), give.length);
  const bValue = packageTradeValue(give.map(value), receive.length);
  const grade = gradeTrade(aValue - bValue, aValue + bValue);
  return (
    <>
      <Choices labels={["Gibbs deal", "Chase deal"]} />
      <div className="grid gap-5 @min-[32rem]:grid-cols-2">
        {([["You receive", receive, aValue], ["You give up", give, bValue]] as const).map(([label, players, total]) => (
          <div key={label} className="glass-strong rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{label}</h3>
              <span className="font-mono text-lg font-bold tabular-nums text-emerald-300">{total.toFixed(1)} <small className="text-[10px] font-semibold text-zinc-500">VALUE</small></span>
            </div>
            <div className="space-y-2">{players.map(p => (
              <div key={p.id} className="rounded-lg bg-zinc-900/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2"><span className="truncate font-semibold text-zinc-200">{p.name}</span><PosBadge position={p.position} size="xs" /></div>
                  <span className="font-tech text-sm font-bold text-emerald-300">{value(p).toFixed(1)}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">{p.team} · {CONTEXTS.get(p.id)!.adjustedRosPoints.toFixed(1)} ROS pts · ADP {formatPositiveStat(p.adp)}</div>
              </div>
            ))}</div>
          </div>
        ))}
      </div>
      <div className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
        <TradeVerdictSummary grade={grade} count={receive.length + give.length} aValue={aValue} bValue={bValue} />
      </div>
    </>
  );
}

function MockDraftStage() {
  const { step, select } = useDemoStep();
  const current = 16 + step;
  const slot = slotForPick(current, 12);
  const slots = Array.from({ length: 4 }, (_, i) => Math.min(9, slot) + i);
  return (
    <div className={styles.board}>
      <header className={styles.toolbar}>
        <h3 className="text-base font-bold">Draft Board</h3><span>Round 2 / Pick {current}</span>
        <div className={styles.controls}><button type="button" data-demo-draft onClick={() => select((step + 1) % 4)}>Auto-Pick</button></div>
      </header>
      <div className={styles.boardScroll} tabIndex={0} role="region" aria-label="Sample snake draft board">
        <table className="w-full border-separate border-spacing-0 text-left text-xs">
          <thead className="sticky top-0 z-20 bg-[#131D1A]"><tr><th className="sticky left-0 bg-[#131D1A] px-2 py-2">Rd</th>{slots.map(team => <th className="min-w-[122px] whitespace-nowrap px-2 py-2" key={team}>Team {team}</th>)}</tr></thead>
          <tbody>{[1, 2, 3].map(round => (
            <tr key={round}><th className="sticky left-0 z-10 border-t border-white/10 bg-[#131D1A] px-2">R{round}<small className="block text-zinc-400">{round === 2 ? "←" : "→"}</small></th>
              {slots.map(team => {
                const pick = (round - 1) * 12 + (round === 2 ? 13 - team : team);
                return <DraftBoardTile key={team} round={round} pickNumber={pick} teams={12} totalRounds={3} player={pick < current ? DRAFT_POOL[pick - 1] : undefined} active={pick === current} mine={team === 9} clock="Untimed" />;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className={styles.toolbar} data-demo-player><span>Best available</span><strong className="text-sm">{DRAFT_POOL[current - 1].name}</strong><PosBadge position={DRAFT_POOL[current - 1].position} size="xs" /></div>
    </div>
  );
}

function StartSitStage() {
  const { step } = useDemoStep();
  const players = [playerFor("kyren-williams"), playerFor(step % 2 ? "jahmyr-gibbs" : "james-cook-iii")];
  const score = (p: Player) => CONTEXTS.get(p.id)!.adjustedWeeklyPoints ?? p.weeklyAvg;
  const diff = score(players[0]) - score(players[1]);
  const winner = diff >= 0 ? players[0] : players[1];
  const band = startSitConfidence(diff);
  return (
    <>
      <Choices labels={["Compare Cook", "Compare Gibbs"]} />
      <div className="grid gap-3 @min-[29rem]:grid-cols-2">
        {players.map((p, i) => (
          <div key={p.id} className="glass-strong flex min-w-0 flex-col rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Player {i ? "B" : "A"}</h3>
            <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-white">{p.name}</span><PosBadge position={p.position} /></div>
            <div className="mt-1 text-xs text-zinc-500">{p.team} · ADP {formatPositiveStat(p.adp)}</div>
            <div className="mt-4">{[["ROS projection", CONTEXTS.get(p.id)!.adjustedRosPoints], ["This week (season-avg estimate)", score(p)], ["Weekly avg", p.weeklyAvg]].map(([label, points]) => (
              <div key={label} className="flex items-center justify-between gap-2 border-b border-zinc-800/70 py-2 last:border-0">
                <span className="text-xs text-zinc-500">{label}</span><span className={`whitespace-nowrap font-tech text-sm font-semibold ${p === winner ? "text-emerald-300" : "text-zinc-200"}`}>{Number(points).toFixed(1)} pts</span>
              </div>
            ))}</div>
          </div>
        ))}
      </div>
      <div className={`mt-6 rounded-2xl border p-6 ${band.cls}`}><div className="flex flex-col items-center gap-4 text-center">
        <span className={`font-display text-2xl font-bold ${band.cls.split(" ")[0]}`}>Start {winner.name}</span>
        <p className="text-sm text-zinc-300">{band.detail}</p><p className="font-tech text-lg font-bold text-zinc-100">{score(players[0]).toFixed(1)} vs {score(players[1]).toFixed(1)} pts</p>
      </div></div>
    </>
  );
}

function LeaguePreview() {
  const { step } = useDemoStep();
  const platform = step % 2 ? "ESPN" : "Sleeper";
  const [loaded, setLoaded] = useState(platform);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(platform), 650);
    return () => clearTimeout(timer);
  }, [platform]);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">League Sync</p>
          <h3 className="mt-1 text-base font-semibold text-white">Bring your fantasy league into DraftEdge</h3></div>
        <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-300">{loaded === platform ? "LEAGUE CONNECTED" : "CONNECTING…"}</span>
      </div>
      <div className="mt-4"><Choices labels={["Sleeper", "ESPN"]} /></div>
      <div aria-busy={loaded !== platform} className="min-w-0 flex-1">
        <LeagueSummary name="Sample Superflex League" scoring="PPR" platform={loaded} teams={12} />
        <p className="mt-1 text-xs text-zinc-500">{loaded === platform ? "Sample import · synced just now" : "Connecting…"}</p>
      </div>
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
    <section ref={section} aria-label="Product walkthrough" className="relative">
      <svg aria-hidden="true" viewBox="0 0 80 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 left-1/2 hidden text-[#45454b] h-full w-20 -translate-x-1/2 lg:block"><defs><clipPath id="walk-progress"><rect ref={progress} width="80" height="0" /></clipPath></defs><path id="walk-spine" d="M40 0 C-40 100 120 180 40 270 S0 440 40 510 S85 690 40 760 S5 920 40 1000" fill="none" stroke="currentColor" className="text-inherit" strokeDasharray="4 7" vectorEffect="non-scaling-stroke" /><use href="#walk-spine" clipPath="url(#walk-progress)" className="walk-progress" /></svg>
      <SpotlightStage number="01" eyebrow="Trade Analyzer" headline={["Win every trade", "before you accept."]} description="Compare both sides of a two-for-one offer. Each sample deal compares the total value you receive and give up." href="/trade" linkLabel="Open Trade Analyzer" accent="emerald"><TradeStage /></SpotlightStage>
      <SpotlightStage number="02" eyebrow="Mock Draft Room" headline={["Mock drafts that", "adapt to your league."]} description="Practice a snake draft with a 12-team board. The board updates after each pick." href="/mock" linkLabel="Start Mock Draft" accent="pink" reverse><MockDraftStage /></SpotlightStage>
      <SpotlightStage number="03" eyebrow="Start/Sit Evaluator" headline={["Settle every", "lineup call."]} description="Compare two running backs using their weekly PPR projections. The verdict shows the projected difference for each starter." href="/start-sit" linkLabel="Compare Players" accent="emerald"><StartSitStage /></SpotlightStage>
      <SpotlightStage number="04" eyebrow="Sleeper & ESPN Sync" headline={["Synced to your", "exact scoring."]} description="Import roster slots and scoring settings from Sleeper or ESPN. Preview the settings for a 12-team superflex league." href="/leagues" linkLabel="Connect League" accent="pink" reverse><LeaguePreview /></SpotlightStage>
    </section>
  );
}
