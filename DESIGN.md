# Design

Source of truth: `Dash Design System/colors_and_type.css` (canonical tokens) mirrored into `src/styles/dash.css` for production use. Tailwind extended to match in `tailwind.config.js`.

## Theme

Light only, cool-gray canvas. No dark mode. Scene: operador em escritório, tela aberta o dia todo ao lado de outras ferramentas (CRM, WhatsApp Web) — precisa de contraste alto e leitura rápida, não ambiência.

## Color Strategy

Restrained. One brand color (navy) + tinted cool-gray neutrals + sparing semantic accents for status (green/amber/red), never used as the only signal.

- Brand: `--navy-600 #171E45` (primary/CTA/active), `--navy-500 #2C3568` (chart fill/hover)
- Neutrals: page `--paper-50 #F7F8FA`, surface `--paper-0 #FFFFFF`, hairline border `--paper-200 #E1E5EB`
- Ink (never pure black): headline `--ink-300 #1A1611`, body `--ink-200 #2E2A23`, muted `--ink-50 #6E665A`
- Semantic (sparingly): green `#2F8F5C`, amber `#C58B2A`, red `#C73428`, each with a `-50` soft background tint

## Typography

Two families only. Cormorant (serif, weight 500, `type-display-*`/`type-h1`/`type-h2`) for human/headline moments. Google Sans Flex for everything else — body, labels, data. Space Mono is retired; `--font-mono` now aliases Google Sans Flex for the label/eyebrow/data tier.

Scale: 11/12/14/16/20/28/40/56/84px (`--fs-xs` → `--fs-4xl`). Numbers always tabular (`font-feature-settings: "tnum" 1`). Sentence case everywhere, no title case.

## Layout

Dash app shell: 264px `Sidebar` + 80px `Topbar` + content. Four sections as sidebar nav: Acompanhar, Disparar, Analisar, Gerenciar. `Acompanhar` uses a master-detail pattern (list + conversation thread).

Spacing scale is 4px-based (`--space-1` 4px → `--space-24` 96px).

## Components

- Radius: 12px (`--radius-md`) default for cards/inputs; pill (999px) for primary buttons only.
- Shadows: brown-tinted only (`rgba(64,38,14,…)`), never neutral black — `--shadow-xs/sm/md/lg`.
- Icons: Lucide only, stroke-width 1.5, 18px default, `currentColor`, via `src/components/Icon.tsx`. No emoji anywhere.
- Focus ring: `0 0 0 3px` navy at 35% mix.
- Status presentation centralized in `src/components/statusMeta.ts` — single source for label/color/icon per status.

## Motion

`--ease-out` (0.22,1,.36,1) for entrances, `--ease-in` for exits, `--ease-snap` for toggles. Durations 120/200/360ms. No bounce/elastic.
