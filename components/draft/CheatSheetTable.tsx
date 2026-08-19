"use client";

import { useMemo, useState } from "react";
import type { DraftState, PickOwner, Player } from "@/lib/types";
import { isDrafted } from "@/lib/draft";
import { TierBadge, PosBadge } from "@/components/ui";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { DraftAction } from "./DraftAction";

type SortKey = "rank" | "adp" | "projection" | "weeklyAvg" | "name" | "position" | "tier";

const SORT_LABEL: Record<SortKey, string> = {
  rank: "Rank",
  adp: "ADP",
  projection: "Proj",
  weeklyAvg: "Wk",
  name: "Player",
  position: "Pos",
  tier: "Tier",
};

function SortableTh({
  label,
  k,
  sort,
  onSort,
  className = "",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <th className={`sticky top-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-2 backdrop-blur ${className}`}>
      <button
        onClick={() => onSort(k)}
        className={`font-tech inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition hover:text-zinc-200 ${
          sort.key === k ? "text-emerald-300" : "text-zinc-500"
        }`}
      >
        {label}
        {sort.key === k &&
          (sort.dir === 1 ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />)}
      </button>
    </th>
  );
}

export function CheatSheetTable({
  players,
  state,
  onDraft,
  onUndraft,
  onNote,
}: {
  players: Player[];
  state: DraftState;
  onDraft: (playerId: string, owner: PickOwner) => void;
  onUndraft: (playerId: string) => void;
  onNote: (playerId: string, note: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    return [...players].sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "adp": {
          const av = a.adp === 0 ? Infinity : a.adp;
          const bv = b.adp === 0 ? Infinity : b.adp;
          cmp = av - bv;
          break;
        }
        case "projection":
          cmp = a.projection - b.projection;
          break;
        case "weeklyAvg":
          cmp = a.weeklyAvg - b.weeklyAvg;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "position":
          cmp = a.position.localeCompare(b.position) || a.positionRank - b.positionRank;
          break;
        case "tier":
          cmp = a.tier - b.tier || b.projection - a.projection;
          break;
      }
      return cmp * dir;
    });
  }, [players, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="font-tech sticky left-0 top-0 z-20 whitespace-nowrap bg-zinc-950 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Draft
            </th>
            <SortableTh label="Tier" k="tier" sort={sort} onSort={toggleSort} />
            <SortableTh label={SORT_LABEL.rank} k="rank" sort={sort} onSort={toggleSort} />
            <SortableTh label={SORT_LABEL.adp} k="adp" sort={sort} onSort={toggleSort} />
            <SortableTh
              label={SORT_LABEL.name}
              k="name"
              sort={sort}
              onSort={toggleSort}
              className="text-left"
            />
            <SortableTh label={SORT_LABEL.position} k="position" sort={sort} onSort={toggleSort} />
            <SortableTh
              label={`${SORT_LABEL.projection} / Wk`}
              k="projection"
              sort={sort}
              onSort={toggleSort}
            />
            <th className="font-tech sticky top-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 backdrop-blur">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const drafted = isDrafted(state, p.id);
            return (
              <tr
                key={p.id}
                className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/60 ${
                  drafted ? "opacity-40" : ""
                }`}
              >
                <td className="sticky left-0 z-10 border-b border-zinc-800/60 bg-[#02020a] px-2.5 py-1.5">
                  <DraftAction player={p} state={state} onDraft={onDraft} onUndraft={onUndraft} />
                </td>
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <TierBadge tier={p.tier} size="xs" />
                </td>
                <td className="font-tech border-b border-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-400">
                  {p.rank}
                </td>
                <td className="font-tech border-b border-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-400">
                  {p.adp > 0 ? p.adp.toFixed(1) : "—"}
                </td>
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold text-zinc-100 ${drafted ? "line-through" : ""}`}>
                      {p.name}
                    </span>
                    <span className="rounded bg-zinc-800 px-1 py-px text-[10px] font-bold text-zinc-400">
                      {p.team}
                    </span>
                    {p.bye > 0 && (
                      <span
                        className="rounded bg-zinc-800/80 px-1 py-px text-[10px] font-semibold text-zinc-500"
                        title={`Bye week ${p.bye}`}
                      >
                        BYE {p.bye}
                      </span>
                    )}
                  </div>
                </td>
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <PosBadge position={p.position} size="xs" />
                </td>
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <span className="font-tech font-semibold text-zinc-200">
                    {p.projection > 0 ? p.projection.toFixed(1) : "—"}
                  </span>
                  {p.weeklyAvg > 0 && (
                    <span className="font-tech ml-1.5 text-[11px] text-zinc-500">
                      {p.weeklyAvg.toFixed(1)}/wk
                    </span>
                  )}
                </td>
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <input
                    value={state.notes[p.id] ?? ""}
                    onChange={(e) => onNote(p.id, e.target.value)}
                    placeholder="Add note…"
                    className="w-full min-w-[140px] rounded-md border border-transparent bg-zinc-800/40 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:bg-zinc-800/80 focus:ring-2 focus:ring-amber-400/20"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-500">
          No players match your filters.
        </p>
      )}
    </div>
  );
}
