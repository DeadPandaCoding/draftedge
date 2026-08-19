"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LeagueConfig, RosterTemplate, ScoringFormat } from "@/lib/types";
import { DEFAULT_ROSTER, SCORING_LABELS, rosterSize } from "@/lib/league";
import { fetchLeague, persistLeague } from "@/lib/data";
import { BoltIcon, CheckIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { Select } from "@/components/ui";

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

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [teamCount, setTeamCount] = useState(12);
  const [draftPosition, setDraftPosition] = useState(4);
  const [roster, setRoster] = useState<RosterTemplate>({ ...DEFAULT_ROSTER });
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<LeagueConfig | null>(null);

  // Load any existing league from the cloud (or local demo storage).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchLeague(user.id)
      .then((lg) => {
        if (!cancelled) setExisting(lg);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Guards
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen" />;
  }

  const bump = (key: keyof RosterTemplate, delta: number) => {
    const def = SLOTS.find((s) => s.key === key)!;
    setRoster((r) => ({
      ...r,
      [key]: Math.max(def.min, Math.min(def.max, r[key] + delta)),
    }));
  };

  const totalRounds = rosterSize(roster);

  const finish = async () => {
    if (!leagueName.trim()) {
      setError("Give your league a name.");
      setStep(1);
      return;
    }
    const league: LeagueConfig = {
      id: `lg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: leagueName.trim(),
      scoring,
      teamCount,
      draftPosition: Math.min(draftPosition, teamCount),
      rounds: totalRounds,
      roster,
      status: "pre_draft",
      pickTimerSeconds: 90,
      createdAt: Date.now(),
    };
    await persistLeague(user.id, league);
    router.replace("/draft");
  };

  const inputClass =
    "glass-input w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={18} />
          </span>
          <span className="font-display text-xl tracking-wide text-white">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>

        <div className="glass-strong rounded-2xl p-7">
          {existing && step === 1 && !editing ? (
            <>
              <h1 className="font-display text-center text-2xl tracking-wide text-white">League already set up</h1>
              <p className="mt-2 text-center text-sm text-zinc-400">
                <span className="font-semibold text-zinc-200">{existing.name}</span> ·{" "}
                {SCORING_LABELS[existing.scoring]} · {existing.teamCount}-team · pick{" "}
                {existing.draftPosition}
              </p>
              <div className="mt-7 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setLeagueName(existing.name);
                    setScoring(existing.scoring);
                    setTeamCount(existing.teamCount);
                    setDraftPosition(existing.draftPosition);
                    setRoster(existing.roster);
                    setEditing(true);
                    setStep(1);
                    setError(null);
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700"
                >
                  Edit League Config
                </button>
                <button
                  onClick={() => router.replace("/draft")}
                  className="btn-glass-primary w-full rounded-lg py-2.5 text-sm font-bold transition"
                >
                  Continue to Draft Room
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Stepper header */}
              <div className="mb-7 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[1, 2].map((s) => (
                    <span
                      key={s}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                        step >= s
                          ? "bg-emerald-500 text-emerald-950"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {step > s ? <CheckIcon size={13} /> : s}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  Step {step} of 2
                </span>
              </div>

              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl tracking-wide text-white">Set up your league</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                      Tell us about your draft so we can build your cheat sheet.
                    </p>
                  </div>

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

                  {error && (
                    <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      if (!leagueName.trim()) {
                        setError("Give your league a name.");
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    className="btn-glass-primary w-full rounded-lg py-2.5 text-sm font-bold transition"
                  >
                    Continue →
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl tracking-wide text-white">Roster template</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                      Configure your starting lineup. <span className="text-zinc-300">{totalRounds} total rounds</span>
                      {totalRounds > 0 && ` × ${teamCount} teams = ${totalRounds * teamCount} picks`}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {SLOTS.map((s) => (
                      <div
                        key={s.key}
                        className="glass flex items-center justify-between rounded-xl px-4 py-2.5"
                      >
                        <div>
                          <span className="text-sm font-bold text-zinc-200">{s.label}</span>
                          <span className="ml-2 text-[11px] text-zinc-500">
                            {s.key === "flex"
                              ? "RB / WR / TE"
                              : s.key === "bench"
                                ? "Any position"
                                : s.key === "k" || s.key === "def"
                                  ? "Optional"
                                  : "Starter"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => bump(s.key, -1)}
                            disabled={roster[s.key] <= s.min}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-30"
                            aria-label={`Decrease ${s.label}`}
                          >
                            <MinusIcon size={14} />
                          </button>
                          <span className="w-6 text-center text-base font-bold text-white">
                            {roster[s.key]}
                          </span>
                          <button
                            onClick={() => bump(s.key, 1)}
                            disabled={roster[s.key] >= s.max}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-30"
                            aria-label={`Increase ${s.label}`}
                          >
                            <PlusIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={finish}
                      className="btn-glass-primary flex-1 rounded-lg py-2.5 text-sm font-bold transition"
                    >
                      Create My Draft Room
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
