"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { getSeedPlayers } from "@/lib/seed-data";
import { buildTradeValues, gradeTrade } from "@/lib/trade-value";
import type { Player } from "@/lib/types";

const SURFACE = "bg-[#0E0E11]";
const INNER_SURFACE = "bg-[#141418]";
const HAIRLINE = "border-[#27272A]";

const POSITION_STYLES: Record<string, string> = {
  QB: "border-rose-400/30 bg-rose-400/10 text-rose-300",
  RB: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  WR: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  TE: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  K: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  DEF: "border-white/20 bg-white/[0.04] text-[#D4D4D8]",
};

const POSITION_BORDERS: Record<string, string> = {
  QB: "border-l-rose-400/70",
  RB: "border-l-emerald-500/80",
  WR: "border-l-sky-400/70",
  TE: "border-l-amber-400/70",
  K: "border-l-cyan-400/70",
  DEF: "border-l-white/30",
};

const SEED_PLAYERS = getSeedPlayers("ppr");
const SEED_BY_ID = new Map(SEED_PLAYERS.map((player) => [player.id, player]));
const TRADE_VALUES = buildTradeValues(SEED_PLAYERS, 12);
const TRADE_PLAYER_IDS = [
  "jahmyr-gibbs",
  "jamarr-chase",
  "breece-hall",
  "brock-bowers",
];

const START_SIT_MATCHUPS = [
  { playerId: "kyren-williams", opponent: "ARI" },
  { playerId: "james-cook-iii", opponent: "MIA" },
];

const DRAFT_PICK_NUMBERS = [1, 2, 3, 4, 13, 14, 15, 16];
const ACTIVE_PICK_START = 17;

function playerFor(id: string): Player {
  return SEED_BY_ID.get(id) ?? SEED_PLAYERS[0];
}

function valueFor(player: Player): number {
  return TRADE_VALUES.get(player.id) ?? 0;
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
    text: "text-emerald-400",
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
  headline: string;
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
    <article aria-labelledby={headingId} className={`border-b ${HAIRLINE} bg-[#09090B]`}>
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className={`min-w-0 lg:col-span-4 ${reverse ? "lg:order-2" : ""}`}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`h-px w-8 ${tone.rule}`} />
              <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${tone.text}`}>
                {number} / {eyebrow}
              </p>
            </div>

            <h2
              id={headingId}
              className="mt-5 max-w-lg font-display text-[clamp(2rem,4.2vw,3.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.055em] text-white"
            >
              {headline}
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

          <div className={`min-w-0 lg:col-span-8 ${reverse ? "lg:order-1" : ""}`}>
            <div className={`relative border ${tone.frame} ${SURFACE} p-3 sm:p-4`}>
              <span aria-hidden="true" className={`absolute left-0 top-0 h-[2px] w-24 ${tone.rule}`} />

              <div className={`mb-3 flex items-center justify-between gap-3 border-b ${HAIRLINE} px-1 pb-2.5`}>
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#71717A]">
                  Live stage
                </span>
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#52525B]">
                  2026 seed data / PPR
                </span>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function TradeStage() {
  const tradePlayers = TRADE_PLAYER_IDS.map(playerFor);
  const [selectedId, setSelectedId] = useState(tradePlayers[0].id);
  const selected = tradePlayers.find((player) => player.id === selectedId) ?? tradePlayers[0];

  const selectedValue = valueFor(selected);
  const otherValues = tradePlayers
    .filter((player) => player.id !== selected.id)
    .map(valueFor);
  const averageOther =
    otherValues.reduce((total, value) => total + value, 0) / Math.max(1, otherValues.length);
  const grade = gradeTrade(
    selectedValue - averageOther,
    selectedValue + averageOther,
  );
  const rosProjection = selected.rosProjection ?? selected.projection;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_242px] lg:items-start">
      <div className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE}`}>
        <div className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Player pool
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            Select to value
          </span>
        </div>

        <div role="group" aria-label="Select a player to value">
          {tradePlayers.map((player) => {
            const active = player.id === selected.id;
            return (
              <button
                key={player.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(player.id)}
                className={`grid w-full grid-cols-[32px_minmax(0,1fr)_46px] items-center gap-3 border-b border-[#27272A] px-3 py-3 text-left transition-colors last:border-b-0 ${
                  active
                    ? "bg-emerald-500/[0.07]"
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
                      <span className="hidden shrink-0 font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-400 sm:inline">
                        Active
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                    {player.team} / {player.position}
                    {player.positionRank} / ADP {format(player.adp)}
                  </span>
                </span>
                <span
                  className={`text-right font-mono text-[11px] font-semibold tabular-nums ${
                    active ? "text-emerald-300" : "text-[#A1A1AA]"
                  }`}
                >
                  {format(valueFor(player))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-live="polite"
        className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE} lg:mt-5 lg:translate-x-2`}
      >
        <div className={`flex items-center justify-between gap-2 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Trade verdict
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            Sample deal
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#71717A]">
                Grade
              </p>
              <p className={`mt-1 font-display text-5xl font-extrabold leading-none tracking-[-0.05em] ${grade.text}`}>
                {grade.letter}
              </p>
            </div>
            <span className="mt-1 border border-[#27272A] bg-[#0E0E11] px-2 py-1 text-right font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-[#D4D4D8]">
              {grade.label}
            </span>
          </div>

          <p className="mt-4 truncate text-sm font-bold text-white">{selected.name}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#71717A]">
            Selected player against the average of the other three values.
          </p>

          <dl className={`mt-4 divide-y divide-[#27272A] border-y ${HAIRLINE}`}>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                VORP value
              </dt>
              <dd className="font-mono text-sm font-bold tabular-nums text-emerald-300">
                {format(selectedValue)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                ROS projection
              </dt>
              <dd className="font-mono text-sm font-bold tabular-nums text-white">
                {format(rosProjection)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.1em] text-[#52525B]">
            {selected.team} / {selected.position}
            {selected.positionRank} / Tier {selected.tier}
          </p>
        </div>
      </div>
    </div>
  );
}

function MockDraftStage() {
  const initialBoard = useMemo(() => {
    const byAdp = [...SEED_PLAYERS]
      .filter((player) => player.adp > 0)
      .sort((a, b) => a.adp - b.adp);
    return DRAFT_PICK_NUMBERS.map((pickNumber, index) => ({
      pickNumber,
      player: byAdp[index] ?? SEED_PLAYERS[index],
    }));
  }, []);

  const [currentPick, setCurrentPick] = useState(ACTIVE_PICK_START);
  const [userPicks, setUserPicks] = useState<Array<{ pickNumber: number; playerId: string }>>([]);

  const unavailableIds = useMemo(() => {
    const ids = new Set(initialBoard.map((entry) => entry.player.id));
    for (const pick of userPicks) ids.add(pick.playerId);
    return ids;
  }, [initialBoard, userPicks]);

  const topAvailable = useMemo(() => {
    return [...SEED_PLAYERS]
      .filter((player) => player.adp > 0 && !unavailableIds.has(player.id))
      .sort((a, b) => {
        const valueDiff = valueFor(b) - valueFor(a);
        if (valueDiff !== 0) return valueDiff;
        return a.adp - b.adp;
      })[0] ?? null;
  }, [unavailableIds]);

  const lastPick = userPicks[userPicks.length - 1];
  const lastPlayer = lastPick ? SEED_BY_ID.get(lastPick.playerId) : null;
  const activeLabel = pickLabel(currentPick);
  const activeTeam = teamForPick(currentPick);
  const adpEdge = topAvailable ? currentPick - topAvailable.adp : 0;

  function draftRecommendation() {
    if (!topAvailable) return;
    setUserPicks((picks) => [
      ...picks,
      { pickNumber: currentPick, playerId: topAvailable.id },
    ]);
    setCurrentPick((pick) => pick + 1);
  }

  function resetBoard() {
    setUserPicks([]);
    setCurrentPick(ACTIVE_PICK_START);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_248px] lg:items-start">
      <div className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE}`}>
        <div className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            3-round snake / 1.01 to 2.04
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            12 teams
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-[#27272A] sm:grid-cols-4">
          {initialBoard.map(({ pickNumber, player }) => (
            <div
              key={pickNumber}
              className={`min-w-0 border-l-2 bg-[#141418] p-2.5 ${
                POSITION_BORDERS[player.position] ?? "border-l-white/30"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[8px] font-bold tabular-nums text-[#A1A1AA]">
                  {pickLabel(pickNumber)}
                </span>
                <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#52525B]">
                  T{teamForPick(pickNumber)}
                </span>
              </div>
              <p className="mt-2 truncate text-[11px] font-semibold leading-tight text-white">
                {player.name}
              </p>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span
                  className={`inline-flex h-5 w-6 items-center justify-center border font-mono text-[8px] font-bold ${
                    POSITION_STYLES[player.position] ??
                    "border-white/15 bg-white/[0.04] text-[#D4D4D8]"
                  }`}
                >
                  {player.position}
                </span>
                <span className="font-mono text-[8px] tabular-nums text-[#71717A]">
                  {format(valueFor(player))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={`border-t ${HAIRLINE} p-3`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 bg-[#EC4899]" />
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#EC4899]">
                On the clock
              </span>
              <span className="font-mono text-[11px] font-bold tabular-nums text-white">
                {activeLabel}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
                Team {activeTeam}
              </span>
            </div>

            {lastPlayer && lastPick ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#52525B]">
                  Last pick
                </span>
                <span className="truncate font-mono text-[9px] text-emerald-300">
                  {pickLabel(lastPick.pickNumber)} / {lastPlayer.name}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        aria-live="polite"
        className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE} lg:mt-7 lg:-translate-x-1`}
      >
        <div className={`flex items-center justify-between gap-2 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Pick recommendation
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            {activeLabel}
          </span>
        </div>

        {topAvailable ? (
          <div className="p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#71717A]">
              Top available
            </p>
            <div className="mt-2 flex items-center gap-2">
              <PositionTag position={topAvailable.position} />
              <p className="min-w-0 truncate text-sm font-bold text-white">
                {topAvailable.name}
              </p>
            </div>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#71717A]">
              {topAvailable.team} / ADP {format(topAvailable.adp)} / Value {format(valueFor(topAvailable))}
            </p>

            <div className={`mt-4 border-y ${HAIRLINE} py-3`}>
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#71717A]">
                ADP edge
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums tracking-[-0.04em] text-emerald-300">
                {adpEdge >= 0 ? "+" : ""}
                {format(adpEdge, 0)}
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-[#71717A]">
                Current pick minus ADP.
              </p>
            </div>

            <button
              type="button"
              onClick={draftRecommendation}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 bg-emerald-500 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#022C22] transition-colors hover:bg-emerald-400 active:bg-emerald-600"
            >
              Draft this player
              <ChevronRightIcon size={12} />
            </button>

            {userPicks.length > 0 ? (
              <button
                type="button"
                onClick={resetBoard}
                className="mt-2 inline-flex min-h-8 w-full items-center justify-center border border-[#27272A] bg-transparent px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#71717A] transition-colors hover:border-white/25 hover:text-white"
              >
                Reset board
              </button>
            ) : null}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-[#A1A1AA]">
              No players remain in this sample board.
            </p>
            <button
              type="button"
              onClick={resetBoard}
              className="mt-3 inline-flex min-h-9 items-center justify-center border border-[#27272A] px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-white hover:border-white/25"
            >
              Reset board
            </button>
          </div>
        )}
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
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_242px] lg:items-start">
      <div className={`min-w-0 border ${HAIRLINE} ${INNER_SURFACE}`}>
        <div className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} px-3 py-2.5`}>
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            Weekly matchup
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#52525B]">
            Select a row
          </span>
        </div>

        <div role="group" aria-label="Select a player for the start verdict">
          {matchups.map(({ player, opponent }) => {
            const active = player.id === selected.player.id;
            const weekly = player.weekProjection ?? player.weeklyAvg;
            return (
              <button
                key={player.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(player.id)}
                className={`grid w-full grid-cols-[32px_minmax(0,1fr)_58px] items-center gap-3 border-b border-[#27272A] px-3 py-4 text-left transition-colors last:border-b-0 ${
                  active
                    ? "bg-emerald-500/[0.07]"
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

        <div className="p-4">
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

export function SpotlightStages() {
  return (
    <section aria-label="Interactive DraftEdge tool showcase">
      <SpotlightStage
        number="01"
        eyebrow="Trade analyzer"
        headline="Value both sides."
        description="Every player gets a 0 to 100 trade value from projections, positional depth, and ADP. Select a player and the verdict card recalculates."
        href="/trade"
        linkLabel="Open the trade analyzer"
        accent="emerald"
      >
        <TradeStage />
      </SpotlightStage>

      <SpotlightStage
        number="02"
        eyebrow="Mock draft"
        headline="Practice the run."
        description="Draft against position-aware bots before your league starts its clock. The board tracks every pick and surfaces the best available player."
        href="/mock"
        linkLabel="Run a mock draft"
        accent="pink"
        reverse
      >
        <MockDraftStage />
      </SpotlightStage>

      <SpotlightStage
        number="03"
        eyebrow="Start / Sit"
        headline="Set the close calls."
        description="Compare weekly projections and opponent context before you lock a lineup. Select either row to update the start verdict."
        href="/start-sit"
        linkLabel="Open start/sit"
        accent="emerald"
      >
        <StartSitStage />
      </SpotlightStage>
    </section>
  );
}
