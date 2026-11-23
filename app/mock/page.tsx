"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePlayers } from "@/lib/players";
import type { DraftType, LeagueFormat, Player, Position, RosterTemplate, ScoringFormat } from "@/lib/types";
import { DEFAULT_ROSTER, SCORING_LABELS, roundForPick, rosterSize, slotForPick } from "@/lib/league";
import { buildTradeValues } from "@/lib/trade-value";
import { toScoringFormat, useSyncedLeagues } from "@/lib/league-context";
import AppShell from "@/components/dashboard/AppShell";
import styles from "./room.module.css";
import { InjuryBadge, Select } from "@/components/ui";
import { ShuffleIcon } from "@/components/icons";
import { ToolLoadingState } from "@/components/dashboard/ToolLoadingState";

/* ───────── Types ───────── */

interface MockPick {
  playerId: string;
  pickNumber: number;
  round: number;
  slot: number;
}

type Strategy = "balanced" | "zero_rb" | "hero_rb" | "robust_rb" | "elite_qb" | "elite_te";
type BotProfile = "consensus" | "vorp" | "zero_rb" | "hero_rb";
const slotTypes = ["QB", "RB", "WR", "TE", "FLEX", "SUPERFLEX", "K", "DEF", "BENCH"] as const;
type Slot = typeof slotTypes[number];

function eligible(slot: Slot | "ALL", position: Position) {
  if (slot === "ALL" || slot === "BENCH") return true;
  if (slot === "FLEX" || slot === "SUPERFLEX") {
    return ["RB", "WR", "TE"].includes(position) || (slot === "SUPERFLEX" && position === "QB");
  }
  return position === slot;
}

/* ───────── Constants ───────── */

const TEAM_COUNTS = [8, 10, 12, 14, 16];
const SCORING_OPTIONS: ScoringFormat[] = ["ppr", "half_ppr", "standard"];
const TIMER_OPTIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
  { value: 0, label: "Off" },
];

const STRATEGIES: { value: Strategy; label: string; tip: string }[] = [
  { value: "balanced", label: "Balanced", tip: "Best available at each pick — fill every position naturally." },
  { value: "zero_rb", label: "Zero-RB", tip: "Load up on WR/TE early, grab RBs in rounds 5+." },
  { value: "hero_rb", label: "Hero RB", tip: "One elite RB in rounds 1-2, then WR/TE depth until late." },
  { value: "robust_rb", label: "Robust RB", tip: "Secure 2-3 RBs in the first 4 rounds before touching WR." },
  { value: "elite_qb", label: "Elite QB", tip: "Grab an elite dual-threat QB in rounds 1-3." },
  { value: "elite_te", label: "Elite TE", tip: "Target a top-3 TE early, then build RB/WR around them." },
];

function rosterPositionEntries(rawPositions: unknown): string[] {
  if (Array.isArray(rawPositions)) return rawPositions.filter((value): value is string => typeof value === "string");
  if (!rawPositions || typeof rawPositions !== "object") return [];
  return Object.entries(rawPositions as Record<string, unknown>).flatMap(([slot, value]) => {
    const count = typeof value === "number" ? Math.max(0, Math.min(30, Math.floor(value))) : 0;
    return Array.from({ length: count }, () => slot);
  });
}

function countPositions(picks: MockPick[], slot: number, playersById: Map<string, Player>): Record<Position, number> {
  const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  for (const p of picks) {
    if (p.slot !== slot) continue;
    const player = playersById.get(p.playerId);
    if (player) counts[player.position] += 1;
  }
  return counts;
}

function seededJitter(seed: number, pickNumber: number, playerId: string): number {
  let hash = (seed ^ Math.imul(pickNumber, 0x45d9f3b)) >>> 0;
  for (let i = 0; i < playerId.length; i++) hash = Math.imul(hash ^ playerId.charCodeAt(i), 0x45d9f3b) >>> 0;
  return (hash % 7) - 3;
}

function assignBotProfiles(teams: number, userSlot: number): Record<number, BotProfile> {
  const profiles: BotProfile[] = ["consensus", "vorp", "zero_rb", "hero_rb"];
  const assigned: Record<number, BotProfile> = {};
  for (let slot = 1; slot <= teams; slot++) {
    if (slot === userSlot) continue;
    assigned[slot] = profiles[Math.floor(Math.random() * profiles.length)];
  }
  return assigned;
}

/** Position-aware auto-draft respecting the user's roster template and strategy. */
function pickForSlot(
  picks: MockPick[],
  slot: number,
  playersById: Map<string, Player>,
  players: Player[],
  draftedIds: Set<string>,
  pickNumber: number,
  teams: number,
  totalPicks: number,
  roster: RosterTemplate,
  strategy: Strategy,
  userSlot: number,
  botProfiles: Record<number, BotProfile>,
  tradeValues: ReadonlyMap<string, number>,
  seed: number,
): Player | null {
  const counts = countPositions(picks, slot, playersById);
  const roundsLeft = Math.ceil((totalPicks - pickNumber + 1) / teams);
  const late = roundsLeft <= 2;
  const round = roundForPick(pickNumber, teams);
  const isUser = slot === userSlot;
  const botProfile = botProfiles[slot] ?? "consensus";
  const pickBest = (positions: Position[]): Player | null => {
    let pool = players.filter((player) => !draftedIds.has(player.id) && positions.includes(player.position));
    if (pool.length === 0) pool = players.filter((player) => !draftedIds.has(player.id));

    if (!isUser) {
      const guarded = pool.filter((player) => {
        if (round < 9 && roster.superflex === 0 && player.position === "QB" && counts.QB >= Math.max(1, roster.qb)) return false;
        if (round < 7 && player.position === "TE" && counts.TE >= Math.max(1, roster.te)) return false;
        return true;
      });
      if (guarded.length > 0) {
        const guardedBest = Math.max(...guarded.map((player) => tradeValues.get(player.id) ?? 0));
        const availableBest = Math.max(...pool.map((player) => tradeValues.get(player.id) ?? 0));
        if (availableBest < guardedBest * 1.4) pool = guarded;
      }
    }

    const score = (player: Player): number => {
      const value = tradeValues.get(player.id) ?? 0;
      if (isUser) return player.projection;
      const jitter = seededJitter(seed, pickNumber, player.id);
      if (botProfile === "consensus") {
        const adp = player.adp > 0 ? player.adp : player.rank;
        return -Math.abs(adp - (pickNumber + jitter));
      }
      if (botProfile === "zero_rb" && round <= 5 && (player.position === "WR" || player.position === "TE")) return value + 100;
      if (botProfile === "hero_rb") {
        if (round <= 2 && counts.RB === 0 && player.position === "RB") return value + 100;
        if (round <= 6 && counts.RB > 0 && (player.position === "WR" || player.position === "TE")) return value + 100;
      }
      return value + jitter * 0.2;
    };
    return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null;
  };

  // Strategy-aware early rounds for the user.
  if (isUser && strategy !== "balanced") {
    const totalSkill = counts.RB + counts.WR + counts.TE;
    if (strategy === "zero_rb" && totalSkill < 6) {
      const wrte = pickBest(["WR", "TE"]);
      if (wrte) return wrte;
    }
    if (strategy === "hero_rb" && counts.RB === 0 && totalSkill < 2) {
      const rb = pickBest(["RB"]);
      if (rb) return rb;
    }
    if (strategy === "robust_rb" && counts.RB < 3 && totalSkill < 4) {
      const rb = pickBest(["RB"]);
      if (rb) return rb;
    }
    if (strategy === "elite_qb" && counts.QB === 0) {
      const qb = pickBest(["QB"]);
      if (qb) return qb;
    }
    if (strategy === "elite_te" && counts.TE === 0) {
      const te = pickBest(["TE"]);
      if (te) return te;
    }
  }

  if (!isUser && botProfile === "zero_rb" && round <= 5) {
    const wrte = pickBest(["WR", "TE"]);
    if (wrte) return wrte;
  }
  if (!isUser && botProfile === "hero_rb") {
    if (round <= 2 && counts.RB === 0) {
      const rb = pickBest(["RB"]);
      if (rb) return rb;
    } else if (round <= 6 && counts.RB > 0) {
      const wrte = pickBest(["WR", "TE"]);
      if (wrte) return wrte;
    }
  }

  // 1) Core starters.
  const core: Position[] = [];
  if (counts.QB < roster.qb) core.push("QB");
  if (counts.RB < roster.rb) core.push("RB");
  if (counts.WR < roster.wr) core.push("WR");
  if (counts.TE < roster.te) core.push("TE");
  if (core.length > 0) return pickBest(core);

  // 2) Flex.
  const flexCapacity = roster.rb + roster.wr + roster.te + roster.flex;
  if (counts.RB + counts.WR + counts.TE < flexCapacity) {
    return pickBest(["RB", "WR", "TE"]);
  }
  const superflexEligible = counts.QB + counts.RB + counts.WR + counts.TE;
  const superflexNeed = (roster.superflex ?? 0) + roster.qb;
  if (superflexEligible < superflexNeed) {
    return pickBest(["QB", "RB", "WR", "TE"]);
  }

  // 3) K / DEF in closing rounds.
  const specialists: Position[] = [];
  if (late && counts.K < roster.k) specialists.push("K");
  if (late && counts.DEF < roster.def) specialists.push("DEF");
  if (specialists.length > 0) return pickBest(specialists);

  // 4) Bench — skill players.
  return pickBest(["QB", "RB", "WR", "TE"]);
}

interface TeamDraftGrade {
  slot: number;
  letter: string;
  label: string;
  color: string;
  starterVorp: number;
  benchVorp: number;
}

/** Compare each team's starting-lineup VORP and bench depth to the room average. */
/** Compare each team's starting-lineup VORP and bench depth to the room average. */
function gradeDraft(
  allPicks: MockPick[],
  teams: number,
  tradeValues: ReadonlyMap<string, number>,
  playersById: Map<string, Player>,
  roster: RosterTemplate,
): TeamDraftGrade[] {
  const summaries = Array.from({ length: teams }, (_, index) => {
    const slot = index + 1;
    const teamPicks = allPicks.filter((pick) => pick.slot === slot && playersById.has(pick.playerId));
    const starters: MockPick[] = [];
    const take = (positions: Position[], count: number) => {
      const selected = teamPicks
        .filter((pick) => !starters.includes(pick) && positions.includes(playersById.get(pick.playerId)!.position))
        .sort((a, b) => (tradeValues.get(b.playerId) ?? 0) - (tradeValues.get(a.playerId) ?? 0))
        .slice(0, count);
      starters.push(...selected);
    };
    take(["QB"], roster.qb);
    take(["RB"], roster.rb);
    take(["WR"], roster.wr);
    take(["TE"], roster.te);
    take(["RB", "WR", "TE"], roster.flex);
    take(["QB", "RB", "WR", "TE"], roster.superflex ?? 0);
    take(["K"], roster.k);
    take(["DEF"], roster.def);
    const starterIds = new Set(starters.map((pick) => pick.playerId));
    const starterVorp = starters.reduce((sum, pick) => sum + (tradeValues.get(pick.playerId) ?? 0), 0);
    const benchVorp = teamPicks
      .filter((pick) => !starterIds.has(pick.playerId))
      .reduce((sum, pick) => sum + (tradeValues.get(pick.playerId) ?? 0), 0);
    return { slot, starterVorp, benchVorp };
  });
  const averageStarter = summaries.reduce((sum, team) => sum + team.starterVorp, 0) / Math.max(1, teams);
  const averageBench = summaries.reduce((sum, team) => sum + team.benchVorp, 0) / Math.max(1, teams);

  return summaries.map((team) => {
    const score = (averageStarter > 0 ? team.starterVorp / averageStarter : 1) * 80 +
      (averageBench > 0 ? team.benchVorp / averageBench : 1) * 20;
    if (score >= 115) return { ...team, letter: "A+", label: "Well above room average", color: "text-emerald-300" };
    if (score >= 107) return { ...team, letter: "A", label: "Strong value across the roster", color: "text-emerald-300" };
    if (score >= 105) return { ...team, letter: "B+", label: "Above room average", color: "text-emerald-400" };
    if (score >= 95) return { ...team, letter: "B", label: "Near room average", color: "text-zinc-200" };
    return { ...team, letter: "C", label: "Below room average", color: "text-amber-300" };
  });
}

/* ---------------- Component ---------------- */
export default function MockDraftPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { activeLeague } = useSyncedLeagues();

  // Pre-draft settings
  const [teams, setTeams] = useState(12);
  const [mySlot, setMySlot] = useState(4);
  const [scoring, setScoring] = useState<ScoringFormat>("ppr");
  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [pickTimer, setPickTimer] = useState(90);
  const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>("redraft");
  const [draftType, setDraftType] = useState<DraftType>("snake");
  const [tePremium, setTePremium] = useState(false);
  const [roster, setRoster] = useState<RosterTemplate>({ ...DEFAULT_ROSTER });
  const [appliedLeagueId, setAppliedLeagueId] = useState<string | null>(null);
  const [irSlots, setIrSlots] = useState(0);
  const [hideOutIr, setHideOutIr] = useState(false);

  // Draft state
  const [started, setStarted] = useState(false);
  const [picks, setPicks] = useState<MockPick[]>([]);
  const [playerQuery, setPlayerQuery] = useState("");
  const [mockPos, setMockPos] = useState<Slot | "ALL">("ALL");
  const [botProfiles, setBotProfiles] = useState<Record<number, BotProfile>>({});
  const [botSeed, setBotSeed] = useState(0);
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [queueHydrated, setQueueHydrated] = useState(false);
  const [playerListTab, setPlayerListTab] = useState<"roster" | "queue">("roster");
  const [copyStatus, setCopyStatus] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(pickTimer);

  // Computed roster
  const { players, loading: playersLoading } = usePlayers(scoring);
  const teamCountOptions = activeLeague
    ? Array.from(new Set([...TEAM_COUNTS, activeLeague.total_teams])).sort((a, b) => a - b)
    : TEAM_COUNTS;
  const draftPlayers = useMemo(() => players.map((player) => ({
    ...player,
    projection: player.projection + (tePremium && player.position === "TE" && player.usage?.games
      ? (player.usage.receptions / player.usage.games) * 17 * 0.5
      : 0),
  })), [players, tePremium]);
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const tradeValues = useMemo(() => buildTradeValues(draftPlayers, teams), [draftPlayers, teams]);

  const totalRounds = rosterSize(roster);
  const totalPicks = teams * totalRounds;
  const currentPick = picks.length + 1;
  const done = started && currentPick > totalPicks;
  const drafted = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("draftedge.mock.queue.v1") ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQueueIds([...new Set(stored.filter((id): id is string => typeof id === "string"))]);
      }
    } catch {
      setQueueIds([]);
    }
    setQueueHydrated(true);
  }, []);

  const activeQueueIds = useMemo(() => queueIds.filter((id) => !drafted.has(id)), [queueIds, drafted]);
  useEffect(() => {
    if (activeQueueIds.length !== queueIds.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueueIds(activeQueueIds);
    }
  }, [activeQueueIds, queueIds.length]);
  useEffect(() => {
    if (!queueHydrated) return;
    try {
      localStorage.setItem("draftedge.mock.queue.v1", JSON.stringify(activeQueueIds));
    } catch {
      // Storage may be unavailable; the queue remains active for this session.
    }
  }, [activeQueueIds, queueHydrated]);

  const isMyTurn = started && !done && slotForPick(currentPick, teams, draftType) === mySlot;

  /* ── Draft logic ── */

  const advance = useCallback(
    (list: MockPick[], draftedIds: Set<string>, profiles = botProfiles, seed = botSeed): MockPick[] => {
      const result = [...list];
      let n = result.length;
      while (n < totalPicks && slotForPick(n + 1, teams, draftType) !== mySlot) {
        const slot = slotForPick(n + 1, teams, draftType);
        const best = pickForSlot(result, slot, playersById, draftPlayers, draftedIds, n + 1, teams, totalPicks, roster, strategy, mySlot, profiles, tradeValues, seed);
        if (!best) break;
        draftedIds.add(best.id);
        n += 1;
        result.push({ playerId: best.id, pickNumber: n, round: roundForPick(n, teams), slot });
      }
      return result;
    },
    [totalPicks, teams, mySlot, playersById, draftPlayers, roster, strategy, draftType, botProfiles, botSeed, tradeValues],
  );

  const makeMyPick = useCallback(
    (playerId: string) => {
      setSecondsLeft(pickTimer);
      setTimerExpired(false);
      setPicks((prev) => {
        const ids = new Set(prev.map((p) => p.playerId));
        if (ids.has(playerId)) return prev;
        ids.add(playerId);
        const n = prev.length + 1;
        const withMine = [
          ...prev,
          { playerId, pickNumber: n, round: roundForPick(n, teams), slot: slotForPick(n, teams, draftType) },
        ];
        return advance(withMine, ids);
      });
    },
    [teams, advance, pickTimer, draftType],
  );

  const autoPick = useCallback(() => {
    const best = pickForSlot(picks, mySlot, playersById, draftPlayers, drafted, currentPick, teams, totalPicks, roster, strategy, mySlot, botProfiles, tradeValues, botSeed);
    if (best) makeMyPick(best.id);
  }, [picks, mySlot, playersById, draftPlayers, drafted, currentPick, teams, totalPicks, roster, strategy, botProfiles, tradeValues, botSeed, makeMyPick]);

  /* ── Pick clock ── */

  useEffect(() => {
    if (!isMyTurn || done || pickTimer === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimerExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isMyTurn, done, pickTimer]);

  useEffect(() => {
    // The timeout is an external timer event, so its action intentionally
    // advances the draft after the timer state has updated.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (timerExpired && isMyTurn) autoPick();
  }, [timerExpired, isMyTurn, autoPick]);

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [user, loading, router]);

  /* ── Actions ── */

  const startDraft = () => {
    setSecondsLeft(pickTimer);
    setTimerExpired(false);
    setCopyStatus("");
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    const seed = Math.floor(Math.random() * 0xffffffff);
    const profiles = assignBotProfiles(teams, mySlot);
    setBotSeed(seed);
    setBotProfiles(profiles);
    const ids = new Set<string>();
    setPicks(advance([], ids, profiles, seed));
  };

  const simulateRest = () => {
    setPicks((prev) => {
      const result = [...prev];
      const ids = new Set(prev.map((p) => p.playerId));
      let n = result.length;
      while (n < totalPicks) {
        const slot = slotForPick(n + 1, teams, draftType);
        const best = pickForSlot(result, slot, playersById, draftPlayers, ids, n + 1, teams, totalPicks, roster, strategy, mySlot, botProfiles, tradeValues, botSeed);
        if (!best) break;
        ids.add(best.id);
        n += 1;
        result.push({ playerId: best.id, pickNumber: n, round: roundForPick(n, teams), slot });
      }
      return result;
    });
  };

  const reset = () => {
    setQueueIds((previous) => previous.filter((id) => !drafted.has(id)));
    setPicks([]);
    setStarted(false);
    setPlayerQuery("");
    setMockPos("ALL");
    setPlayerListTab("roster");
    setCopyStatus("");
  };

  const toggleQueue = (playerId: string) => {
    setQueueIds((previous) => previous.includes(playerId)
      ? previous.filter((id) => id !== playerId)
      : [...previous, playerId]);
  };

  const randomizeSlot = () => setMySlot(Math.floor(Math.random() * teams) + 1);

  const applySyncedSettings = () => {
    if (!activeLeague) return;
    const counts: RosterTemplate = { qb: 0, rb: 0, wr: 0, te: 0, flex: 0, superflex: 0, k: 0, def: 0, bench: 0 };
    for (const rawPosition of rosterPositionEntries(activeLeague.roster_positions)) {
      const position = rawPosition.trim().toUpperCase().replace(/[\s-]+/g, "_");
      if (position === "QB") counts.qb++;
      else if (position === "RB") counts.rb++;
      else if (position === "WR") counts.wr++;
      else if (position === "TE") counts.te++;
      else if (position === "K") counts.k++;
      else if (position === "DEF" || position === "DST") counts.def++;
      else if (position === "SUPER_FLEX" || position === "SUPERFLEX") counts.superflex++;
      else if (["FLEX", "REC_FLEX", "WRRB_FLEX", "WR_RB_FLEX", "WR_TE_FLEX"].includes(position)) counts.flex++;
      else if (position === "BN" || position === "BENCH") counts.bench++;
    }
    setTeams(Math.max(2, Math.min(32, activeLeague.total_teams)));
    setMySlot((slot) => Math.max(1, Math.min(slot, activeLeague.total_teams)));
    setScoring(toScoringFormat(activeLeague.scoring_format));
    setTePremium(activeLeague.te_premium);
    if (Object.values(counts).some((count) => count > 0)) setRoster(counts);
    setAppliedLeagueId(activeLeague.id ?? activeLeague.platform_league_id);
  };

  /* ── Derived data ── */

  const myPicks = useMemo(() => picks.filter((p) => p.slot === mySlot), [picks, mySlot]);

  const queuedPlayers = useMemo(
    () => activeQueueIds.map((id) => playersById.get(id)).filter((player): player is Player => Boolean(player)),
    [activeQueueIds, playersById],
  );
  const visiblePlayers = useMemo(() => {
    const query = playerQuery.trim().toLowerCase();

    const filtered = draftPlayers.filter((p) =>
      !drafted.has(p.id) &&
      eligible(mockPos, p.position) &&
      (!hideOutIr || !["O", "IR", "PUP"].includes(p.injuryStatus ?? "")) &&
      (p.position !== "K" || roster.k > 0) && (p.position !== "DEF" || roster.def > 0) &&
      p.name.toLowerCase().includes(query)
    );
    return filtered.sort((a, b) => (tradeValues.get(b.id) ?? 0) - (tradeValues.get(a.id) ?? 0));
  }, [playerQuery, draftPlayers, drafted, mockPos, hideOutIr, roster.k, roster.def, tradeValues]);

  // Post-draft audit
  const draftGrades = useMemo(() => (done ? gradeDraft(picks, teams, tradeValues, playersById, roster) : []), [done, picks, teams, tradeValues, playersById, roster]);
  const draftGrade = draftGrades.find((grade) => grade.slot === mySlot);

  const slots = useMemo(() => {
    const remaining = myPicks.flatMap(pick => playersById.get(pick.playerId) ?? []);
    const rows = slotTypes.flatMap(slot => {
      const count = roster[slot.toLowerCase() as keyof RosterTemplate];
      return Array.from({ length: count }, () => {
        const index = remaining.findIndex(player => eligible(slot, player.position));
        return { slot, player: index < 0 ? undefined : remaining.splice(index, 1)[0] };
      });
    });
    // Manual picks may exceed bench capacity while starter slots remain open.
    return [...rows, ...remaining.map(player => ({ slot: "BENCH" as const, player }))];
  }, [myPicks, playersById, roster]);
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const board = boardRef.current;
    const cell = board?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!board || !cell) return;
    const bounds = board.getBoundingClientRect();
    const tile = cell.getBoundingClientRect();
    if (tile.left < bounds.left + 48 || tile.right > bounds.right)
      board.scrollLeft += tile.left - bounds.left - board.clientWidth / 2 + tile.width / 2;
    if (tile.top < bounds.top + 36 || tile.bottom > bounds.bottom)
      board.scrollTop += tile.top - bounds.top - 40;
  }, [currentPick, started]);
  const biggestSteal = myPicks
    .map((pick) => ({ pick, player: playersById.get(pick.playerId) }))
    .filter((entry): entry is { pick: MockPick; player: Player } => Boolean(entry.player && entry.player.adp > 0))
    .map((entry) => ({ ...entry, savedPicks: entry.player.adp - entry.pick.pickNumber }))
    .sort((a, b) => b.savedPicks - a.savedPicks)[0];

  const copyDraftSummary = async () => {
    const rosterSummary = myPicks.map((pick) => {
      const player = playersById.get(pick.playerId);
      return player ? `R${pick.round} Pick ${pick.pickNumber}: ${player.name} (${player.position}, ADP ${player.adp > 0 ? player.adp.toFixed(1) : "n/a"})` : null;
    }).filter(Boolean).join("\n");
    const summary = `DraftEdge Mock Draft\n${teams}-team ${SCORING_LABELS[scoring]} · ${draftGrade?.letter ?? "—"} grade\n${rosterSummary}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Clipboard unavailable");
    }
  };

  const byeWeekConflicts = useMemo(() => {
    if (!done) return [];
    const byeMap = new Map<number, Player[]>();
    for (const pick of myPicks) {
      const p = playersById.get(pick.playerId);
      if (p && p.bye > 0) {
        const list = byeMap.get(p.bye) ?? [];
        list.push(p);
        byeMap.set(p.bye, list);
      }
    }
    return Array.from(byeMap.entries())
      .filter(([, list]) => list.length >= 3)
      .map(([week, list]) => ({ week, players: list }));
  }, [done, myPicks, playersById]);

  const positionBalance = useMemo(() => {
    if (!done) return null;
    const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    let totalProj = 0;
    for (const pick of myPicks) {
      const p = playersById.get(pick.playerId);
      if (p) { counts[p.position]++; totalProj += p.projection; }
    }
    return { counts, totalProj };
  }, [done, myPicks, playersById]);

  const tradeAssets = useMemo(() => {
    if (!done) return [];
    const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    for (const pick of myPicks) {
      const p = playersById.get(pick.playerId);
      if (p) counts[p.position]++;
    }
    const assets: { pos: Position; count: number; msg: string }[] = [];
    if (counts.QB > roster.qb + 1) assets.push({ pos: "QB", count: counts.QB, msg: "Trade surplus QBs for RB/WR depth" });
    if (counts.TE > roster.te + 1) assets.push({ pos: "TE", count: counts.TE, msg: "Trade surplus TEs — position is deep" });
    if (counts.RB > roster.rb + roster.flex + 2) assets.push({ pos: "RB", count: counts.RB, msg: "Extra RBs are trade bait" });
    if (counts.WR > roster.wr + roster.flex + 2) assets.push({ pos: "WR", count: counts.WR, msg: "Extra WRs are trade bait" });
    return assets;
  }, [done, myPicks, playersById, roster]);

  if (loading || !user) {
    return <ToolLoadingState title="Fantasy Football Mock Draft Simulator" description="Practice fantasy football drafts with configurable league settings, roster slots, draft strategy, and position-aware picks." />;
  }

  const canStart = players.length > 0 && !playersLoading;

  return (
    <AppShell draftRoom={started && !done} maxWidth={started && !done ? "max-w-none" : "max-w-[1440px]"} className={started ? "" : "pt-10"}>
      {(!started || done) && <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white">Mock Draft</h1>
          {!started && <p className="mt-2 text-sm text-zinc-400">
            Practice a snake draft with configurable settings and strategy-aware auto-drafters.
          </p>}
        </div>
        {done && <button type="button" onClick={reset} className="rounded-lg px-3 py-2 text-sm hover:bg-white/5">Reset</button>}
      </div>}

      {/* ════════════════════════════════════════════ PHASE 1: SETUP ════════════════════════════════════════════ */}
      {!started ? (
        <div className="glass-strong mx-auto max-w-2xl rounded-2xl p-7">
          <div className="space-y-5">

            {activeLeague && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0D1412] px-3 py-2.5">
              <div><p className="text-xs font-semibold text-zinc-200">{activeLeague.league_name}</p><p className="mt-0.5 text-[10px] text-zinc-500">{activeLeague.platform.toUpperCase()} settings available for this mock.</p></div>
              <button type="button" onClick={applySyncedSettings} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400">{appliedLeagueId === (activeLeague.id ?? activeLeague.platform_league_id) ? "League Settings Applied ✓" : "Use League Settings"}</button>
            </div>}

            {/* Scoring */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Scoring Format</label>
              <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1">
                {SCORING_OPTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setScoring(s)} aria-pressed={scoring === s}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${scoring === s ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}`}>
                    {SCORING_LABELS[s]}
                  </button>
                ))}
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={tePremium} onChange={(e) => setTePremium(e.target.checked)} className="accent-emerald-500" />
                TE Premium (+0.5 PPR; historical usage estimate)
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-zinc-400">League Format
                <select value={leagueFormat} onChange={(e) => setLeagueFormat(e.target.value as LeagueFormat)} className="glass-input mt-2 w-full rounded-lg px-3 py-2 text-zinc-100">
                  <option value="redraft">Redraft</option><option value="dynasty">Dynasty</option><option value="keeper">Keeper</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-zinc-400">Draft Type
                <select value={draftType} onChange={(e) => setDraftType(e.target.value as DraftType)} className="glass-input mt-2 w-full rounded-lg px-3 py-2 text-zinc-100">
                  <option value="snake">Snake</option><option value="linear">Linear</option><option value="third_round_reversal">3rd-Round Reversal</option>
                </select>
              </label>
            </div>

            {/* League size + slot */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-zinc-400">League Size</label>
                <div className="flex gap-1.5">
                  {teamCountOptions.map((t) => (
                    <button key={t} type="button" onClick={() => { setTeams(t); setMySlot((s) => Math.min(s, t)); }}
                      aria-pressed={teams === t}
                      className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${teams === t ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-zinc-400">Your Draft Slot</label>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <Select label="Draft slot" value={String(mySlot)} onChange={(v) => setMySlot(Number(v))}
                      options={Array.from({ length: teams }, (_, i) => ({ value: String(i + 1), label: `#${i + 1}` }))} />
                  </div>
                  <button type="button" onClick={randomizeSlot} title="Randomize slot" aria-label="Randomize draft slot"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400 transition hover:border-emerald-500/50 hover:text-emerald-300">
                    <ShuffleIcon size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Roster builder */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Roster Settings</label>
              <div className="rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(["qb", "rb", "wr", "te", "flex", "superflex", "k", "def", "bench"] as const).map((key) => (
                    <label key={key} className="flex items-center justify-between gap-2 rounded-lg bg-[#0D1412] px-2.5 py-2 text-xs text-zinc-300">
                      <span>{key === "superflex" ? "SUPERFLEX" : key.toUpperCase()}</span>
                      <input aria-label={`${key} roster slots`} type="number" min={0} max={key === "bench" ? 15 : 8} value={roster[key]} onChange={(e) => setRoster((r) => ({ ...r, [key]: Math.max(0, Math.min(key === "bench" ? 15 : 8, Number(e.target.value) || 0)) }))} className="w-12 rounded border border-white/[0.08] bg-[#080E0C] px-1.5 py-1 text-right font-mono tabular-nums text-white" />
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-300">IR Slots</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((n) => (
                      <button key={n} type="button" onClick={() => setIrSlots(n)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${irSlots === n ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-300"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600">
                {leagueFormat} · {draftType.replaceAll("_", " ")} · {rosterSize(roster)} rounds{irSlots > 0 ? ` · ${irSlots} IR` : ""}
              </p>
            </div>

            {/* Pick timer */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Pick Timer</label>
              <div className="flex rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-1">
                {TIMER_OPTIONS.map((t) => (
                  <button key={t.value} type="button" onClick={() => setPickTimer(t.value)}
                    aria-pressed={pickTimer === t.value}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${pickTimer === t.value ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-zinc-400">Draft Strategy</label>
              <div className="grid grid-cols-3 gap-1.5">
                {STRATEGIES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setStrategy(s.value)}
                    title={s.tip}
                    className={`rounded-lg border py-2 text-[11px] font-bold transition ${strategy === s.value ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600">
                {STRATEGIES.find((s) => s.value === strategy)?.tip}
              </p>
            </div>

            <button type="button" onClick={startDraft} disabled={!canStart}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
              {playersLoading ? "Loading players…" : "Start Mock Draft"}
            </button>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════ PHASE 3: DRAFT / RESULTS ════════════════════════════════════════════ */
        <div className={done ? "space-y-4" : styles.room}>
          <section className={styles.board}>
            <header className={styles.toolbar}>
              <h1>Draft Board</h1>
              <span>{done ? "Complete" : `Round ${roundForPick(currentPick, teams)} / Pick ${currentPick}`}</span>
              {!done && <div className={styles.controls}>
                <button onClick={autoPick} disabled={!isMyTurn}>Auto-Pick</button>
                <button onClick={simulateRest}>Simulate Rest</button>
                <button onClick={reset}>Reset</button>
              </div>}
            </header>
            <div ref={boardRef} role="region" aria-label="Draft board by round and team" tabIndex={0} className={styles.boardScroll}>
              <table className="w-full border-separate border-spacing-0 text-left text-xs">
                <thead className="sticky top-0 z-20 bg-[#131D1A]">
                  <tr>
                    <th scope="col" className="sticky left-0 bg-[#131D1A] px-2 py-2">Rd</th>
                    {Array.from({ length: teams }, (_, i) => (
                      <th key={i} scope="col" className={`min-w-[122px] whitespace-nowrap px-2 py-2 ${i + 1 === mySlot ? "bg-emerald-950 text-emerald-300" : ""}`}>
                        {i + 1 === mySlot ? `Team ${i + 1} (You)` : `Team ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: totalRounds }, (_, i) => {
                    const round = i + 1;
                    return (
                      <tr key={round}>
                        <th scope="row" className="sticky left-0 z-10 border-t border-white/10 bg-[#131D1A] px-2">R{round}<small className="block text-zinc-400">{slotForPick(i * teams + 1, teams, draftType) === 1 ? "→" : "←"}</small></th>
                        {Array.from({ length: teams }, (_, j) => {
                          const slot = j + 1;
                          const firstPick = i * teams + 1;
                          const pickNumber = firstPick + (slotForPick(firstPick, teams, draftType) === 1 ? j : teams - slot);
                          const pick = picks[pickNumber - 1];
                          const player = pick && playersById.get(pick.playerId);
                          const active = !done && pickNumber === currentPick;
                          const [first, ...last] = player?.name.split(" ") ?? [];
                          return (
                            <td key={slot} aria-current={active ? "step" : undefined} data-pos={player?.position} data-mine={slot === mySlot} className={styles.tile}>
                              <small>{round}.{pickNumber - i * teams}{pickNumber % teams === 0 && round < totalRounds && " ↓"}</small>
                              {active ? <><strong className="text-pop">ON THE CLOCK</strong><b className="font-mono text-white">{pickTimer ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : "Untimed"}</b></>
                                : player && <><span>{last.length ? first : ""}</span><strong>{last.join(" ") || first}</strong><small>{player.position} &middot; {player.team} (Bye {player.bye || "—"})</small></>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          {done ? (
            <section className="glass-strong rounded-xl p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Draft Results</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {totalRounds} rounds · pick {mySlot} · {SCORING_LABELS[scoring]} · {STRATEGIES.find((s) => s.value === strategy)?.label}
                </p>

                {/* Letter grade */}
                {draftGrade && (
                  <div className="mt-4 rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-center">
                    <span className={`font-display text-4xl font-bold ${draftGrade.color}`}>{draftGrade.letter}</span>
                    <p className="mt-1 text-xs text-zinc-400">{draftGrade.label}</p>
                    <p className="mt-1 font-mono text-[10px] tabular-nums text-zinc-500">Starter value {draftGrade.starterVorp.toFixed(1)} · Bench {draftGrade.benchVorp.toFixed(1)} vs room average</p>
                  </div>
                )}

                <button type="button" onClick={copyDraftSummary} className="mt-3 w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">Copy Draft Summary</button>
                {copyStatus && <p role="status" className="mt-1 text-center text-[10px] text-zinc-500">{copyStatus}</p>}
                {biggestSteal && biggestSteal.savedPicks > 0 && <div className="mt-3 rounded-lg border border-[#FF3E9D]/25 bg-[#FF3E9D]/[0.06] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wider text-[#FF3E9D]">Best value steal</p><p className="mt-1 truncate text-xs font-semibold text-zinc-100">{biggestSteal.player.name} <span className="font-mono text-zinc-400">ADP {biggestSteal.player.adp.toFixed(0)} · Pick {biggestSteal.pick.pickNumber}</span></p><p className="font-mono text-[10px] text-emerald-300">{biggestSteal.savedPicks.toFixed(0)} picks past ADP</p></div>}

                <div className="mt-4 border-t border-white/[0.08] pt-3">
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Room grades · VORP</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {draftGrades.map((grade) => <div key={grade.slot} className="flex items-center justify-between text-xs"><span className={grade.slot === mySlot ? "font-semibold text-white" : "text-zinc-500"}>{grade.slot === mySlot ? "You" : `Team ${grade.slot}`}</span><span className={`font-mono font-bold ${grade.color}`}>{grade.letter}</span></div>)}
                  </div>
                </div>

                {/* Projected total */}
                {positionBalance && (
                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
                    <span className="font-tech text-xs uppercase tracking-wider text-emerald-300">Projected</span>
                    <span className="font-tech mt-0.5 block text-2xl font-bold text-white">
                      {positionBalance.totalProj.toFixed(0)} pts
                    </span>
                  </div>
                )}

                {/* Positional breakdown */}
                {positionBalance && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Positional Breakdown</h3>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["QB", "RB", "WR", "TE", "K", "DEF"] as Position[]).map((pos) => {
                        const count = positionBalance.counts[pos];
                        const need = roster[pos.toLowerCase() as keyof RosterTemplate] ?? 0;
                        if (need === 0 && count === 0) return null;
                        return (
                          <div key={pos} className={`rounded-lg px-2 py-1.5 text-center ${count >= need ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "bg-zinc-800/60"}`}>
                            <span className="block text-[10px] font-bold text-zinc-500">{pos}</span>
                            <span className={`block text-sm font-bold ${count >= need ? "text-emerald-300" : "text-amber-300"}`}>{count}/{need}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bye week conflicts */}
                {byeWeekConflicts.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                    <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">⚠ Bye Week Conflicts</h3>
                    {byeWeekConflicts.map(({ week, players: plist }) => (
                      <p key={week} className="text-[10px] text-amber-200/80">
                        Week {week}: {plist.map((p) => p.name).join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {/* Trade assets */}
                {tradeAssets.length > 0 && (
                  <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-3 py-2.5">
                    <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Trade Leverage</h3>
                    {tradeAssets.map((a) => (
                      <p key={a.pos} className="text-[10px] text-cyan-200/80">
                        {a.pos} ×{a.count} — {a.msg}
                      </p>
                    ))}
                  </div>
                )}

                {/* Roster list */}
                <div className="mt-4 space-y-1.5">
                  {myPicks.map((pick) => {
                    const p = playersById.get(pick.playerId);
                    if (!p) return null;
                    return (
                      <div key={pick.playerId} className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-tech shrink-0 text-xs text-zinc-500">R{pick.round}</span>
                          <span className="truncate font-semibold text-zinc-200">{p.name}</span>
                        </div>
                        <span className="font-tech shrink-0 text-xs text-zinc-400">
                          {p.position} · {p.projection.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
            </section>
          ) : (
            <div className={styles.lower}>
              <section className={styles.panel} aria-label="Available players">
                <div className={styles.filters}>
                  <h2>Available Players</h2>
                  <input type="search" placeholder="Search players" aria-label="Search draft players" value={playerQuery} onChange={e => setPlayerQuery(e.target.value)} />
                  <label><input type="checkbox" checked={hideOutIr} onChange={e => setHideOutIr(e.target.checked)} /> Hide Out/IR</label>
                  <div className={styles.tabs}>
                    {(["ALL", ...slotTypes] as const).filter(pos => pos !== "BENCH" && (pos !== "SUPERFLEX" || roster.superflex)).map(pos => (
                      <button key={pos} aria-pressed={mockPos === pos} onClick={() => setMockPos(pos)}>{pos}{pos !== "ALL" && ` ${slots.filter(row => row.slot === pos && row.player).length}/${roster[pos.toLowerCase() as keyof RosterTemplate]}`}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.scroll}>
                  <table className={styles.players}>
                    <thead><tr>{["Draft", "Rank", "Player", "Queue", "ADP", "Proj pts", "PPG"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
                    <tbody>{visiblePlayers.map(p => {
                      const queued = activeQueueIds.includes(p.id);
                      return <tr key={p.id}>
                        <td><button className={styles.draft} disabled={!isMyTurn} onClick={() => makeMyPick(p.id)} aria-label={`Draft ${p.name}`}>Draft</button></td>
                        <td>{p.rank}</td>
                        <td><strong>{p.name}</strong> <InjuryBadge status={p.injuryStatus} /><small>{p.position} &middot; {p.team} (Bye {p.bye || "—"})</small></td>
                        <td><button aria-pressed={queued} title={queued ? "Remove from Queue" : "Add to Queue"} aria-label={`${queued ? "Remove from" : "Add to"} queue: ${p.name}`} onClick={() => toggleQueue(p.id)}>&#9733; {queued ? "Queued" : "Queue"}</button></td>
                        <td>{p.adp > 0 ? p.adp.toFixed(1) : "—"}</td><td>{p.projection.toFixed(1)}</td>
                        <td>{p.usage?.games && p.actualPoints != null ? (p.actualPoints / p.usage.games).toFixed(1) : "—"}</td>
                      </tr>;
                    })}</tbody>
                  </table>
                  {!visiblePlayers.length && <p className="p-4 text-sm text-zinc-400">No players match these filters.</p>}
                </div>
              </section>
              <aside className={styles.panel}>
                <div className={styles.sideTabs}>{(["roster", "queue"] as const).map(tab => <button key={tab} aria-pressed={playerListTab === tab} onClick={() => setPlayerListTab(tab)}>{tab}{tab === "queue" && ` (${queuedPlayers.length})`}</button>)}</div>
                <div className={styles.scroll}>
                  {playerListTab === "roster" ? slots.map(({ slot, player }, index) => (
                    <div className={styles.slot} key={index}><span data-pos={player?.position ?? slot}>{slot}</span>{player?.name ?? <small>Empty</small>}</div>
                  )) : queuedPlayers.length ? queuedPlayers.map(p => (
                    <div className={styles.slot} key={p.id}><span data-pos={p.position}>{p.position}</span><b>{p.name}</b><button disabled={!isMyTurn} onClick={() => makeMyPick(p.id)}>Draft</button><button onClick={() => toggleQueue(p.id)} aria-label={`Remove ${p.name} from queue`}>Remove</button></div>
                  )) : <p className="p-4 text-sm text-zinc-400">Use the star in the player pool to queue a player.</p>}
                </div>
              </aside>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
