"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "@/lib/types";
import { PosBadge } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export function PlayerPicker({
  players,
  exclude,
  onPick,
  placeholder = "Search players…",
}: {
  players: Player[];
  exclude: Set<string>;
  onPick: (player: Player) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return players
      .filter(
        (p) =>
          !exclude.has(p.id) &&
          (p.name.toLowerCase().includes(t) || p.team.toLowerCase().includes(t))
      )
      .sort((a, b) => b.projection - a.projection)
      .slice(0, 8);
  }, [q, players, exclude]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <div className="relative">
        <SearchIcon
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="glass-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
        />
      </div>

      {open && matches.length > 0 && (
        <div className="glass-strong absolute z-40 mt-2 w-full overflow-hidden rounded-xl">
          <div className="max-h-64 overflow-y-auto p-1">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p);
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-zinc-100">{p.name}</span>
                  <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                    {p.team}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <PosBadge position={p.position} size="xs" />
                  <span className="font-tech text-xs text-zinc-400">{p.projection.toFixed(1)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
