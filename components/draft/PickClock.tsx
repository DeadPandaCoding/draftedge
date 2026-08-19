"use client";

import { useEffect, useState } from "react";
import type { DraftStatus } from "@/lib/types";
import { Dropdown } from "@/components/ui";
import { CheckIcon, ChevronDownIcon, ClockIcon } from "@/components/icons";

const TIMER_OPTIONS = [30, 60, 90, 120];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PickClock({
  status,
  timerSeconds,
  anchorTime,
  onSetTimer,
}: {
  status: DraftStatus;
  timerSeconds: number;
  /** Epoch ms of the last logged pick (or when the draft went live). */
  anchorTime: number | undefined;
  onSetTimer: (seconds: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  // Tick only while the draft is live.
  useEffect(() => {
    if (status !== "live") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  const totalMs = timerSeconds * 1000;
  const elapsedMs = anchorTime ? Math.max(0, now - anchorTime) : 0;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const remaining = Math.ceil(remainingMs / 1000);

  const expired = status === "live" && remaining <= 0;
  const low = status === "live" && remaining <= 10 && !expired;
  const warm = status === "live" && remaining <= 30 && !low && !expired;

  const tone = expired || low
    ? "border-rose-500/50 bg-rose-500/15 text-rose-300 animate-pulse"
    : warm
      ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
      : status === "live"
        ? "border-emerald-500/40 bg-zinc-900 text-amber-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-400";

  return (
    <Dropdown
      align="right"
      width="w-44"
      trigger={
        <button
          aria-label="Pick timer"
          title="Pick timer — click to change"
          className={`font-tech inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold tracking-wide ring-1 ring-inset transition ${tone}`}
        >
          <ClockIcon size={12} />
          {formatTime(remaining)}
          <ChevronDownIcon size={10} className="opacity-60" />
        </button>
      }
    >
      {(close) => (
        <div className="py-1">
          <p className="px-3.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Pick timer
          </p>
          {TIMER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                onSetTimer(s);
                close();
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-sm transition hover:bg-zinc-800 ${
                timerSeconds === s ? "font-bold text-white" : "text-zinc-400"
              }`}
            >
              {s}s
              {timerSeconds === s && <CheckIcon size={13} className="text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
