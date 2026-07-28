# Design

Source of truth: `src/styles/dash.css` (tokens + component classes). Tailwind extended to match in `tailwind.config.js`.

## Theme

Light only, monochrome canvas — ElevenLabs-style. No dark mode, no brand hue. Scene: operador em escritório, tela aberta o dia todo ao lado de outras ferramentas (CRM, WhatsApp Web) — precisa de contraste alto e leitura rápida, não ambiência.

## Color Strategy

Restrained to the point of monochrome. One near-black "brand" color (used for primary CTAs and active states) + true-neutral grays + sparing semantic accents for status (green/amber/red), never used as the only signal.

- Brand: `--navy-600 #0A0A0A` (primary/CTA/active — near-black, no hue), `--navy-500 #333333` (hover)
- Neutrals: page/surface `--paper-0 #FFFFFF`, sunken `--paper-100 #F2F2F2`, hairline border `--paper-200 #E5E5E5`
- Ink (true neutral, no warm/cool undertone): headline `--ink-300 #0A0A0A`, body `--ink-200 #262626`, muted `--ink-50 #737373`
- Semantic (sparingly, as bordered pills + colored dot, not tinted fills): green `#16A34A`, amber `#D97706`, red `#DC2626`

## Typography

One family only — Google Sans Flex (Cormorant/serif retired: ElevenLabs uses no serif anywhere). Display headings use the 72pt optical-size cut ("Google Sans Flex Display") at weight 600, everything else — body, labels, data — uses the 24pt cut.

Scale: 11/12/14/16/20/28/40/56px. Numbers always tabular (`font-feature-settings: "tnum" 1`). Sentence case everywhere, no title case.

## Layout

Dash app shell: 264px `Sidebar` + 72px `Topbar` + content. Four sections as sidebar nav: Acompanhar, Disparar, Analisar, Gerenciar. `Acompanhar` uses a master-detail pattern (list + conversation thread).

Spacing scale is 4px-based (`--space-1` 4px → `--space-24` 96px).

## Components

- Radius: generous — 14px (`--radius-md`) for cards, 10px (`--radius-sm`) for buttons/inputs, pill (999px) reserved for search bars, filter chips and tags (not primary buttons — ElevenLabs' CTAs are moderately-rounded rects, not pills).
- Shadows: neutral black, near-zero — borders do the separating work, shadow only appears on hover/elevated surfaces (`--shadow-xs/sm/md/lg`).
- Icons: Lucide only, stroke-width 1.5, 18px default, `currentColor`, via `src/components/Icon.tsx`. No emoji anywhere.
- Sidebar active state: light-gray fill (`--paper-100`) + near-black text/icon — not an inverted dark pill.
- Focus ring: `0 0 0 3px` near-black at 14% opacity.
- Status presentation centralized in `src/components/statusMeta.ts` — single source for label/color/icon per status.

## Motion

`--ease-out` (0.22,1,.36,1) for entrances, `--ease-in` for exits, `--ease-snap` for toggles. Durations 120/200/360ms. No bounce/elastic.

## Font substitution note

ElevenLabs' production typeface is proprietary and isn't freely licensable, so this system reuses the already-bundled Google Sans Flex family (same neutral-grotesk character, full weight range, already self-hosted) rather than pulling in a new font. Everything else — palette, radii, shadow weight, button/pill split, chip style — mirrors the ElevenLabs reference screens directly.
