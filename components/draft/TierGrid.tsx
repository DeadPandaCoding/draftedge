"use client";

import { useMemo } from "react";
import type { DraftState, PickOwner, Player } from "@/lib/types";
import { isDrafted } from "@/lib/draft";
import { PosBadge, TierBadge } from "@/components/ui";
import { TIER_STYLES } from "@/lib/tiers";
import { DraftAction } from "./DraftAction";

export function TierGrid({
  players,
  state,
  onDraft,
  onUndraft,
}: {
  players: Player[];
  state: DraftState;
  onDraft: (playerId: string, owner: PickOwner) => void;
  onUndraft: (playerId: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<number, Player[]>();
    for (const p of players) {
      const list = map.get(p.tier) ?? [];
      list.push(p);
      map.set(p.tier, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([tier, list]) => ({
        tier,
        players: [...list].sort((a, b) => b.projection - a.projection),
      }));
  }, [players]);

  return (
    <div className="h-full space-y-8 overflow-y-auto p-4">
      {groups.map(({ tier, players: group }) => {
        const style = TIER_STYLES[tier] ?? TIER_STYLES[5];
        return (
          <section key={tier}>
            <div className="mb-3 flex items-center gap-3">
              <TierBadge tier={tier} />
              <h3 className="font-tech text-xs font-bold uppercase tracking-widest text-zinc-400">
                {style.label} · {group.length} player{group.length === 1 ? "" : "s"}
              </h3>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {group.map((p) => {
                const drafted = isDrafted(state, p.id);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border bg-zinc-900/70 p-3 transition hover:bg-zinc-900 ${style.border} ${
                      tier === 1 ? style.glow : ""
                    } ${drafted ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold text-zinc-100 ${drafted ? "line-through" : ""}`}>
                          {p.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <span className="rounded bg-zinc-800 px-1 py-px font-bold text-zinc-400">
                            {p.team}
                          </span>
                          {p.bye > 0 && <span>BYE {p.bye}</span>}
                        </p>
                      </div>
                      <PosBadge position={p.position} size="xs" />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
                        <span>
                          ADP <span className="font-semibold text-zinc-300">{p.adp > 0 ? p.adp.toFixed(1) : "—"}</span>
                        </span>
                        <span>
                          Proj{" "}
                          <span className="font-semibold text-zinc-200">
                            {p.projection > 0 ? p.projection.toFixed(0) : "—"}
                          </span>
                        </span>
                      </div>
                      <DraftAction player={p} state={state} onDraft={onDraft} onUndraft={onUndraft} />
                    </div>
                    {state.notes[p.id] && (
                      <p className="mt-2 truncate rounded-md bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-400/20">
                        📝 {state.notes[p.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {groups.length === 0 && (
        <p className="py-16 text-center text-sm text-zinc-500">No players match your filters.</p>
      )}
    </div>
  );
}
