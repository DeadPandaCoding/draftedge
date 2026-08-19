"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LeagueConfig, RosterTemplate, ScoringFormat } from "@/lib/types";
import { DEFAULT_ROSTER, SCORING_LABELS, STATUS_LABELS, rosterSize } from "@/lib/league";
import { fetchDraftState, fetchLeague, persistLeague } from "@/lib/data";
import { usePlayers } from "@/lib/players";
import type { DraftState } from "@/lib/types";
import { DraftBoardMockup } from "@/components/landing/DraftBoardMockup";
import KineticGrid from "@/components/ui/kinetic-grid";
import { Select, Skeleton } from "@/components/ui";
import {
  BoltIcon,
  LogoutIcon,
  MinusIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/icons";

const SCORING_OPTIONS: { value: ScoringFormat; label: string; desc: string }[] = [
  { value: "ppr", label: "PPR", desc: "1 point per reception" },
  { value: "half_ppr", label: "Half-PPR", desc: "0.5 points per reception" },
  { value: "standard", label: "Standard", desc: "No reception points" },
];

const TEAM_COUNTS = [8, 10, 12, 14];

interface SlotDef {
  key: keyof RosterTemplate;
  label: string;
  min: number;
  max: number;
}

const SLOTS: SlotDef[] = [
  { key: "qb", label: "QB", min: 1, max: 3 },
  { key: "rb", label: "RB", min: 1, max: 8 },
  { key: "wr", label: "WR", min: 1, max: 8 },
  { key: "te", label: "TE", min: 1, max: 3 },
  { key: "flex", label: "FLEX", min: 0, max: 4 },
  { key: "k", label: "K", min: 0, max: 1 },
  { key: "def", label: "DEF", min: 0, max: 1 },
  { key: "bench", label: "BENCH", min: 0, max: 15 },
];

const STATUS_PILL: Record<LeagueConfig["status"], string> = {
  pre_draft: "bg-zinc-500",
  live: "bg-rose-500 animate-pulse",
  completed: "bg-emerald-500",
};

function HomeSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Heading */}
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* League card + board preview */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="glass-strong rounded-2xl p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-48 max-w-full" />
            </div>
            <Skeleton className="h-7 w-28 shrink-0 rounded-full" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass space-y-2 rounded-xl p-3">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>

          <div className="mt-7 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="w-full min-w-0">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [league, setLeague] = useState<LeagueConfig | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(true);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { players } = usePlayers(league?.scoring ?? "ppr");

  // Setup form state
  const [leagueName, setLeagueName] = useState("");
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [teamCount, setTeamCount] = useState(12);
  const [draftPosition, setDraftPosition] = useState(4);
  const [roster, setRoster] = useState<RosterTemplate>({ ...DEFAULT_ROSTER });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Guards
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  // Load the league from the cloud (or local demo storage).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchLeague(user.id)
      .then((lg) => {
        if (cancelled) return;
        setLeague(lg);
        if (lg) {
          setLeagueName(lg.name);
          setScoring(lg.scoring);
          setTeamCount(lg.teamCount);
          setDraftPosition(lg.draftPosition);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingLeague(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load the draft log for the mini "Recent picks" card.
  useEffect(() => {
    if (!league) return;
    let cancelled = false;
    fetchDraftState(league.id)
      .then((s) => {
        if (!cancelled) setDraftState(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [league]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4" aria-busy="true" aria-label="Loading">
          <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={24} />
          </span>
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  const bump = (key: keyof RosterTemplate, delta: number) => {
    const def = SLOTS.find((s) => s.key === key)!;
    setRoster((r) => ({
      ...r,
      [key]: Math.max(def.min, Math.min(def.max, r[key] + delta)),
    }));
  };

  const totalRounds = rosterSize(roster);

  const createLeague = async () => {
    if (!leagueName.trim()) {
      setError("Give your league a name.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const newLeague: LeagueConfig = {
        id: `lg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        name: leagueName.trim(),
        scoring,
        teamCount,
        draftPosition: Math.min(draftPosition, teamCount),
        rounds: rosterSize(roster),
        roster,
        status: "pre_draft",
        pickTimerSeconds: 90,
        createdAt: Date.now(),
      };
      await persistLeague(user.id, newLeague);
      setLeague(newLeague);
      router.replace("/draft");
    } catch {
      setError("Couldn't save your league. Try again.");
      setSubmitting(false);
    }
  };

  const inputClass =
    "glass-input w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition";

  return (
    <div className="relative flex min-h-screen flex-col text-zinc-200">
      {/* Kinetic grid background — warps toward the pointer, ripples on click */}
      <KineticGrid globalColor="default" className="pointer-events-none fixed inset-0 z-0" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-30 flex items-center justify-between gap-3 px-6 py-4">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={16} />
          </span>
          <span className="font-display text-lg tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {league && (
            <Link
              href="/draft"
              className="btn-glass-primary rounded-lg px-4 py-2 text-sm font-bold transition"
            >
              Open Draft Room
            </Link>
          )}
          <button
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="glass glass-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            <LogoutIcon size={14} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-wide text-white">
            {league ? `Welcome back, ${user.name.split(" ")[0]}!` : `Welcome, ${user.name.split(" ")[0]}!`}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {league
              ? "Your draft room is ready. Review your league and jump in."
              : "Set up your league to build your cheat sheet."}
          </p>
        </div>

        {loadingLeague ? (
          <HomeSkeleton />
        ) : league ? (
          /* ── League overview ─────────────────────────────── */
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="glass-strong rounded-2xl p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Your League
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-white">{league.name}</h2>
                </div>
                <span className="glass inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-zinc-200">
                  <span className={`h-2 w-2 rounded-full ${STATUS_PILL[league.status]}`} />
                  {STATUS_LABELS[league.status]}
                </span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="glass rounded-xl p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Scoring
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-zinc-100">
                    {SCORING_LABELS[league.scoring]}
                  </dd>
                </div>
                <div className="glass rounded-xl p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Teams
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-zinc-100">{league.teamCount}</dd>
                </div>
                <div className="glass rounded-xl p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Your Pick
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-zinc-100">
                    #{league.draftPosition}
                  </dd>
                </div>
                <div className="glass rounded-xl p-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Rounds
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-zinc-100">{league.rounds}</dd>
                </div>
              </dl>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/draft"
                  className="btn-glass-primary flex-1 rounded-xl px-6 py-3 text-center text-sm font-bold transition"
                >
                  Open Draft Room
                </Link>
                <Link
                  href="/onboarding"
                  className="glass glass-hover rounded-xl px-6 py-3 text-center text-sm font-semibold text-zinc-200 transition"
                >
                  Edit League Config
                </Link>
              </div>

              {/* Mini draft log */}
              <div className="mt-7">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-tech flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    <UsersIcon size={12} className="text-zinc-400" />
                    Recent Picks
                  </h3>
                  <Link
                    href="/draft"
                    className="text-[11px] font-semibold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Full log →
                  </Link>
                </div>
                {!draftLoaded ? (
                  <div className="space-y-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                  </div>
                ) : !draftState || draftState.picks.length === 0 ? (
                  <div className="glass flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500 ring-1 ring-inset ring-zinc-700/60">
                      <UsersIcon size={18} />
                    </span>
                    <p className="text-xs font-semibold text-zinc-300">No picks yet</p>
                    <p className="max-w-[240px] text-[11px] leading-relaxed text-zinc-500">
                      Cross players off the board during your draft and they will show up here.
                    </p>
                    <Link
                      href="/draft"
                      className="mt-1 text-[11px] font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      Open the draft room →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...draftState.picks]
                      .sort((a, b) => b.pickNumber - a.pickNumber)
                      .slice(0, 6)
                      .map((pick) => {
                        const p = players.find((pl) => pl.id === pick.playerId);
                        return (
                          <div
                            key={`${pick.playerId}-${pick.pickNumber}`}
                            className="glass flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                          >
                            <span className="font-mono shrink-0 text-zinc-500">
                              R{pick.round} · P{pick.pickNumber}
                            </span>
                            <span className="min-w-0 flex-1 truncate px-1 font-semibold text-zinc-200">
                              {p?.name ?? pick.playerId}
                            </span>
                            {p && (
                              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-px text-[10px] font-bold text-zinc-400">
                                {p.position}
                              </span>
                            )}
                            <span
                              className={`shrink-0 font-bold ${
                                pick.owner === "me" ? "text-emerald-400" : "text-zinc-500"
                              }`}
                            >
                              {pick.owner === "me" ? "Me" : "Opp"}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full min-w-0">
              <DraftBoardMockup />
            </div>
          </div>
        ) : (
          /* ── Setup card (first-time users) ───────────────── */
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="glass-strong rounded-2xl p-7">
              <h2 className="font-display text-2xl tracking-wide text-white">Set up your league</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Tell us about your draft so we can build your cheat sheet.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                    League Name
                  </label>
                  <input
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder='e.g. "The Office League"'
                    maxLength={60}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-400">
                    Scoring Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SCORING_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setScoring(o.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          scoring === o.value
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                      >
                        <span
                          className={`block text-sm font-bold ${
                            scoring === o.value ? "text-emerald-300" : "text-zinc-200"
                          }`}
                        >
                          {o.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-tight text-zinc-500">
                          {o.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-zinc-400">
                      League Size
                    </label>
                    <div className="flex gap-1.5">
                      {TEAM_COUNTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTeamCount(t);
                            setDraftPosition((p) => Math.min(p, t));
                          }}
                          className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                            teamCount === t
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                              : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                      Draft Position
                    </label>
                    <Select
                      label="Draft Position"
                      value={String(draftPosition)}
                      onChange={(v) => setDraftPosition(Number(v))}
                      options={Array.from({ length: teamCount }, (_, i) => ({
                        value: String(i + 1),
                        label: `Pick #${i + 1} of ${teamCount}`,
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label className="block text-xs font-semibold text-zinc-400">
                      Roster Template
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      {totalRounds} rounds · {totalRounds * teamCount} picks
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {SLOTS.map((s) => (
                      <div
                        key={s.key}
                        className="glass flex items-center justify-between rounded-lg px-3 py-1.5"
                      >
                        <div>
                          <span className="text-xs font-bold text-zinc-200">{s.label}</span>
                          <span className="ml-1.5 text-[10px] text-zinc-500">
                            {s.key === "flex"
                              ? "RB / WR / TE"
                              : s.key === "bench"
                                ? "Any position"
                                : s.key === "k" || s.key === "def"
                                  ? "Optional"
                                  : "Starter"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => bump(s.key, -1)}
                            disabled={roster[s.key] <= s.min}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-30"
                            aria-label={`Decrease ${s.label}`}
                          >
                            <MinusIcon size={13} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-white">
                            {roster[s.key]}
                          </span>
                          <button
                            type="button"
                            onClick={() => bump(s.key, 1)}
                            disabled={roster[s.key] >= s.max}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-30"
                            aria-label={`Increase ${s.label}`}
                          >
                            <PlusIcon size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                    {error}
                  </p>
                )}

                <button
                  onClick={createLeague}
                  disabled={submitting}
                  className="btn-glass-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition"
                >
                  <UsersIcon size={15} />
                  {submitting ? "Creating…" : "Create My Draft Room"}
                </button>
              </div>
            </div>

            <div className="w-full min-w-0">
              <DraftBoardMockup />
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto border-t border-zinc-900 py-5 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} DraftEdge · Not affiliated with the NFL or Sleeper
      </footer>
    </div>
  );
}
