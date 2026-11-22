# DraftEdge Design System

## 1. Visual Direction

High-contrast, broadcast-inspired sports analytics UI. Use crisp 1px alpha borders, stepped dark surfaces, and tabular numeric precision.

**Avoid:** Full-screen warping grids, drifting aurora blobs, film-grain overlays, outer neon button glows, and generic B2B SaaS navigation (`Features / Product / Company`).

## 2. Color Tokens

Defined in `app/globals.css`. Preserve the existing Tailwind v4 `emerald-*` and `zinc-*` remaps.

### Surfaces and borders

- **Base canvas:** `#080E0C`
- **Primary card:** `#0D1412`
- **Elevated / hover / popover:** `#131D1A`
- **Resting hairline:** `rgb(255 255 255 / 0.08)` (`border-white/[0.08]`)
- **Active / focus:** `rgb(52 211 153 / 0.25)`

### Accents and text

- **Primary CTA:** `#10B981` (`emerald-500`), hover `#34D399` (`emerald-400`), dark text `#022C22`
- **Primary text:** `#FFFFFF`
- **Secondary text:** `#E2F3EA` (`zinc-100`)
- **Muted text:** `#9DD5BD` (`zinc-400`)

### Position data-viz

- **WR:** Sky (`bg-sky-500/15 text-sky-400 ring-sky-500/30`)
- **RB:** Emerald (`bg-emerald-500/15 text-emerald-400 ring-emerald-500/30`)
- **TE:** Amber (`bg-amber-500/15 text-amber-400 ring-amber-500/30`)
- **QB:** Rose (`bg-rose-500/15 text-rose-400 ring-rose-500/30`)

### Pop / signal accent (`#FF3E9D` — Electric Pink)

- **Tokens:** `--color-pop` (`bg-pop`, `text-pop`), `--color-pop-soft` (`bg-pop-soft`), and `--color-pop-border` (`border-pop-border`).
- **Usage cap:** Keep pink to small, high-signal moments. Never use it for primary buttons, large backgrounds, or body text.
- **Use for:** Urgent on-the-clock countdowns (15 seconds or less), positional-run alerts, value-steal badges, trade-winner labels, and small live indicators or chart focal points.

## 3. Typography

- **Display (`font-display`):** Plus Jakarta Sans, weights 600, 700, and 800; use tight tracking.
- **Body (`font-sans`):** Geist, weights 400, 500, and 600.
- **Data (`font-mono`):** Geist Mono. Use `tabular-nums` for ADP, projections, tiers, trade values, and countdowns.

## 4. Micro-craft and layout

- **Concentric corners:** Inner radius equals outer radius minus padding; for example, a 16px card with 8px padding wraps an 8px inner radius.
- **Viewport height:** Prefer `min-h-dvh` for full-height shells and mobile overlays to account for browser toolbars.
- **Icon strokes:** Match adjacent text weight: 1.5 beside regular body text and 2 beside semibold labels or buttons.
- **Gradients:** Include `in oklch` on multi-stop gradients to avoid muddy midpoints.
- **Edge fades:** Use CSS masks on horizontal scrolling tables and carousels rather than hard clipping.

## 5. Component conventions

- **Buttons:** Flat, high-contrast rectangles (`rounded-lg` or `rounded-xl`) with semibold text. No outer colored shadows.
- **Pointer glow:** Reserve `BorderGlow` for hero preview frames or modals. Use emerald-only colors (`#10b981`, `#34d399`, `#059669`), `fillOpacity: 0.12`, and no mount sweep.
- **Navigation:** Link directly to Rankings, Trade Analyzer, and Mock Drafts, with one Tools menu. Avoid generic Features, Product, and Company navigation.
- **Motion:** Keep effects subtle and respect `prefers-reduced-motion`.
