export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

export type ScoringFormat = "ppr" | "half_ppr" | "standard";

export type DraftStatus = "pre_draft" | "live" | "completed";

export type PickOwner = "me" | "opponent";

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: string; // NFL abbreviation, "FA" when unassigned
  bye: number; // bye week (0 = unknown)
  adp: number; // average draft position (0 = unknown)
  projection: number; // season total, adjusted to league scoring format
  weeklyAvg: number; // projection / 17
  tier: number; // 1 = best, computed per position
  rank: number; // overall rank (1..n) by projection
  positionRank: number; // rank within position
  source: "seed" | "live"; // where the record came from
}

export interface RosterTemplate {
  qb: number;
  rb: number;
  wr: number;
  te: number;
  flex: number;
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
}
