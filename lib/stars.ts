"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";

const STARS_KEY = "draftedge.stars.v1";

/**
 * Starred players (personalized dashboard), keyed by player name so they
 * survive scoring-format changes and work across every screen.
 *
 * Persistence mirrors the rest of the app: the Supabase `starred_players`
 * table when configured (so stars sync across devices and sessions), or
 * localStorage in demo mode. See `supabase/migrations/0002_starred_players.sql`.
 */
export function useStarredPlayers() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [starred, setStarred] = useState<string[]>([]);

  // Load the user's stars once (Supabase or demo localStorage).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowser();
        try {
          const { data, error } = await supabase
            .from("starred_players")
            .select("players")
            .eq("user_id", userId)
            .maybeSingle();
          if (!cancelled && !error && data) {
            setStarred((data.players ?? []) as string[]);
          }
        } catch {
          // table missing / network error — fall through to empty
        }
      } else {
        try {
          const raw = localStorage.getItem(STARS_KEY);
          if (raw && !cancelled) {
            setStarred(JSON.parse(raw) as string[]);
          }
        } catch {
          // corrupted storage — ignore
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (next: string[]) => {
      if (!userId) return;
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowser();
        try {
          await supabase
            .from("starred_players")
            .upsert(
              { user_id: userId, players: next, updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            );
        } catch {
          // network/table error — keep the optimistic update; next toggle retries
        }
      } else {
        try {
          localStorage.setItem(STARS_KEY, JSON.stringify(next));
        } catch {
          // storage unavailable — ignore
        }
      }
    },
    [userId]
  );

  const toggleStar = useCallback(
    (name: string) => {
      const next = starred.includes(name) ? starred.filter((n) => n !== name) : [...starred, name];
      setStarred(next);
      void persist(next);
    },
    [starred, persist]
  );

  const isStarred = useCallback((name: string) => starred.includes(name), [starred]);

  return { starred, toggleStar, isStarred };
}
