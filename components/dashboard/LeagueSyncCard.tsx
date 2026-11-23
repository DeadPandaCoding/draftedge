"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSyncedLeagues } from "@/lib/league-context";

function relativeTime(timestamp: string): string {
  const date = new Date(timestamp).getTime();
  if (!Number.isFinite(date)) return "just now";
  const minutes = Math.max(0, Math.floor((Date.now() - date) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LeagueSyncCard() {
  const { supabaseEnabled } = useAuth();
  const { leagues, activeLeague, loading, error, connectSleeper, syncNow, disconnectLeague, setActiveLeagueId } = useSyncedLeagues();
  const [username, setUsername] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const connect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    try {
      await connectSleeper(username);
      setUsername("");
    } catch (connectError) {
      setLocalError(connectError instanceof Error ? connectError.message : "Could not connect Sleeper account.");
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5" aria-label="Sleeper league sync">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">League Sync</p>
          <h2 className="mt-1 text-base font-semibold text-white">Bring your Sleeper league into DraftEdge</h2>
        </div>
        {activeLeague && <span className="rounded border border-pop-border bg-pop-soft px-2 py-1 font-mono text-[10px] font-bold text-pop">LIVE SYNC</span>}
      </div>

      {activeLeague ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-zinc-100">{activeLeague.league_name}</p>
              <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                {activeLeague.scoring_format}{activeLeague.te_premium ? " · TEP" : ""}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">{activeLeague.total_teams} teams</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">@{activeLeague.sleeper_username} · synced {relativeTime(activeLeague.last_synced_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {leagues.length > 1 && (
              <select aria-label="Active Sleeper league" value={activeLeague.id ?? ""} onChange={(event) => setActiveLeagueId(event.target.value)} className="rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs text-zinc-200">
                {leagues.map((league) => <option key={league.id} value={league.id}>{league.league_name}</option>)}
              </select>
            )}
            <button type="button" disabled={loading} onClick={() => void syncNow(activeLeague.platform_league_id).catch(() => {})} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50">
              {loading ? "Syncing…" : "Sync Now"}
            </button>
            <button type="button" disabled={loading} onClick={() => activeLeague.id && void disconnectLeague(activeLeague.id).catch(() => {})} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-50">
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={connect} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" placeholder="Enter Sleeper username…" aria-label="Sleeper username" className="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none" />
          <button type="submit" disabled={loading || !supabaseEnabled || !username.trim()} className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Connecting…" : "Connect Sleeper"}
          </button>
        </form>
      )}
      {(!supabaseEnabled || error || localError) && <p role="status" className="mt-3 text-xs text-amber-300">{localError ?? error ?? "Connect Supabase and apply migration 0006 to save league syncs."}</p>}
    </section>
  );
}
