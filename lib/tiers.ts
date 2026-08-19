import type { Position } from "./types";

/**
 * Tier/position color styling. Tiers are assigned by the data source (the
 * generated rankings carry expert tiers mapped to 1–5); this module only
 * provides the visual treatment.
 */

export const TIER_STYLES: Record<number, { pill: string; border: string; glow: string; label: string }> = {
  1: {
    pill: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_24px_-6px_rgba(251,191,36,0.45)]",
    label: "Tier 1",
  },
  2: {
    pill: "bg-sky-400/15 text-sky-300 ring-sky-400/40",
    border: "border-sky-400/40",
    glow: "shadow-[0_0_24px_-6px_rgba(56,189,248,0.35)]",
    label: "Tier 2",
  },
  3: {
    pill: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_24px_-6px_rgba(52,211,153,0.35)]",
    label: "Tier 3",
  },
  4: {
    pill: "bg-violet-400/15 text-violet-300 ring-violet-400/40",
    border: "border-violet-400/40",
    glow: "shadow-[0_0_24px_-6px_rgba(167,139,250,0.35)]",
    label: "Tier 4",
  },
  5: {
    pill: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/40",
    border: "border-zinc-600/50",
    glow: "",
    label: "Tier 5",
  },
};

export const POSITION_STYLES: Record<Position, { pill: string; dot: string }> = {
  QB: { pill: "bg-rose-400/15 text-rose-300 ring-rose-400/40", dot: "bg-rose-400" },
  RB: { pill: "bg-sky-400/15 text-sky-300 ring-sky-400/40", dot: "bg-sky-400" },
  WR: { pill: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40", dot: "bg-emerald-400" },
  TE: { pill: "bg-violet-400/15 text-violet-300 ring-violet-400/40", dot: "bg-violet-400" },
  K: { pill: "bg-amber-400/15 text-amber-300 ring-amber-400/40", dot: "bg-amber-400" },
  DEF: { pill: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/40", dot: "bg-zinc-400" },
};
