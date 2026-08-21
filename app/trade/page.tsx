"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { Player } from "@/lib/types";
import { buildTradeValues, gradeTrade } from "@/lib/trade-value";
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
  const values = useMemo(() => buildTradeValues(players), [players]);
  const excluded = useMemo(() => new Set([...sideA, ...sideB]), [sideA, sideB]);

  const aPlayers = sideA.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
  const bPlayers = sideB.map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));

  const valueOf = (id: string) => values.get(id) ?? 0;
  const aValue = aPlayers.reduce((s, p) => s + valueOf(p.id), 0);
  const bValue = bPlayers.reduce((s, p) => s + valueOf(p.id), 0);
  const aProj = aPlayers.reduce((s, p) => s + p.projection, 0);
  const bProj = bPlayers.reduce((s, p) => s + p.projection, 0);

  const net = aValue - bValue;
  const total = aValue + bValue;
  const grade = gradeTrade(net, total);
  const aPct = total > 0 ? (aValue / total) * 100 : 50;

  const add = (side: Side, player: Player) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => (prev.includes(player.id) ? prev : [...prev, player.id]));
  };

  const remove = (side: Side, id: string) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => prev.filter((x) => x !== id));
  };

  const playerRow = (p: Player, side: Side) => (
    <div key={p.id} className="rounded-lg bg-zinc-900/60 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-zinc-200">{p.name}</span>
          <PosBadge position={p.position} size="xs" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-tech text-sm font-bold text-emerald-300">{valueOf(p.id).toFixed(1)}</span>
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
      <div className="mt-0.5 text-[11px] text-zinc-500">
        {p.projection.toFixed(1)} pts · ADP {p.adp > 0 ? p.adp.toFixed(1) : "—"}
      </div>
    </div>
  );

  const sideColumn = (side: Side, title: string, list: Player[], totalValue: number, totalProj: number) => (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">{title}</h2>
        <span className="font-tech text-lg font-bold text-emerald-300">
          {totalValue.toFixed(1)} <span className="text-[10px] font-semibold text-zinc-500">VAL</span>
        </span>
      </div>
      <div className="mb-3">
        <PlayerPicker
          players={players}
          exclude={excluded}
          onPick={(p) => add(side, p)}
          placeholder={side === "A" ? "Add players you receive…" : "Add players you give up…"}
        />
      </div>
      <div className="space-y-1.5">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700/60 px-3 py-4 text-center text-xs text-zinc-500">
            No players added yet.
          </p>
        ) : (
          list.map((p) => playerRow(p, side))
        )}
      </div>
      {list.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <span>Projection</span>
          <span className="font-tech font-semibold text-zinc-200">{totalProj.toFixed(1)} pts</span>
        </div>
      )}
    </div>
  );

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-5xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
          <SwapIcon size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Trade Analyzer</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Compare both sides by trade value and get an instant grade.
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
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {sideColumn("A", "You receive", aPlayers, aValue, aProj)}
            {sideColumn("B", "You give up", bPlayers, bValue, bProj)}
          </div>

          {/* Verdict */}
          {(aPlayers.length > 0 || bPlayers.length > 0) && (
            <div className={`mt-6 rounded-2xl border p-6 ${grade.ring}`}>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className={`font-display text-5xl font-bold ${grade.text}`}>{grade.letter}</span>
                  <div>
                    <p className={`font-display text-xl tracking-wide ${grade.text}`}>{grade.label}</p>
                    <p className="text-sm text-zinc-400">
                      {aPlayers.length + bPlayers.length} players compared
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Net value</p>
                  <p className={`font-tech text-2xl font-bold ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {net >= 0 ? "+" : ""}
                    {net.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Value split bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="text-emerald-300">Receive</span>
                  <span className="text-rose-300">Give up</span>
                </div>
                <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: `${aPct}%` }} />
                  <div className="bg-rose-500" style={{ width: `${100 - aPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-tech">{aValue.toFixed(1)} value</span>
                  <span className="font-tech">{bValue.toFixed(1)} value</span>
                </div>
              </div>

              {aPlayers.length !== bPlayers.length && (
                <p className="mt-4 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400">
                  {aPlayers.length < bPlayers.length
                    ? "You're consolidating several players into fewer — real markets usually demand a premium for that."
                    : "You're splitting one player into several — depth can be valuable, but the market often discounts it."}
                </p>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
                Value = projected points above a replacement-level starter (12-team baseline), shown
                alongside ADP as a market cross-check.
              </p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
