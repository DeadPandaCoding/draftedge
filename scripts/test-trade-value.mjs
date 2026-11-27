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
