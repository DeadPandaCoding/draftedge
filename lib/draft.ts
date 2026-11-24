"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  DraftPick,
  DraftState,
  DraftType,
  LeagueConfig,
  PickOwner,
  Player,
  Position,
  RosterEntry,
  RosterTemplate,
} from "./types";
import { POSITIONS } from "./types";
import { roundForPick, slotForPick } from "./league";
import { fetchDraftState, persistDraftState } from "./data";
import { isSupabaseConfigured } from "./supabase/client";

function emptyState(): DraftState {
  return { picks: [], notes: {}, currentPick: 1 };
}

export function isDrafted(state: DraftState, playerId: string): boolean {
  return state.picks.some((p) => p.playerId === playerId);
}

export function pickForPlayer(state: DraftState, playerId: string): DraftPick | undefined {
  return state.picks.find((p) => p.playerId === playerId);
}

export function useDraft(league: LeagueConfig | null) {
  const [state, setState] = useState<DraftState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  const leagueId = league?.id ?? null;
  const teamCount = league?.teamCount ?? 12;

  // Load persisted draft state (Supabase or localStorage) when the league changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(false);
    if (!leagueId) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchDraftState(leagueId);
        if (!cancelled) setState(loaded ?? emptyState());
      } catch {
        if (!cancelled) setState(emptyState());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leagueId]);

  // Persist on every change (only after hydration).
  // Demo mode writes localStorage synchronously (no debounce); the cloud path
  // debounces so rapid picks and note typing batch into a single write.
  useEffect(() => {
    if (!leagueId || !hydrated) return;
    const save = () => {
      persistDraftState(leagueId, state).catch(() => {
        // offline/network error — the next change will retry
      });
    };
    if (!isSupabaseConfigured()) {
      save();
      return;
    }
    const id = window.setTimeout(save, 400);
    return () => window.clearTimeout(id);
  }, [state, leagueId, hydrated]);

  // Best-effort flush of the last pending cloud write when the tab hides/closes.
  useEffect(() => {
    if (!leagueId || !hydrated || !isSupabaseConfigured()) return;
    const flush = () => {
      persistDraftState(leagueId, state).catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, [leagueId, hydrated, state]);

  const draftPlayer = useCallback(
    (playerId: string, owner: PickOwner) => {
      if (!leagueId) return;
      setState((s) => {
        if (s.picks.some((p) => p.playerId === playerId)) return s;
        const pickNumber = s.currentPick;
        return {
          ...s,
          picks: [
            ...s.picks,
            {
              playerId,
              pickNumber,
              round: roundForPick(pickNumber, teamCount),
              owner,
              timestamp: Date.now(),
            },
          ],
          currentPick: pickNumber + 1,
        };
      });
    },
    [leagueId, teamCount]
  );

  const undraftPlayer = useCallback(
    (playerId: string) => {
      if (!leagueId) return;
      setState((s) => {
        const remaining = s.picks
          .filter((p) => p.playerId !== playerId)
          .sort((a, b) => a.timestamp - b.timestamp);
        const renumbered: DraftPick[] = remaining.map((p, i) => ({
          ...p,
          pickNumber: i + 1,
          round: roundForPick(i + 1, teamCount),
        }));
        return { ...s, picks: renumbered, currentPick: renumbered.length + 1 };
      });
    },
    [leagueId, teamCount]
  );

  const setNote = useCallback((playerId: string, note: string) => {
    setState((s) => ({ ...s, notes: { ...s.notes, [playerId]: note } }));
  }, []);

  const resetDraft = useCallback(() => {
    setState(emptyState());
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      draftPlayer,
      undraftPlayer,
      setNote,
      resetDraft,
    }),
    [state, hydrated, draftPlayer, undraftPlayer, setNote, resetDraft]
  );

  return value;
}

/** The single set of slot keys used for both roster counting and assignment. */
export const ROSTER_SLOTS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "FLEX",
  "SUPERFLEX",
  "K",
  "DEF",
  "BENCH",
] as const;
export type RosterSlot = (typeof ROSTER_SLOTS)[number];

function slotLimit(roster: RosterTemplate, slot: RosterSlot): number {
  switch (slot) {
    case "QB": return roster.qb;
    case "RB": return roster.rb;
    case "WR": return roster.wr;
    case "TE": return roster.te;
    case "FLEX": return roster.flex;
    case "SUPERFLEX": return roster.superflex ?? 0;
    case "K": return roster.k;
    case "DEF": return roster.def;
    case "BENCH": return roster.bench;
  }
}

function slotAccepts(slot: RosterSlot, position: Position): boolean {
  if (slot === "BENCH") return true;
  if (slot === "FLEX") return position === "RB" || position === "WR" || position === "TE";
  if (slot === "SUPERFLEX") {
    return position === "QB" || position === "RB" || position === "WR" || position === "TE";
  }
  return position === slot;
}

/**
 * Assigns the user's drafted players to labeled roster slots.
 *
 * Counting and assignment share one typed slot key, so a player can never be
 * assigned to a group whose count was tracked under a different key. Slots are
 * filled in order (position starters → FLEX → SUPERFLEX → BENCH), which means
 * FLEX/SUPERFLEX are always filled before the bench.
 *
 * Pass `preference` to order players by anything other than draft order (for
 * example, weekly projection for the Start/Sit optimizer).
 */
export function buildRoster(
  picks: DraftPick[],
  playersById: Map<string, Player>,
  roster: RosterTemplate,
  preference?: (player: Player) => number
): RosterEntry[] {
  const ordered = picks
    .filter((p) => p.owner === "me")
    .sort((a, b) => {
      if (!preference) return a.pickNumber - b.pickNumber;
      const playerA = playersById.get(a.playerId);
      const playerB = playersById.get(b.playerId);
      if (!playerA || !playerB) return a.pickNumber - b.pickNumber;
      return preference(playerB) - preference(playerA) || a.pickNumber - b.pickNumber;
    });

  const counts: Record<RosterSlot, number> = {
    QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, SUPERFLEX: 0, K: 0, DEF: 0, BENCH: 0,
  };
  const entries: RosterEntry[] = [];
  const assigned = new Set<string>();

  const fill = (slot: RosterSlot) => {
    const limit = slotLimit(roster, slot);
    for (const pick of ordered) {
      if (counts[slot] >= limit) break;
      if (assigned.has(pick.playerId)) continue;
      const player = playersById.get(pick.playerId);
      if (!player || !slotAccepts(slot, player.position)) continue;
      assigned.add(pick.playerId);
      counts[slot] += 1;
      entries.push({ slot: `${slot}${counts[slot]}`, playerId: pick.playerId });
    }
  };

  fill("QB");
  fill("RB");
  fill("WR");
  fill("TE");
  fill("K");
  fill("DEF");
  fill("FLEX");
  fill("SUPERFLEX");
  fill("BENCH");

  return entries;
}

/**
 * Minimum number of additional picks needed to fill every mandatory starting
 * slot (QB, RB, WR, TE, FLEX, SUPERFLEX, K, DEF). Extra players at a position
 * count toward FLEX/SUPERFLEX, matching the slots they can legally fill.
 */
export function startingSlotsNeeded(
  roster: RosterTemplate,
  counts: Record<Position, number>
): number {
  const qbNeed = Math.max(0, roster.qb - counts.QB);
  const rbNeed = Math.max(0, roster.rb - counts.RB);
  const wrNeed = Math.max(0, roster.wr - counts.WR);
  const teNeed = Math.max(0, roster.te - counts.TE);
  const kNeed = Math.max(0, roster.k - counts.K);
  const defNeed = Math.max(0, roster.def - counts.DEF);

  const skillSurplus =
    Math.max(0, counts.RB - roster.rb) +
    Math.max(0, counts.WR - roster.wr) +
    Math.max(0, counts.TE - roster.te);
  const flexNeed = Math.max(0, roster.flex - skillSurplus);
  const skillAfterFlex = Math.max(0, skillSurplus - roster.flex);
  const qbSurplus = Math.max(0, counts.QB - roster.qb);
  const superflexNeed = Math.max(0, (roster.superflex ?? 0) - (skillAfterFlex + qbSurplus));

  return qbNeed + rbNeed + wrNeed + teNeed + kNeed + defNeed + flexNeed + superflexNeed;
}

/** Number of future picks (excluding the current pick) owned by one draft slot. */
export function futurePicksForSlot(
  pickNumber: number,
  slotNumber: number,
  teamCount: number,
  totalPicks: number,
  draftType: DraftType = "snake"
): number {
  let count = 0;
  for (let pick = pickNumber + 1; pick <= totalPicks; pick += 1) {
    if (slotForPick(pick, teamCount, draftType) === slotNumber) count += 1;
  }
  return count;
}

/**
 * Feasibility guard for a single pick: drafting `position` must not leave more
 * mandatory starting slots open than there are picks left to fill them.
 *
 * Returns true when no position can rescue the roster, so a draft that is
 * already infeasible (for example after changing roster settings mid-draft)
 * cannot deadlock.
 */
export function canDraftPosition(
  position: Position,
  counts: Record<Position, number>,
  roster: RosterTemplate,
  picksAfterThisOne: number
): boolean {
  const feasible = (candidate: Position) =>
    startingSlotsNeeded(roster, {
      ...counts,
      [candidate]: counts[candidate] + 1,
    }) <= picksAfterThisOne;

  if (!POSITIONS.some(feasible)) return true;
  return feasible(position);
}

export interface NeedsWarning {
  label: string;
  detail: string;
  critical: boolean;
}

/**
 * Warns about unfilled starting slots relative to the rounds remaining.
 * Example: "You have 0 TEs and only 3 rounds remaining."
 */
export function analyzeNeeds(
  entries: RosterEntry[],
  roster: RosterTemplate,
  currentPick: number,
  teamCount: number,
  totalPicks: number
): NeedsWarning[] {
  const picksLeft = Math.max(0, totalPicks - currentPick + 1);
  const roundsLeft = Math.ceil(picksLeft / teamCount);

  const countFor = (group: string) =>
    entries.filter((e) => e.slot.startsWith(group)).length;

  const requirements: { group: string; need: number; label: string }[] = [
    { group: "QB", need: roster.qb, label: "QB" },
    { group: "RB", need: roster.rb, label: "RB" },
    { group: "WR", need: roster.wr, label: "WR" },
    { group: "TE", need: roster.te, label: "TE" },
    { group: "K", need: roster.k, label: "K" },
    { group: "DEF", need: roster.def, label: "DEF" },
    { group: "FLEX", need: roster.flex, label: "FLEX" },
    { group: "SUPERFLEX", need: roster.superflex ?? 0, label: "SUPERFLEX" },
  ];

  const warnings: NeedsWarning[] = [];
  for (const req of requirements) {
    const have = countFor(req.group);
    const shortage = req.need - have;
    if (shortage <= 0) continue;
    // Players already on the bench can still fill FLEX later.
    const benchEligible = entries.filter((e) => e.slot.startsWith("BENCH")).length;
    const effectiveShortage = req.group === "FLEX" ? Math.max(0, shortage - benchEligible) : shortage;
    if (effectiveShortage <= 0) continue;
    warnings.push({
      label: `${shortage} ${req.label}${shortage > 1 ? "s" : ""} needed`,
      detail: `You have ${have} ${req.label}${have === 1 ? "" : "s"} and ~${roundsLeft} round${roundsLeft === 1 ? "" : "s"} remaining`,
      critical: roundsLeft <= effectiveShortage,
    });
  }
  return warnings;
}

/** Remaining (undrafted) players sorted by VOR (or projection), for "best available" lists. */
export function bestAvailable(
  players: Player[],
  draftedIds: Set<string>,
  position?: Position,
  vor?: Map<string, number>
): Player[] {
  return players
    .filter((p) => !draftedIds.has(p.id) && (!position || p.position === position))
    .sort((a, b) => (vor?.get(b.id) ?? b.projection) - (vor?.get(a.id) ?? a.projection));
}
