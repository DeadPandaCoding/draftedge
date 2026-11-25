import type { Ref } from "react";
import { roundForPick, slotForPick } from "@/lib/league";
import type { DraftType, Player } from "@/lib/types";
import { DraftBoardTile } from "./DraftBoardTile";
import styles from "@/app/mock/room.module.css";

export function MockDraftBoard({ teams, mySlot, draftType, picks, playersById, currentPick, totalRounds, done, isMyTurn, autoPick, simulateRest, reset, boardRef, clock }: {
  teams: number; mySlot: number; draftType: DraftType; picks: { playerId: string }[];
  playersById: Map<string, Player>; currentPick: number; totalRounds: number;
  done: boolean; isMyTurn: boolean; autoPick: () => void; simulateRest: () => void; reset: () => void;
  boardRef?: Ref<HTMLDivElement>; clock: string;
}) {
  return (
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
                    return (
                      <DraftBoardTile key={slot} player={player} round={round} pickNumber={pickNumber} teams={teams} totalRounds={totalRounds} active={active} mine={slot === mySlot} clock={clock} />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
