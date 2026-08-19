"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeagueConfig } from "@/lib/types";
import { SCORING_LABELS, STATUS_LABELS, slotForPick } from "@/lib/league";
import { useAuth } from "@/lib/auth";
import { Dropdown, MenuItem } from "@/components/ui";
import { PickClock } from "./PickClock";
import {
  BoltIcon,
  ChevronDownIcon,
  DownloadIcon,
  LogoutIcon,
  ResetIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/icons";

const STATUS_DOT: Record<LeagueConfig["status"], string> = {
  pre_draft: "bg-zinc-500",
  live: "bg-rose-500 animate-pulse",
  completed: "bg-emerald-500",
};

export function DraftHeader({
  league,
  currentPick,
  lastPickTime,
  onSetStatus,
  onSetPickTimer,
  onReset,
  onExport,
  onOpenRoster,
}: {
  league: LeagueConfig;
  currentPick: number;
  lastPickTime: number | undefined;
  onSetStatus: (s: LeagueConfig["status"]) => void;
  onSetPickTimer: (seconds: number) => void;
  onReset: () => void;
  onExport: () => void;
  onOpenRoster: () => void;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const totalPicks = league.rounds * league.teamCount;
  const isComplete = currentPick > totalPicks;
  const status: LeagueConfig["status"] = isComplete ? "completed" : league.status;
  const round = Math.min(league.rounds, Math.ceil(currentPick / league.teamCount));
  const myTurn =
    status === "live" && !isComplete && slotForPick(currentPick, league.teamCount) === league.draftPosition;
  const timerSeconds = league.pickTimerSeconds ?? 90;
  // Clock anchor: the last logged pick, or when the draft went live before any pick.
  const clockAnchor = lastPickTime ?? (status === "live" ? league.liveSince : undefined);

  return (
    <header className="glass-nav relative z-30 flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <BoltIcon size={14} />
          </span>
          <span className="font-display hidden text-sm tracking-wide text-white sm:block">
            Draft<span className="text-emerald-400">Edge</span>
          </span>
        </Link>

        <div className="hidden h-6 w-px bg-zinc-800 sm:block" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-zinc-100">{league.name}</span>
            <span className="glass hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-zinc-400 md:inline">
              {SCORING_LABELS[league.scoring]} · {league.teamCount}-team · Pick {league.draftPosition}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>
              Pick <span className="font-tech font-bold text-zinc-300">{Math.min(currentPick, totalPicks)}</span>
              /{totalPicks} · Round {round}
            </span>
            {myTurn && (
              <span className="rounded-full bg-amber-400/15 px-2 py-px font-bold text-amber-300 shadow-[0_0_14px_-2px_rgba(251,191,36,0.5)] ring-1 ring-inset ring-amber-400/40">
                Your pick!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onOpenRoster}
          className="glass glass-hover flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-300 lg:hidden"
        >
          <UsersIcon size={13} />
          Roster
        </button>

        {/* Draft status pill */}
        <Dropdown
          align="right"
          width="w-44"
          trigger={
            <button
              type="button"
              className="glass glass-hover flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-zinc-200"
              title="Change draft status"
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABELS[status]}
              <ChevronDownIcon size={12} className="text-zinc-500" />
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              {(["pre_draft", "live", "completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSetStatus(s);
                    close();
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition hover:bg-zinc-800 ${
                    status === s ? "font-bold text-white" : "text-zinc-400"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        {/* Live pick countdown clock (matches the hero mockup) */}
        {status !== "completed" && (
          <PickClock
            status={status}
            timerSeconds={timerSeconds}
            anchorTime={clockAnchor}
            onSetTimer={onSetPickTimer}
          />
        )}

        {/* Profile menu */}
        <Dropdown
          align="right"
          width="w-60"
          trigger={
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-bold text-white transition hover:border-zinc-500">
              {(user?.name ?? "?").charAt(0).toUpperCase()}
            </button>
          }
        >
          {(close) => (
            <div className="py-1">
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="truncate text-sm font-bold text-zinc-100">{user?.name}</p>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
              <MenuItem
                icon={<SettingsIcon size={15} />}
                label="Home Dashboard"
                onClick={() => {
                  close();
                  router.push("/home");
                }}
              />
              <MenuItem
                icon={<DownloadIcon size={15} />}
                label="Export Roster to CSV"
                onClick={() => {
                  close();
                  onExport();
                }}
              />
              <MenuItem
                icon={<ResetIcon size={15} />}
                label="Reset Draft Board"
                danger
                onClick={() => {
                  close();
                  onReset();
                }}
              />
              <div className="my-1 border-t border-zinc-800" />
              <MenuItem
                icon={<LogoutIcon size={15} />}
                label="Log Out"
                danger
                onClick={() => {
                  close();
                  signOut();
                  router.push("/");
                }}
              />
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
