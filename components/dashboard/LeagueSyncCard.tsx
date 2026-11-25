"use client";

import { LeagueSummary } from "./LeagueSummary";
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

type Platform = "sleeper" | "espn";

export function LeagueSyncCard({ compactWhenConnected = false }: { compactWhenConnected?: boolean }) {
  const { supabaseEnabled } = useAuth();
  const connections = useSyncedLeagues();
  return <LeagueSyncPanel connections={connections} supabaseEnabled={supabaseEnabled} compactWhenConnected={compactWhenConnected} />;
}

type Connections = Pick<ReturnType<typeof useSyncedLeagues>, "leagues" | "activeLeague" | "loading" | "error" | "connectSleeper" | "connectEspn" | "syncNow" | "disconnectLeague" | "setActiveLeagueId">;

export function LeagueSyncPanel({ connections, supabaseEnabled, compactWhenConnected = false, initialPlatform = "sleeper", initialUsername = "", initialLeagueId = "", localExample = false, initiallyShowConnectForm = false, previewInput }: {
  connections: Connections; supabaseEnabled: boolean; compactWhenConnected?: boolean;
  initiallyShowConnectForm?: boolean; previewInput?: string; localExample?: boolean; initialPlatform?: Platform; initialUsername?: string; initialLeagueId?: string;
}) {
  const { leagues, activeLeague, loading, error, connectSleeper, connectEspn, syncNow, disconnectLeague, setActiveLeagueId } = connections;
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [enteredUsername, setUsername] = useState(initialUsername);
  const [enteredLeagueId, setLeagueId] = useState(initialLeagueId);
  const username = previewInput ?? enteredUsername;
  const leagueId = previewInput ?? enteredLeagueId;
  const [espnS2, setEspnS2] = useState("");
  const [swid, setSwid] = useState("");
  const [pendingTeams, setPendingTeams] = useState<Array<{ teamId: string; label: string }> | null>(null);
  const [teamId, setTeamId] = useState("");
  const [showConnectForm, setShowConnectForm] = useState(initiallyShowConnectForm);
  const [localError, setLocalError] = useState<string | null>(null);

  const connect = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    try {
      if (platform === "sleeper") {
        await connectSleeper(username);
        setUsername("");
        setShowConnectForm(false);
        return;
      }
      const result = await connectEspn({ leagueId, espnS2: espnS2.trim() || undefined, swid: swid.trim() || undefined, teamId: teamId || undefined });
      if (result.needsTeamSelection) {
        setPendingTeams(result.teams ?? []);
        setTeamId(result.teams?.[0]?.teamId ?? "");
        return;
      }
      setPendingTeams(null);
      setLeagueId("");
      setEspnS2("");
      setSwid("");
      setShowConnectForm(false);
    } catch (connectError) {
      setLocalError(connectError instanceof Error ? connectError.message : `${platform === "espn" ? "ESPN" : "Sleeper"} sync failed.`);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0D1412] p-4 sm:p-5" aria-label="Fantasy league sync">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">League Sync</p>
          <h2 className="mt-1 text-base font-semibold text-white">Bring your fantasy league into DraftEdge</h2>
        </div>
        {activeLeague && <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-300">LEAGUE CONNECTED</span>}
      </div>

      {activeLeague && !showConnectForm && compactWhenConnected ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">{activeLeague.league_name} · {activeLeague.total_teams} teams · synced {relativeTime(activeLeague.last_synced_at)}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={loading} onClick={() => void syncNow(activeLeague.platform_league_id).catch(() => {})} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white disabled:opacity-50">{loading ? "Syncing…" : "Sync Now"}</button>
            <button data-connect-another type="button" onClick={() => setShowConnectForm(true)} className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/15">+ Connect Another League</button>
          </div>
        </div>
      ) : activeLeague && !showConnectForm ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <LeagueSummary name={activeLeague.league_name} scoring={activeLeague.scoring_format} tePremium={activeLeague.te_premium} platform={activeLeague.platform} teams={activeLeague.total_teams} />
            {localExample && <p className="mt-1 text-xs text-zinc-400">{activeLeague.roster_positions.join(" · ")}</p>}
            <p className="mt-1 text-xs text-zinc-500">{activeLeague.platform === "sleeper" && activeLeague.sleeper_username ? `@${activeLeague.sleeper_username} · ` : ""}synced {relativeTime(activeLeague.last_synced_at)}</p>
            {!localExample && activeLeague.platform === "espn" && <p className="mt-1 text-[10px] text-zinc-600">Private league cookies stay in memory and may need to be entered again after a page reload.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {leagues.length > 1 && (
              <select aria-label="Active league" value={activeLeague.id ?? ""} onChange={(event) => setActiveLeagueId(event.target.value)} className="max-w-56 rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2 text-xs text-zinc-200">
                {leagues.map((league) => <option key={league.id} value={league.id}>{league.platform.toUpperCase()} · {league.league_name}</option>)}
              </select>
            )}
            <button type="button" disabled={loading} onClick={() => void syncNow(activeLeague.platform_league_id).catch(() => {})} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50">
              {loading ? "Syncing…" : "Sync Now"}
            </button>
            <button type="button" disabled={loading} onClick={() => activeLeague.id && void disconnectLeague(activeLeague.id).catch(() => {})} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-50">
              Disconnect
            </button>
            <button data-connect-another type="button" onClick={() => setShowConnectForm(true)} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white">
              Connect another league
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeLeague && <button type="button" onClick={() => setShowConnectForm(false)} className="mt-4 text-xs font-medium text-zinc-400 underline underline-offset-4 hover:text-white">Back to connected league</button>}
          <div className={`${activeLeague ? "mt-3" : "mt-4"} inline-flex rounded-lg border border-white/[0.08] bg-[#080E0C] p-0.5`} role="tablist" aria-label="Fantasy platform">
            {(["sleeper", "espn"] as const).map((item) => <button key={item} role="tab" aria-selected={platform === item} type="button" onClick={() => { setPlatform(item); setLocalError(null); }} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${platform === item ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-200"}`}>{item === "espn" ? "ESPN" : "Sleeper"}</button>)}
          </div>
          <form onSubmit={connect} className="mt-3 space-y-3">
            {platform === "sleeper" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" placeholder="Enter Sleeper username…" aria-label="Sleeper username" className="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none" />
                <button type="submit" disabled={loading || !supabaseEnabled || !username.trim()} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${loading || !supabaseEnabled || !username.trim() ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300/60" : "border-emerald-500 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"} disabled:cursor-not-allowed`}>{loading ? "Connecting…" : "Connect Sleeper"}</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input value={leagueId} onChange={(event) => setLeagueId(event.target.value)} inputMode="numeric" autoComplete="off" placeholder="ESPN League ID" aria-label="ESPN league ID" className="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none" />
                  <button type="submit" disabled={loading || !supabaseEnabled || !leagueId.trim() || (!!pendingTeams && !teamId)} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${loading || !supabaseEnabled || !leagueId.trim() || (!!pendingTeams && !teamId) ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300/60" : "border-emerald-500 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"} disabled:cursor-not-allowed`}>{loading ? "Connecting…" : "Connect ESPN"}</button>
                </div>
                {pendingTeams && <label className="block text-xs text-zinc-400">Which team is yours?
                  <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-white/[0.1] bg-[#080E0C] px-3 py-2.5 text-sm text-white sm:max-w-sm">{pendingTeams.map((team) => <option key={team.teamId} value={team.teamId}>{team.label}</option>)}</select>
                </label>}
                {!localExample && <details className="rounded-lg border border-white/[0.08] bg-[#080E0C] px-3 py-2.5">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-300">Private league? Add ESPN cookies</summary>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">On ESPN Fantasy, open DevTools → Application → Cookies, then copy <code>espn_s2</code> and <code>SWID</code>. These are sent only to DraftEdge’s sync endpoint and are not saved.</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input value={espnS2} onChange={(event) => setEspnS2(event.target.value)} type="password" autoComplete="off" placeholder="espn_s2" aria-label="ESPN espn_s2 cookie" className="min-w-0 rounded-lg border border-white/[0.1] bg-[#0D1412] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none" />
                    <input value={swid} onChange={(event) => setSwid(event.target.value)} type="password" autoComplete="off" placeholder="SWID" aria-label="ESPN SWID cookie" className="min-w-0 rounded-lg border border-white/[0.1] bg-[#0D1412] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none" />
                  </div>
                </details>}
              </>
            )}
          </form>
        </>
      )}
      {(!supabaseEnabled || error || localError) && <p role="status" className="mt-3 text-xs text-amber-300">{localError ?? error ?? "Connect Supabase and apply migration 0006 to save league syncs."}</p>}
    </section>
  );
}
