# DraftEdge Design Context

This file summarizes the current product design for design tools. The authoritative tokens and component rules live in `DESIGN_SYSTEM.md` and `app/globals.css`.

## Product

DraftEdge is a fantasy football analytics and draft-assistance app built with Next.js, React, and Tailwind CSS v4.

## Visual Direction

Use a high-contrast, broadcast-inspired sports analytics aesthetic with crisp borders, dense tables, and clear hierarchy.

### Colors

- Canvas: `#080E0C`
- Card surface: `#0D1412`
- Elevated surface: `#131D1A`
- Resting border: `rgb(255 255 255 / 0.08)`
- Primary accent: `#10B981`; hover: `#34D399`
- Signal accent: `#FF3E9D`, reserved for small urgent or high-signal callouts
- Primary text: `#FFFFFF`; muted text: `#9DD5BD`

Preserve the Tailwind v4 `emerald-*` and `zinc-*` remaps in `app/globals.css`.

### Typography and data

- Display: Plus Jakarta Sans, weights 600–800
- Body: Geist
- Data: Geist Mono with `tabular-nums`
- Use tabular numbers for projections, ADP, rankings, values, and timers.

### Component rules

- Prefer flat buttons, solid stepped surfaces, and 1px borders.
- Keep pointer-reactive glow limited to showcase frames and modals.
- Keep pink rare; never use it for large surfaces or primary actions.
- Avoid aurora blobs, full-screen interactive grids, film grain, neon glows, and generic SaaS navigation.
- Provide accessible control names and keyboard support; respect reduced-motion preferences.
- Refer to `DESIGN_SYSTEM.md` for detailed component conventions.
