"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon, ClockIcon, SearchIcon, SwapIcon } from "@/components/icons";
import { usePlayers } from "@/lib/players";
import { getSeedPlayers, playerSlug } from "@/lib/seed-data";
import { buildTradeValues } from "@/lib/trade-value";
import { normalizeSearchText } from "@/lib/utils";
import type { Player } from "@/lib/types";

const POSITION_STYLES: Record<string, string> = {
  QB: "border-rose-400/25 bg-rose-400/[0.08] text-rose-300",
  RB: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300",
  WR: "border-sky-400/25 bg-sky-400/[0.08] text-sky-300",
  TE: "border-amber-400/25 bg-amber-400/[0.08] text-amber-300",
  K: "border-violet-400/25 bg-violet-400/[0.08] text-violet-300",
  DEF: "border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-300",
};

function positionClass(position: string) {
  return POSITION_STYLES[position] ?? "border-white/[0.12] bg-white/[0.04] text-[#D4D4D8]";
}

function number(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function rankLabel(player: Player) {
  return player.rank > 0 ? `#${player.rank} overall` : "Unranked";
}

export function LandingPlayerLookup() {
  const seedPlayers = useMemo(() => getSeedPlayers("ppr"), []);
  const { players: livePlayers, source, loading } = usePlayers("ppr");
  const players = livePlayers.length ? livePlayers : seedPlayers;
  const values = useMemo(() => buildTradeValues(players, 12), [players]);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = "landing-player-results";

  const matches = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return [];
    return players
      .filter((player) =>
        normalizeSearchText(`${player.name} ${player.team} ${player.position}`).includes(term),
      )
      .sort((a, b) => {
        if (a.rank > 0 && b.rank > 0) return a.rank - b.rank;
        if (a.rank > 0) return -1;
        if (b.rank > 0) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [players, query]);

  const selected =
    players.find((player) => player.id === selectedId) ?? players[0] ?? null;
  const isOpen = query.trim().length > 0;
  const activeMatch = matches[activeIndex];

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
        setActiveIndex(0);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  function choose(playerId: string) {
    setSelectedId(playerId);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  const selectedValue = selected ? values.get(selected.id) ?? 0 : 0;
  const sourceLabel = loading
    ? "Refreshing the player board…"
    : source === "live"
      ? "Live player feed"
      : "2026 baseline board";

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[650px] lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute -inset-x-6 -top-8 bottom-8 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.09),transparent_62%)]"
      />

      <div className="relative border border-white/[0.1] bg-[#111214] shadow-[0_32px_90px_-38px_rgba(0,0,0,0.95)]">
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">
              Player value lookup
            </p>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#71717A]">
              PPR · 12 team
            </span>
          </div>

          <div className="relative mt-4">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (!isOpen) return;
                if (event.key === "ArrowDown" && matches.length) {
                  event.preventDefault();
                  setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
                } else if (event.key === "ArrowUp" && matches.length) {
                  event.preventDefault();
                  setActiveIndex((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter" && activeMatch) {
                  event.preventDefault();
                  choose(activeMatch.id);
                } else if (event.key === "Escape") {
                  setQuery("");
                  setActiveIndex(0);
                }
              }}
              placeholder="Search any player or team"
              aria-label="Search any NFL player"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={isOpen ? resultsId : undefined}
              aria-expanded={isOpen}
              aria-activedescendant={isOpen && activeMatch ? `landing-player-${activeMatch.id}` : undefined}
              className="h-12 w-full border border-white/[0.1] bg-[#09090B] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-[#71717A] hover:border-white/[0.18] focus:border-emerald-400/60"
            />

            {isOpen && (
              <div
                id={resultsId}
                role="listbox"
                aria-label="Player search results"
                className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto border border-white/[0.12] bg-[#111214] shadow-2xl"
              >
                {matches.length ? (
                  matches.map((player, index) => (
                    <button
                      key={player.id}
                      id={`landing-player-${player.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      onClick={() => choose(player.id)}
                      className={`flex w-full items-center gap-3 border-b border-white/[0.06] px-3.5 py-3 text-left transition last:border-b-0 ${
                        index === activeIndex ? "bg-white/[0.055]" : "hover:bg-white/[0.025]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-8 shrink-0 items-center justify-center border font-mono text-[9px] font-bold ${positionClass(player.position)}`}
                      >
                        {player.position}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {player.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.1em] text-[#71717A]">
                          {player.team} · {rankLabel(player)}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-emerald-300">
                        {(values.get(player.id) ?? 0).toFixed(1)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-5 text-sm text-[#A1A1AA]">
                    No players match “{query}”. Try a last name or team.
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#71717A]">
            Name, team, or position · {sourceLabel}
          </p>
        </div>

        {selected ? (
          <div key={selected.id} className="landing-panel-in p-4 sm:p-5">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`flex h-6 w-8 items-center justify-center border font-mono text-[9px] font-bold ${positionClass(selected.position)}`}
                  >
                    {selected.position}
                  </span>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#A1A1AA]">
                    {selected.team}
                    {selected.bye > 0 ? ` · Bye ${selected.bye}` : ""}
                  </span>
                </div>
                <h3 className="mt-2 truncate font-display text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl">
                  {selected.name}
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#71717A]">
                  {rankLabel(selected)}
                  {selected.positionRank > 0 ? ` · ${selected.position}${selected.positionRank}` : ""}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#71717A]">
                  VORP value
                </p>
                <p className="mt-1 font-display text-4xl font-extrabold tabular-nums tracking-[-0.04em] text-emerald-300">
                  {number(selectedValue)}
                </p>
              </div>
            </div>

            <div
              role="img"
              aria-label={`${selected.name} has a VORP trade value of ${number(selectedValue)} out of 100`}
              className="mt-5 h-1.5 overflow-hidden bg-white/[0.08]"
            >
              <span
                className="block h-full bg-emerald-400"
                style={{ width: `${Math.max(0, Math.min(100, selectedValue))}%` }}
              />
            </div>

            <dl className="mt-5 grid grid-cols-3 border border-white/[0.08] bg-[#0B0B0D]">
              {[
                ["Season proj", number(selected.projection)],
                ["ADP", selected.adp > 0 ? number(selected.adp) : "—"],
                ["Tier", selected.tier > 0 ? `T${selected.tier}` : "—"],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`min-w-0 px-3 py-3 ${index > 0 ? "border-l border-white/[0.08]" : ""}`}
                >
                  <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#71717A]">
                    {label}
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/trade?get=${encodeURIComponent(playerSlug(selected.name))}&scoring=ppr`}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#022C22] transition hover:bg-emerald-400"
              >
                <SwapIcon size={14} />
                Analyze this trade value
              </Link>
              <Link
                href="/mock"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-white/[0.12] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-[#D4D4D8] transition hover:border-white/[0.22] hover:bg-white/[0.05] hover:text-white"
              >
                <ClockIcon size={14} />
                Start a mock draft
              </Link>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3 sm:px-5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#71717A]">
            {players.length.toLocaleString()} players on the board
          </span>
          <Link
            href="/rankings"
            className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#A1A1AA] transition hover:text-white"
          >
            Full rankings <ChevronRightIcon size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
