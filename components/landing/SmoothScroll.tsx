"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Smooth scroll for the landing page, powered by Lenis.
 *
 * Mounted as a client-side island so the rest of the page stays a Server
 * Component. `autoRaf` drives the animation loop for us; `anchors` lets the
 * nav's `#features` / `#how-it-works` links scroll smoothly instead of jumping.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
