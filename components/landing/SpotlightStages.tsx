"use client";

import { LeagueSyncPanel } from "@/components/dashboard/LeagueSyncCard";
import type { SyncedSleeperLeague } from "@/lib/sleeper-sync";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { TradeSide } from "@/components/dashboard/TradeSide";
import { StartSitPlayerCard, StartSitVerdict } from "@/components/dashboard/StartSitComparison";
import { indexPlayersById } from "@/lib/player-display";
import Link from "next/link";
import { DemoPlayback, useDemoQuery, useDemoStep } from "./DemoPlayback";
import { useEffect, useRef } from "react";
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
            <div className="relative min-w-0">
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

function ignoreInteraction() {}

function TradeStage() {
  const step = useDemoStep();

  const query = useDemoQuery();
  const receiveQuery = step === 2 ? "James Cook III" : query;
  const sides = { A: step >= 3 ? ["puka-nacua", "james-cook-iii"] : ["puka-nacua"], B: ["jahmyr-gibbs"] };
  const excluded = new Set([...sides.A, ...sides.B]);
  const total = (side: "A" | "B") => packageTradeValue(
    sides[side].map(id => DEMO_VALUES.get(id) ?? 0), sides[side === "A" ? "B" : "A"].length);
  const aValue = total("A"), bValue = total("B");
  const grade = gradeTrade(aValue - bValue, aValue + bValue, !!(sides.A.length && sides.B.length));
  return (
    <div className="demo-result-stage">
      <div className="demo-trade-sides grid gap-5 sm:grid-cols-2">
        {(["A", "B"] as const).map(side => {
          const list = sides[side].map(playerFor);
          return <div key={side} className="min-w-0" data-receive={side === "A" ? "" : undefined}>
            <TradeSide side={side} title={side === "A" ? "You receive" : "You give up"} list={list}
              totalValue={total(side)} totalProj={list.reduce((sum, p) => sum + CONTEXTS.get(p.id)!.adjustedRosPoints, 0)}
              players={[playerFor("james-cook-iii")]} excluded={excluded} values={DEMO_VALUES} contexts={CONTEXTS}
              previewQuery={side === "A" ? receiveQuery : ""} add={ignoreInteraction} remove={ignoreInteraction} />
          </div>;
        })}
      </div>
      {sides.A.length > 0 && sides.B.length > 0 && <div data-verdict className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
        <TradeVerdictSummary grade={grade} count={sides.A.length + sides.B.length} aValue={aValue} bValue={bValue} />
      </div>}
    </div>
  );
}

function MockDraftStage() {
  const step = useDemoStep();
  const selected = DRAFT_POOL.slice(16).find(p => p.position === "RB")!;
  const drafted = DRAFT_POOL.slice(0, step === 0 ? 15 : 16);
  if (step === 5) drafted.push(selected);
  const picks = drafted.map(p => ({ playerId: p.id }));
  const showPool = step === 2 || step === 3;
  const filtered = step === 3;
  const available = DRAFT_POOL.filter(p => !drafted.includes(p) && (!filtered || p.position === "RB")).slice(0, 3);
  const currentPick = picks.length + 1;
  return (
    <div className="demo-draft-views grid h-full min-h-0 min-w-0">
      <div className={`col-start-1 row-start-1 min-w-0 ${showPool ? "invisible" : "demo-change"}`}><MockDraftBoard teams={12} visibleSlots={[7, 8, 9]} mySlot={8} draftType="snake" picks={picks} playersById={SEED_BY_ID}
        currentPick={currentPick} totalRounds={3} done={false} isMyTurn={currentPick === 17} clock="Untimed"
        autoPick={ignoreInteraction} simulateRest={ignoreInteraction} reset={ignoreInteraction} /></div>
      <section data-pool className={`${styles.panel} col-start-1 row-start-1 min-w-0 ${showPool ? "demo-change" : "invisible"}`} aria-label="Available players">
          <div className={styles.filters}><h2>Available Players</h2><input type="search" placeholder="Search players" aria-label="Search draft players" value="" readOnly />
            <div className={styles.tabs}>{["ALL", "QB", "RB", "WR", "TE"].map(pos => <button key={pos} data-filter={pos === "RB" ? "" : undefined} aria-pressed={pos === (filtered ? "RB" : "ALL")}>{pos}</button>)}</div>
          </div>
          <div className={styles.scroll}><table className={styles.players}>
            <thead><tr>{["Draft", "Rank", "Player", "Queue", "ADP", "Proj pts", "PPG"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{available.map(p =>
              <AvailablePlayerRow key={p.id} p={p} isMyTurn={currentPick === 17} makeMyPick={ignoreInteraction} queued={false} toggleQueue={ignoreInteraction} />)}</tbody>
          </table></div>
        </section>
    </div>
  );
}

function StartSitStage() {
  const step = useDemoStep();
  const query = useDemoQuery();
  const players = [playerFor("jahmyr-gibbs"), playerFor("james-cook-iii")];
  const weeklyScore = (p: Player) => CONTEXTS.get(p.id)?.adjustedWeeklyPoints ?? p.weeklyAvg;
  const [aScore, bScore] = players.map(weeklyScore);
  const diff = aScore - bScore;
  const winnerIndex = diff >= 0 ? 0 : 1;
  const winner = players[winnerIndex];
  return (
    <div className="demo-result-stage">
      <div className="mb-4 inline-flex rounded-lg bg-zinc-900 p-1">{["This week", "Season projection"].map((label, i) =>
        <button type="button" key={label} aria-pressed={i === 0} className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-400 aria-pressed:bg-emerald-500/15 aria-pressed:text-emerald-300">{label}</button>)}</div>
      <div className="demo-comparison relative grid auto-rows-fr gap-5 sm:grid-cols-2" data-winner={winnerIndex}>
        {players.map((p, i) => <div data-player-card={i} key={i} className="grid min-w-0">
          <div className={step >= i * 2 + 3 ? "" : "invisible col-start-1 row-start-1"}><StartSitPlayerCard p={p} label={i ? "Player B" : "Player A"} contexts={CONTEXTS} winner={step >= 5 ? winner : null}
            useWeek isOnBye={() => false} weeklyScore={weeklyScore} values={VALUES} onClear={ignoreInteraction} /></div>
          {step < i * 2 + 3 && <div className="glass-strong col-start-1 row-start-1 rounded-2xl p-5"><h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Player {i ? "B" : "A"}</h2><PlayerPicker players={[p]} exclude={new Set(i ? [players[0].id] : [])} tradeValues={VALUES} placeholder="Search a player…" previewQuery={step === i * 2 + 2 ? p.name : step === i * 2 + 1 ? query : ""} onPick={ignoreInteraction} /><p className="mt-3 text-xs text-zinc-500">Pick a player to compare.</p></div>}
        </div>)}
        {step >= 5 && <span className="demo-start-highlight absolute rounded-2xl border border-emerald-500/40" />}
      </div>
      <div data-verdict className={step < 5 ? "invisible" : ""}><StartSitVerdict band={startSitConfidence(diff)} {...{ winner, aScore, bScore, diff }} contexts={CONTEXTS} useWeek /></div>
    </div>
  );
}

function sampleLeague(platform: "sleeper" | "espn", account: string): SyncedSleeperLeague {
  return { id: platform, platform, platform_league_id: "123456", platform_user_id: "demo",
    sleeper_username: platform === "sleeper" ? account : null, league_name: "Sample Superflex League",
    season: "2026", scoring_format: "PPR", te_premium: false, total_teams: 12, roster_positions: ["QB", "RB", "WR", "TE", "SUPER_FLEX"],
    rosters: [], draft_id: null, drafted_player_ids: [], last_synced_at: new Date().toISOString() };
}

function LeaguePreview() {
  const step = useDemoStep();
  return <LeagueExample key={step} step={step} />;
}

function LeagueExample({ step }: { step: number }) {
  const platform = step < 5 ? "sleeper" : "espn";
  const phase = step % 5;
  const query = useDemoQuery();
  const activeLeague = step >= 3 ? sampleLeague(step >= 8 ? "espn" : "sleeper", "draftedge_demo") : null;
  return <LeagueSyncPanel localExample initiallyShowConnectForm={Boolean(activeLeague) && phase !== 3} previewInput={phase === 0 ? query : undefined} initialPlatform={platform} initialUsername={phase === 1 || phase === 2 ? "draftedge_demo" : ""}
    initialLeagueId={phase === 1 || phase === 2 ? "123456" : ""} supabaseEnabled connections={{
      activeLeague, leagues: activeLeague ? [activeLeague] : [], loading: phase === 2, error: null,
      connectSleeper: async () => {}, connectEspn: async () => ({}),
      disconnectLeague: async () => {}, syncNow: async () => {}, setActiveLeagueId: ignoreInteraction,
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
