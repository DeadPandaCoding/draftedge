import { XIcon } from "@/components/icons";
import { InjuryBadge, PosBadge } from "@/components/ui";
import { formatPositiveStat } from "@/lib/player-display";
import { getWeeklyInjuryMultiplier, type PlayerMatchupContext, type startSitConfidence } from "@/lib/matchup-context";
import type { Player } from "@/lib/types";

const statRow = (label: string, value: string, highlight = false) => (
  <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 py-2 last:border-0">
    <span className="text-xs text-zinc-500">{label}</span>
    <span className={`font-tech text-sm font-semibold ${highlight ? "text-emerald-300" : "text-zinc-200"}`}>
      {value}
    </span>
  </div>
);

export function StartSitPlayerCard({ p, label, onClear, contexts, winner, useWeek, isOnBye, weeklyScore, values }: {
  p: Player; label: string; onClear: () => void; contexts: Map<string, PlayerMatchupContext>;
  winner: Player | null; useWeek: boolean; isOnBye: (p: Player) => boolean;
  weeklyScore: (p: Player) => number | null; values: Map<string, number>;
}) {
  return (
    <div className="glass-strong flex flex-col rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {label}
        </h2>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${p.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
        >
          <XIcon size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="truncate text-lg font-bold text-white">{p.name}</span>
        <InjuryBadge status={p.injuryStatus} />
        <PosBadge position={p.position} size="sm" />
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {p.team} · ADP {formatPositiveStat(p.adp)}
      </div>
      <div className="mt-4">
        {statRow("ROS projection", `${(contexts.get(p.id)?.adjustedRosPoints ?? p.projection).toFixed(1)} pts`, winner === p)}
        {useWeek && statRow(
          `This week${
            getWeeklyInjuryMultiplier(p.injuryStatus, isOnBye(p)) === 0
              ? " · SIT"
              : contexts.get(p.id)?.weeklyPointsEstimated
                ? " (season-avg estimate)"
                : " (adjusted)"
          }`,
          weeklyScore(p) == null ? "Unavailable" : `${weeklyScore(p)!.toFixed(1)} pts`,
          winner === p,
        )}
        {statRow("Weekly avg", p.weeklyAvg > 0 ? `${p.weeklyAvg.toFixed(1)} pts` : "Unavailable")}
        {statRow("Season PPG", contexts.get(p.id)?.ppg == null ? "Unavailable" : `${contexts.get(p.id)!.ppg!.toFixed(1)} pts`)}
        {statRow("Opponent rank", "Unavailable")}
        {statRow("Trade value", (values.get(p.id) ?? 0).toFixed(1))}
        {statRow("Tier", `T${p.tier}`)}
        {statRow("Position rank", `#${p.positionRank}`)}
        {(contexts.get(p.id)?.reasonTags ?? []).map((tag) => <p key={tag} className="mt-2 rounded border border-white/[0.08] px-2 py-1 text-[10px] text-zinc-300">{tag}</p>)}
      </div>
    </div>
  );
}

export function StartSitVerdict({ band, winner, aScore, bScore, diff, contexts, useWeek }: {
  band: ReturnType<typeof startSitConfidence>; winner: Player; aScore: number | null; bScore: number | null;
  diff: number; contexts: Map<string, PlayerMatchupContext>; useWeek: boolean;
}) {
  return (
    <div className={`mt-6 rounded-2xl border p-6 ${band.cls}`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className={`font-display text-2xl font-bold ${band.cls.split(" ")[0]}`}>
          Start {winner.name}
        </span>
        <p className="text-sm text-zinc-300">{band.detail}</p>
        <p className="font-tech text-lg font-bold text-zinc-100">
          {aScore?.toFixed(1) ?? "—"} vs {bScore?.toFixed(1) ?? "—"} pts
          <span className="ml-2 text-sm text-zinc-400">
            ({diff >= 0 ? "+" : ""}
            {diff.toFixed(1)} gap)
          </span>
        </p>
        <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {useWeek
            ? contexts.get(winner.id)?.weeklyPointsEstimated
              ? "This week · season-avg estimate"
              : "This week"
            : "Season projection"}
        </span>
        <span className="rounded-full bg-zinc-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {band.label}
        </span>
        <ul className="mt-1 space-y-1 text-left text-xs text-zinc-300">
          <li>• {useWeek ? (contexts.get(winner.id)?.weeklyPointsEstimated ? "Weekly-average estimate" : "Adjusted weekly projection") : "Season projection"}: {Math.abs(diff).toFixed(1)} point edge for {winner.name}.</li>
          <li>• Season PPG: {contexts.get(winner.id)?.ppg == null ? "unavailable" : `${contexts.get(winner.id)!.ppg!.toFixed(1)} points`}.</li>
          <li>• Opponent positional rank is unavailable until a schedule matchup source is connected.</li>
          {(contexts.get(winner.id)?.reasonTags ?? []).map((tag) => <li key={tag}>• {tag}</li>)}
        </ul>
      </div>
    </div>
  );
}
