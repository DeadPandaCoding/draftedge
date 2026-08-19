"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LeagueConfig, PickOwner, Position } from "@/lib/types";
import { fetchLeague, persistLeague } from "@/lib/data";
import { analyzeNeeds, bestAvailable, buildRoster, useDraft } from "@/lib/draft";
import { usePlayers } from "@/lib/players";
import { exportRosterCsv } from "@/lib/csv";
import { Modal } from "@/components/ui";
import { DraftHeader } from "@/components/draft/DraftHeader";
import { NavRail } from "@/components/draft/NavRail";
import { ControlPanel, type ViewMode } from "@/components/draft/ControlPanel";
import { CheatSheetTable } from "@/components/draft/CheatSheetTable";
import { TierGrid } from "@/components/draft/TierGrid";
import { RosterPanel } from "@/components/draft/RosterPanel";
import { XIcon } from "@/components/icons";

export default function DraftPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [ready, setReady] = useState(false);

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [view, setView] = useState<ViewMode>("table");
  const [hideDrafted, setHideDrafted] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Guards: must be signed in and have a league configured.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const lg = await fetchLeague(user.id);
        if (cancelled) return;
        if (!lg) {
          router.replace("/onboarding");
          return;
        }
        setLeague(lg);
        setReady(true);
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  const { players, source, loading: playersLoading } = usePlayers(league?.scoring ?? "ppr");
  const draft = useDraft(league);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const draftedIds = useMemo(() => new Set(draft.state.picks.map((p) => p.playerId)), [draft.state.picks]);

  const entries = useMemo(
    () => (league ? buildRoster(draft.state.picks, playersById, league.roster) : []),
    [draft.state.picks, playersById, league]
  );

  const totalPicks = league ? league.rounds * league.teamCount : 0;
  const needs = useMemo(
    () =>
      league
        ? analyzeNeeds(entries, league.roster, draft.state.currentPick, league.teamCount, totalPicks)
        : [],
    [entries, league, draft.state.currentPick, totalPicks]
  );

  const best = useMemo(() => bestAvailable(players, draftedIds), [players, draftedIds]);

  const counts = useMemo(() => {
    const c: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    for (const p of players) if (!draftedIds.has(p.id)) c[p.position]++;
    return c;
  }, [players, draftedIds]);

  const filtered = useMemo(() => {
    let list = players;
    if (position !== "ALL") list = list.filter((p) => p.position === position);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }
    if (hideDrafted) list = list.filter((p) => !draftedIds.has(p.id));
    return list;
  }, [players, position, search, hideDrafted, draftedIds]);

  const handleDraft = (playerId: string, owner: PickOwner) => draft.draftPlayer(playerId, owner);
  const handleUndraft = (playerId: string) => draft.undraftPlayer(playerId);
  const handleNote = (playerId: string, note: string) => draft.setNote(playerId, note);

  const handleSetStatus = async (s: LeagueConfig["status"]) => {
    if (!league || !user) return;
    const updated: LeagueConfig = {
      ...league,
      status: s,
      // Anchor the pick clock when the draft goes live.
      liveSince: s === "live" ? league.liveSince ?? Date.now() : league.liveSince,
    };
    await persistLeague(user.id, updated);
    setLeague(updated);
  };

  const handleSetPickTimer = async (seconds: number) => {
    if (!league || !user) return;
    const updated = { ...league, pickTimerSeconds: seconds };
    await persistLeague(user.id, updated);
    setLeague(updated);
  };

  const handleResetConfirm = async () => {
    if (!league || !user) return;
    // Restarting the draft board also restarts the live clock.
    if (league.status === "live") {
      const updated = { ...league, liveSince: Date.now() };
      await persistLeague(user.id, updated);
      setLeague(updated);
    }
    draft.resetDraft();
    setConfirmReset(false);
  };

  const handleExport = () => {
    if (!league) return;
    exportRosterCsv(entries, playersById, draft.state, league);
  };

  const handleLogout = () => {
    signOut();
    router.replace("/");
  };

  if (!ready || !league) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="flex h-screen flex-col bg-[#02020a]/45 text-zinc-200">
      <DraftHeader
        league={league}
        currentPick={draft.state.currentPick}
        lastPickTime={
          draft.state.picks.length > 0
            ? draft.state.picks[draft.state.picks.length - 1].timestamp
            : undefined
        }
        onSetStatus={handleSetStatus}
        onSetPickTimer={handleSetPickTimer}
        onReset={() => setConfirmReset(true)}
        onExport={handleExport}
        onOpenRoster={() => setRosterOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <NavRail
          onExport={handleExport}
          onReset={() => setConfirmReset(true)}
          onLogout={handleLogout}
        />

        <ControlPanel
          search={search}
          onSearch={setSearch}
          position={position}
          onPosition={setPosition}
          view={view}
          onView={setView}
          hideDrafted={hideDrafted}
          onToggleHideDrafted={() => setHideDrafted((v) => !v)}
          counts={counts}
          onReset={() => setConfirmReset(true)}
          onExport={handleExport}
          source={source}
          loading={playersLoading}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {view === "table" ? (
            <CheatSheetTable
              players={filtered}
              state={draft.state}
              onDraft={handleDraft}
              onUndraft={handleUndraft}
              onNote={handleNote}
            />
          ) : (
            <TierGrid
              players={filtered}
              state={draft.state}
              onDraft={handleDraft}
              onUndraft={handleUndraft}
            />
          )}
        </main>

        {/* Desktop roster panel */}
        <aside className="glass hidden w-80 shrink-0 border-x-0 border-y-0 border-l lg:block">
          <RosterPanel
            entries={entries}
            playersById={playersById}
            needs={needs}
            best={best}
            picks={draft.state.picks}
            league={league}
            onDraftBest={(id) => handleDraft(id, "me")}
          />
        </aside>
      </div>

      {/* Mobile roster drawer */}
      {rosterOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close roster"
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            onClick={() => setRosterOpen(false)}
          />
          <div className="glass-strong absolute right-0 top-0 flex h-full w-[320px] max-w-[88vw] flex-col border-l shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <span className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">
                My Roster
              </span>
              <button
                onClick={() => setRosterOpen(false)}
                aria-label="Close roster"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RosterPanel
                entries={entries}
                playersById={playersById}
                needs={needs}
                best={best}
                picks={draft.state.picks}
                league={league}
                onDraftBest={(id) => handleDraft(id, "me")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset draft board?">
        <p className="text-sm leading-relaxed text-zinc-400">
          This clears every logged pick and pick number for{" "}
          <span className="font-semibold text-zinc-200">{league.name}</span>. Your notes and league
          settings are kept.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setConfirmReset(false)}
            className="glass glass-hover rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={handleResetConfirm}
            className="btn-glass-danger rounded-lg px-4 py-2 text-sm font-bold"
          >
            Yes, reset the board
          </button>
        </div>
      </Modal>
    </div>
  );
}
