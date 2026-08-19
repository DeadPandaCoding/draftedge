"use client";

import type { DraftState, LeagueConfig } from "./types";
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

export async function removeLeague(userId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    await supabase.from("leagues").delete().eq("user_id", userId);
    return;
  }
  localStorage.removeItem(leagueLocalKey(userId));
}

// ── Draft state ────────────────────────────────────────────────────
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
      ? {
          picks: data.picks as DraftState["picks"],
          notes: (data.notes ?? {}) as DraftState["notes"],
          currentPick: data.current_pick,
        }
      : null;
  }
  try {
    const raw = localStorage.getItem(draftLocalKey(leagueId));
    return raw ? (JSON.parse(raw) as DraftState) : null;
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
    roster: row.roster,
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
