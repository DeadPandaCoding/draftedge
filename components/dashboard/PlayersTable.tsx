"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/types";
import { TierBadge, PosBadge } from "@/components/ui";
import { ArrowDownIcon, ArrowUpIcon, StarIcon } from "@/components/icons";
import { playerSlug } from "@/lib/seed-data";
import { useStarredPlayers } from "@/lib/stars";

type SortKey = "rank" | "adp" | "projection" | "name" | "position" | "tier";

const SORT_LABELS: Record<SortKey, string> = {
  tier: "Tier",
  rank: "Rank",
  adp: "ADP",
  name: "Player",
  position: "Pos",
  projection: "Proj",
};

const COLUMNS: SortKey[] = ["tier", "rank", "adp", "name", "position", "projection"];

export function PlayersTable({ players }: { players: Player[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });
  const { isStarred, toggleStar } = useStarredPlayers();

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

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="glass-strong overflow-hidden rounded-2xl">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {COLUMNS.map((k) => (
                <th
                  key={k}
                  className="sticky top-0 z-10 whitespace-nowrap bg-zinc-950/95 px-3 py-2 backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => toggle(k)}
                    className={`font-tech inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition hover:text-zinc-200 ${
                      sort.key === k ? "text-emerald-300" : "text-zinc-500"
                    }`}
                  >
                    {SORT_LABELS[k]}
                    {sort.key === k &&
                      (sort.dir === 1 ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/60"
              >
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
                    <button
                      type="button"
                      onClick={() => toggleStar(p.name)}
                      aria-pressed={isStarred(p.name)}
                      aria-label={`${isStarred(p.name) ? "Remove" : "Add"} ${p.name} ${
                        isStarred(p.name) ? "from" : "to"
                      } starred players`}
                      className={`shrink-0 rounded-md p-0.5 transition ${
                        isStarred(p.name)
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <StarIcon size={14} fill={isStarred(p.name) ? "currentColor" : "none"} />
                    </button>
                    <Link
                      href={`/players/${playerSlug(p.name)}`}
                      className="font-semibold text-zinc-100 transition hover:text-emerald-300"
                    >
                      {p.name}
                    </Link>
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
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">No players match your filters.</p>
        )}
      </div>
    </div>
  );
}
