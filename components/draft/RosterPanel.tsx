"use client";

import type { DraftState, LeagueConfig, Player, RosterEntry } from "@/lib/types";
import type { NeedsWarning } from "@/lib/draft";
import { PosBadge } from "@/components/ui";
import { CheckIcon, UsersIcon } from "@/components/icons";

const GROUP_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF", "BENCH"] as const;
const GROUP_LABEL: Record<string, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
  FLEX: "Flex",
  K: "Kicker",
  DEF: "Team Defense",
  BENCH: "Bench",
};

export function RosterPanel({
  entries,
  playersById,
  needs,
  best,
  picks,
  league,
  onDraftBest,
}: {
  entries: RosterEntry[];
  playersById: Map<string, Player>;
  needs: NeedsWarning[];
  best: Player[];
  picks: DraftState["picks"];
  league: LeagueConfig;
  onDraftBest: (playerId: string) => void;
}) {
  const totalProjection = entries.reduce((sum, e) => {
    const p = playersById.get(e.playerId);
    return sum + (p?.projection ?? 0);
  }, 0);

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    entries: entries.filter((e) => e.slot.startsWith(g)),
  }));

  const recent = [...picks].sort((a, b) => b.pickNumber - a.pickNumber).slice(0, 8);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Needs warnings */}
      {needs.length > 0 && (
        <div className="space-y-2">
          {needs.map((n, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                n.critical
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-200"
              }`}
            >
              <span className="mt-px font-bold">⚠</span>
              <div>
                <p className="font-bold">{n.label}</p>
                <p className="opacity-80">{n.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roster header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-wider text-zinc-300">
            My Roster
          </h2>
          <span className="font-mono text-xs text-zinc-500">
            {entries.length}/{league.rounds} drafted
          </span>
        </div>
        {totalProjection > 0 && (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Projected total:{" "}
            <span className="font-mono font-bold text-emerald-300">
              {totalProjection.toFixed(0)}
            </span>{" "}
            pts
          </p>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-4">
        {grouped.map(({ group, entries: groupEntries }) => {
          const need = league.roster[group.toLowerCase() as keyof typeof league.roster] ?? 0;
          return (
            <div key={group}>
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="font-tech text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  {GROUP_LABEL[group]}
                </h3>
                <span className="text-[10px] text-zinc-600">
                  {groupEntries.length}/{need}
                </span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: Math.max(need, 1) }).map((_, i) => {
                  const entry = groupEntries[i];
                  const p = entry ? playersById.get(entry.playerId) : undefined;
                  if (!entry || !p) {
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-dashed border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-600"
                      >
                        <span className="font-semibold">
                          {group === "QB" || group === "K" || group === "DEF"
                            ? group
                            : `${group}${i + 1}`}
                        </span>
                        <span>Empty</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="glass flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-zinc-100">
                          <span className="mr-1.5 text-[10px] font-semibold text-zinc-500">
                            {entry.slot}
                          </span>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {p.team}
                          {p.bye > 0 ? ` · BYE ${p.bye}` : ""} ·{" "}
                          <span className="font-mono text-zinc-400">
                            {p.projection > 0 ? p.projection.toFixed(0) : "—"} pts
                          </span>
                        </p>
                      </div>
                      <PosBadge position={p.position} size="xs" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Best available */}
      {best.length > 0 && (
        <div>
          <h3 className="font-tech mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <CheckIcon size={12} className="text-emerald-400" />
            Best Available
          </h3>
          <div className="space-y-1.5">
            {best.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="glass flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-200">{p.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {p.team} · <span className="font-mono">{p.projection > 0 ? p.projection.toFixed(0) : "—"} pts</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <PosBadge position={p.position} size="xs" />
                  <button
                    onClick={() => onDraftBest(p.id)}
                    title={`Draft ${p.name} to my team`}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <CheckIcon size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent picks */}
      <div>
        <h3 className="font-tech mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <UsersIcon size={12} className="text-zinc-400" />
          Draft Log
        </h3>
        {recent.length === 0 ? (
          <p className="text-xs text-zinc-600">No picks logged yet. Click “Draft” next to a player.</p>
        ) : (
          <div className="space-y-1">
            {recent.map((pick) => {
              const p = playersById.get(pick.playerId);
              return (
                <div
                  key={`${pick.playerId}-${pick.pickNumber}`}
                  className="flex items-center justify-between rounded-md bg-zinc-900/40 px-2 py-1 text-[11px]"
                >
                  <span className="font-mono text-zinc-500">
                    R{pick.round} · P{pick.pickNumber}
                  </span>
                  <span className="truncate px-1 font-semibold text-zinc-300">
                    {p?.name ?? pick.playerId}
                  </span>
                  <span
                    className={`shrink-0 font-bold ${
                      pick.owner === "me" ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  >
                    {pick.owner === "me" ? "Me" : "Opp"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
