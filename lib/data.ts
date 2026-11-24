"use client";

import type { DraftState, LeagueConfig } from "./types";
import { isLegacyPlayerId } from "./seed-data";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";

/**
 * Persistence layer for league configs and draft states.
 *
 * Primary: Supabase Postgres (`leagues` + `draft_states` tables, see
 * `supabase/schema.sql`) — synced to the cloud and available on any device.
 *
 * Fallback: localStorage (demo mode) when Supabase is unconfigured.
 */

// ── Demo fallback keys ─────────────────────────────────────────────
function leagueLocalKey(userId: string): string {
  return `draftedge.league.${userId.toLowerCase()}`;
}
function draftLocalKey(leagueId: string): string {
  return `draftedge.draft.${leagueId}`;
}

// ── League config ──────────────────────────────────────────────────
export async function fetchLeague(userId: string): Promise<LeagueConfig | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToLeague(data) : null;
  }
  try {
    const raw = localStorage.getItem(leagueLocalKey(userId));
    return raw ? (JSON.parse(raw) as LeagueConfig) : null;
  } catch {
    return null;
  }
}

export async function persistLeague(userId: string, league: LeagueConfig): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("leagues")
      .upsert(leagueToRow(userId, league), { onConflict: "id" });
    if (error) throw error;
    return;
  }
  localStorage.setItem(leagueLocalKey(userId), JSON.stringify(league));
}

// ── Draft state ────────────────────────────────────────────────────

/**
 * Legacy drafts stored picks with rank-based IDs (`r1`, `r2`, …). Those IDs
 * were relative to whichever scoring board was active, so mapping them blindly
 * could swap one player's identity for another's. Drop those picks (and their
 * notes) instead of guessing, keep anything with a canonical ID (for example
 * team-defense IDs), and renumber so the draft can continue cleanly.
 */
function sanitizeDraftState(state: DraftState): DraftState {
  const picks = state.picks ?? [];
  const hasLegacyPicks = picks.some((pick) => isLegacyPlayerId(pick.playerId));
  const hasLegacyNotes = Object.keys(state.notes ?? {}).some(isLegacyPlayerId);
  if (!hasLegacyPicks && !hasLegacyNotes) return state;

  const kept = picks
    .filter((pick) => !isLegacyPlayerId(pick.playerId))
    .sort((a, b) => a.pickNumber - b.pickNumber)
    .map((pick, index) => ({ ...pick, pickNumber: index + 1 }));
  const notes = Object.fromEntries(
    Object.entries(state.notes ?? {}).filter(([playerId]) => !isLegacyPlayerId(playerId))
  );
  return { picks: kept, notes, currentPick: kept.length + 1 };
}

export async function fetchDraftState(leagueId: string): Promise<DraftState | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("draft_states")
      .select("picks, notes, current_pick")
      .eq("league_id", leagueId)
      .maybeSingle();
    if (error) throw error;
    return data
      ? sanitizeDraftState({
          picks: data.picks as DraftState["picks"],
          notes: (data.notes ?? {}) as DraftState["notes"],
          currentPick: data.current_pick,
        })
      : null;
  }
  try {
    const raw = localStorage.getItem(draftLocalKey(leagueId));
    return raw ? sanitizeDraftState(JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

export async function persistDraftState(leagueId: string, state: DraftState): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("draft_states").upsert(
      {
        league_id: leagueId,
        picks: state.picks,
        notes: state.notes,
        current_pick: state.currentPick,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "league_id" }
    );
    if (error) throw error;
    return;
  }
  localStorage.setItem(draftLocalKey(leagueId), JSON.stringify(state));
}

// ── Row mapping ────────────────────────────────────────────────────
interface LeagueRow {
  id: string;
  name: string;
  scoring: string;
  team_count: number;
  draft_position: number;
  rounds: number;
  roster: LeagueConfig["roster"];
  status: LeagueConfig["status"];
  pick_timer_seconds?: number | null;
  live_since?: number | null;
  created_at: string;
}

function rowToLeague(row: LeagueRow): LeagueConfig {
  return {
    id: row.id,
    name: row.name,
    scoring: row.scoring as LeagueConfig["scoring"],
    teamCount: row.team_count,
    draftPosition: row.draft_position,
    rounds: row.rounds,
    roster: { ...row.roster, superflex: row.roster.superflex ?? 0 },
    status: row.status,
    pickTimerSeconds: row.pick_timer_seconds ?? undefined,
    liveSince: row.live_since ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function leagueToRow(userId: string, league: LeagueConfig) {
  return {
    id: league.id,
    user_id: userId,
    name: league.name,
    scoring: league.scoring,
    team_count: league.teamCount,
    draft_position: league.draftPosition,
    rounds: league.rounds,
    roster: league.roster,
    status: league.status,
    pick_timer_seconds: league.pickTimerSeconds ?? 90,
    live_since: league.liveSince ?? null,
    created_at: new Date(league.createdAt).toISOString(),
  };
}
