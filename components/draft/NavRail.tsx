"use client";

import { useRouter } from "next/navigation";
import { DownloadIcon, GridIcon, LogoutIcon, ResetIcon, SettingsIcon } from "@/components/icons";

const ITEM =
  "glass glass-hover flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200";

/**
 * Slim vertical command rail (Command Deck direction): primary navigation
 * for the draft room. Hidden on mobile — the header and control strip cover
 * those actions there.
 */
export function NavRail({
  onExport,
  onReset,
  onLogout,
}: {
  onExport: () => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();

  return (
    <nav
      aria-label="Primary"
      className="glass hidden w-12 shrink-0 flex-col items-center gap-1.5 border-x-0 border-y-0 border-r py-3 md:flex"
    >
      <span
        aria-label="Draft board"
        title="Draft board"
        className={`${ITEM} bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30`}
      >
        <GridIcon size={16} />
      </span>
      <button
        type="button"
        aria-label="Home dashboard"
        title="Home dashboard"
        onClick={() => router.push("/home")}
        className={ITEM}
      >
        <SettingsIcon size={16} />
      </button>
      <div className="my-1 h-px w-6 bg-zinc-800" />
      <button
        type="button"
        aria-label="Export roster CSV"
        title="Export roster CSV"
        onClick={onExport}
        className={ITEM}
      >
        <DownloadIcon size={16} />
      </button>
      <button
        type="button"
        aria-label="Reset draft board"
        title="Reset draft board"
        onClick={onReset}
        className={ITEM}
      >
        <ResetIcon size={16} />
      </button>
      <div className="my-1 h-px w-6 bg-zinc-800" />
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        onClick={onLogout}
        className={`${ITEM} hover:text-rose-300`}
      >
        <LogoutIcon size={16} />
      </button>
    </nav>
  );
}