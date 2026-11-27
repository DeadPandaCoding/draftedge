import type { Player, RosterTemplate } from "./types";
import { gradeTrade } from "./trade-value";

export function weeklyPoints(player: Player, week?: number | null) {
  if ((week && player.bye === week) || ["O", "IR", "PUP", "SUS"].includes(player.injuryStatus ?? "")) return 0;
  return Math.max(0, player.weekProjection ?? player.weeklyAvg ?? 0);
}

// Eligibility sets are nested: filling dedicated slots first, then FLEX, then
// SUPER_FLEX maximizes points without spending a flexible slot prematurely.
export function optimalStarters(players: Player[], slots: RosterTemplate, week?: number | null) {
  const available = [...new Map(players.map(p => [p.id, p])).values()]
    .sort((a, b) => weeklyPoints(b, week) - weeklyPoints(a, week));
  const lineup = new Map<string, number>();
  const fill = (label: string, count: number, positions: string[]) => {
    for (let i = 1; i <= count; i++) {
      const index = available.findIndex(p => positions.includes(p.position));
      const points = index < 0 ? 0 : weeklyPoints(available.splice(index, 1)[0], week);
      lineup.set(label + i, points);
    }
  };
  for (const position of ["qb", "rb", "wr", "te", "k", "def"] as const)
    fill(position.toUpperCase(), slots[position], [position.toUpperCase()]);
  fill("FLEX", slots.flex, ["RB", "WR", "TE"]);
  fill("SUPER_FLEX", slots.superflex ?? 0, ["QB", "RB", "WR", "TE"]);
  return lineup;
}

export function starterImpact(roster: Player[], receive: Player[], send: Player[], slots: RosterTemplate, week?: number | null,
  before = optimalStarters(roster, slots, week)) {
  const owned = new Set(roster.map(p => p.id));
  if (!send.length || !receive.length || send.some(p => !owned.has(p.id)) || receive.some(p => owned.has(p.id))) return null;
  const sent = new Set(send.map(p => p.id));
  const after = optimalStarters([...roster.filter(p => !sent.has(p.id)), ...receive], slots, week);
  const changes = [...after].map(([slot, points]) => ({ slot, delta: points - (before.get(slot) ?? 0) }));
  const delta = Math.round(10 * changes.reduce((sum, change) => sum + change.delta, 0)) / 10;
  const largest = changes.sort((a, b) => delta < 0 ? a.delta - b.delta : b.delta - a.delta)[0];
  return { delta, slot: delta ? largest?.slot : undefined };
}

// One projected weekly starter point offsets two market-value points in the
// team verdict only. Market totals and the shared grade stay league-neutral.
export function teamVerdict(net: number, total: number, delta: number) {
  return gradeTrade(net + 2 * delta, total).label;
}

export function suggestTrades(mine: Player[], partners: { id: string; name: string; players: Player[] }[],
  slots: RosterTemplate, values: ReadonlyMap<string, number>, week?: number | null) {
  const before = optimalStarters(mine, slots, week);
  const candidates = [];
  for (const partner of partners) {
    const theirs = optimalStarters(partner.players, slots, week);
    for (const send of mine) for (const receive of partner.players) {
      const take = values.get(receive.id) ?? 0;
      const give = values.get(send.id) ?? 0;
      if (!take || !give || Math.abs(take - give) > Math.max(5, (take + give) * .12)) continue;
      const gain = starterImpact(mine, [receive], [send], slots, week, before);
      if (!gain || gain.delta <= 0 || teamVerdict(take - give, take + give, gain.delta).includes("loss")) continue;
      const partnerGain = starterImpact(partner.players, [send], [receive], slots, week, theirs);
      if (partnerGain && partnerGain.delta >= 0)
        candidates.push({ partner, send, receive, gain, score: gain.delta + .25 * partnerGain.delta });
    }
  }
  const seen = new Set<string>();
  return candidates.sort((a, b) => b.score - a.score).filter(({ receive }) => {
    if (seen.has(receive.id)) return false;
    seen.add(receive.id);
    return true;
  }).slice(0, 3);
}
