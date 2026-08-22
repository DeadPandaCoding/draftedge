"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePolls } from "@/lib/polls";
import AppShell from "@/components/dashboard/AppShell";
import { ShareButtons } from "@/components/dashboard/ShareButtons";
import { Skeleton } from "@/components/ui";
import { PlusIcon, PollIcon, XIcon } from "@/components/icons";

const MAX_OPTIONS = 5;

export default function PollsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { results, loading: pollsLoading, addPoll, vote } = usePolls();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (i: number) =>
    setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError(null);
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (question.trim().length < 5) return setError("Ask a question that's at least 5 characters.");
    if (clean.length < 2) return setError("Add at least two options.");
    setSubmitting(true);
    try {
      await addPoll(question, clean);
      setQuestion("");
      setOptions(["", ""]);
    } catch {
      setError("Couldn't publish the poll. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <AppShell maxWidth="max-w-3xl" className="pt-12">
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
          <PollIcon size={20} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Community Polls</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Crowd-sourced takes — vote, see the consensus, and share the debate.
          </p>
        </div>
      </div>

      {/* ── Create ─────────────────────────────────────────── */}
      <section className="glass-strong rounded-2xl p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-300">Create a poll</h2>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Who wins this trade: McCaffrey for Bijan + pick?"
          aria-label="Poll question"
          className="glass-input w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
        />
        <div className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className="glass-input w-full rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                >
                  <XIcon size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={addOption}
              className="glass glass-hover inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 transition"
            >
              <PlusIcon size={14} />
              Add option
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-glass-primary ml-auto rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish poll"}
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
            {error}
          </p>
        )}
      </section>

      {/* ── Poll list ──────────────────────────────────────── */}
      <section className="mt-8" aria-label="Polls">
        {pollsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <p className="text-sm text-zinc-400">No polls yet.</p>
            <p className="mt-1 text-xs text-zinc-500">Ask the first question above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(({ poll, counts, total, myOption }) => (
              <div key={poll.id} className="glass-strong rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-white">{poll.question}</h3>
                  <ShareButtons
                    url={`${window.location.origin}/polls`}
                    text={poll.question}
                    title={poll.question}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {poll.options.map((opt, i) => {
                    const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
                    const mine = myOption === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => vote(poll.id, i)}
                        className={`relative w-full overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          mine
                            ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40"
                            : "bg-zinc-900/60 hover:bg-zinc-900"
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-500/15"
                          style={{ width: `${pct}%` }}
                          aria-hidden="true"
                        />
                        <div className="relative flex items-center justify-between gap-2">
                          <span className={`font-semibold ${mine ? "text-emerald-200" : "text-zinc-200"}`}>
                            {opt}
                            {mine && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Your vote</span>}
                          </span>
                          <span className="font-tech text-xs font-bold text-zinc-300">{pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  {total} {total === 1 ? "vote" : "votes"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
