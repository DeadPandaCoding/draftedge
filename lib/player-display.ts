import type { Player } from "./types";

export function indexPlayersById(players: readonly Player[]): Map<string, Player> {
  return new Map(players.map(player => [player.id, player]));
}

export function formatPositiveStat(value: number): string {
  return value > 0 ? value.toFixed(1) : "—";
}
