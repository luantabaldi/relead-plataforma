# Design

Source of truth: `src/styles/dash.css` (tokens + component classes). Tailwind extended to match in `tailwind.config.js`.

## Theme

Light only, low-contrast canvas — Salvy-style: clean, airy, quiet. No dark mode, no brand hue. Scene: operador em escritório, tela aberta o dia todo ao lado de outras ferramentas (CRM, WhatsApp Web) — precisa de leitura rápida sem fadiga visual; o produto não deve "gritar", os dados devem.

## Color Strategy

Restrained. One near-black "brand" color (used only for primary CTAs, active states and main headings) + true-neutral grays + status colors expressed as pastel tints, never as solid/vibrant fills.

- Brand: `--navy-600 #0A0A0A` (primary/CTA/active — near-black, no hue), `--navy-500 #333333` (hover)
- Canvas: page background `--paper-50 #F8F9FA` (subtle off-white), card/surface `--paper-0 #FFFFFF` — cards sit one tint lighter than the page so they read as floating panels, not blocks blending into the background
- Hairline border `--paper-200 #E5E7EB`
- Ink (true neutral, no warm/cool undertone): headline `--ink-300 #0A0A0A`, body `--ink-200 #262626`, muted `--ink-50 #737373`
- Semantic status colors are always pastel: ~12% tint background + a darker shade of the same family for text (`--green-50`/`#166534`, `--amber-50`/`#92400E`, `--red-50`/`#991B1B`). No solid/chapado green or red anywhere, and color is never the only signal (icon/text always pairs with it).
- Solid near-black fill is reserved for primary CTAs and headline text only — never for KPI/stat cards. "Emphasized" stat cards signal importance via a tinted number/icon color on a white surface, not an inverted dark block.

## Typography

Inter, everywhere (self-hosted Google Sans Flex is the fallback stack if the Google Fonts request fails — see `public/index.html`). Sentence case, no title case.

Scale: 11/12/14/16/20/28/40/56px. Numbers always tabular (`font-feature-settings: "tnum" 1`). Weight stays in the Medium/Semibold range for headings, numbers and buttons (600) — never Bold/Black/ExtraBold. Labels and captions sit at Regular/Medium (400–500), not Bold. KPI numbers are sized down (26px, not 32+) so they inform rather than shout.

## Layout

Dash app shell: top `TopNav` + `Topbar` header row (68px), content below. **Navigation is a topbar, not a sidebar** — do not reintroduce a left rail. Four sections as top-nav items: Dashboards, Campanhas, Contatos, Gerenciar; each with its own in-page sub-tab selector where needed.

Spacing is generous: page padding 40px (72px bottom), card padding 28px, section margins 40px/20px, table cells 18px/16px — roughly +25–30% over a dense admin-template default.

## Components

- Radius: generous — 16px (`--radius-md`) for cards, 12px (`--radius-sm`) for buttons/inputs, pill (999px) for search bars, nav items, status chips and tags (not primary buttons — CTAs stay moderately-rounded rects).
- Shadows: soft and diffuse, low opacity, wide blur (`--shadow-xs/sm/md/lg`) — every card carries a resting `--shadow-xs`, not just on hover. Borders are hairline (`--paper-100`/`--paper-200`) and do secondary work, not primary separation.
- Icons: Lucide only, stroke-width 1.5, 18px default, `currentColor`, via `src/components/Icon.tsx`. No emoji anywhere.
- Status tags (`.chip`): pastel background + matching darker text, pill-shaped, no border. Source of truth for status → label/color/icon is `src/components/statusMeta.ts`.
- Tables (`.dash-table`): no cell borders, only a `--paper-200` hairline divider between rows, generous cell padding — never cramped.
- Focus ring: `0 0 0 3px` near-black at 14% opacity.

## Motion

`--ease-out` (0.22,1,.36,1) for entrances, `--ease-in` for exits, `--ease-snap` for toggles. Durations 120/200/360ms. No bounce/elastic.

## Font substitution note

Inter is loaded via Google Fonts (`public/index.html`, weights 400/500/600/700). The self-hosted Google Sans Flex family (already bundled from the prior design pass) stays wired as the fallback in every `--font-*` stack, so the layout doesn't shift if the Google Fonts request is slow or blocked.
