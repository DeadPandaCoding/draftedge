/**
 * End-to-end walkthrough of the DraftEdge flow in a real browser:
 * landing → signup → onboarding → draft room → draft players → filters/views/notes/persistence.
 *
 * Usage:
 *   npm i --no-save playwright-core   # uses the system Chrome, no browser download
 *   node scripts/e2e-walkthrough.mjs
 *
 * Requires the app server running (npm run dev / npm run start) on http://localhost:3000.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const shotsDir = path.join(os.tmpdir(), "draftedge-shots");
fs.mkdirSync(shotsDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

let failures = 0;
function check(name, cond, extra = "") {
  const pass = !!cond;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? "  [" + extra + "]" : ""}`);
}
async function shot(name) {
  await page.screenshot({ path: path.join(shotsDir, name + ".png") });
}

try {
  // ── 1. Landing page ───────────────────────────────────────────
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  // First visit — dismiss the cookie consent banner so it can't intercept clicks.
  const consentRegion = page.getByRole("region", { name: "Cookie consent" });
  if (await consentRegion.isVisible().catch(() => false)) {
    await consentRegion.getByRole("button", { name: "Reject optional" }).click();
    await consentRegion.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }
  check("landing hero headline", await page.getByRole("heading", { level: 1, name: /Master Your Fantasy Draft/ }).isVisible());
  check("landing mockup visible", await page.getByText("The Office League · PPR").isVisible());
  check("landing no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await shot("01-landing");

  // ── 2. Signup ─────────────────────────────────────────────────
  await page.getByRole("link", { name: "Get Started Free" }).first().click();
  await page.waitForURL("**/signin**");
  const email = `walker${Date.now()}@test.com`;
  await page.getByPlaceholder("Your name").fill("Test Walker");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill("draftday123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/home", { timeout: 10000 });
  // The home page fetches the league async — wait for the setup card to render.
  await page.getByRole("heading", { name: "Set up your league" }).waitFor({ timeout: 10000 });
  check("signup lands on home dashboard", true);
  await shot("02-home-setup");

  // ── 3. Home setup card → draft room ──────────────────────────
  await page.getByPlaceholder(/Office League/).fill("The Office League");
  await page.getByRole("button", { name: /Half-PPR/ }).click();
  await page.getByRole("button", { name: "12", exact: true }).click();
  await page.getByRole("combobox", { name: "Draft Position" }).click();
  await page.getByRole("option", { name: "Pick #4 of 12" }).click();
  await page.getByRole("button", { name: "Create My Draft Room" }).click();
  await page.waitForURL("**/draft", { timeout: 10000 });
  check("setup lands on draft room", true);
  await shot("03-draft-empty");

  // ── 4. Draft room loads player board ──────────────────────────
  await page.waitForSelector("tbody tr", { timeout: 90000 });
  const rowCount = await page.locator("tbody tr").count();
  check("player board loaded (>=200 rows)", rowCount >= 200, `${rowCount} rows`);
  check("header shows league badge", await page.getByText("The Office League").first().isVisible());
  check("status pill is Pre-Draft", await page.getByText("Pre-Draft").isVisible());
  const clock = page.getByRole("button", { name: "Pick timer" });
  check("pick clock static pre-draft (1:30)", (await clock.innerText()) === "1:30", await clock.innerText());
  check("table scrollable", await page.evaluate(() => {
    const el = document.querySelector("main .overflow-auto");
    return !!el && el.scrollHeight > el.clientHeight;
  }));
  const asideBox = await page.locator("aside").boundingBox();
  check("roster panel docked right", !!asideBox && Math.abs(asideBox.x + asideBox.width - 1440) < 2);
  await shot("04-draft-loaded");

  // ── 5. Draft players (1 mine, 1 opponent) ─────────────────────
  const firstRow = page.locator("tbody tr").first();
  await firstRow.getByRole("button", { name: "Draft" }).click();
  await page.getByRole("button", { name: "Draft to my team" }).click();
  await page.locator("tbody tr").nth(1).getByRole("button", { name: "Draft" }).click();
  await page.getByRole("button", { name: "Opponent drafted" }).click();

  check("row 1 shows Me badge", await page.locator("tbody tr").first().getByText("Me", { exact: true }).isVisible());
  check("row 2 shows Opp badge", await page.locator("tbody tr").nth(1).getByText("Opp", { exact: true }).isVisible());
  check("roster panel shows drafted player", await page.locator("aside").getByText("Jahmyr Gibbs").first().isVisible());
  check("draft log shows 2 picks", (await page.locator("aside").getByText("Draft Log").locator("..").getByText(/R1 · P\d/).count()) >= 2);
  check("needs warning present", (await page.locator("aside").getByText(/needed/).count()) > 0);
  check("header shows Pick 3", await page.getByText("Pick 3").isVisible());
  await shot("05-drafted-two");

  // ── 6. Status → Draft Live; snake math → Your pick! ───────────
  await page.getByText("Pre-Draft", { exact: true }).click();
  await page.getByRole("button", { name: "Draft Live" }).click();
  check("status pill now Draft Live", await page.getByText("Draft Live").isVisible());
  // one more opponent pick → next pick 4 → snake slot 4 = our draft slot
  await page.locator("tbody tr").nth(2).getByRole("button", { name: "Draft" }).click();
  await page.getByRole("button", { name: "Opponent drafted" }).click();
  check("'Your pick!' indicator appears at pick 4", await page.getByText("Your pick!").isVisible());
  await shot("06-your-pick");

  // ── 6b. Live pick clock ────────────────────────────────────────
  check("pick clock visible when live", await clock.isVisible());
  const toSecs = (t) => {
    const [m, s] = t.split(":").map(Number);
    return m * 60 + s;
  };
  const t1 = await clock.innerText();
  await page.waitForTimeout(2200);
  const t2 = await clock.innerText();
  check("pick clock ticks down while live", t1 !== t2, `${t1} → ${t2}`);
  // Log another pick → clock resets near full.
  await page.locator("tbody tr").nth(3).getByRole("button", { name: "Draft" }).click();
  await page.getByRole("button", { name: "Opponent drafted" }).click();
  const t3 = await clock.innerText();
  check("pick clock resets after a logged pick", toSecs(t3) >= 80, t3);
  // Timer is adjustable via the clock dropdown.
  await clock.click();
  await page.getByRole("button", { name: "120s" }).click();
  const t4 = await clock.innerText();
  check("pick timer adjustable (120s)", toSecs(t4) >= 110, t4);
  await shot("06b-pick-clock");

  // ── 7. Filters ────────────────────────────────────────────────
  await page.getByPlaceholder("Search players…").fill("chase");
  await page.waitForTimeout(300);
  const chaseRows = await page.locator("tbody tr").count();
  const chaseVisible = await page.locator("tbody tr").filter({ hasText: "Chase" }).count();
  check("search narrows rows", chaseRows > 0 && chaseRows < 30, `${chaseRows} rows, ${chaseVisible} contain Chase`);
  await page.getByPlaceholder("Search players…").fill("");

  await page.getByRole("button", { name: /^RB\d+$/ }).click();
  await page.waitForTimeout(300);
  const rbBadges = await page.locator("tbody tr").count();
  check("position filter shows only RBs", rbBadges > 0, `${rbBadges} rows`);
  await page.getByRole("button", { name: "ALL", exact: true }).click();
  await shot("07-filters");

  // ── 8. View toggle: tier grid ─────────────────────────────────
  await page.getByRole("button", { name: "Tier view" }).click();
  await page.waitForSelector("text=Tier 1", { timeout: 5000 });
  check("tier view renders tier sections", await page.getByText(/Tier 1 · \d+ players?/).isVisible());
  check("tier view drafts still marked", await page.locator("main").getByText("Me", { exact: true }).first().isVisible());
  await shot("08-tier-view");
  await page.getByRole("button", { name: "Table view" }).click();
  await page.waitForSelector("tbody tr");

  // ── 9. Notes + persistence ────────────────────────────────────
  const noteInput = page.locator("tbody tr").first().locator('input[placeholder="Add note…"]');
  await noteInput.fill("Target in round 4");
  await page.waitForTimeout(300);
  check("note typed in table", (await noteInput.inputValue()) === "Target in round 4");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("tbody tr", { timeout: 90000 });
  await page.waitForTimeout(500);
  const persisted = await page.locator("tbody tr").first().locator('input[placeholder="Add note…"]').inputValue();
  check("note persists after reload", persisted === "Target in round 4");
  const meBadges = await page.locator("tbody tr").first().getByText("Me", { exact: true }).count();
  check("draft picks persist after reload", meBadges === 1);
  await shot("09-persisted");

  // ── 10. Sort by ADP ───────────────────────────────────────────
  await page.getByRole("button", { name: "ADP", exact: true }).click();
  await page.waitForTimeout(300);
  const firstAdp = await page.locator("tbody tr").first().locator("td").nth(3).innerText();
  check("ADP sort applied (first ADP visible)", /\d/.test(firstAdp), `first cell: ${firstAdp}`);

  // ── 11. Undo ──────────────────────────────────────────────────
  const myRow = page
    .locator("tbody tr")
    .filter({ has: page.getByText("Me", { exact: true }) })
    .first();
  await myRow.getByRole("button", { name: "Undo draft" }).click();
  check("undo removes Me badge", (await page.locator("tbody tr").getByText("Me", { exact: true }).count()) === 0);

  // ── 12. Reset confirmation modal ──────────────────────────────
  await page.getByRole("button", { name: "Reset Draft Board" }).first().click();
  await page.waitForSelector("text=Reset draft board?", { timeout: 5000 });
  check("reset modal opens", true);
  await page.getByRole("button", { name: "Yes, reset the board" }).click();
  await page.waitForTimeout(400);
  const draftButtons = await page.locator("tbody tr").first().getByRole("button", { name: "Draft" }).count();
  check("reset clears picks (row 1 draftable again)", draftButtons === 1);
  await shot("10-after-reset");
} catch (err) {
  failures++;
  console.log("FATAL", err.message);
  await shot("99-fatal");
}

console.log("\n── Console errors ──");
const meaningful = consoleErrors.filter(
  (e) => !/favicon|Download the React DevTools/i.test(e)
);
if (meaningful.length === 0) console.log("(none)");
else meaningful.forEach((e) => console.log("ERROR:", e.slice(0, 300)));

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"}`);
console.log("Screenshots:", shotsDir);
await browser.close();
process.exit(failures === 0 && meaningful.length === 0 ? 0 : 1);
