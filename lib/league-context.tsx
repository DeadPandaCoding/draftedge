"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ScoringFormat } from "@/lib/types";
import type { Player } from "@/lib/types";
import type { SyncedSleeperLeague } from "@/lib/sleeper-sync";

const ACTIVE_LEAGUE_KEY = "draftedge.active-sleeper-league.v1";

interface LeagueContextValue {
  leagues: SyncedSleeperLeague[];
  activeLeague: SyncedSleeperLeague | null;
  activeLeagueId: string | null;
  loading: boolean;
  error: string | null;
  setActiveLeagueId: (id: string) => void;
  connectSleeper: (username: string) => Promise<void>;
  connectEspn: (input: { leagueId: string; espnS2?: string; swid?: string; teamId?: string }) => Promise<{ teams?: Array<{ teamId: string; label: string }>; needsTeamSelection?: boolean }>;
  syncNow: (leagueId?: string) => Promise<void>;
  disconnectLeague: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueContextProvider({ children }: { children: React.ReactNode }) {
  const { user, supabaseEnabled } = useAuth();
  const [leagues, setLeagues] = useState<SyncedSleeperLeague[]>([]);
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [espnCredentials, setEspnCredentials] = useState<Record<string, { espnS2: string; swid: string }>>({});

  const setActiveLeagueId = useCallback((id: string) => {
    setActiveLeagueIdState(id);
    try { localStorage.setItem(ACTIVE_LEAGUE_KEY, id); } catch { /* storage is optional */ }
  }, []);

  const reload = useCallback(async () => {
    if (!user || !supabaseEnabled) {
      setLeagues([]);
      setEspnCredentials({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/leagues", { cache: "no-store" });
      const payload = await response.json() as { leagues?: SyncedSleeperLeague[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load synced leagues.");
      const next = payload.leagues ?? [];
      setLeagues(next);
      const storedId = (() => { try { return localStorage.getItem(ACTIVE_LEAGUE_KEY); } catch { return null; } })();
      const selected = next.find((league) => league.id === storedId) ?? next[0] ?? null;
      setActiveLeagueIdState(selected?.id ?? null);
      if (selected?.id) { try { localStorage.setItem(ACTIVE_LEAGUE_KEY, selected.id); } catch { /* storage is optional */ } }
    } finally {
      setLoading(false);
    }
  }, [user, supabaseEnabled]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reload().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Could not load leagues."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const sync = useCallback(async (payload: { username?: string; leagueId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leagues/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sleeper sync failed.");
      await reload();
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Sleeper sync failed.";
      setError(message);
      throw syncError;
    } finally {
      setLoading(false);
    }
  }, [reload]);

  const connectSleeper = useCallback((username: string) => sync({ username }), [sync]);
  const connectEspn = useCallback(async (input: { leagueId: string; espnS2?: string; swid?: string; teamId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leagues/sync/espn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json() as { error?: string; teams?: Array<{ teamId: string; label: string }>; needsTeamSelection?: boolean; league?: { platform_league_id: string } };
      if (!response.ok) throw new Error(result.error ?? "ESPN sync failed.");
      if (result.needsTeamSelection) return { teams: result.teams, needsTeamSelection: true };
      if (input.espnS2 && input.swid && result.league?.platform_league_id) {
        setEspnCredentials((current) => ({ ...current, [result.league!.platform_league_id]: { espnS2: input.espnS2!, swid: input.swid! } }));
      }
      await reload();
      return { teams: result.teams, needsTeamSelection: false };
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "ESPN sync failed.";
      setError(message);
      throw connectError;
    } finally { setLoading(false); }
  }, [reload]);
  const syncNow = useCallback(async (leagueId?: string) => {
    const selectedLeague = leagues.find((item) => item.id === activeLeagueId) ?? leagues[0] ?? null;
    const league = selectedLeague?.platform_league_id === leagueId
      ? selectedLeague
      : leagues.find((item) => item.platform_league_id === leagueId) ?? selectedLeague;
    if (!league || league.platform === "sleeper") return sync(leagueId ? { leagueId } : {});
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leagues/sync/espn", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: league.platform_league_id, teamId: league.platform_user_id, ...espnCredentials[league.platform_league_id] }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "ESPN sync failed.");
      await reload();
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "ESPN sync failed.";
      setError(message);
      throw syncError;
    } finally { setLoading(false); }
  }, [activeLeagueId, espnCredentials, leagues, reload, sync]);

  const disconnectLeague = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leagues?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not disconnect league.");
      await reload();
    } catch (disconnectError) {
      const message = disconnectError instanceof Error ? disconnectError.message : "Could not disconnect league.";
      setError(message);
      throw disconnectError;
    } finally { setLoading(false); }
  }, [reload]);

  const activeLeague = leagues.find((league) => league.id === activeLeagueId) ?? leagues[0] ?? null;
  const value = useMemo(() => ({ leagues, activeLeague, activeLeagueId, loading, error, setActiveLeagueId, connectSleeper, connectEspn, syncNow, disconnectLeague, reload }),
    [leagues, activeLeague, activeLeagueId, loading, error, setActiveLeagueId, connectSleeper, connectEspn, syncNow, disconnectLeague, reload]);
  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
}

export function useSyncedLeagues(): LeagueContextValue {
  const context = useContext(LeagueContext);
  if (!context) throw new Error("useSyncedLeagues must be used within LeagueContextProvider");
  return context;
}

export function toScoringFormat(format?: string | null): ScoringFormat {
  if (format === "Half-PPR") return "half_ppr";
  if (format === "Standard") return "standard";
  return "ppr";
}

export function resolveSleeperPlayerIds(players: Player[], sleeperIds: string[]): string[] {
  const bySleeperId = new Map(players.map((player) => [player.sleeperId ?? player.id, player.id]));
  return sleeperIds.map((id) => bySleeperId.get(id)).filter((id): id is string => Boolean(id));
}
