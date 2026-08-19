"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  DraftPick,
  DraftState,
  LeagueConfig,
  PickOwner,
  Player,
  Position,
  RosterEntry,
  RosterTemplate,
} from "./types";
import { roundForPick } from "./league";
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

/** Assigns the user's drafted players to labeled roster slots. */
export function buildRoster(
  picks: DraftPick[],
  playersById: Map<string, Player>,
  roster: RosterTemplate
): RosterEntry[] {
  const mine = picks
    .filter((p) => p.owner === "me")
    .sort((a, b) => a.pickNumber - b.pickNumber);

  const entries: RosterEntry[] = [];
  const counters: Record<string, number> = {};

  const push = (group: string, playerId: string) => {
    const n = (counters[group] ?? 0) + 1;
    counters[group] = n;
    entries.push({ slot: `${group}${group === "QB" || group === "K" || group === "DEF" ? "" : n}`, playerId });
  };

  const isEligible = (p: Player, group: string): boolean => {
    if (group === "FLEX") return p.position === "RB" || p.position === "WR" || p.position === "TE";
    return p.position === group;
  };

  // 1) Position-specific starters
  for (const p of mine) {
    const player = playersById.get(p.playerId);
    if (!player) continue;
    if (player.position === "QB" && (counters.qb ?? 0) < roster.qb) push("QB", p.playerId);
    else if (player.position === "RB" && (counters.rb ?? 0) < roster.rb) push("RB", p.playerId);
    else if (player.position === "WR" && (counters.wr ?? 0) < roster.wr) push("WR", p.playerId);
    else if (player.position === "TE" && (counters.te ?? 0) < roster.te) push("TE", p.playerId);
    else if (player.position === "K" && (counters.k ?? 0) < roster.k) push("K", p.playerId);
    else if (player.position === "DEF" && (counters.def ?? 0) < roster.def) push("DEF", p.playerId);
  }
  // 2) FLEX (RB/WR/TE)
  for (const p of mine) {
    const player = playersById.get(p.playerId);
    if (!player || (counters.flex ?? 0) >= roster.flex) break;
    const alreadySlotted = entries.some((e) => e.playerId === p.playerId);
    if (!alreadySlotted && isEligible(player, "FLEX")) push("FLEX", p.playerId);
  }
  // 3) Bench (everything else)
  for (const p of mine) {
    const alreadySlotted = entries.some((e) => e.playerId === p.playerId);
    if (!alreadySlotted && (counters.bench ?? 0) < roster.bench) push("BENCH", p.playerId);
  }

  return entries;
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

/** Remaining (undrafted) players sorted by projection, for "best available" lists. */
export function bestAvailable(
  players: Player[],
  draftedIds: Set<string>,
  position?: Position
): Player[] {
  return players
    .filter((p) => !draftedIds.has(p.id) && (!position || p.position === position))
    .sort((a, b) => b.projection - a.projection);
}
