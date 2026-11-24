import type { Player } from "@/lib/types";
import styles from "@/app/mock/room.module.css";

export function DraftBoardTile({ player, round, pickNumber, teams, totalRounds, active, mine, clock }: {
  player?: Player; round: number; pickNumber: number; teams: number; totalRounds: number; active: boolean; mine: boolean; clock: string;
}) {
  const [first, ...last] = player?.name.split(" ") ?? [];
  return (
    <td aria-current={active ? "step" : undefined} data-pos={player?.position} data-mine={mine} className={styles.tile}>
      <small>{round}.{(pickNumber - 1) % teams + 1}{pickNumber % teams === 0 && round < totalRounds && " ↓"}</small>
      {active ? <><strong className="text-pop">ON THE CLOCK</strong><b className="font-mono text-white">{clock}</b></>
        : player && <><span>{last.length ? first : ""}</span><strong>{last.join(" ") || first}</strong><small>{player.position} &middot; {player.team} (Bye {player.bye || "—"})</small></>}
    </td>
  );
}
