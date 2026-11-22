# DraftEdge Design System

## Visual Direction

High-contrast, broadcast-inspired sports analytics UI. Use crisp 1px borders, solid dark surfaces, and tabular numeric precision. Avoid generic SaaS gradients, drifting aurora blobs, film-grain overlays, and full-screen interactive grids.

## Color Tokens

Defined in `app/globals.css`; preserve the existing Tailwind `emerald-*` and `zinc-*` remaps.

- **Canvas:** `#080E0C`
- **Card surface:** `#0D1412`, with a 1px `rgba(255, 255, 255, 0.08)` border
- **Elevated surface:** `#081C15`, with a subtle emerald border
- **Primary accent:** `#10B981` (`emerald-500`); hover `#34D399` (`emerald-400`)
- **Primary text:** `#FFFFFF`
- **Secondary text:** `#E2F3EA` (`zinc-100`)
- **Muted text:** `#9DD5BD` (`zinc-400`)

## Typography

- **Display (`font-display`):** Plus Jakarta Sans, weights 600, 700, and 800
- **Body (`font-sans`):** Geist
- **Data (`font-mono`):** Geist Mono; use `tabular-nums` for ADP, projections, tiers, and trade values

## Component Rules

- **Buttons:** Flat, high-contrast controls with `rounded-lg` or `rounded-xl`; avoid outer neon shadows.
- **Pointer glow:** Reserve `BorderGlow` for showcase frames and modals. Keep it emerald-only with low fill opacity (`0.12`).
- **Navigation:** Link directly to Rankings, Trade Analyzer, and Mock Drafts, with one Tools menu. Avoid generic Features, Product, and Company navigation.
- **Motion:** Keep effects subtle and respect `prefers-reduced-motion`.
