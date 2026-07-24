---
name: dash-design
description: Use this skill to generate well-branded interfaces and assets for Dash, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always link or import `colors_and_type.css` first — it contains every design token, font-face, and semantic class the brand uses. Then look in `ui_kits/dash/` for component patterns; reuse the same composition idioms (sidebar layout, hero with serif greeting, mono numbers, cream paper background).

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## The brand in one sentence

> A crisp, editorial financial-analytics aesthetic. Cormorant (serif display) × Google Sans Flex (sans) on a cool-gray canvas with a single deep navy (#171E45).

## Hard rules — never break these

1. **One navy.** `#171E45` (`--navy-600`) is the brand primary — CTAs, logo, active states. `#2C3568` (`--navy-500`) for chart fills. No competing accent colors.
2. **No pure black.** Headlines are `#1A1611`. Body is `#2E2A23`. Both very-slightly warm.
3. **Cool-gray neutrals.** Page is `#F7F8FA`; cards are `#FFFFFF` with `#E1E5EB` hairline borders. A crisp, screen-native gray — never cream.
4. **No emoji.** None. Anywhere in product UI.
5. **No gradients** as decoration. The single tolerated gradient is on the primary button hover state.
6. **Brown-tinted shadows only** — `rgba(64, 38, 14, …)`, never `rgba(0, 0, 0, …)`.
7. **Tabular figures on every number** — `font-feature-settings: "tnum" 1`.
8. **Sentence case everywhere.** Headings, buttons, menu items. No title case.
9. **Lucide icons only,** stroke-width 1.5, 18px default, currentColor.
10. **Pill-shaped primary buttons** — `border-radius: 999px`. Cards & inputs use **12px** (`--radius-md`), the primary radius.
11. **Two type families only:** Cormorant (serif, human lines) + Google Sans Flex (everything else). Space Mono is retired.

## Files in this skill

- `README.md` — full design system documentation
- `colors_and_type.css` — every token + font-face + semantic class
- `fonts/` — Cormorant and Google Sans Flex TTFs
- `assets/` — logo, mark, reference imagery
- `preview/` — visual specimens for every part of the system
- `ui_kits/dash/` — interactive React reference implementation
