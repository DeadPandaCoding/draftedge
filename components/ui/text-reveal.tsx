"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  /** Delay in seconds before the reveal starts. */
  delay?: number;
  /** Stagger between words in seconds. */
  stagger?: number;
}

/**
 * Oversized headline reveal — each word slides up, fades in and de-blurs.
 * Uses a single decelerating ease (power4.out) for a premium, restrained feel
 * with no overshoot. Honors `prefers-reduced-motion`.
 */
export function TextReveal({ text, className, delay = 0, stagger = 0.07 }: TextRevealProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pieces = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-word]"));
    if (!pieces.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(pieces, { y: 0, opacity: 1, filter: "none" });
      return;
    }

    const tween = gsap.fromTo(
      pieces,
      { y: 28, opacity: 0, filter: "blur(8px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power4.out",
        stagger,
        delay,
        clearProps: "filter",
      }
    );

    return () => {
      tween.kill();
    };
  }, [text, delay, stagger]);

  return (
    <span ref={rootRef} className={cn("inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block">
            <span data-reveal-word className="inline-block will-change-transform">
              {word}
            </span>
            {i < words.length - 1 ? <span className="inline-block">{"\u00A0"}</span> : null}
          </span>
        ))}
      </span>
    </span>
  );
}
