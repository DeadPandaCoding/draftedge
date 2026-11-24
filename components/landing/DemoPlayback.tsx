"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import "./walkthrough.css";

const DemoStep = createContext(0);

export function useDemoStep() {
  return useContext(DemoStep);
}

export function DemoPlayback({ children, title, draft }: { children: ReactNode; title: string; draft: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  const playing = visible && !reduced;

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
      pointer.style.transform = "translate(" + (box.left - origin.left + box.width * .55) + "px," + (box.top - origin.top + box.height * .6) + "px)";
      pointer.style.opacity = "1";
    }
    function advance() {
      const target = root.querySelector<HTMLElement>(draft ? "[data-demo-draft]" : '[data-demo-choice][data-active="false"]');
      if (!target) return;
      const start = root.querySelector<HTMLElement>(draft ? "[data-demo-player]" : '[data-demo-choice][data-active="true"]');
      if (start) move(start);
      timer = setTimeout(() => {
        move(target);
        timer = setTimeout(() => {
          pointer.firstElementChild?.animate([{ transform: "scale(.5)", opacity: 1 }, { transform: "scale(2.2)", opacity: 0 }], 450);
          setStep(previous => (previous + 1) % 4);
          timer = setTimeout(advance, 2300);
        }, 720);
      }, 950);
    }
    timer = setTimeout(advance, 550);
    return () => {
      clearTimeout(timer);
      pointer.style.opacity = "0";
    };
  }, [draft, playing]);

  return (
    <div ref={frame} className="relative">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/15 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">{title}</span>

      </div>
      <DemoStep.Provider value={step}>{children}</DemoStep.Provider>
      <div ref={cursor} aria-hidden="true" className="demo-pointer">
        <i /><svg width="23" height="27" viewBox="0 0 23 27"><path d="M2 2 20 14l-8 1.5 4 8-4 1.5-4-8L3 22Z" fill="white" stroke="#09090B" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}
