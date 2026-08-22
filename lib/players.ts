"use client";

import { useEffect, useState } from "react";
import type { Player, PlayersResponse, ScoringFormat } from "./types";
import { getSeedPlayers } from "./seed-data";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface PlayersState {
  players: Player[];
  source: "live" | "seed" | "cache";
  loading: boolean;
  error?: string;
}

export function usePlayers(scoring: ScoringFormat): PlayersState {
  const [state, setState] = useState<PlayersState>({
    players: [],
    source: "seed",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `draftedge.players.${scoring}.v3`;

    // 1) Serve from cache immediately if fresh.
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as { players: Player[]; source: "live" | "seed"; t: number };
        if (Date.now() - cached.t < CACHE_TTL_MS) {
          // Serve cached board instantly; the fetch below refreshes in the background.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({ players: cached.players, source: cached.source, loading: false });
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
          localStorage.setItem(cacheKey, JSON.stringify({ players: data.players, source: data.source, t: Date.now() }));
        } catch {
          // storage unavailable — ignore
        }
        setState({ players: data.players, source: data.source, loading: false });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({
          players: s.players.length > 0 ? s.players : getSeedPlayers(scoring),
          source: s.players.length > 0 ? s.source : "seed",
          loading: false,
          error: `Live data unavailable (${err instanceof Error ? err.message : "network error"}). Using bundled baseline projections.`,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [scoring]);

  return state;
}
