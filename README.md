# ⚡ DraftEdge

A 100% free, open-source fantasy football draft assistant and cheat sheet. Master your fantasy draft with automated tiers, live pick tracking, and custom cheat sheets powered by open data.

> Built from the product blueprint in [`DRAFTEDGE_BLUEPRINT.md`](./DRAFTEDGE_BLUEPRINT.md).

## Stack ($0)

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Hosting:** Vercel free tier (deploy via `vercel` CLI or the Vercel dashboard)
- **Auth:** [Supabase](https://supabase.com) Auth (email/password + Google OAuth). Falls back to a local demo auth in `localStorage` when Supabase env vars are absent, so the app still runs with zero setup.
- **Data:** Live public [Sleeper API](https://docs.sleeper.com/) player metadata (names, teams, positions) fetched server-side via `/api/players` with hourly caching, merged with bundled baseline 2026 projections/ADP/byes (`lib/seed-data.ts`). Falls back to the seed dataset entirely when the API is unreachable.
- **Persistence:** League configs and draft states (picks, notes, pick counter) sync to Supabase Postgres tables (`leagues`, `draft_states`) with Row Level Security — available on any device. Falls back to `localStorage` in demo mode.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Get Started Free** → sign up (or click “Continue with Google”) → configure your league → draft.

## Scripts

| Command        | Description                  |
| -------------- | ---------------------------- |
| `npm run dev`  | Dev server                   |
| `npm run build`| Production build             |
| `npm run lint` | ESLint                       |

## UI/UX skills (`.agents/skills/`)

Seven design-intelligence skills from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) are installed:

- **ui-ux-pro-max** — UI/UX design intelligence: 79 styles, 192 product palettes, 74 font pairings, 119 UX guidelines, 105 icons, GSAP presets, chart types, and 22 stacks (searchable CSV data)
- **ui-styling** — shadcn/ui + Tailwind styling, accessible components, dark mode, design tokens
- **design** — brand identity, logos (55 styles), icons, social photos, HTML presentations
- **design-system** — token architecture, component specs, slide generation
- **slides** — strategic HTML presentations with Chart.js
- **banner-design** — social/ads/web/print banners (22 styles)
- **brand** — brand voice, visual identity, style guides

Plus the [21st.dev](https://21st.dev) skill pack (from `npx @21st-dev/cli install-skill`, mirrored into `.agents/skills/` from the global agent install):

- **21st-ui-build** — build project-aware production UI grounded in `.21st/design.json` context (search/generate/review via the `21st` CLI)
- **21st-ui-review** — audit existing UI (a11y, responsive, interaction, consistency)
- **21st-ui-explore** — compare multiple UI directions before committing
- **21st-ai / 21st-cli-use / 21st-registry / 21st-design-sync** — supporting skills (registry access, CLI use, design sync)

The project's design context lives in `.21st/design.json` + `.21st/DESIGN.md` (dark navy + periwinkle accent, dense dashboard) — regenerate with `npx @21st-dev/cli init --design-context`.

### Using the skill data without Python

The ui-ux-pro-max skill's search tool ships as a Python script, and Python isn't installed here — so a Node port of the same search engine lives at `scripts/ux-search.mjs` (same CSV data, same domain detection, same output contract):

```bash
# Targeted concern (one dominant intent, 2–5 terms, explicit domain)
node scripts/ux-search.mjs "keyboard focus modal" --domain ux
node scripts/ux-search.mjs "glassmorphism dark" --domain style
node scripts/ux-search.mjs "saas" --domain color

# Stack-specific implementation guidance
node scripts/ux-search.mjs "dialog focus trap" --stack shadcn

# New page/project: generate a design system (dials 1-10 optional)
node scripts/ux-search.mjs "fantasy football dashboard dark" --design-system -p "DraftEdge" --variance 7 --density 8

# Persist it for reuse across sessions (writes design-system/<slug>/MASTER.md)
node scripts/ux-search.mjs "<query>" --design-system -p "Project" --persist

# JSON for scripting; auto-detects domain if --domain is omitted
node scripts/ux-search.mjs "dark dashboard" --json
```

Domains: `style, color, chart, landing, product, ux, typography, google-fonts, icons, gsap, react, web`. Stacks: `react, nextjs, vue, svelte, astro, nuxtjs, nuxt-ui, angular, laravel, html-tailwind, shadcn, threejs`, etc. The full rule text also lives in `.agents/skills/ui-ux-pro-max/references/quick-reference.md` and `pro-rules.md`. A zero-result query is reported honestly (no fabricated matches).

## Supabase setup (optional but recommended)

Without any configuration the app runs in local demo mode. To enable real auth and cloud sync:

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Run [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql) in the project's SQL editor (creates `leagues` + `draft_states` with RLS).
3. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
4. **Google OAuth:** Dashboard → Authentication → Providers → Google → enable and add your OAuth Client ID/Secret (create the client in Google Cloud Console with callback URL `https://<your-project-ref>.supabase.co/auth/v1/callback`).
5. **Redirect URLs:** Authentication → URL Configuration → add your app URL, e.g. `http://localhost:3000/auth/callback`.
6. Optional: Authentication → Sign In / Up → turn off "Confirm email" for instant signup, or leave it on — signups then prompt users to confirm by email first.

Restart `npm run dev` and the sign-in page switches to real Supabase auth (the Google button says "Continue with Google" instead of "(demo)").

## End-to-end smoke tests

Drives a real Chrome through the full flow (signup → onboarding → draft room → drafting → filters/notes/persistence) and asserts key behavior:

```bash
npm i --no-save playwright-core   # uses your system Chrome, no browser download
node scripts/e2e-walkthrough.mjs  # desktop (1440px) pass
node scripts/e2e-mobile.mjs       # mobile (390px) pass
```

Both scripts exit non-zero on any failed check or console error, and dump screenshots into the OS temp dir (`draftedge-shots`).

## Features

- **Landing page** — hero, tier-based value props, 3-step walkthrough, GitHub badge
- **Onboarding wizard** — league name, PPR/Half-PPR/Standard, league size, snake draft slot, roster template with live round/pick math
- **Draft room** — sortable cheat sheet table with tier badges, rank/ADP, projections, bye weeks, and per-player notes
- **Tier view** — color-coded card grid grouped by automated tiers
- **Live draft engine** — one-click draft logging (my team vs. opponent), strikethrough + gray-out, automatic roster slot assignment, positional needs warnings, best-available list, and a live draft log
- **Live pick clock** — countdown in the header that ticks while the draft is live, resets on each logged pick, turns red + pulses at 0:00, and is adjustable (30/60/90/120s)
- **Quick actions** — reset draft board, export roster to CSV

## Data notes

- Sleeper's free tier currently returns no ADP or projections (and the old ADP endpoint is retired), so ADP/projection/tier values come from the bundled baseline dataset; live API data refreshes player names, teams, and positions daily-ish (hourly cache).
- Bye weeks are 2026-season estimates and live in `BYE_WEEKS` in `lib/seed-data.ts` — update when the real schedule drops.

## Project structure

```
app/
  page.tsx            Landing page
  signin/page.tsx     Auth (sign in / sign up / Google demo)
  onboarding/page.tsx League setup wizard
  draft/page.tsx      Draft room
  api/players/route.ts Sleeper data proxy + merge + tiers
components/
  landing/            Landing sections + draft board mockup
  draft/              Header, control panel, table, tier grid, roster panel
  ui.tsx              Badges, modal, dropdown primitives
lib/
  types.ts            Shared domain types
  auth.tsx            Auth provider (Supabase primary, demo fallback)
  data.ts             Persistence layer (Supabase Postgres, localStorage fallback)
  supabase/           Browser + server Supabase clients
  league.ts           League constants + snake-draft math
  draft.ts            Draft engine (state, roster slots, needs)
  players.ts          Client data hook with cache + fallback
  seed-data.ts        Bundled baseline projections/ADP/byes
  tiers.ts            Tier computation + style maps
  csv.ts              Roster CSV export
app/
  auth/callback/      Google OAuth callback (exchanges code for session)
supabase/migrations/  SQL schema (leagues, draft_states, RLS)
```
