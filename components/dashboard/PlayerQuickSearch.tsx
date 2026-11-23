"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { usePlayers } from "@/lib/players";
import { playerSlug } from "@/lib/seed-data";

export function PlayerQuickSearch() {
  const { players } = usePlayers("ppr");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return players
      .filter((player) => `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(term))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);
  }, [players, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        placeholder="Jump to player stats, trade value, or rank..."
        aria-label="Search players"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="player-quick-search-results"
        aria-expanded={open && Boolean(query.trim())}
        className="w-full rounded-lg border border-white/[0.08] bg-[#0D1412] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-emerald-500/40"
      />
      {open && query.trim() && (
        <div id="player-quick-search-results" role="listbox" className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-xl border border-white/[0.1] bg-[#0B1210] shadow-xl">
          {matches.length ? matches.map((player) => (
            <Link
              key={player.id}
              href={`/players/${playerSlug(player.name)}`}
              role="option"
              aria-selected="false"
              onClick={() => { setOpen(false); setQuery(""); }}
              className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2.5 last:border-0 hover:bg-white/[0.04]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-100">{player.name}</span>
                <span className="text-[11px] text-zinc-500">{player.team} · {player.position}</span>
              </span>
              <span className="shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-300">
                <span className="block">RK {player.rank}</span>
                <span className="text-zinc-500">ROS {(player.rosProjection ?? player.projection).toFixed(1)}</span>
              </span>
            </Link>
          )) : <p className="px-3 py-3 text-xs text-zinc-500">No matching players.</p>}
        </div>
      )}
    </div>
  );
}
