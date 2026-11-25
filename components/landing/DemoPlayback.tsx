"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import "./walkthrough.css";

const DemoStep = createContext(0);

export function useDemoStep() {
  return useContext(DemoStep);
}


export function DemoPlayback({ children, title, href }: { children: ReactNode; title: string; href: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const script = shots[href];
  const playing = started && !reduced;

  useEffect(() => {
    const element = frame.current!;
    // Shared app components can mount new controls as the example advances.
    const excludeTabStops = () => {
      element.querySelectorAll<HTMLElement>("input, button, select, textarea, a[href], [tabindex]").forEach(control => {
        if (control.tabIndex !== -1) control.tabIndex = -1;
      });
    };
    excludeTabStops();
    const controls = new MutationObserver(excludeTabStops);
    controls.observe(element, { childList: true, subtree: true });
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => {
      preference.removeEventListener("change", sync);
      observer.disconnect();
      controls.disconnect();
    };
  }, []);

  return <div ref={frame} inert aria-hidden="true" aria-label={title} className="demo-frame relative h-[380px] sm:h-[420px] overflow-hidden pointer-events-none select-none">
    <CameraDemo script={script} playing={playing} reduced={reduced}>{children}</CameraDemo>
  </div>;
}

const DemoQuery = createContext("");
export function useDemoQuery() { return useContext(DemoQuery); }

type Shot = { focus?: string; click?: string; type?: string; duration?: number };
const receive = "[data-receive] input";
const first = '[data-player-card="0"] input';
const second = '[data-player-card="1"] input';
const shots: Record<string, Shot[]> = {
  "/trade": [{}, { focus: receive, click: receive, type: "James Cook III" }, { focus: receive, click: '[data-receive] [data-player-result="james-cook-iii"]' }, {}, {}],
  "/mock": [{}, {}, { click: "[data-filter]" }, { click: 'button[aria-label^="Draft "]' }, {}, {}],
  "/start-sit": [
    {}, { focus: first, click: first, type: "Jahmyr Gibbs" },
    { focus: first, click: '[data-player-result="jahmyr-gibbs"]' },
    { focus: second, click: second, type: "James Cook III" },
    { focus: second, click: '[data-player-result="james-cook-iii"]' }, { duration: 5550 },
  ],
  "/leagues": [
    { click: '[aria-label="Sleeper username"]', type: "draftedge_demo" },
    { click: 'button[type="submit"]' }, {}, { click: "[data-connect-another]" }, { click: '[role="tab"]:last-child' },
    { click: '[aria-label="ESPN league ID"]', type: "123456" },
    { click: 'button[type="submit"]' }, {}, { click: "[data-connect-another]" }, { click: '[role="tab"]:first-child' },
  ],
};

function CameraDemo({script, playing, reduced, children}: {script: Shot[]; playing: boolean; reduced: boolean; children: ReactNode}) {
  const camera = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!playing) return;
    const layer = camera.current!;
    const pointer = cursor.current!;
    const shot = script[step];
    const focus = shot.focus ? layer.querySelector<HTMLElement>(shot.focus) : null;
    const target = shot.click ? layer.querySelector<HTMLElement>(shot.click) : null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    function position() {
      const rect = layer.getBoundingClientRect();
      const ratio = rect.width / layer.offsetWidth;
      function center(el: HTMLElement) {
        const box = el.getBoundingClientRect();
        return [(box.left + box.width / 2 - rect.left) / ratio, (box.top + box.height / 2 - rect.top) / ratio];
      }
      const zoom = focus ? 1.45 : 1;
      const [x, y] = focus ? center(focus) : [0, 0];
      const pan = (size: number, point: number) => Math.min(0, Math.max(size * (1 - zoom), size / 2 - point * zoom));
      if (target) {
        const [cx, cy] = center(target);
        pointer.style.transform = "translate(" + cx + "px," + cy + "px)";
      }
      layer.style.transform = "translate(" + pan(layer.offsetWidth,x) + "px," + pan(layer.offsetHeight,y) + "px) scale(" + zoom + ")";
      pointer.style.opacity = target ? "1" : "0";
    }
    position();
    const resize = new ResizeObserver(position);
    resize.observe(layer);
    if (target) later(() => pointer.firstElementChild?.animate([{opacity:1, transform:"scale(.5)"},{opacity:0, transform:"scale(2)"}], 360), shot.type ? 800 : 1450);
    const name = shot.type ?? "";
    for (let i = 1; i <= name.length; i++) later(() => setQuery(name.slice(0, i)), 910 + i * 85);
    later(() => { setQuery(""); setStep((step + 1) % script.length); }, shot.duration ?? (shot.type ? 2800 : 1850));
    return () => { timers.forEach(clearTimeout); resize.disconnect(); };
  }, [script, step, playing]);
  return <div ref={camera} className="demo-camera relative" data-shot={step}>
    <DemoStep.Provider value={reduced ? script.length - 1 : step}><DemoQuery.Provider value={query}>{children}</DemoQuery.Provider></DemoStep.Provider>
    <div ref={cursor} className="demo-pointer"><i /><svg width="23" height="27" viewBox="0 0 23 27"><path d="M2 2 20 14l-8 1.5 4 8-4 1.5-4-8L3 22Z" fill="white" stroke="#09090B" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
  </div>;
}
