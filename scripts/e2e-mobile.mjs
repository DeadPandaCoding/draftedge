/**
 * Mobile/tablet pass: verifies the draft room is usable at phone width —
 * no horizontal overflow, control panel strip, roster drawer, tier view.
 * Usage: node scripts/e2e-mobile.mjs  (requires server + `npm i --no-save playwright-core`)
 */
import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

let failures = 0;
function check(name, cond, extra = "") {
  const pass = !!cond;
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? "  [" + extra + "]" : ""}`);
}

try {
  // Landing on mobile
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  // First visit — dismiss the cookie consent banner so it can't intercept clicks.
  const consentRegion = page.getByRole("region", { name: "Cookie consent" });
  if (await consentRegion.isVisible().catch(() => false)) {
    await consentRegion.getByRole("button", { name: "Reject optional" }).click();
    await consentRegion.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }
  check("landing hero visible on mobile", await page.getByRole("heading", { level: 1, name: /Master Your Fantasy Draft/ }).isVisible());
  check("landing no horizontal overflow (mobile)", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  // Sign up
  await page.getByRole("link", { name: "Get Started Free" }).first().click();
  await page.waitForURL("**/signin**");
  await page.getByPlaceholder("Your name").fill("Mob Walker");
  await page.getByPlaceholder("you@example.com").fill(`mob${Date.now()}@test.com`);
  await page.getByPlaceholder("At least 6 characters").fill("draftday123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/home");

  // Home setup card (PPR is the default scoring — no click needed)
  await page.getByPlaceholder(/Office League/).fill("Mobile League");
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("combobox", { name: "Draft Position" }).click();
  await page.getByRole("option", { name: "Pick #3 of 10" }).click();
  await page.getByRole("button", { name: "Create My Draft Room" }).click();
  await page.waitForURL("**/draft");
  await page.waitForSelector("tbody tr", { timeout: 90000 });

  check("draft room loads on mobile", (await page.locator("tbody tr").count()) > 100);
  check("draft room no horizontal overflow (mobile)", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  check("mobile roster button visible", await page.getByRole("button", { name: "Roster", exact: true }).isVisible());
  check("search input visible (control strip)", await page.getByPlaceholder("Search players…").isVisible());
  check("position pills horizontally scrollable", await page.evaluate(() => {
    const pills = [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("ALL"));
    return !!pills && pills.parentElement.scrollWidth > pills.parentElement.clientWidth;
  }));

  // Draft one player
  await page.locator("tbody tr").first().getByRole("button", { name: "Draft" }).click();
  await page.getByRole("button", { name: "Draft to my team" }).click();
  check("drafted on mobile", await page.locator("tbody tr").first().getByText("Me", { exact: true }).isVisible());

  // Live pick clock on mobile
  await page.getByText("Pre-Draft", { exact: true }).click();
  await page.getByRole("button", { name: "Draft Live" }).click();
  check("pick clock visible on mobile", await page.getByRole("button", { name: "Pick timer" }).isVisible());
  check("no horizontal overflow with clock (mobile)", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

  // Roster drawer (scope to the drawer — the desktop aside header is hidden on mobile)
  const drawer = page.locator("div.fixed.inset-0.z-40");
  await page.getByRole("button", { name: "Roster", exact: true }).click();
  await drawer.waitFor({ state: "visible", timeout: 5000 });
  check("roster drawer opens", await drawer.isVisible());
  check("drawer shows drafted player", await drawer.getByText("Ja'Marr Chase").first().isVisible());
  check("drawer shows needs warning", (await drawer.locator("text=/needed/").count()) > 0);
  await drawer.locator('div.absolute.right-0').locator('button[aria-label="Close roster"]').click();
  await page.waitForTimeout(300);
  check("drawer closes", !(await drawer.isVisible()));

  // Tier view on mobile
  await page.getByRole("button", { name: "Tier view" }).click();
  await page.waitForSelector("text=Tier 1");
  check("tier view works on mobile", await page.getByText(/Tier 1 · \d+ players?/).isVisible());
} catch (err) {
  failures++;
  console.log("FATAL", err.message);
}

const meaningful = consoleErrors.filter((e) => !/favicon|React DevTools/i.test(e));
console.log("\n── Console errors ──");
if (meaningful.length === 0) console.log("(none)");
else meaningful.forEach((e) => console.log("ERROR:", e.slice(0, 300)));

console.log(`\n${failures === 0 && meaningful.length === 0 ? "MOBILE CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"}`);
await browser.close();
process.exit(failures === 0 && meaningful.length === 0 ? 0 : 1);
