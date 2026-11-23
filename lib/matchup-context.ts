import type { InjuryStatus, LeagueFormat, Player } from "./types";

export interface PlayerMatchupContext {
  player: Player;
  ppg: number | null;
  rosPoints: number;
  weeklyPoints: number;
  healthDiscount: number;
  teammateUsageBoost: number;
  backupQbDiscount: number;
  adjustedRosPoints: number;
  adjustedWeeklyPoints: number;
  opponentRank: null;
  matchupGrade: null;
  rosSos: null;
  reasonTags: string[];
}

const OUT_STATUSES = new Set<InjuryStatus>(["O", "IR", "PUP"]);
function healthDiscount(status: InjuryStatus | null | undefined, format: LeagueFormat): number {
  if (status === "Q") return 0.05;
  if (status === "D") return 0.35;
  if (status === "O" || status === "IR" || status === "PUP") return format === "dynasty" ? 0 : 0.25;
  return 0;
}

/**
 * Creates transparent player context from snapshot fields only. Opponent/SOS
 * values intentionally stay null until a schedule/defense data source is wired.
 */
export function buildMatchupContext(
  players: Player[],
  format: LeagueFormat = "redraft",
): Map<string, PlayerMatchupContext> {
  const teamPlayers = new Map<string, Player[]>();
  for (const player of players) {
    if (player.team && player.team !== "FA") {
      const group = teamPlayers.get(player.team) ?? [];
      group.push(player);
      teamPlayers.set(player.team, group);
    }
  }

  const contexts = new Map<string, PlayerMatchupContext>();
  for (const player of players) {
    const tags: string[] = [];
    const health = healthDiscount(player.injuryStatus, format);
    if (health > 0 && player.injuryStatus) tags.push(`Health ${player.injuryStatus}: −${Math.round(health * 100)}%`);

    const teammates = teamPlayers.get(player.team) ?? [];
    const injuredQb = teammates.find((mate) => mate.position === "QB" && OUT_STATUSES.has(mate.injuryStatus ?? "Q"));
    const samePosOut = teammates
      .filter((mate) => mate.position === player.position && OUT_STATUSES.has(mate.injuryStatus ?? "Q"))
      .sort((a, b) => a.positionRank - b.positionRank)[0];
    const usageBoost = samePosOut && !OUT_STATUSES.has(player.injuryStatus ?? "Q") && !health
      ? 0.10
      : 0;
    const qbDiscount = injuredQb && player.position !== "QB" && !OUT_STATUSES.has(player.injuryStatus ?? "Q") ? 0.12 : 0;
    if (usageBoost) tags.push(`↑ Usage boost: ${player.position} teammate Out/IR`);
    if (qbDiscount) tags.push("↓ Backup QB starting: −12% efficiency");

    const factor = (1 - health) * (1 + usageBoost) * (1 - qbDiscount);
    const rosPoints = player.rosProjection ?? player.projection;
    const weeklyPoints = player.weekProjection ?? player.weeklyAvg;
    const games = player.usage?.games ?? 0;
    contexts.set(player.id, {
      player,
      ppg: player.actualPoints != null && games > 0 ? player.actualPoints / games : null,
      rosPoints,
      weeklyPoints,
      healthDiscount: health,
      teammateUsageBoost: usageBoost,
      backupQbDiscount: qbDiscount,
      adjustedRosPoints: Math.round(rosPoints * factor * 10) / 10,
      adjustedWeeklyPoints: Math.round(weeklyPoints * factor * 10) / 10,
      opponentRank: null,
      matchupGrade: null,
      rosSos: null,
      reasonTags: tags,
    });
  }
  return contexts;
}

export function isOutOrIr(status?: InjuryStatus | null): boolean {
  return !!status && OUT_STATUSES.has(status);
}

export const MATCHUP_DATA_UNAVAILABLE = "Opponent and ROS SOS unavailable: no schedule matchup source is configured.";
