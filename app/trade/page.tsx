"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { Player } from "@/lib/types";
import AppShell from "@/components/dashboard/AppShell";
import { PlayerPicker } from "@/components/dashboard/PlayerPicker";
import { PosBadge, Skeleton } from "@/components/ui";
import { SwapIcon, XIcon } from "@/components/icons";

type Side = "A" | "B";

export default function TradePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { players, loading: playersLoading } = usePlayers("ppr");

  const [sideA, setSideA] = useState<string[]>([]);
  const [sideB, setSideB] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const excluded = useMemo(() => new Set([...sideA, ...sideB]), [sideA, sideB]);

  const aPlayers = sideA.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const bPlayers = sideB.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));

  const aTotal = aPlayers.reduce((s, p) => s + p.projection, 0);
  const bTotal = bPlayers.reduce((s, p) => s + p.projection, 0);
  const diff = aTotal - bTotal;

  const add = (side: Side, player: Player) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => (prev.includes(player.id) ? prev : [...prev, player.id]));
  };

  const remove = (side: Side, id: string) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => prev.filter((x) => x !== id));
  };

  const sideList = (players: Player[], side: Side) => (
    <div className="space-y-1.5">
      {players.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700/60 px-3 py-4 text-center text-xs text-zinc-500">
          No players added yet.
        </p>
      ) : (
        players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/60 px-3 py-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-zinc-200">{p.name}</span>
              <PosBadge position={p.position} size="xs" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-tech text-xs text-zinc-400">{p.projection.toFixed(1)}</span>
              <button
                type="button"
                onClick={() => remove(side, p.id)}
                aria-label={`Remove ${p.name}`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
              >
                <XIcon size={13} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  const verdict =
    diff > 1
      ? { text: "You win this trade", detail: `+${diff.toFixed(1)} projected points`, color: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" }
      : diff < -1
        ? { text: "You lose this trade", detail: `${diff.toFixed(1)} projected points`, color: "text-rose-300", ring: "border-rose-500/40 bg-rose-500/10" }
        : { text: "Roughly even", detail: `Δ ${diff.toFixed(1)} projected points`, color: "text-zinc-300", ring: "border-zinc-600/60 bg-zinc-800/40" };

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
          <SwapIcon size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Trade Analyzer</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Compare both sides of a trade by projected points to see who comes out ahead.
          </p>
        </div>
      </div>

      {playersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {/* Side A — You receive */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">You receive</h2>
              <span className="font-tech text-lg font-bold text-emerald-300">{aTotal.toFixed(1)}</span>
            </div>
            <div className="mb-3">
              <PlayerPicker players={players} exclude={excluded} onPick={(p) => add("A", p)} placeholder="Add players you receive…" />
            </div>
            {sideList(aPlayers, "A")}
          </div>

          {/* Side B — You give up */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">You give up</h2>
              <span className="font-tech text-lg font-bold text-zinc-200">{bTotal.toFixed(1)}</span>
            </div>
            <div className="mb-3">
              <PlayerPicker players={players} exclude={excluded} onPick={(p) => add("B", p)} placeholder="Add players you give up…" />
            </div>
            {sideList(bPlayers, "B")}
          </div>
        </div>
      )}

      {/* Verdict */}
      {(aPlayers.length > 0 || bPlayers.length > 0) && (
        <div className={`mt-6 rounded-2xl border px-6 py-5 text-center ${verdict.ring}`}>
          <span className={`font-display block text-2xl tracking-wide ${verdict.color}`}>{verdict.text}</span>
          <span className="mt-1 block text-sm text-zinc-400">
            {verdict.detail} · {aPlayers.length + bPlayers.length} players compared
          </span>
          <span className="mt-2 block text-[11px] text-zinc-500">
            Based on season projections only — context like team need and league size still matters.
          </span>
        </div>
      )}
    </AppShell>
  );
}
