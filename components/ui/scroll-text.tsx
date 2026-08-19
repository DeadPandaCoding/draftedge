"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type ScrollTextTag = "p" | "h1" | "h2" | "h3" | "div" | "span";

interface ScrollTextProps {
  text: string;
  className?: string;
  /** ScrollTrigger start position for the reveal (e.g. "top 82%"). */
  start?: string;
  /** Semantic element to render (defaults to `p`). */
  as?: ScrollTextTag;
}

/**
 * Line-by-line scrolling text reveal.
 *
 * The text is split into words, grouped into the lines they actually render
 * on (measured from the DOM), then each line is wrapped in an
 * `overflow: hidden` mask and slides up into place as it scrolls into view.
 * Re-splits on resize so the line breaks track the responsive layout, and
 * honors `prefers-reduced-motion` (renders fully visible).
 */
export function ScrollText({ text, className, start = "top 82%", as = "p" }: ScrollTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  // Callback ref so the root can be any intrinsic element while the ref's
  // value stays a plain HTMLElement (contravariance widens this safely).
  const setRef = useCallback((node: HTMLElement | null) => {
    rootRef.current = node;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let alive = true;

    // One span per word. Hidden from ATs — the sr-only span carries the text.
    const wordEls = text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const span = document.createElement("span");
        span.className = "scroll-text-word";
        span.setAttribute("aria-hidden", "true");
        span.textContent = word;
        return span;
      });
    wordEls.forEach((w) => root.appendChild(w));

    const tweens: gsap.core.Tween[] = [];

    const split = () => {
      if (!alive) return;

      // Restore words from any existing masks back to the root first.
      root.querySelectorAll("[data-scroll-line-mask]").forEach((mask) => {
        mask.querySelectorAll(".scroll-text-word").forEach((w) => root.appendChild(w));
        mask.remove();
      });
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      tweens.length = 0;

      // Group words into lines by their rendered vertical position.
      const groups: HTMLElement[][] = [];
      let lastTop: number | null = null;
      wordEls.forEach((w) => {
        const top = Math.round(w.getBoundingClientRect().top);
        if (lastTop === null || top !== lastTop) {
          groups.push([w]);
          lastTop = top;
        } else {
          groups[groups.length - 1].push(w);
        }
      });

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const inners: HTMLElement[] = [];

      groups.forEach((group) => {
        const mask = document.createElement("span");
        mask.className = "scroll-text-line-mask";
        mask.dataset.scrollLineMask = "true";
        const inner = document.createElement("span");
        inner.className = "scroll-text-line";
        group.forEach((w) => inner.appendChild(w));
        mask.appendChild(inner);
        root.appendChild(mask);
        if (!reduce) inners.push(inner);
      });

      if (reduce || inners.length === 0) return;

      gsap.set(inners, { yPercent: 115 });
      tweens.push(
        gsap.to(inners, {
          yPercent: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root, start, once: true },
        })
      );
    };

    split();

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(split);
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      wordEls.forEach((w) => w.remove());
      root.querySelectorAll("[data-scroll-line-mask]").forEach((m) => m.remove());
    };
  }, [text, start]);

  const Tag = as;

  return (
    <Tag ref={setRef} className={cn("scroll-text", className)}>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
