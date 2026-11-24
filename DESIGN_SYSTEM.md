# DraftEdge Design System

## 0. Permanent Constraints (Non-Negotiable)

These rules take precedence over every other section in this document.

### Surfaces

- Canvas: `#09090B`.
- Elevated panel: `#111113`.
- Border: `#27272A`, always 1px and crisp.
- Matte, solid fills only.
- Never use violet or neon gradients, glassmorphism, backdrop blur, blurred corner orbs, ambient radial glows, or uniform card shadows.
- Do not use shadow to imply elevation. Use a border, surface change, or accent rule.

### Typography

- Display and body sans: Space Grotesk.
- Data and labels: JetBrains Mono.
- Never use Inter or Roboto.
- Tighten tracking as display size increases.
- Apply `tabular-nums` to every numeric readout.

### Color

- Emerald `#10B981`: primary actions and positive edge only.
- Pink `#EC4899`: secondary highlights and small accents only.
- No decorative color. No decorative gradients.
- Position badges are the only data-viz exception.

### Editorial

- No fake social proof, invented counts, or unverified claims.
- No emojis.
- No em dash filler copy. Use a period, comma, colon, or rewrite the sentence.
- No identical three-column icon grids. Use asymmetric splits, index cards, or staggered timelines.

## 1. Visual Direction

High-contrast, broadcast-inspired sports analytics UI. Use crisp 1px alpha borders, stepped dark surfaces, and tabular numeric precision.

**Avoid:** Full-screen warping grids, drifting aurora blobs, film-grain overlays, outer neon button glows, and generic B2B SaaS navigation (`Features / Product / Company`).

## 2. Color Tokens

Defined in `app/globals.css`. Preserve the existing Tailwind v4 `emerald-*` and `zinc-*` remaps.

### Surfaces and borders

- **Base canvas:** `#09090B`
- **Elevated panel:** `#111113`
- **Resting hairline:** `#27272A`
- **Active / focus:** `rgb(16 185 129 / 0.45)`
- **Elevation:** Flat canvas, 1px bordered panel, or active/sticky note. No shadow-based level.

### Accents and text

- **Primary CTA:** `#10B981` (`emerald-500`), hover `#34D399` (`emerald-400`), active `#059669` (`emerald-600`), dark text `#022C22`
- **Secondary accent:** `#EC4899`
- **Primary text:** `#FFFFFF`
- **Secondary text:** `#E2F3EA` (`zinc-100`)
- **Muted text:** `#9DD5BD` (`zinc-400`)

### Position data-viz

- **WR:** Sky (`bg-sky-500/15 text-sky-400 ring-sky-500/30`)
- **RB:** Emerald (`bg-emerald-500/15 text-emerald-400 ring-emerald-500/30`)
- **TE:** Amber (`bg-amber-500/15 text-amber-400 ring-amber-500/30`)
- **QB:** Rose (`bg-rose-500/15 text-rose-400 ring-rose-500/30`)

### Pop / signal accent: Electric Pink (`#EC4899`)

- **Tokens:** `--color-pop` (`bg-pop`, `text-pop`), `--color-pop-soft` (`bg-pop-soft`), and `--color-pop-border` (`border-pop-border`).
- **Usage cap:** Keep pink to small, high-signal moments. Never use it for primary buttons, large backgrounds, or body text.
- **Use for:** Urgent on-the-clock countdowns (15 seconds or less), positional-run alerts, value-steal badges, trade-winner labels, and small live indicators or chart focal points.

## 3. Typography

- **Display (`font-display`):** Space Grotesk, weights 600, 700, and 800; use tight tracking.
- **Body (`font-sans`):** Space Grotesk, weights 400, 500, and 600.
- **Data (`font-mono`):** JetBrains Mono. Use `tabular-nums` for ADP, projections, tiers, trade values, and countdowns.
- **Never use:** Inter or Roboto.

## 4. Micro-craft and layout

- **Concentric corners:** Inner radius equals outer radius minus padding; for example, a 16px card with 8px padding wraps an 8px inner radius.
- **Viewport height:** Prefer `min-h-dvh` for full-height shells and mobile overlays to account for browser toolbars.
- **Icon strokes:** Match adjacent text weight: 1.5 beside regular body text and 2 beside semibold labels or buttons.
- **Gradients:** Functional data-viz only. If a multi-stop gradient is unavoidable, include `in oklch` to avoid muddy midpoints.
- **Edge fades:** Use CSS masks on horizontal scrolling tables and carousels rather than hard clipping.

## 5. Component conventions

- **Buttons:** Flat, high-contrast rectangles (`rounded-lg` or `rounded-xl`) with semibold text. No outer colored shadows.
- **No glow:** Do not use `BorderGlow` or any pointer/glow effect on cards, buttons, or hero frames.
- **Spotlight stages:** Use an outer stage canvas of `#0E0E11`, inner stage cards of `#141418`, 1px `#27272A` borders, and one emerald or pink accent frame. No shadows.
- **Navigation:** Link directly to Rankings, Trade Analyzer, and Mock Drafts, with one Tools menu. Avoid generic Features, Product, and Company navigation.
- **Motion:** Keep effects subtle and respect `prefers-reduced-motion`.
