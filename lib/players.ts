"use client";

import { useEffect, useState } from "react";
import type { Player, PlayersResponse, ScoringFormat } from "./types";
import { getSeedPlayers } from "./seed-data";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Bump whenever the player schema changes. v9 introduced canonical
 * scoring-independent player IDs; older caches contain rank-based IDs (`r1`,
 * `r2`, …) that mean different players on different scoring boards, so they
 * must never be served again.
 */
const CACHE_VERSION = "v9";

interface PlayersState {
  players: Player[];
  source: "live" | "seed" | "cache";
  loading: boolean;
  error?: string;
  weeklyRankingsUpdated?: string;
  currentWeek?: number | null;
  /** Scoring board the retained rows belong to. */
  scoring: ScoringFormat;
}

export function usePlayers(scoring: ScoringFormat): PlayersState {
  const [state, setState] = useState<PlayersState>({
    players: [],
    source: "seed",
    loading: true,
    scoring,
  });

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `draftedge.players.${scoring}.${CACHE_VERSION}`;

    // Drop player caches from older schema versions so legacy rank-based IDs
    // cannot resurface after a scoring-format change.
    try {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith("draftedge.players.") && !key.endsWith(`.${CACHE_VERSION}`)) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // storage unavailable — nothing to clean up
    }

    // Reset retained rows to this format's bundled board before cache/network
    // reads. Without this, a failed fetch could keep showing the previous
    // format's numbers under the new scoring label.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ players: getSeedPlayers(scoring), source: "seed", loading: true, scoring });

    // 1) Serve from cache immediately if fresh.
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as {
          players: Player[];
          source: "live" | "seed";
          weeklyRankingsUpdated?: string;
          currentWeek?: number | null;
          t: number;
        };
        if (Date.now() - cached.t < CACHE_TTL_MS) {
          // Serve cached board instantly; the fetch below refreshes in the background.
          setState({
            players: cached.players,
            source: cached.source,
            weeklyRankingsUpdated: cached.weeklyRankingsUpdated,
            currentWeek: cached.currentWeek,
            loading: false,
            scoring,
          });
        }
      }
    } catch {
      // corrupted cache — ignore
    }

    // 2) Refresh from the API in the background; fall back to seed on failure.
    fetch(`/api/players?scoring=${scoring}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PlayersResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              players: data.players,
              source: data.source,
              weeklyRankingsUpdated: data.weeklyRankingsUpdated,
              currentWeek: data.currentWeek,
              t: Date.now(),
            }),
          );
        } catch {
          // storage unavailable — ignore
        }
        setState({
          players: data.players,
          source: data.source,
          weeklyRankingsUpdated: data.weeklyRankingsUpdated,
          currentWeek: data.currentWeek,
          loading: false,
          scoring,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => {
          const aligned = s.scoring === scoring && s.players.length > 0;
          return {
            players: aligned ? s.players : getSeedPlayers(scoring),
            source: aligned ? s.source : "seed",
            loading: false,
            scoring,
            error: `Live data unavailable (${err instanceof Error ? err.message : "network error"}). Using bundled baseline projections.`,
          };
        });
      });

    return () => {
      cancelled = true;
    };
  }, [scoring]);

  // Never expose rows retained from a different scoring board (the render
  // between a scoring switch and the effect above).
  const aligned = state.scoring === scoring;
  return {
    players: aligned ? state.players : [],
    source: aligned ? state.source : "seed",
    loading: aligned ? state.loading : true,
    error: aligned ? state.error : undefined,
    weeklyRankingsUpdated: aligned ? state.weeklyRankingsUpdated : undefined,
    currentWeek: aligned ? state.currentWeek : null,
    scoring,
  };
}
