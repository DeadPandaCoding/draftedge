"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InjuryBadge, PosBadge } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { buildTradeValues } from "@/lib/trade-value";
import { usePlayers } from "@/lib/players";
import { playerSlug } from "@/lib/seed-data";
import { useSyncedLeagues } from "@/lib/league-context";

export function PlayerQuickSearch() {
  const { activeLeague } = useSyncedLeagues();
  const scoring = activeLeague?.scoring_format === "Half-PPR" ? "half_ppr" : activeLeague?.scoring_format === "Standard" ? "standard" : "ppr";
  const { players, loading } = usePlayers(scoring);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = "player-command-results";

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return players
      .filter((player) => `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(term))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 7);
  }, [players, query]);
  const values = useMemo(() => buildTradeValues(players.map((player) => ({
    ...player,
    projection: player.rosProjection ?? player.projection,
  })), activeLeague?.total_teams ?? 12), [players, activeLeague?.total_teams]);
  const selectedPlayer = matches.find((player) => player.id === selectedId) ?? null;
  const isOpen = Boolean(query.trim());

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement)) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        focusSearch();
      }
    };
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, [focusSearch]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
        setSelectedId(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuery("");
        setSelectedId(null);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const choose = (playerId: string) => {
    setActiveIndex(Math.max(0, matches.findIndex((player) => player.id === playerId)));
    setSelectedId(playerId);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <SearchIcon size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setSelectedId(null); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && matches.length) {
              event.preventDefault();
              const next = Math.min(activeIndex + 1, matches.length - 1);
              setActiveIndex(next);
              setSelectedId(null);
            } else if (event.key === "ArrowUp" && matches.length) {
              event.preventDefault();
              const next = Math.max(0, activeIndex - 1);
              setActiveIndex(next);
              setSelectedId(null);
            } else if (event.key === "Enter" && matches.length) {
              event.preventDefault();
              choose(matches[activeIndex].id);
            }
          }}
          placeholder="Search any player for stats, ROS projections, trade value..."
          aria-label="Search NFL players"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={isOpen && matches.length && !selectedPlayer ? resultsId : undefined}
          aria-expanded={isOpen && !selectedPlayer}
          aria-activedescendant={isOpen && !selectedPlayer && matches[activeIndex] ? `player-option-${matches[activeIndex].id}` : undefined}
          className="h-10 w-full rounded-lg border border-white/[0.1] bg-[#0D1412] pl-10 pr-3 xl:pr-14 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500/50"
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-white/[0.1] bg-[#080E0C] px-1.5 py-1 font-mono text-[9px] text-zinc-500 xl:block">⌘K / /</kbd>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70dvh] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#0B1210] shadow-2xl">
          {loading && players.length === 0 ? (
            <p className="px-4 py-5 text-sm text-zinc-400">Loading player data…</p>
          ) : matches.length ? (
            <div>
              {!selectedPlayer && <div id={resultsId} role="listbox" aria-label="Player search results" className="max-h-80 overflow-y-auto border-b border-white/[0.08] divide-y divide-white/[0.06] md:border-b-0 md:border-r">
                {matches.map((player, index) => (
                  <button
                    id={`player-option-${player.id}`}
                    key={player.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => { setActiveIndex(index); }}
                    onFocus={() => { setActiveIndex(index); }}
                    onClick={() => choose(player.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${activeIndex === index ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.03]"}`}
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-zinc-100">{player.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-500">{player.position} · {player.team}</span>
                  </button>
                ))}
              </div>}

              {selectedPlayer && (
                <section aria-label={`${selectedPlayer.name} quick view`} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-white">{selectedPlayer.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PosBadge position={selectedPlayer.position} size="xs" />
                        <span className="font-mono text-xs text-zinc-400">{selectedPlayer.team} · Bye {selectedPlayer.bye || "—"}</span>
                        {selectedPlayer.injuryStatus ? <InjuryBadge status={selectedPlayer.injuryStatus} /> : <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">Healthy</span>}
                      </div>
                    </div>
                    <Link href={`/players/${playerSlug(selectedPlayer.name)}`} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">Full profile →</Link>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06] sm:grid-cols-3">
                    {[
                      ["Season PPG", selectedPlayer.usage?.games && selectedPlayer.actualPoints != null ? (selectedPlayer.actualPoints / selectedPlayer.usage.games).toFixed(1) : "—"],
                      ["ROS Projected Points", selectedPlayer.rosProjection?.toFixed(1) ?? "—"],
                      ["VORP Trade Value", (values.get(selectedPlayer.id) ?? 0).toFixed(1)],
                      ["Position Rank", `#${selectedPlayer.rosPositionRank ?? selectedPlayer.positionRank}`],
                      ["ADP", selectedPlayer.adp > 0 ? selectedPlayer.adp.toFixed(1) : "—"],
                      ["Actual Points", selectedPlayer.actualPoints != null ? selectedPlayer.actualPoints.toFixed(1) : "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[#0D1412] px-3 py-2.5">
                        <dt className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</dt>
                        <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-100">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link onNavigate={(event) => {
                      if (window.location.pathname === "/trade") {
                        event.preventDefault();
                        window.dispatchEvent(new CustomEvent("draftedge:select-player", { detail: selectedPlayer.id }));
                        setQuery("");
                        setSelectedId(null);
                      }
                    }} href={`/trade?get=${encodeURIComponent(playerSlug(selectedPlayer.name))}`} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">Add to Trade Analyzer</Link>
                    <Link onNavigate={(event) => {
                      if (window.location.pathname === "/start-sit") {
                        event.preventDefault();
                        window.dispatchEvent(new CustomEvent("draftedge:select-player", { detail: selectedPlayer.id }));
                        setQuery("");
                        setSelectedId(null);
                      }
                    }} href={`/start-sit?player=${encodeURIComponent(playerSlug(selectedPlayer.name))}`} className="rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-emerald-500/30 hover:text-white">Compare in Start/Sit</Link>
                  </div>
                </section>
              )}
            </div>
          ) : <p className="px-4 py-5 text-sm text-zinc-400">No players match “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
