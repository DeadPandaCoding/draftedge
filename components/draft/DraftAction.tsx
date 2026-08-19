"use client";

import { useEffect, useRef, useState } from "react";
import type { DraftState, PickOwner, Player } from "@/lib/types";
import { pickForPlayer } from "@/lib/draft";
import { CheckIcon, UndoIcon, UserIcon, UsersIcon } from "@/components/icons";
import BorderGlow, { GLOW_PRESET } from "@/components/ui/BorderGlow";

export function DraftAction({
  player,
  state,
  onDraft,
  onUndraft,
}: {
  player: Player;
  state: DraftState;
  onDraft: (playerId: string, owner: PickOwner) => void;
  onUndraft: (playerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const pick = pickForPlayer(state, player.id);

  // Escape closes the menu; scroll/reposition closes it so the fixed popover
  // never floats detached from its row.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  if (pick) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
            pick.owner === "me"
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
              : "bg-zinc-600/30 text-zinc-400 ring-zinc-600/50"
          }`}
        >
          {pick.owner === "me" ? <UserIcon size={9} /> : <UsersIcon size={9} />}
          {pick.owner === "me" ? "Me" : "Opp"}
        </span>
        <button
          onClick={() => onUndraft(player.id)}
          title="Undo draft"
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <UndoIcon size={13} />
        </button>
      </div>
    );
  }

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const WIDTH = 200;
    const x = Math.min(r.right, window.innerWidth - WIDTH - 8);
    setPos({ x, y: r.bottom + 4 });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-glass-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition"
      >
        <CheckIcon size={11} />
        Draft
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close draft menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <BorderGlow
            {...GLOW_PRESET}
            className="fixed z-50 w-[200px]"
            borderRadius={12}
            glowRadius={28}
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="py-1">
            <button
              onClick={() => {
                onDraft(player.id, "me");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              <UserIcon size={15} />
              Draft to my team
            </button>
            <button
              onClick={() => {
                onDraft(player.id, "opponent");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              <UsersIcon size={15} />
              Opponent drafted
            </button>
            </div>
          </BorderGlow>
        </>
      )}
    </>
  );
}
