"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";

/**
 * Community polls ("Who wins this trade?", "breakout or bust", etc.).
 *
 * Persistence mirrors the rest of the app: Supabase `polls` + `poll_votes`
 * tables when configured (so votes are truly cross-user and synced), or
 * localStorage in demo mode. See `supabase/migrations/0003_polls.sql`.
 */

export interface Poll {
  id: string;
  question: string;
  options: string[];
  createdBy: string;
  createdAt: number;
}

export interface PollVote {
  pollId: string;
  userId: string;
  option: number;
}

export interface PollResult {
  poll: Poll;
  counts: number[];
  total: number;
  myOption: number | null;
}

const POLLS_KEY = "draftedge.polls.v1";
const VOTES_KEY = "draftedge.pollvotes.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

interface PollRow {
  id: string;
  question: string;
  options: string[];
  created_by: string;
  created_at: string;
}

function rowToPoll(row: PollRow): Poll {
  return {
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// ── Persistence ──────────────────────────────────────────────────────
export async function fetchPolls(): Promise<Poll[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPoll);
  }
  try {
    const raw = localStorage.getItem(POLLS_KEY);
    return raw ? (JSON.parse(raw) as Poll[]) : [];
  } catch {
    return [];
  }
}

export async function fetchVotes(): Promise<PollVote[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.from("poll_votes").select("poll_id, user_id, option");
    if (error) throw error;
    const rows = (data ?? []) as { poll_id: string; user_id: string; option: number }[];
    return rows.map((v) => ({
      pollId: v.poll_id,
      userId: v.user_id,
      option: v.option,
    }));
  }
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? (JSON.parse(raw) as PollVote[]) : [];
  } catch {
    return [];
  }
}

export async function createPoll(
  question: string,
  options: string[],
  userId: string
): Promise<Poll> {
  const poll: Poll = {
    id: newId(),
    question: question.trim(),
    options,
    createdBy: userId,
    createdAt: Date.now(),
  };
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("polls").insert({
      id: poll.id,
      question: poll.question,
      options,
      created_by: userId,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return poll;
  }
  const polls = await fetchPolls();
  localStorage.setItem(POLLS_KEY, JSON.stringify([poll, ...polls]));
  return poll;
}

export async function castVote(pollId: string, userId: string, option: number): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("poll_votes").upsert(
      { poll_id: pollId, user_id: userId, option },
      { onConflict: "poll_id,user_id" }
    );
    if (error) throw error;
    return;
  }
  const votes = await fetchVotes();
  const rest = votes.filter((v) => !(v.pollId === pollId && v.userId === userId));
  localStorage.setItem(VOTES_KEY, JSON.stringify([...rest, { pollId, userId, option }]));
}

// ── Hook ─────────────────────────────────────────────────────────────
export function usePolls() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load polls + votes once (Supabase or demo localStorage).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, v] = await Promise.all([fetchPolls(), fetchVotes()]);
        if (!cancelled) {
          setPolls(p);
          setVotes(v);
        }
      } catch {
        // network/table error — leave whatever we have
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addPoll = useCallback(
    async (question: string, options: string[]) => {
      if (!userId) return;
      const poll = await createPoll(question, options, userId);
      setPolls((prev) => [poll, ...prev]);
    },
    [userId]
  );

  const vote = useCallback(
    async (pollId: string, option: number) => {
      if (!userId) return;
      // Optimistic update so the bar moves instantly.
      setVotes((prev) => [
        ...prev.filter((v) => !(v.pollId === pollId && v.userId === userId)),
        { pollId, userId, option },
      ]);
      try {
        await castVote(pollId, userId, option);
      } catch {
        const v = await fetchVotes(); // roll back to server truth on failure
        setVotes(v);
      }
    },
    [userId]
  );

  const results: PollResult[] = polls.map((poll) => {
    const counts = poll.options.map(() => 0);
    let total = 0;
    for (const v of votes) {
      if (v.pollId !== poll.id) continue;
      if (v.option >= 0 && v.option < counts.length) {
        counts[v.option] += 1;
        total += 1;
      }
    }
    const mine = votes.find((v) => v.pollId === poll.id && v.userId === userId);
    return { poll, counts, total, myOption: mine ? mine.option : null };
  });

  return { results, loading, addPoll, vote };
}
