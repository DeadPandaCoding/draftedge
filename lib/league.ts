import type { DraftStatus, DraftType, RosterTemplate, ScoringFormat } from "./types";

export const DEFAULT_ROSTER: RosterTemplate = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  superflex: 0,
  k: 1,
  def: 1,
  bench: 5,
};

export const SCORING_LABELS: Record<ScoringFormat, string> = {
  ppr: "PPR",
  half_ppr: "Half-PPR",
  standard: "Standard",
};

export const STATUS_LABELS: Record<DraftStatus, string> = {
  pre_draft: "Pre-Draft",
  live: "Draft Live",
  completed: "Completed",
};

export function rosterSize(roster: RosterTemplate): number {
  return roster.qb + roster.rb + roster.wr + roster.te + roster.flex + (roster.superflex ?? 0) + roster.k + roster.def + roster.bench;
}

/** Draft slot owning pick #n for the selected draft order (1-based). */
export function slotForPick(pickNumber: number, teamCount: number, draftType: DraftType = "snake"): number {
  const round = Math.ceil(pickNumber / teamCount);
  const inRound = ((pickNumber - 1) % teamCount) + 1;
  if (draftType === "linear") return inRound;
  if (draftType === "third_round_reversal") {
    if (round === 1) return inRound;
    if (round === 2 || round === 3) return teamCount - inRound + 1;
    return round % 2 === 1 ? inRound : teamCount - inRound + 1;
  }
  return round % 2 === 1 ? inRound : teamCount - inRound + 1;
}

export function roundForPick(pickNumber: number, teamCount: number): number {
  return Math.ceil(pickNumber / teamCount);
}
