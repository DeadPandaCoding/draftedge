"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "@/lib/types";
import { InjuryBadge, PosBadge } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { normalizeSearchText } from "@/lib/utils";

export function PlayerPicker({
  players,
  exclude,
  onPick,
  placeholder = "Search players…",
  tradeValues,
  initialQuery = "",
  previewQuery,
}: {
  players: Player[];
  exclude: Set<string>;
  onPick: (player: Player) => void;
  placeholder?: string;
  initialQuery?: string;
  previewQuery?: string;
  tradeValues?: Map<string, number>;
}) {
  const [query, setQ] = useState(initialQuery);
  const q = previewQuery ?? query;
  const [open, setOpen] = useState(Boolean(initialQuery));
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const t = normalizeSearchText(q);
    if (!t) return [];
    return players
      .filter(
        (p) =>
          !exclude.has(p.id) &&
          (normalizeSearchText(p.name).includes(t) || normalizeSearchText(p.team).includes(t))
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
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.preventDefault();
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="glass-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
        />
      </div>

      {(previewQuery !== undefined || open) && matches.length > 0 && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.12] bg-[#0B1210] shadow-xl">
          <div className="max-h-80 divide-y divide-white/[0.06] overflow-y-auto">
            {matches.map((p) => (
              <button
                key={p.id}
                data-player-result={p.id}
                type="button"
                onClick={() => {
                  onPick(p);
                  setQ("");
                  setOpen(false);
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-zinc-100">{p.name}</span>
                  <InjuryBadge status={p.injuryStatus} />
                </span>
                <span className="row-span-2"><PosBadge position={p.position} size="xs" /></span>
                <span className="row-span-2 text-right font-mono text-[11px] tabular-nums text-zinc-300">
                  <span className="block">ROS {((p.rosProjection ?? p.projection) || 0).toFixed(1)}</span>
                  <span className="text-zinc-500">VALUE {tradeValues?.get(p.id)?.toFixed(1) ?? "—"}</span>
                </span>
                <span className="min-w-0 truncate text-[10px] text-zinc-500">
                  {p.team} · BYE {p.bye || "—"} · PPG {p.usage?.games && p.actualPoints != null ? (p.actualPoints / p.usage.games).toFixed(1) : "—"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
