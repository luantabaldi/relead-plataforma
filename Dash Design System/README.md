# Dash Design System

> A crisp, editorial financial-analytics aesthetic.
> Cormorant (serif display) × Google Sans Flex (sans) on a cool-gray canvas with a single deep navy (#171E45).

---

## About the brand

**Dash** is a financial / analytics product line — dashboards for income, spending, portfolios, business performance. The brand is **orange-forward** and pulls from the visual language of a small cluster of warm-toned finance dashboards (see `assets/reference-*.webp` for the source mood references the brief was anchored against).

What makes Dash distinct from generic SaaS finance UIs:
- **Editorial serifs for the human-facing tier.** Cormorant carries headings and welcome lines; Google Sans Flex carries everything else — running text, numbers, UI chrome. The contrast — a literary face against a clean neutral sans — is the brand's signature.
- **Crisp, not warm-paper.** The canvas is a cool gray `#F7F8FA`. Cards are white with cool-gray hairline borders. Corners are tight (12px), not bubbly.
- **One deep navy, used confidently.** `#171E45` (the brand primary, `--navy-600`) for primary actions, the logo mark, and active states; `--navy-500` (`#2C3568`) fills charts. No competing accent colors; data series fade to muted navy/gray tints rather than reach for orange/green/purple.

## Sources & inputs

The user provided:

1. **Brand brief:** "Dash — Orange."
2. **Fonts:**
   - Cormorant (variable, regular + italic) — Google Fonts
   - Google Sans Flex (optical-size cuts 9/24/36/72/120pt, Thin→Black) — Google Fonts
3. **Reference imagery** (4 WebP screenshots of related dashboard projects, used purely as mood guides — Dash itself is an original product). Stored as `assets/reference-*.webp`.

No codebase, Figma file, or existing component library was attached, so the UI kit is an **original interpretation** of the brief, not a recreation. Treat all components here as the canonical source of truth for Dash going forward.

---

## Content fundamentals

**Voice.** Direct, calm, lightly humanistic. Dash sounds like a measured financial advisor, not a hype-startup. It does not exclaim. It does not say *"Let's do this!"*.

**Person.** Second person (*you, your*) for the user; first-person plural (*we*) sparingly, only when the product itself is acting. Never "I."

**Casing.** Sentence case everywhere. Headings, buttons, menu items, table headers. The only exceptions: `OVERVIEW`, `WALLETS`, `REPORTS` etc. as eyebrow labels — those are uppercase Google Sans Flex with wide tracking. Never title-case ("Total Income") on body text.

**Numbers & data.** Numbers carry the meaning. Always tabular figures. Currency symbol attached, no space: `$23,194.80`. Negatives use a real minus glyph: `−$1,205.40`. Deltas live in their own small chip with an up/down arrow, never inline in headings.

**Sample copy.**

| ✗ Avoid                          | ✓ Use                                |
| -------------------------------- | ------------------------------------ |
| "Welcome back! 👋"               | "Welcome back, Sarah."               |
| "Total Earnings"                 | "Total earnings"                     |
| "🚀 Boost your savings"          | "Save 2% more this month"            |
| "Click here to view all"         | "See all activity →"                 |
| "Awesome! Transfer successful."  | "Transfer sent. $250 to checking."   |

**Emoji.** None. The brand uses zero emoji in production UI. The serif and the orange do the warmth-carrying work.

**Vibe.** A weekend broadsheet in a coffee shop. Quiet, considered, confident. Information-dense without being cramped.

---

## Visual foundations

### Color
- **One brand navy.** `--navy-600` (`#171E45`) is the primary — CTAs, logo, active states. `--navy-500` (`#2C3568`) fills charts; `--navy-300` (`#828BB0`) is for accents on dark surfaces. The lighter tints (`50`–`200`) tint backgrounds; the darker (`700`–`900`) are press states and deep surfaces. (Legacy `--orange-*` tokens still resolve, aliased to navy.)
- **Cool gray neutrals.** The neutral ramp is a crisp, screen-native **gray** with a slight blue undertone. `--paper-50` (`#F7F8FA`) is the page; `--paper-200` (`#E1E5EB`) is a hairline; `--paper-300` (`#CBD1DA`) is a divider; most muted text uses `--ink-50` (`#6E665A`).
- **Semantic accents** (green, amber, red) are desaturated and used only on status pills, never decoratively.
- **Ink is warm-black.** Headlines are `#1A1611`, not `#000000` — a touch of warmth keeps the cool grays from feeling clinical.

### Type
- **Two families.** Cormorant (serif, human-facing lines) · **Google Sans Flex** (sans, everything else — running text, numbers, labels, eyebrows). Space Mono was retired.
- **Display tier** (≥20px / `--fs-lg`): Cormorant, weight 500, tight letter-spacing. Italic is reserved for pull quotes and emphasis within Cormorant blocks.
- **Body & UI tier:** **Google Sans Flex** 400 / 500 / 600. All running text — nav, body copy, table cells, inputs, buttons, captions.
- **Data tier:** **Google Sans Flex** SemiBold (600) with `font-variant-numeric: tabular-nums` so columns of numbers align. Large figures (≥28px) use the **72pt** optical cut (`--font-sans-display`); inline/small figures use the **24pt** cut (`--font-sans`).
- **Eyebrow labels:** Google Sans Flex Medium/SemiBold 11px, `letter-spacing: 0.04em`, UPPERCASE. (The legacy `--font-mono` token still exists for labels/code but now points at Google Sans Flex.)

### Spacing
4px base. Common steps: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. Cards have **24px** internal padding (`--space-6`); page gutters are **48px** (`--space-12`); section separators are **64px+**.

### Backgrounds & surfaces
- **Page** sits on `--paper-50`.
- **Cards** are `--paper-0` (pure white) with a 1px `--border-hairline` line — *not* a shadow. Shadows only on floating things (menus, toasts, modals).
- **No gradients** as decorative fills. The single tolerated gradient is a subtle vertical fade from `--orange-500` → `--orange-600` on the primary button — and even that is optional.
- **No full-bleed marketing imagery** inside the product. The product UI is flat and crisp. Marketing pages can use editorial photography.
- **No patterns, no textures, no grain.** The face combo is loud enough.

### Borders
- **Hairline** (`--paper-200`) for card outlines, table rows, sidebar dividers.
- **Default** (`--paper-300`) for input borders, chart grid lines.
- **Strong** (`--ink-200`) only for active selected states.
- All borders are 1px. No 2px outlines anywhere.

### Corner radii
- **`--radius-md` (12px) is the primary radius** — cards, inputs, status tiles, most surfaces. Cards used to be 20px; they were pulled in to 12px for a crisper, less bubbly feel.
- Small chips: `--radius-sm` (8px).
- Modals: `--radius-lg` (16px).
- Hero / sidebar regions: `--radius-xl` (20px).
- Pills, avatars, buttons: `--radius-full`.
- Primary action button: `--radius-full` (fully rounded) — this is the Dash button shape.

### Shadow system
- `--shadow-xs`: input focus halo.
- `--shadow-sm`: hover lift on cards.
- `--shadow-md`: dropdown menus, popovers.
- `--shadow-lg`: modals, toasts.
- `--shadow-accent`: the primary CTA only, on hover.
All shadows are **brown-tinted** (`rgba(64, 38, 14, …)`), never gray.

### Hover & press
- **Hover** on neutral surfaces: background → `--paper-100`. On accent surfaces: → `--orange-700`. Cards don't lift unless they're clickable.
- **Press**: scale 0.98, duration 120ms, ease-out. No color shift on press for buttons — the scale carries it.
- **Focus**: 3px ring at `color-mix(--orange-600 35%, transparent)`. Always visible, never hidden.

### Animation
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo-ish) for entrances. `cubic-bezier(0.4, 0, 0.1, 1)` (snap) for state changes.
- Durations: `120ms` for hover, `200ms` for state, `360ms` for entrances.
- **No bounces. No fly-ins from across the screen. No springy overshoot.** Things fade and move 4–8px.

### Layout rules
- Sidebar is **264px** wide, fixed.
- Top bar is **80px** tall, fixed.
- Page content sits on a 12-column grid with a max content width of **1440px** centered.
- Cards have **22px** padding and 1px borders. Card-to-card gap is **20px**.

### Transparency & blur
- Used only on **modal scrims** (page `rgba(26, 22, 17, 0.45)` with `backdrop-filter: blur(4px)`) and on toast overlays.
- The product UI itself never uses translucent surfaces. Opacity is binary.

### Card anatomy
A Dash card is `--paper-0` background, `--border-hairline` 1px line, `--radius-md` (12px) corners, **no shadow** at rest. On hover (only if clickable), the card gets `--shadow-sm` and the border stays. Inside, the structure is always:

```
┌─────────────────────────────────┐
│ Label (eyebrow)         ⋯       │   ← Google Sans Flex UPPERCASE, --fg-muted
│                                  │
│ $23,194.80                       │   ← Big number, sans 600, --ink-300
│                                  │
│ ▲ 12.4% vs last month            │   ← Delta chip, --green-500
└─────────────────────────────────┘
```

---

## Iconography

**Approach.** Dash uses **Lucide** (https://lucide.dev) as the canonical icon set, served from CDN. Lucide's 1.5px stroke, square caps, and clean geometric construction pair well with Space Mono's stroke and Cormorant's restrained drawing. **All icons are stroke-only**, never filled (with one exception: small inline status dots).

- **Default size:** 18px. Sidebar nav: 20px. Inline-with-text: 14px. Big feature icons (rare): 24px.
- **Stroke weight:** `stroke-width="1.5"` everywhere. Never increase to 2.
- **Color:** Icons inherit `currentColor` and default to `--ink-100`. Active/focused state uses `--orange-600`.
- **Hit target:** A 36×36 padded button around an 18px icon. Never tap a bare icon.

**No emoji. No unicode symbols-as-icons** (no `→` for arrows in buttons — use `lucide:arrow-right`). The one exception is the inline minus glyph (`−` U+2212) in negative numbers; that's typographic, not iconographic.

**Logos.** The Dash mark is a simple custom glyph — a forward-slash inscribed in a rounded square (`/`). See `assets/dash-logo.svg` and `assets/dash-mark.svg`. The wordmark uses Cormorant 500 with the slash mark to the left.

**Available icon files in `assets/`:**
- `dash-logo.svg` — full lockup (mark + wordmark)
- `dash-mark.svg` — square mark only
- Reference imagery in `assets/reference-*.webp` (mood, not for shipping)

---

## ⚠️ Font substitutions / open questions

- **Fonts shipped:** Both Cormorant and Space Mono came as TTF uploads. Fully matched, no substitution needed.
- **No codebase or Figma was provided.** Everything in `ui_kits/dash/` is an original construction. If a real Dash codebase exists somewhere, please attach it and I will recalibrate to match.
- **Brand name confirmation needed.** The brief said *"Dash — Orange"*. I interpreted this as a brand name "Dash" with primary color orange, building a financial-analytics product because the reference imagery was finance dashboards. If "Dash" is a different category (delivery? sports? AI agent?), the type system stays but I'll need to retune the UI kit.

---

## Index

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← Claude-Code-compatible skill entry
├── colors_and_type.css        ← all design tokens, font-faces, semantic classes
├── fonts/                     ← Cormorant + Space Mono TTFs
├── assets/                    ← logos, marks, reference imagery
├── preview/                   ← single-purpose Design System cards
└── ui_kits/
    └── dash/
        ├── README.md
        ├── index.html         ← interactive dashboard demo
        ├── kit.css            ← UI-kit-specific styles
        ├── App.jsx            ← top-level layout shell
        ├── Sidebar.jsx
        ├── Topbar.jsx
        ├── StatCard.jsx
        ├── Chart.jsx
        ├── ActivityTable.jsx
        ├── Buttons.jsx
        ├── Inputs.jsx
        └── Card.jsx
```

When in doubt: `colors_and_type.css` is the source of truth for tokens, and `ui_kits/dash/index.html` is the source of truth for component composition.
