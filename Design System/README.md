# reLead Hub Design System

> **Aesthetic Canvas:** Clean, airy, quiet visual identity — Salvy-style (low-contrast canvas, monochrome base, pastel indicators, and Inter-based typography). 
> **Goal:** High readability, lower visual fatigue for daily CRM operations, keeping focus entirely on data.

---

## 1. Brand & Design Principles

* **Restrained & Quiet:** No dark mode, no vibrant brand hues on layout chrome. The interface acts as a silent canvas. 
* **Data-First:** The UI shouldn't scream; the data should. Solid colors are reserved for primary CTAs and critical headings.
* **Low Contrast Canvas:** Soft off-white page canvas (`#F4F6F8`) paired with pure white cards (`#FFFFFF`).
* **Clean Borders & Shadows:** Separation of components is achieved through soft, diffuse shadows (`--shadow-xs`) rather than heavy borders. Hairline borders (`#E5E7EB`) are used only for secondary lines and dividers.
* **No Emojis:** Product copy and UI elements must use Lucide icons instead of emojis to maintain a professional, clean tone.

---

## 2. Color Strategy & Tokens

### Base & Surfaces
* **Page Canvas (`--paper-50`):** `#F4F6F8` (resting page background).
* **Card Surface (`--paper-0`):** `#FFFFFF` (resting container surface).
* **Hairline Border (`--paper-200`):** `#E5E7EB` (dividers and secondary lines).
* **Strong Border (`--paper-300`):** `#D4D4D4` (active input borders/focus references).

### Ink & Text
* **Headline Text (`--ink-300` / `--navy-600`):** `#0A0A0A` (primary text, near-black, no hue).
* **Body Text (`--ink-200`):** `#262626` (running text, readable dark gray).
* **Muted/Caption (`--ink-50`):** `#737373` (labels, helper text, captions).

### Brand Accent
* **Primary Brand (`--navy-600`):** `#0A0A0A` (applied only to primary actions, active navigation, and main headings).
* **Hover State (`--navy-500`):** `#333333` (applied to primary button hovers).

### Semantic & Status Tags (Pastel Only)
We never use solid/saturated status fills. Status indicators use a **12% tint background** with a **darker text shade** of the same family:
* **Success (`.chip.green`):** Background `#F0FDF4`, Text `#16A34A`
* **Warning (`.chip.amber`):** Background `#FFFBEB`, Text `#D97706`
* **Danger (`.chip.red`):** Background `#FEF2F2`, Text `#DC2626`

### DataViz Colors
Restrained, gray-tinted palette separate from primary UI accents:
* **Line Chart:** `#3B4B7A` with a soft opacity gradient (`rgba(59, 75, 122, 0.2)`).
* **Funnel Gradient:** Cool-gray `#9AA6B8` to pastel-mint `#6FC099` (continuous 3-stop gradient).
* **Donut Categories:** Pastel shades of gray (`#9AA6B8`), desaturated blue (`#8FA9C7`), mint (`#7FD1AE`), rose (`#E7A3A3`), orange-gold (`#E8C79A`), and peach-red (`#D6867F`).

---

## 3. Typography

* **Primary Font:** `Inter` (loaded via Google Fonts).
* **Fallback Font:** `Google Sans Flex` (self-hosted display/body cuts to prevent layout shift if Google Fonts fails).
* **Casing:** Sentence case everywhere (e.g., "Custo total", "Nova campanha", "Filtros"). Eyebrow labels use uppercase with tracking. Title case is prohibited.
* **Numbers:** Always tabular figures (`font-variant-numeric: tabular-nums` / `font-feature-settings: "tnum" 1`) to ensure perfect column alignment.
* **Scale:** Keep sizes moderate. KPI numbers are kept to `26px–36px` to avoid "screaming" headlines.

---

## 4. Radii & Spacing

### Corner Radii
* **Cards & Modals (`--radius-md`):** `16px` (generous roundness for large containers).
* **Buttons & Inputs (`--radius-sm`):** `12px` (tighter roundness for interactive elements).
* **Chips & Search bars (`--radius-full`):** `999px` (pill-shaped).

### Shadows
* **`--shadow-xs`:** `0 4px 20px rgba(0, 0, 0, 0.03)` (default rest state for cards).
* **`--shadow-sm`:** `0 8px 28px rgba(0, 0, 0, 0.05)` (hover state for clickable cards).

### Spacing Scale
4px baseline. Default layouts use:
* **Page padding:** `40px` (72px at bottom).
* **Card internal padding:** `28px`.
* **Table row heights:** cell padding `18px` vertical, `16px` horizontal.

---

## 5. Component Layouts

### App Shell & TopBar Navigation
* The primary navigation is a topbar menu (`.topnav`), **not a sidebar**. Left sidebar layouts are retired.
* The header bar is `68px` tall, containing the brand logo and tab list on the left, and search/profile actions on the right.

### Cards & Grid Layouts
* **Bento Grid:** The dashboard dashboard uses a bento layout to display metrics. It pairs two wide cards with a stacked compact pair, rather than a uniform grid.
* **Splits & Detail views:** Rather than nesting cards, split views (e.g., list + detail) must be contained in a single parent card with an internal divider.

### Tables (`.dash-table`)
* No vertical gridlines. Only clean horizontal hairlines (`--paper-200`) separating rows.
* High vertical cell padding (`18px`) for readability.

---

## 6. Directory Map

This folder provides references to the active design system:
```
Design System/
├── README.md               ← This documentation
├── design.md               ← Mirror of root DESIGN.md (theme, color, type, layout, components)
├── product.md              ← Mirror of root PRODUCT.md (users, purpose, brand personality, principles)
├── tokens.css              ← CSS design tokens (mirror of active src/styles/dash.css)
└── fonts/                  ← Google Sans Flex fallback font files
```

`design.md` and `product.md` are copies kept in sync with the root `DESIGN.md` / `PRODUCT.md` — update the root files first, then re-copy here.
