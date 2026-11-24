export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
export type InjuryStatus = "Q" | "D" | "O" | "IR" | "PUP" | "SUS";
export type DraftType = "snake" | "linear" | "third_round_reversal";

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

export const POSITION_FILTERS: (Position | "ALL")[] = ["ALL", ...POSITIONS];
export const SCORING_FORMATS = ["ppr", "half_ppr", "standard"] as const;
export type ScoringFormat = (typeof SCORING_FORMATS)[number];

export type DraftStatus = "pre_draft" | "live" | "completed";

export type PickOwner = "me" | "opponent";

export interface Player {
  id: string;
  /** Sleeper's platform ID when matched into a DraftEdge seed record. */
  sleeperId?: string;
  name: string;
  position: Position;
  team: string; // NFL abbreviation, "FA" when unassigned
  bye: number; // bye week (0 = unknown)
  adp: number; // average draft position (0 = unknown)
  projection: number; // season total, adjusted to league scoring format
  weeklyAvg: number; // season projection / expected 17 games
  tier: number; // 1 = best, computed per position
  rank: number; // overall rank (1..n) by projection
  positionRank: number; // rank within position
  source: "seed" | "live"; // where the record came from
  injuryStatus?: InjuryStatus | null;
  injuryBodyPart?: string | null;
  /** Seasonal usage/efficiency from nflverse, when live data is available. */
  usage?: UsageMetrics;
  /** Current-week projection from Sleeper (empty until the regular season starts). */
  weekProjection?: number;
  /** Sleeper projection summed from the current NFL week through week 18. */
  rosProjection?: number;
  /** Projected catches from the remaining schedule, when Sleeper provides them. */
  rosReceptions?: number;
  /** Completed-week points from Sleeper, in the selected scoring format. */
  actualPoints?: number;
  /** Completed actual points plus the ROS estimate, when all source weeks exist. */
  seasonProjection?: number;
  /** Overall ROS rank, derived only from players with a ROS projection. */
  rosRank?: number;
  /** Positional ROS rank and tier. */
  rosPositionRank?: number;
  rosTier?: number;
  /** Current-week position consensus rank from FantasyPros/ffverse data. */
  weekPositionRank?: number;
  /** Overall current-week rank, ordered by Sleeper's weekly point projection. */
  weekRank?: number;
  /** Current-week tier, recalculated from the live positional order. */
  weekTier?: number;
  /**
   * Consensus season projection, including Sleeper actuals + ROS when available.
   */
  consensus?: number;
}

/** Seasonal receiving usage, derived from nflverse player stats. */
export interface UsageMetrics {
  season: number;
  games: number;
  targets: number;
  receptions: number;
  receivingYards: number;
  airYards: number;
  yac: number;
  targetShare: number; // 0..1 share of team targets
  airYardsShare: number; // 0..1 share of team air yards
  wopr: number; // weighted opportunity rating
}

export interface RosterTemplate {
  qb: number;
  rb: number;
  wr: number;
  te: number;
  flex: number;
  /** FLEX slot eligible for QB/RB/WR/TE (Superflex). */
  superflex: number;
  k: number;
  def: number;
  bench: number;
}

export interface LeagueConfig {
  id: string;
  name: string;
  scoring: ScoringFormat;
  teamCount: number;
  draftPosition: number; // 1..teamCount
  rounds: number;
  roster: RosterTemplate;
  status: DraftStatus;
  /** Seconds allowed per pick for the live draft clock (default 90). */
  pickTimerSeconds?: number;
  /** Epoch ms when the draft went live (clock anchor before any pick is logged). */
  liveSince?: number;
  createdAt: number;
}

export interface DraftPick {
  playerId: string;
  pickNumber: number;
  round: number;
  owner: PickOwner;
  timestamp: number;
}

export interface DraftState {
  picks: DraftPick[];
  notes: Record<string, string>;
  currentPick: number; // next pick number (1-based)
}

export interface RosterEntry {
  slot: string; // "QB", "RB1", "FLEX", "BENCH2", ...
  playerId: string;
}

export interface PlayersResponse {
  players: Player[];
  source: "live" | "seed";
  generatedAt: number;
  schemaVersion?: number;
  weeklyRankingsUpdated?: string;
  currentWeek?: number | null;
}
