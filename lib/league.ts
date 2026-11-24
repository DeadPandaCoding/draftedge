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

function rosterPositionEntries(rawPositions: unknown): string[] {
  if (Array.isArray(rawPositions)) return rawPositions.filter((value): value is string => typeof value === "string");
  if (!rawPositions || typeof rawPositions !== "object") return [];
  return Object.entries(rawPositions as Record<string, unknown>).flatMap(([slot, value]) => {
    const count = typeof value === "number" ? Math.max(0, Math.min(30, Math.floor(value))) : 0;
    return Array.from({ length: count }, () => slot);
  });
}

/** Convert a platform's raw `roster_positions` payload into our roster template. */
export function rosterFromPositions(rawPositions: unknown): RosterTemplate {
  const counts: RosterTemplate = { qb: 0, rb: 0, wr: 0, te: 0, flex: 0, superflex: 0, k: 0, def: 0, bench: 0 };
  for (const rawPosition of rosterPositionEntries(rawPositions)) {
    const position = rawPosition.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (position === "QB") counts.qb++;
    else if (position === "RB") counts.rb++;
    else if (position === "WR") counts.wr++;
    else if (position === "TE") counts.te++;
    else if (position === "K") counts.k++;
    else if (position === "DEF" || position === "DST") counts.def++;
    else if (position === "SUPER_FLEX" || position === "SUPERFLEX") counts.superflex++;
    else if (["FLEX", "REC_FLEX", "WRRB_FLEX", "WR_RB_FLEX", "WR_TE_FLEX"].includes(position)) counts.flex++;
    else if (position === "BN" || position === "BENCH") counts.bench++;
  }
  return counts;
}

export function hasRosterSlots(roster: RosterTemplate): boolean {
  return Object.values(roster).some((count) => count > 0);
}

/** Superflex and 2QB leagues price quarterbacks as 2QB leagues in FantasyCalc. */
export function numQbsForRoster(roster: RosterTemplate): number {
  return (roster.superflex ?? 0) > 0 || roster.qb >= 2 ? 2 : 1;
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
