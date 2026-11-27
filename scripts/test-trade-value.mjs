// Run with Node 24+: node --disable-warning=ExperimentalWarning scripts/test-trade-value.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts") && !specifier.endsWith(".ts"))
      return nextResolve(specifier + ".ts", context);
    return nextResolve(specifier, context);
  },
});
const { buildTradeValues, packageTradeValue, gradeTrade } = await import("../lib/trade-value.ts");
const { buildMatchupContext } = await import("../lib/matchup-context.ts");
const { buildSeedPlayers } = await import("../lib/seed-data.ts");
const { DEFAULT_ROSTER } = await import("../lib/league.ts");

// Use the reported Week 12 PPR snapshot for the three assets and season-only
// seed projections for the rest of the board. No live data needed in CI.
const snapshot = new Map([
  ["jamarr-chase", [3.2, 133.71]], ["chase-brown", [14.2, 90.62]], ["parker-washington", [58.8, 111.04]],
]);
const seed = buildSeedPlayers("ppr");
const players = seed.map(p => {
  const row = snapshot.get(p.id);
  return row ? { ...p, adp: row[0], rosProjection: row[1], injuryStatus: null } : p;
});
const contexts = buildMatchupContext(players, 12);
const values = buildTradeValues(players, 12, undefined, DEFAULT_ROSTER, contexts);
const [chase, brown, washington] = [...snapshot.keys()].map(id => values.get(id));
assert(chase >= 85 && chase <= 95);
assert(brown >= 55 && brown <= 70);
assert(washington >= 20 && washington <= 30);
const received = packageTradeValue([brown, washington], 1);
assert(received < chase);
assert.equal(packageTradeValue([washington, brown], 1), received);
assert.equal(received, Math.round((brown + (washington - 5) * .75) * 10) / 10);
assert(!["Clear win", "Slight edge"].includes(gradeTrade(received - chase, received + chase).label));
assert.equal(gradeTrade(.5, 3.5).label, "Fair trade");
for (const [a, b] of [[[60], [61]], [[65, 25], [80]]]) {
  const left = packageTradeValue(a, b.length), right = packageTradeValue(b, a.length);
  assert.equal(gradeTrade(left - right, left + right).label, "Fair trade");
}
assert(packageTradeValue([75, 45], 1) > chase);
assert.equal(gradeTrade(10, 10, false).label, "Add players to both sides");
assert.equal(contexts.get("chase-brown").rosPoints, 90.62);
const missing = players.find(p => p.projection > 0 && !snapshot.has(p.id));
assert.equal(contexts.get(missing.id).rosPoints, missing.projection * (7 - Number(missing.bye >= 12 && missing.bye <= 18)) / 17);
const seedValues = buildTradeValues(seed);
assert.deepEqual(seedValues, buildTradeValues(seed, 12, undefined, DEFAULT_ROSTER, buildMatchupContext(seed)));
const qb = [...players].filter(p => p.position === "QB").sort((a,b) => b.projection-a.projection)[0];
const superflex = buildTradeValues(players, 12, undefined, { ...DEFAULT_ROSTER, superflex: 1 }, contexts);
assert(superflex.get(qb.id) >= values.get(qb.id));
console.log("Passed trade spread, ROS horizon, package, grade, roster, and seed parity checks.");

const { optimalStarters, starterImpact, suggestTrades, teamVerdict } = await import("../lib/trade-recommendations.ts");
const slots = { qb: 1, rb: 1, wr: 0, te: 0, flex: 1, superflex: 1, k: 0, def: 0 };
const player = (id, position, weekProjection) => ({ id, position, weekProjection, bye: 9 });
const mine = [player("qb1", "QB", 22), player("qb2", "QB", 20), player("rb1", "RB", 12), player("wr1", "WR", 15), player("wr2", "WR", 11)];
const target = player("rb2", "RB", 15.6);
const rosterValues = new Map([...mine, target].map(p => [p.id, 50]));
assert.deepEqual([...optimalStarters(mine, slots, 8).values()], [22, 12, 15, 20]);
assert.deepEqual(starterImpact(mine, [target], [mine[4]], slots, 8), { delta: 3.6, slot: "RB1" });
assert.equal(starterImpact(mine, [target], [target], slots, 8), null);
assert.equal(gradeTrade(0, 100).label, "Fair trade");
assert.equal(teamVerdict(0, 100, 3.6), "Slight edge");
assert.deepEqual(suggestTrades(mine, [{ id: "empty", name: "Empty", players: [] }], slots, rosterValues, 8), []);
const partner = { id: "p", name: "Partner", players: [target, player("rb3", "RB", 18), player("rb4", "RB", 19), player("qb3", "QB", 23), player("qb4", "QB", 21)] };
assert.ok(suggestTrades(mine, [partner], slots, rosterValues, 8).some(s => s.receive.id === target.id));
console.log("Passed weekly starter, team verdict, and suggestion checks.");
