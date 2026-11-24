import type { InjuryStatus, Player, Position } from "./types";

export interface PlayerMatchupContext {
  player: Player;
  ppg: number | null;
  rosPoints: number;
  /** Weekly points, or null when neither a weekly projection nor weekly avg exists. */
  weeklyPoints: number | null;
  /** True when weeklyPoints falls back to the season weekly average. */
  weeklyPointsEstimated: boolean;
  healthDiscount: number;
  teammateUsageBoost: number;
  backupQbDiscount: number;
  adjustedRosPoints: number;
  adjustedWeeklyPoints: number | null;
  opponentRank: null;
  matchupGrade: null;
  rosSos: null;
  reasonTags: string[];
}

const OUT_STATUSES = new Set<InjuryStatus>(["O", "IR", "PUP"]);

/** Positions whose efficiency drops when a team's starting QB is unavailable. */
const BACKUP_QB_AFFECTED = new Set<Position>(["RB", "WR", "TE"]);

/** Positions that can absorb a starter's vacated usage. */
const USAGE_BOOST_POSITIONS = new Set<Position>(["QB", "RB", "WR", "TE"]);

function playerIsOut(player: Player): boolean {
  return Boolean(player.injuryStatus && OUT_STATUSES.has(player.injuryStatus));
}

/**
 * The team's depth-chart #1 at a position, approximated by the highest
 * projected player at that position on the same NFL team.
 */
function teamStarter(teammates: Player[], position: Position): Player | undefined {
  return teammates.reduce<Player | undefined>((best, candidate) => {
    if (candidate.position !== position) return best;
    if (!best) return candidate;
    const candidateValue = candidate.rosProjection ?? candidate.projection;
    const bestValue = best.rosProjection ?? best.projection;
    if (candidateValue !== bestValue) return candidateValue > bestValue ? candidate : best;
    return candidate.positionRank < best.positionRank ? candidate : best;
  }, undefined);
}

export function getWeeklyInjuryMultiplier(
  status: InjuryStatus | null | undefined,
  onBye = false,
): number {
  if (onBye || status === "O" || status === "IR" || status === "PUP" || status === "SUS") return 0;
  if (status === "Q") return 0.88;
  if (status === "D") return 0.25;
  return 1;
}

function healthDiscount(status: InjuryStatus | null | undefined): number {
  if (status === "Q") return 0.05;
  // Weekly D/O tags should only discount a small portion of ROS value; they
  // must not be treated as season-ending absences.
  if (status === "D" || status === "O") return 0.06;
  if (status === "IR" || status === "PUP") return 0.25;
  return 0;
}

/**
 * Creates transparent player context from snapshot fields only. Opponent/SOS
 * values intentionally stay null until a schedule/defense data source is wired.
 */
export function buildMatchupContext(
  players: Player[],
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
    const health = healthDiscount(player.injuryStatus);
    if (health > 0 && player.injuryStatus) tags.push(`Health ${player.injuryStatus}: −${Math.round(health * 100)}%`);
    if (player.injuryStatus === "Q") tags.push("Questionable: check inactive reports 90 minutes before kickoff.");

    const teammates = teamPlayers.get(player.team) ?? [];
    const healthy = !health && !playerIsOut(player);

    // Only the team's actual starting QB (depth-chart #1 by projection) being
    // Out/IR changes the offense. An injured backup QB must never trigger this.
    const startingQb = teamStarter(teammates, "QB");
    const startingQbOut = startingQb ? playerIsOut(startingQb) : false;

    // Same depth-chart check for vacated usage: the out player must be the
    // team's starter at the player's position, not an injured backup.
    const positionStarter = teamStarter(teammates, player.position);
    const positionStarterOut = Boolean(
      positionStarter && positionStarter.id !== player.id && playerIsOut(positionStarter)
    );

    const usageBoost =
      positionStarterOut && healthy && USAGE_BOOST_POSITIONS.has(player.position) ? 0.1 : 0;
    const qbDiscount =
      startingQbOut && startingQb?.id !== player.id && healthy && BACKUP_QB_AFFECTED.has(player.position)
        ? 0.12
        : 0;
    if (usageBoost) tags.push(`↑ Usage boost: ${player.position} starter Out/IR`);
    if (qbDiscount) tags.push("↓ Backup QB starting: −12% efficiency");

    const factor = (1 - health) * (1 + usageBoost) * (1 - qbDiscount);
    const rosPoints = player.rosProjection ?? player.projection;
    const hasWeekProjection = player.weekProjection != null && Number.isFinite(player.weekProjection);
    // Distinguish a real weekly projection from a season-average estimate, and
    // both from missing data (null) so the UI never prints a false 0.0.
    const weeklyPoints = hasWeekProjection
      ? (player.weekProjection as number)
      : player.weeklyAvg > 0
        ? player.weeklyAvg
        : null;
    const weeklyPointsEstimated = !hasWeekProjection && weeklyPoints != null;
    const games = player.usage?.games ?? 0;
    contexts.set(player.id, {
      player,
      ppg: player.actualPoints != null && games > 0 ? player.actualPoints / games : null,
      rosPoints,
      weeklyPoints,
      weeklyPointsEstimated,
      healthDiscount: health,
      teammateUsageBoost: usageBoost,
      backupQbDiscount: qbDiscount,
      adjustedRosPoints: Math.round(rosPoints * factor * 10) / 10,
      adjustedWeeklyPoints:
        weeklyPoints == null
          ? null
          : Math.round(weeklyPoints * (1 + usageBoost) * (1 - qbDiscount) * 10) / 10,
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
