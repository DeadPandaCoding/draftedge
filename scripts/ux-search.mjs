#!/usr/bin/env node
/**
 * UX Search — Node port of the ui-ux-pro-max skill's search.py.
 *
 * Python isn't available on this machine, so this script queries the skill's
 * CSV data directly with the same domain logic, scoring, and output contract.
 *
 * Usage:
 *   node scripts/ux-search.mjs "<query>" [--domain <domain>] [-n <1-20>] [--json]
 *   node scripts/ux-search.mjs "<query>" --stack <stack>
 *   node scripts/ux-search.mjs "<query>" --design-system -p "Project Name"
 *       [--variance 1-10] [--motion 1-10] [--density 1-10] [--persist] [--force]
 *
 * Domains: style, color, chart, landing, product, ux, typography, google-fonts,
 *          icons, gsap, react, web
 * Stacks:  react, nextjs, vue, svelte, astro, nuxtjs, nuxt-ui, angular, laravel,
 *          html-tailwind, shadcn, threejs, swiftui, react-native, flutter, ...
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".agents", "skills", "ui-ux-pro-max", "data");
const TRUNCATE_AT = 300;

const CSV_CONFIG = {
  style: {
    file: "styles.csv",
    search_cols: ["Style ID", "Style Category", "Aliases", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
  },
  color: { file: "colors.csv", search_cols: ["Product Type", "Notes"] },
  chart: { file: "charts.csv", search_cols: ["Data Type", "Keywords", "Best Chart Type", "When to Use", "When NOT to Use", "Accessibility Notes"] },
  landing: { file: "landing.csv", search_cols: ["Pattern ID", "Pattern Name", "Aliases", "Keywords", "Conversion Optimization", "Section Order"] },
  product: { file: "products.csv", search_cols: ["Product Type", "Keywords", "Primary Style Recommendation", "Key Considerations"] },
  ux: { file: "ux-guidelines.csv", search_cols: ["Category", "Issue", "Description", "Platform"] },
  typography: { file: "typography.csv", search_cols: ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For", "Heading Font", "Body Font"] },
  icons: { file: "icons.csv", search_cols: ["Category", "Icon Name", "Keywords", "Best For", "Library"] },
  gsap: { file: "motion.csv", search_cols: ["Category", "Intensity Tier", "Keywords", "Trigger"] },
  react: { file: "react-performance.csv", search_cols: ["Category", "Issue", "Keywords", "Description"] },
  web: { file: "app-interface.csv", search_cols: ["Category", "Issue", "Keywords", "Description"] },
  "google-fonts": { file: "google-fonts.csv", search_cols: ["Family", "Category", "Stroke", "Classifications", "Keywords", "Subsets", "Designers"] },
};

const UNTRUNCATED_COLS = new Set([
  "Code Example Good", "Code Example Bad", "Code Good", "Code Bad",
  "Implementation Checklist", "Design System Variables", "CSS Import",
  "Tailwind Config", "GSAP Snippet",
]);

// Domain auto-detection vocabulary (mirrors core.py `_domain_keywords`).
const DOMAIN_TIEBREAK_ORDER = ["ux", "product", "style", "color", "typography", "google-fonts", "chart", "landing", "icons", "gsap", "react", "web"];
const DOMAIN_KEYWORDS = {
  color: ["color", "palette", "hex", "rgb", "token", "semantic", "accent", "destructive", "muted", "foreground"],
  chart: ["time series", "chart", "graph", "visualization", "trend", "bar chart", "pie", "scatter", "heatmap", "funnel", "forecast"],
  landing: ["landing", "page", "cta", "conversion", "hero", "testimonial", "pricing", "section"],
  product: null, // loaded from products.csv at runtime
  style: ["style", "design", "ui", "minimalism", "glassmorphism", "neumorphism", "brutalism", "dark mode", "flat", "aurora", "css", "implementation", "variable", "checklist", "tailwind"],
  ux: ["ux", "usability", "accessibility", "wcag", "touch", "scroll", "animation", "keyboard", "navigation", "mobile"],
  typography: ["font pairing", "typography pairing", "heading font", "body font"],
  "google-fonts": ["google font", "font family", "font weight", "font style", "variable font", "noto", "font for", "find font", "font subset", "font language", "monospace font", "serif font", "sans serif font", "display font", "handwriting font", "font", "typography", "serif", "sans"],
  icons: ["icon", "icons", "lucide", "phosphor", "heroicons", "symbol", "glyph", "pictogram", "svg icon"],
  gsap: ["gsap", "quickto", "scrolltrigger", "stagger", "magnetic cursor", "parallax", "page transition", "scroll reveal", "scroll-triggered", "scrollytelling", "flip plugin", "splittext", "shimmer", "skeleton loader"],
  react: ["react", "next.js", "nextjs", "suspense", "memo", "usecallback", "useeffect", "rerender", "bundle", "waterfall", "barrel", "dynamic import", "rsc", "server component"],
  web: ["aria", "focus", "outline", "semantic", "virtualize", "autocomplete", "form", "input type", "preconnect", "drag reorder", "single pointer", "touch target", "native accessibility"],
};

// ── CSV parsing (handles quoted fields with embedded commas/quotes) ────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function loadCSV(file) {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) throw new Error(`Data file not found: ${path}`);
  const [header, ...body] = parseCSV(readFileSync(path, "utf8"));
  return body.map((cells) => {
    const obj = {};
    header.forEach((h, i) => (obj[h.trim()] = (cells[i] ?? "").trim()));
    return obj;
  });
}

function loadProductKeywords() {
  const seeds = ["saas", "software", "dashboard", "analytics", "ecommerce", "store", "portfolio", "entertainment", "social", "productivity", "tool", "fintech", "health", "fitness", "news", "blog", "education", "learning", "travel", "food", "real estate", "marketing", "agency", "gaming", "music", "streaming"];
  try {
    for (const row of loadCSV("products.csv")) {
      if (row["Product Type"]) seeds.push(row["Product Type"]);
      if (row["Keywords"]) seeds.push(...row["Keywords"].split("|").map((k) => k.trim()));
    }
  } catch { /* fall back to seeds */ }
  return [...new Set(seeds)];
}

function domainKeywords() {
  const kw = { ...DOMAIN_KEYWORDS };
  if (!kw.product) kw.product = loadProductKeywords();
  return kw;
}

function norm(s) { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

function containsPhrase(text, phrase) {
  return new RegExp(`(?<!\\w)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\w)`).test(text);
}

function detectDomain(query) {
  const q = norm(query);
  const keywords = domainKeywords();
  const scores = {};
  for (const [domain, kws] of Object.entries(keywords)) {
    let total = 0;
    for (const kw of kws) {
      if (containsPhrase(q, kw)) {
        const specificity = Math.max(1, kw.split(" ").length);
        total += (domain === "product" ? 1 : 2) * specificity;
      }
    }
    scores[domain] = total;
  }
  if (/#[0-9a-f]{3,8}\b/i.test(q)) scores.color = (scores.color ?? 0) + 2;
  const ranked = Object.entries(scores).sort((a, b) =>
    b[1] - a[1] || DOMAIN_TIEBREAK_ORDER.indexOf(a[0]) - DOMAIN_TIEBREAK_ORDER.indexOf(b[0]));
  const [best, score] = ranked[0];
  return score > 0 ? best : "style";
}

function tokenize(query) {
  const words = (query.toLowerCase().match(/[a-z0-9#]+/g) ?? []).filter((w) => w.length >= 2);
  const terms = [...new Set(words)];
  const phrases = [...new Set(words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`))];
  return { terms, phrases };
}

function scoreRows(rows, config, query) {
  const { terms, phrases } = tokenize(query);
  const scored = [];
  for (const row of rows) {
    const text = config.search_cols.map((c) => row[c] ?? "").join(" | ").toLowerCase();
    let score = 0;
    for (const p of phrases) if (containsPhrase(text, p)) score += 2;
    for (const t of terms) if (containsPhrase(text, t)) score += 1;
    if (score > 0) scored.push({ row, score });
  }
  return scored.sort((a, b) => b.score - a.score);
}

function truncate(value, col) {
  const s = String(value);
  if (!UNTRUNCATED_COLS.has(col) && s.length > TRUNCATE_AT) return s.slice(0, TRUNCATE_AT) + "...";
  return s;
}

function formatResult(result) {
  if (result.error) return `Error: ${result.error}`;
  const out = [];
  if (result.stack) {
    out.push("## UI Pro Max Stack Guidelines");
    out.push(`**Stack:** ${result.stack} | **Query:** ${result.query}`);
  } else {
    out.push("## UI Pro Max Search Results");
    out.push(`**Domain:** ${result.domain} | **Query:** ${result.query}`);
  }
  out.push(`**Source:** ${result.file} | **Found:** ${result.count}\n`);
  if (result.count === 0) {
    out.push("No matches. This is not a match with an empty value -- the query did not hit the database. Retry with broader/different keywords before falling back to general defaults, and say explicitly that no database match was found if you do fall back.");
    return out.join("\n");
  }
  result.results.forEach((row, i) => {
    out.push(`### Result ${i + 1}`);
    for (const [key, value] of Object.entries(row)) out.push(`- **${key}:** ${truncate(value, key)}`);
    out.push("");
  });
  return out.join("\n");
}

function search(query, { domain, maxResults = 3, full = false } = {}) {
  const autoDetected = !domain;
  const searchDomain = domain ?? detectDomain(query);
  const config = CSV_CONFIG[searchDomain];
  if (!config) return { error: `unknown domain: ${searchDomain}`, domain: searchDomain };
  let rows;
  try { rows = loadCSV(config.file); } catch (e) { return { error: e.message, domain: searchDomain }; }
  const hits = scoreRows(rows, config, query).slice(0, maxResults);
  const outputCols = Object.keys(rows[0] ?? {});
  const results = hits.map(({ row }) =>
    Object.fromEntries(outputCols.filter((c) => row[c] !== "").map((c) => [c, row[c]])));
  return {
    query, domain: searchDomain, autoDetected, file: config.file,
    count: results.length,
    results: full ? results : results,
  };
}

function searchStack(query, stack, maxResults = 3) {
  const file = `stacks/${stack}.csv`;
  let rows;
  try { rows = loadCSV(file); } catch (e) { return { error: e.message, stack }; }
  const config = { search_cols: Object.keys(rows[0] ?? []) };
  const hits = scoreRows(rows, config, query).slice(0, maxResults);
  return { query, stack, file, count: hits.length, results: hits.map((h) => h.row) };
}

// ── Design system synthesis (aggregates domain searches, mirrors design_system.py intent) ──
function designSystem(query, { projectName, variance, motion, density }) {
  const q = query || (projectName ?? "product");
  const product = search(q, { domain: "product" });
  // --variance biases the style picks: bold/asymmetric at 8-10, centered/minimal at 1-3.
  const styleQuery = variance != null
    ? `${q} ${variance >= 8 ? "bold asymmetric brutalism bento" : variance <= 3 ? "minimal centered clean" : "modern balanced"}`
    : q;
  const style = search(styleQuery, { domain: "style", maxResults: 3 });
  const color = search(q, { domain: "color", maxResults: 2 });
  const typography = search(q, { domain: "typography" });
  const landing = search(q, { domain: "landing" });
  const motionQ = motion != null
    ? (motion >= 8 ? "complex choreography scroll" : motion >= 5 ? "standard scroll stagger" : "subtle micro interaction")
    : "scroll reveal stagger";
  const gsap = search(motionQ, { domain: "gsap" });
  const densityNote = density != null
    ? (density >= 8 ? "Dense/dashboard: 8-32px spacing scale" : density <= 3 ? "Spacious: 24-96px spacing scale" : "Standard: 16-64px spacing scale")
    : "Standard: 16-64px spacing scale";

  return {
    projectName, query: q, densityNote,
    product: product.results[0] ?? null,
    styles: style.results.slice(0, 2),
    color: color.results[0] ?? null,
    typography: typography.results[0] ?? null,
    landing: landing.results[0] ?? null,
    motion: gsap.results[0] ?? null,
  };
}

function renderDesignSystem(ds, format = "ascii") {
  const L = [];
  const title = ds.projectName ? `Design System — ${ds.projectName}` : "Design System";
  if (format === "markdown") {
    L.push(`# ${title}\n`);
    L.push(`**Query:** ${ds.query}`);
    L.push(`**Spacing:** ${ds.densityNote}\n`);
    if (ds.product) L.push(`## Product Direction\n- **Type:** ${ds.product["Product Type"]}\n- **Primary Style:** ${ds.product["Primary Style Recommendation"]}`);
    if (ds.color) {
      L.push(`\n## Color Palette\n- **Primary:** ${ds.color["Primary"]} (on: ${ds.color["On Primary"]})\n- **Secondary:** ${ds.color["Secondary"]} (on: ${ds.color["On Secondary"]})\n- **Accent:** ${ds.color["Accent"]} (on: ${ds.color["On Accent"]})\n- **Background:** ${ds.color["Background"]} / **Foreground:** ${ds.color["Foreground"]}\n- **Card:** ${ds.color["Card"]} / **Card fg:** ${ds.color["Card Foreground"]}\n- **Muted:** ${ds.color["Muted"]} / **Muted fg:** ${ds.color["Muted Foreground"]}\n- **Border:** ${ds.color["Border"]} | **Destructive:** ${ds.color["Destructive"]}\n- **Notes:** ${ds.color["Notes"] ?? ""}`);
    }
    if (ds.styles.length) {
      L.push(`\n## Style Direction`);
      for (const s of ds.styles) L.push(`- **${s["Style ID"]}** (${s["Style Category"]}): ${s["Keywords"] ?? ""} ${s["Primary Colors"] ? `— Colors: ${s["Primary Colors"]}` : ""}`);
    }
    if (ds.typography) L.push(`\n## Typography\n- **Pairing:** ${ds.typography["Font Pairing Name"]}\n- **Heading:** ${ds.typography["Heading Font"]} | **Body:** ${ds.typography["Body Font"]}`);
    if (ds.landing) L.push(`\n## Landing Pattern\n- **${ds.landing["Pattern Name"]}**: ${ds.landing["Conversion Optimization"] ?? ""}`);
    if (ds.motion) L.push(`\n## Motion\n- **${ds.motion["Intensity Tier"]}** (${ds.motion["Trigger"]}): ${(ds.motion["GSAP Snippet"] ?? "").slice(0, 300)}`);
    return L.join("\n");
  }
  L.push(`== ${title} ==`);
  L.push(`query: ${ds.query} | spacing: ${ds.densityNote}`);
  if (ds.product) L.push(`product: ${ds.product["Product Type"]} → ${ds.product["Primary Style Recommendation"]}`);
  if (ds.color) L.push(`colors: ${ds.color["Primary"]} / ${ds.color["Secondary"]} / ${ds.color["Accent"]} on ${ds.color["Background"]} (card ${ds.color["Card"]})`);
  if (ds.styles.length) L.push(`styles: ${ds.styles.map((s) => s["Style ID"]).join(" + ")}`);
  if (ds.typography) L.push(`type: ${ds.typography["Heading Font"]} / ${ds.typography["Body Font"]}`);
  if (ds.landing) L.push(`landing: ${ds.landing["Pattern Name"]}`);
  if (ds.motion) L.push(`motion: ${ds.motion["Intensity Tier"]} (${ds.motion["Trigger"]})`);
  return L.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}
function has(name) { return args.includes(name); }

const query = args.find((a) => !a.startsWith("-")) ?? "";
const domain = flag("--domain") ?? flag("-d");
const stack = flag("--stack") ?? flag("-s");
const maxResults = parseInt(flag("--max-results") ?? flag("-n") ?? "3", 10);
const json = has("--json");
const full = has("--full");
const designSystemMode = has("--design-system") || has("-ds");
const projectName = flag("--project-name") ?? flag("-p");
const variance = flag("--variance") ? parseInt(flag("--variance"), 10) : undefined;
const motion = flag("--motion") ? parseInt(flag("--motion"), 10) : undefined;
const density = flag("--density") ? parseInt(flag("--density"), 10) : undefined;
const persist = has("--persist");
const force = has("--force");

try {
  if (designSystemMode) {
    const ds = designSystem(query, { projectName, variance, motion, density });
    const format = flag("--format") ?? "ascii";
    if (json) {
      console.log(JSON.stringify(ds, null, 2));
    } else {
      console.log(renderDesignSystem(ds, format));
    }
    if (persist) {
      const slug = (projectName ?? "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const dir = join(process.cwd(), "design-system", slug);
      const file = join(dir, "MASTER.md");
      if (existsSync(file) && !force) {
        console.log(`\n[persist] ${file} already exists — skipping (use --force to overwrite, after reviewing it)`);
      } else {
        mkdirSync(dir, { recursive: true });
        writeFileSync(file, renderDesignSystem(ds, "markdown") + "\n");
        console.log(`\n[persist] wrote ${file}`);
      }
    }
  } else if (stack) {
    const result = searchStack(query, stack, maxResults);
    console.log(json ? JSON.stringify(result, null, 2) : formatResult(result));
  } else {
    const result = search(query, { domain, maxResults, full });
    console.log(json ? JSON.stringify(result, null, 2) : formatResult(result));
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
