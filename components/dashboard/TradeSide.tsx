import { PlayerPicker } from "./PlayerPicker";
import { PosBadge, InjuryBadge } from "@/components/ui";
import { XIcon } from "@/components/icons";
import { formatPositiveStat } from "@/lib/player-display";
import type { Player } from "@/lib/types";
import type { FantasyCalcEntry } from "@/lib/fantasycalc";
import type { PlayerMatchupContext } from "@/lib/matchup-context";

type Side = "A" | "B";
interface Props {
  side: Side; title: string; list: Player[]; totalValue: number; totalProj: number; fcTotal?: number;
  players: Player[]; excluded: Set<string>; values: Map<string, number>; contexts: Map<string, PlayerMatchupContext>;
  fcEntryMap?: Map<string, FantasyCalcEntry>; fcValueOf?: (id: string) => number;
  myPlayerIds?: Set<string>; myRosterPlayers?: Player[]; initialQuery?: string;
  add: (side: Side, player: Player) => void; remove: (side: Side, id: string) => void;
}
export function TradeSide({ side, title, list, totalValue, totalProj, fcTotal = 0, players, excluded, values, contexts, fcEntryMap, fcValueOf, myPlayerIds, myRosterPlayers = [], initialQuery, add, remove }: Props) {
  const valueOf = (id: string) => values.get(id) ?? 0;
  const playerRow = (p: Player, side: Side) => {
    const fcVal = fcValueOf?.(p.id) ?? 0;
    const fcEntry = fcEntryMap?.get(p.id);
    return (
      <div key={p.id} className="rounded-lg bg-zinc-900/60 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-zinc-200">{p.name}</span>
            <InjuryBadge status={p.injuryStatus} />
            <PosBadge position={p.position} size="xs" />
            {side === "A" && myPlayerIds?.has(p.id) && (
              <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/30">
                Already owned
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-tech text-sm font-bold text-emerald-300">{valueOf(p.id).toFixed(1)}</span>
            {fcVal > 0 && (
              <span className="font-tech text-[11px] font-semibold text-cyan-300/80">
                {fcVal.toFixed(1)} <span className="text-[9px] text-zinc-500">FC</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(side, p.id)}
              aria-label={`Remove ${p.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
            >
              <XIcon size={13} />
            </button>
          </div>
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-500">
          {(contexts.get(p.id)?.adjustedRosPoints ?? p.projection).toFixed(1)} ROS pts · ADP {formatPositiveStat(p.adp)}
          {fcEntry && (
            <>
              <span className="mx-1">·</span>
              FC Rank #{fcEntry.overallRank}
              {fcEntry.trend30Day !== 0 && (
                <span className={`ml-1 ${fcEntry.trend30Day > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {fcEntry.trend30Day > 0 ? "↑" : "↓"}{Math.abs(fcEntry.trend30Day)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h2>
        <div className="text-right">
          <span className="font-mono text-lg font-bold tabular-nums text-emerald-300">
            {totalValue.toFixed(1)} <span className="text-[10px] font-semibold text-zinc-500">VALUE</span>
          </span>
          {fcTotal > 0 && (
            <span className="ml-2 font-tech text-sm font-semibold text-cyan-300/80">
              {fcTotal.toFixed(1)} <span className="text-[10px] text-zinc-500">FC</span>
            </span>
          )}
        </div>
      </div>
      {side === "B" && myRosterPlayers.length > 0 && (
        <div className="mb-3">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Your roster
          </span>
          <div className="flex flex-wrap gap-1.5">
            {myRosterPlayers.map((p) => {
              const added = excluded.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(side, p)}
                  disabled={added}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    added
                      ? "border-zinc-700 bg-zinc-800/40 text-zinc-500"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/60 hover:bg-emerald-500/20"
                  }`}
                >
                  {p.name}
                  <span className="text-[10px] text-zinc-400">{p.position}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mb-3">
        <PlayerPicker initialQuery={initialQuery}
          players={players}
          exclude={excluded}
          tradeValues={values}
          onPick={(p) => add(side, p)}
          placeholder={side === "A" ? "Add players you receive…" : "Add players you give up…"}
        />
      </div>
      <div className="space-y-1.5">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700/60 px-3 py-4 text-center text-xs text-zinc-500">
            No players added yet.
          </p>
        ) : (
          list.map((p) => playerRow(p, side))
        )}
      </div>
      {list.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <span>Projection</span>
          <span className="font-tech font-semibold text-zinc-200">{totalProj.toFixed(1)} pts</span>
        </div>
      )}
    </div>
  );

}
