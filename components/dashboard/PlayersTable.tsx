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

type Row =
  | { kind: "player"; player: Player }
  | { kind: "break"; position: string; fromTier: number; toTier: number; drop: number };

// Orderings that keep tiers contiguous (overall rank, tier, or position).
// Name/ADP sorts shuffle tiers around, so a "break" there would be meaningless.
const TIER_SORTS = new Set<SortKey>(["rank", "tier", "position"]);

const rankOf = (player: Player, weekly: boolean, ros: boolean) =>
  ros ? player.rosRank ?? Number.MAX_SAFE_INTEGER : weekly ? player.weekRank ?? player.rank : player.rank;
const tierOf = (player: Player, weekly: boolean, ros: boolean) =>
  ros ? player.rosTier ?? 5 : weekly ? player.weekTier ?? player.tier : player.tier;
const projectionOf = (player: Player, weekly: boolean, ros: boolean) =>
  ros ? player.rosProjection ?? 0 : weekly ? player.weekProjection ?? 0 : player.projection;

export function PlayersTable({
  players,
  weekly = false,
  ros = false,
}: {
  players: Player[];
  weekly?: boolean;
  ros?: boolean;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });
  const { isStarred, toggleStar } = useStarredPlayers();
  const sorted = useMemo(() => {
    const { key, dir } = sort;
    return [...players].sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case "rank":
          cmp = rankOf(a, weekly, ros) - rankOf(b, weekly, ros);
          break;
        case "adp": {
          const av = a.adp === 0 ? Infinity : a.adp;
          const bv = b.adp === 0 ? Infinity : b.adp;
          cmp = av - bv;
          break;
        }
        case "projection":
          cmp = projectionOf(b, weekly, ros) - projectionOf(a, weekly, ros);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "position":
          cmp = a.position.localeCompare(b.position) ||
            (ros ? a.rosPositionRank ?? Number.MAX_SAFE_INTEGER : weekly ? a.weekPositionRank ?? a.positionRank : a.positionRank) -
              (ros ? b.rosPositionRank ?? Number.MAX_SAFE_INTEGER : weekly ? b.weekPositionRank ?? b.positionRank : b.positionRank);
          break;
        case "tier":
          cmp = tierOf(a, weekly, ros) - tierOf(b, weekly, ros) ||
            projectionOf(b, weekly, ros) - projectionOf(a, weekly, ros);
          break;
      }
      return cmp * dir;
    });
  }, [players, sort, weekly, ros]);

  // Per-position, per-tier average projection. Used to size the drop-off
  // between adjacent tiers so the number stays robust to projection noise.
  const tierAverages = useMemo(() => {
    const acc = new Map<string, { sum: number; count: number }>();
    for (const p of players) {
      const key = `${p.position}:${tierOf(p, weekly, ros)}`;
      const e = acc.get(key) ?? { sum: 0, count: 0 };
      e.sum += projectionOf(p, weekly, ros);
      e.count += 1;
      acc.set(key, e);
    }
    const avg = new Map<string, number>();
    for (const [key, e] of acc) avg.set(key, e.sum / e.count);
    return avg;
  }, [players, weekly, ros]);

  // Insert a tier-break divider between two same-position players when their
  // tier climbs, so each position's value drop-off is visible as you draft.
  const rows = useMemo<Row[]>(() => {
    if (!TIER_SORTS.has(sort.key)) return sorted.map((player) => ({ kind: "player", player }));
    const out: Row[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = sorted[i - 1];
      const tier = tierOf(p, weekly, ros);
      const previousTier = prev ? tierOf(prev, weekly, ros) : 0;
      if (prev && prev.position === p.position && previousTier < tier) {
        const hi = tierAverages.get(`${p.position}:${previousTier}`);
        const lo = tierAverages.get(`${p.position}:${tier}`);
        const drop = hi != null && lo != null ? hi - lo :
          projectionOf(prev, weekly, ros) - projectionOf(p, weekly, ros);
        out.push({ kind: "break", position: p.position, fromTier: previousTier, toTier: tier, drop });
      }
      out.push({ kind: "player", player: p });
    }
    return out;
  }, [sorted, sort.key, tierAverages, weekly, ros]);

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
                    {weekly && k === "rank" ? "Wk Rank" : ros && k === "rank" ? "ROS Rank" :
                      weekly && k === "projection" ? "Wk Proj" : ros && k === "projection" ? "ROS Proj" : SORT_LABELS[k]}
                    {sort.key === k &&
                      (sort.dir === 1 ? <ArrowUpIcon size={11} /> : <ArrowDownIcon size={11} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => {
              if (item.kind === "break") {
                return (
                  <tr key={`break-${i}`} className="border-b border-zinc-800/60">
                    <td colSpan={COLUMNS.length} className="px-3 py-1">
                      <div className="flex items-center gap-2.5">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700/70" />
                        <ArrowDownIcon size={11} className="shrink-0 text-zinc-500" />
                        <span className="font-tech whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Tier {item.fromTier} → {item.toTier}
                        </span>
                        <span
                          className={`font-tech whitespace-nowrap text-[11px] font-semibold ${
                            item.drop > 0 ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {item.drop > 0 ? "-" : "+"}
                          {Math.abs(item.drop).toFixed(1)} pts
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700/70" />
                      </div>
                    </td>
                  </tr>
                );
              }
              const p = item.player;
              return (
              <tr
                key={p.id}
                className="border-b border-zinc-800/60 transition-colors hover:bg-zinc-900/60"
              >
                <td className="border-b border-zinc-800/60 px-2.5 py-1.5">
                  <TierBadge tier={tierOf(p, weekly, ros)} size="xs" />
                </td>
                <td className="font-tech border-b border-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-400">
                  {ros ? p.rosRank ?? "—" : rankOf(p, weekly, ros)}
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
                    {projectionOf(p, weekly, ros) > 0 ? projectionOf(p, weekly, ros).toFixed(1) : "—"}
                  </span>
                  {!weekly && !ros && p.weeklyAvg > 0 && (
                    <span className="font-tech ml-1.5 text-[11px] text-zinc-500">
                      {p.weeklyAvg.toFixed(1)}/wk
                    </span>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">No players match your filters.</p>
        )}
      </div>
    </div>
  );
}
