import { InjuryBadge } from "@/components/ui";
import type { Player } from "@/lib/types";
import { formatPositiveStat } from "@/lib/player-display";
import styles from "@/app/mock/room.module.css";

export function AvailablePlayerRow({ p, queued, blockReason, isMyTurn, makeMyPick, toggleQueue }: {
  p: Player; queued: boolean; blockReason?: string | null; isMyTurn: boolean;
  makeMyPick: (id: string) => void; toggleQueue: (id: string) => void;
}) {
  return <tr >
    <td><button className={styles.draft} disabled={!isMyTurn || Boolean(blockReason)} title={blockReason ?? (isMyTurn ? undefined : "Not your turn")} onClick={() => makeMyPick(p.id)} aria-label={`Draft ${p.name}`}>Draft</button></td>
    <td>{p.rank}</td>
    <td><strong>{p.name}</strong> <InjuryBadge status={p.injuryStatus} /><small>{p.position} &middot; {p.team} (Bye {p.bye || "—"})</small>{blockReason && <small className="block text-rose-300">{blockReason}</small>}</td>
    <td><button aria-pressed={queued} title={queued ? "Remove from Queue" : "Add to Queue"} aria-label={`${queued ? "Remove from" : "Add to"} queue: ${p.name}`} onClick={() => toggleQueue(p.id)}>&#9733; {queued ? "Queued" : "Queue"}</button></td>
    <td>{formatPositiveStat(p.adp)}</td><td>{p.projection.toFixed(1)}</td>
    <td>{p.usage?.games && p.actualPoints != null ? (p.actualPoints / p.usage.games).toFixed(1) : "—"}</td>
  </tr>;
}
