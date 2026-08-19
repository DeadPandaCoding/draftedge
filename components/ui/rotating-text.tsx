"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { cn } from "@/lib/utils";

// SSR-safe reduced-motion store: returns false during prerender/hydration,
// then tracks the real media query once the client takes over.
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return false;
}

/**
 * RotatingText — cycles through phrases with a blur-fade-slide swap and a
 * blinking caret. Stays static (first phrase, no motion) for users who
 * prefer reduced motion.
 */
export function RotatingText({
  phrases,
  interval = 2800,
  caret = true,
  className,
}: {
  phrases: string[];
  interval?: number;
  caret?: boolean;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  useEffect(() => {
    if (reduceMotion || phrases.length <= 1) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % phrases.length), interval);
    return () => window.clearInterval(id);
  }, [reduceMotion, phrases.length, interval]);

  return (
    /* key forces a remount per phrase so the entrance animation AND the
       caret's blink phase restart in sync with each swap */
    <span key={idx} className="inline-flex items-baseline">
      <span className={cn("rotating-phrase inline-block", className)}>{phrases[idx]}</span>
      {caret && !reduceMotion && (
        <span
          aria-hidden
          className="rotating-caret ml-1.5 inline-block h-[0.85em] w-[0.09em] translate-y-[0.08em] rounded-full bg-emerald-400"
        />
      )}
    </span>
  );
}
