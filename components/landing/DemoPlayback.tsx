"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import "./walkthrough.css";

const DemoStep = createContext({ step: 0, select: (_step: number) => { void _step; } });

export function useDemoStep() {
  return useContext(DemoStep);
}

const sequences: Record<string, readonly string[]> = {
  "/trade": ['input[aria-label^="Add players you receive"]', '[data-receive] [data-player-result="james-cook-iii"]', '[aria-label="Remove James Cook III"]'],
  "/mock": ['button[aria-label^="Draft "]', 'button[aria-label^="Draft "]', 'button[aria-label^="Draft "]', 'button[aria-label^="Draft "]'],
  "/start-sit": ['button[aria-pressed="false"]', 'button[aria-pressed="false"]'],
  "/leagues": ['input[aria-label="Sleeper username"]', 'button[type=submit]', 'button:last-of-type', 'input[aria-label="ESPN league ID"]', 'button[type=submit]', 'button:last-of-type'],
};

export function DemoPlayback({ children, title, href }: { children: ReactNode; title: string; href: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const playing = visible && !reduced && !focusWithin && !hovered;

  useEffect(() => {
    const element = frame.current!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(element);
    return () => {
      preference.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const root = frame.current!;
    const pointer = cursor.current!;
    let timer: ReturnType<typeof setTimeout>;
    function move(target: HTMLElement) {
      const box = target.getBoundingClientRect();
      const origin = root.getBoundingClientRect();
      const scale = origin.width / root.offsetWidth || 1;
      pointer.style.transform = "translate(" + ((box.left - origin.left + box.width * .55) / scale) + "px," + ((box.top - origin.top + box.height * .6) / scale) + "px)";
      pointer.style.opacity = "1";
    }
    function advance() {
      const sequence = sequences[href];
      const target = root.querySelector<HTMLElement>(sequence[step]) ?? root;
      timer = setTimeout(() => {
        move(target);
        timer = setTimeout(() => {
          pointer.firstElementChild?.animate([{ transform: "scale(.5)", opacity: 1 }, { transform: "scale(2.2)", opacity: 0 }], 450);
          if (href === "/trade" && target instanceof HTMLButtonElement) target.click();
          setStep(previous => (previous + 1) % sequence.length);
        }, 720);
      }, 950);
    }
    timer = setTimeout(advance, 1400);
    return () => {
      clearTimeout(timer);
      pointer.style.opacity = "0";
    };
  }, [href, step, playing]);

  return (
    <div ref={frame} className="relative" role="group" aria-label={title} onPointerEnter={e => setHovered(e.pointerType === "mouse")} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocusWithin(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusWithin(false); }}>
      <DemoStep.Provider value={{ step, select: setStep }}>{children}</DemoStep.Provider>
      <div ref={cursor} aria-hidden="true" className="demo-pointer">
        <i /><svg width="23" height="27" viewBox="0 0 23 27"><path d="M2 2 20 14l-8 1.5 4 8-4 1.5-4-8L3 22Z" fill="white" stroke="#09090B" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}
