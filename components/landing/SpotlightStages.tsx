"use client";

import { LeagueSyncPanel } from "@/components/dashboard/LeagueSyncCard";
import type { SyncedSleeperLeague } from "@/lib/sleeper-sync";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { TradeSide } from "@/components/dashboard/TradeSide";
import { StartSitPlayerCard, StartSitVerdict } from "@/components/dashboard/StartSitComparison";
import { indexPlayersById } from "@/lib/player-display";
import Link from "next/link";
import { DemoPlayback, useDemoStep } from "./DemoPlayback";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { buildSeedPlayers } from "@/lib/seed-data";

import { TradeVerdictSummary } from "@/components/dashboard/TradeVerdictSummary";
import { MockDraftBoard } from "@/components/draft/MockDraftBoard";
import { AvailablePlayerRow } from "@/components/draft/AvailablePlayerRow";
import { buildTradeValues, gradeTrade, packageTradeValue } from "@/lib/trade-value";
import { buildMatchupContext, startSitConfidence } from "@/lib/matchup-context";
import styles from "@/app/mock/room.module.css";
import type { Player } from "@/lib/types";

const SEED_PLAYERS = buildSeedPlayers("ppr");
const SEED_BY_ID = indexPlayersById(SEED_PLAYERS);

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
            <div className="relative min-w-0 lg:[zoom:0.8]">
              <DemoPlayback title={eyebrow} href={href}>{children}</DemoPlayback>
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

// Seed the screenshot's two starting values; additional assets are priced by
// the same package valuation function as /trade.
const DEMO_VALUES = new Map(VALUES).set("puka-nacua", 76.7).set("jahmyr-gibbs", 54.2);

function TradeStage() {
  const { step } = useDemoStep();

  const [sides, setSides] = useState({
    A: ["puka-nacua"],
    B: ["jahmyr-gibbs"],
  });
  const excluded = new Set([...sides.A, ...sides.B]);
  const add = (side: "A" | "B", player: Player) => setSides(previous =>
    previous.A.includes(player.id) || previous.B.includes(player.id) ? previous :
      { ...previous, [side]: [...previous[side], player.id] });
  const remove = (side: "A" | "B", id: string) => setSides(previous =>
    ({ ...previous, [side]: previous[side].filter(existing => existing !== id) }));
  const total = (side: "A" | "B") => packageTradeValue(
    sides[side].map(id => DEMO_VALUES.get(id) ?? 0), sides[side === "A" ? "B" : "A"].length);
  const aValue = total("A"), bValue = total("B");
  const grade = gradeTrade(aValue - bValue, aValue + bValue, !!(sides.A.length && sides.B.length));
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {(["A", "B"] as const).map(side => {
          const list = sides[side].map(playerFor);
          return <div key={side} className="min-w-0" data-receive={side === "A" ? "" : undefined}>
            <TradeSide key={side === "A" ? step : side} side={side} title={side === "A" ? "You receive" : "You give up"} list={list}
              totalValue={total(side)} totalProj={list.reduce((sum, p) => sum + CONTEXTS.get(p.id)!.adjustedRosPoints, 0)}
              players={SEED_PLAYERS} excluded={excluded} values={DEMO_VALUES} contexts={CONTEXTS}
              initialQuery={side === "A" && step === 1 ? "James Cook" : ""} add={add} remove={remove} />
          </div>;
        })}
      </div>
      {sides.A.length > 0 && sides.B.length > 0 && <div className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
        <TradeVerdictSummary grade={grade} count={sides.A.length + sides.B.length} aValue={aValue} bValue={bValue} />
      </div>}
    </>
  );
}

function MockDraftStage() {
  const { step } = useDemoStep();
  return <MockExample key={step} step={step} />;
}

function MockExample({ step }: { step: number }) {
  const initial = DRAFT_POOL.slice(0, 15 + step).map(p => ({ playerId: p.id }));
  const [picks, setPicks] = useState(initial);
  const [queue, setQueue] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const done = picks.length >= 36;
  const taken = new Set(picks.map(p => p.playerId));
  const available = DRAFT_POOL.filter(p => !taken.has(p.id));
  const currentPick = picks.length + 1;
  useEffect(() => {
    const board = boardRef.current;
    const tile = board?.querySelector<HTMLElement>('[aria-current="step"]');
    if (board && tile) board.scrollLeft += tile.getBoundingClientRect().left - board.getBoundingClientRect().left - board.clientWidth / 2;
  }, [currentPick]);
  const draft = (id: string) => setPicks(prev => prev.length >= 36 || prev.some(p => p.playerId === id) ? prev : [...prev, { playerId: id }]);
  const reset = () => { setPicks(DRAFT_POOL.slice(0, 15).map(p => ({ playerId: p.id }))); setQueue([]); setQuery(""); };
  return (
    <div className="grid min-w-0 gap-2">
      <MockDraftBoard teams={12} mySlot={9} draftType="snake" picks={picks} playersById={SEED_BY_ID}
        currentPick={currentPick} totalRounds={3} done={done} isMyTurn={!done} boardRef={boardRef} clock="Untimed"
        autoPick={() => draft(available.find(p => queue.includes(p.id))?.id ?? available[0].id)}
        simulateRest={() => setPicks([...picks, ...available.slice(0, 36 - picks.length).map(p => ({ playerId: p.id }))])} reset={reset} />
      {done ? <button type="button" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950" onClick={reset}>Reset draft</button> :
        <section className={styles.panel} aria-label="Available players">
          <div className={styles.filters}><h2>Available Players</h2><input type="search" placeholder="Search players" aria-label="Search draft players" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className={styles.scroll}><table className={styles.players}>
            <thead><tr>{["Draft", "Rank", "Player", "Queue", "ADP", "Proj pts", "PPG"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{available.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3).map(p =>
              <AvailablePlayerRow key={p.id} p={p} isMyTurn makeMyPick={draft} queued={queue.includes(p.id)}
                toggleQueue={id => setQueue(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />)}</tbody>
          </table></div>
        </section>}
    </div>
  );
}

function StartSitStage() {
  const { step, select } = useDemoStep();
  const [players, setPlayers] = useState<(Player | null)[]>([playerFor("kyren-williams"), playerFor("james-cook-iii")]);
  const useWeek = step === 0;
  const weeklyScore = (p: Player) => CONTEXTS.get(p.id)?.adjustedWeeklyPoints ?? null;
  const score = (p: Player | null) => p ? (useWeek ? weeklyScore(p) : CONTEXTS.get(p.id)?.adjustedRosPoints) ?? 0 : 0;
  const [a, b] = players;
  const aScore = score(a), bScore = score(b);
  const diff = aScore - bScore;
  const winner = a && b && diff !== 0 ? (diff > 0 ? a : b) : null;
  const setPlayer = (index: number, player: Player | null) => setPlayers(prev => prev.map((p, i) => i === index ? player : p));
  return (
    <>
      <div className="mb-4 inline-flex rounded-lg bg-zinc-900 p-1">{["This week", "Season projection"].map((label, i) =>
        <button type="button" key={label} aria-pressed={step === i} onClick={() => select(i)} className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-400 aria-pressed:bg-emerald-500/15 aria-pressed:text-emerald-300">{label}</button>)}</div>
      <div className="grid gap-5 sm:grid-cols-2">{players.map((p, i) => p ?
        <StartSitPlayerCard key={i} p={p} label={i ? "Player B" : "Player A"} contexts={CONTEXTS} winner={winner}
          useWeek={useWeek} isOnBye={() => false} weeklyScore={weeklyScore} values={VALUES} onClear={() => setPlayer(i, null)} /> :
        <div className="glass-strong rounded-2xl p-5" key={i}><h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Player {i ? "B" : "A"}</h2>
          <PlayerPicker players={SEED_PLAYERS} tradeValues={VALUES} exclude={new Set(players.flatMap(p => p ? [p.id] : []))} onPick={p => setPlayer(i, p)} placeholder="Search a player…" />
          <p className="mt-3 text-xs text-zinc-500">Pick a player to compare.</p></div>)}</div>
      {winner && <StartSitVerdict band={startSitConfidence(diff)} {...{ winner, aScore, bScore, diff, useWeek }} contexts={CONTEXTS} />}
      {a && b && !winner && <div className="mt-6 rounded-2xl border border-zinc-600/60 bg-zinc-800/40 p-6 text-center"><span className="font-display text-2xl font-bold text-zinc-100">Too close to call</span><p className="mt-2 text-sm text-zinc-300">Both players are tied at {aScore.toFixed(1)} pts.</p></div>}
    </>
  );
}

function sampleLeague(platform: "sleeper" | "espn", account: string): SyncedSleeperLeague {
  return { id: platform, platform, platform_league_id: "123456", platform_user_id: "demo",
    sleeper_username: platform === "sleeper" ? account : null, league_name: "Sample Superflex League",
    season: "2026", scoring_format: "PPR", te_premium: false, total_teams: 12, roster_positions: ["QB", "RB", "WR", "TE", "SUPER_FLEX"],
    rosters: [], draft_id: null, drafted_player_ids: [], last_synced_at: new Date().toISOString() };
}

function LeaguePreview() {
  const { step } = useDemoStep();
  return <LeagueExample key={step} step={step} />;
}

function LeagueExample({ step }: { step: number }) {
  const platform = step < 3 ? "sleeper" : "espn";
  const [activeLeague, setLeague] = useState(() => step % 3 === 2 ? sampleLeague(platform, "draftedge_demo") : null);
  return <LeagueSyncPanel localExample initialPlatform={platform} initialUsername={step === 1 ? "draftedge_demo" : ""}
    initialLeagueId={step === 4 ? "123456" : ""} supabaseEnabled connections={{
      activeLeague, leagues: activeLeague ? [activeLeague] : [], loading: false, error: null,
      connectSleeper: async username => setLeague(sampleLeague("sleeper", username)),
      connectEspn: async () => { setLeague(sampleLeague("espn", "")); return {}; },
      disconnectLeague: async () => setLeague(null), syncNow: async () => setLeague(l => l && { ...l, last_synced_at: new Date().toISOString() }),
      setActiveLeagueId: () => {},
    }} />;
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
