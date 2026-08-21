"use client";

import { useCallback, useEffect, useState } from "react";

const STARS_KEY = "draftedge.stars.v1";

/**
 * Starred players (personalized dashboard). Stars are keyed by player name so
 * they survive scoring-format changes and work across every screen.
 */
export function useStarredPlayers() {
  const [starred, setStarred] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STARS_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStarred(JSON.parse(raw) as string[]);
      }
    } catch {
      // corrupted storage — ignore
    }
  }, []);

  const toggleStar = useCallback((name: string) => {
    setStarred((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      try {
        localStorage.setItem(STARS_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — ignore
      }
      return next;
    });
  }, []);

  const isStarred = useCallback((name: string) => starred.includes(name), [starred]);

  return { starred, toggleStar, isStarred };
}
