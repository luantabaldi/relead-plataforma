# Dash — UI Kit

An interactive recreation of the canonical Dash overview screen. Use this as the source of truth for component composition.

## Files

- `index.html` — interactive demo (open this)
- `kit.css` — kit-level styles (imports `../../colors_and_type.css`)
- `Icons.jsx` — Lucide-style SVG icon set
- `Sidebar.jsx` — left navigation with section labels & promo card
- `Topbar.jsx` — search + profile + notification bell
- `Cards.jsx` — `<StatCard>` + `<WalletGroup>` + `<Wallet>`
- `Chart.jsx` — Profit/Loss paired bar chart with hatched orange fill
- `ActivityTable.jsx` — sortable, selectable transaction table
- `TransferModal.jsx` — full-screen modal with form
- `App.jsx` — top-level composition

## Interactivity

- Click any nav item in the sidebar to switch active state.
- Click the orange **Transfer** button → opens transfer modal.
- Submit the modal → shows a toast confirmation.
- Click any row in the activity table → selects it (orange tint).
- Click the checkbox → toggles select.

## Surface coverage

This kit is a single-screen overview. It demonstrates: sidebar nav, top-bar chrome, hero greeting, 4-up stat row, paired bar chart, wallet group, progress bar, tag chips, full activity table with status pills and checkboxes, modal with form fields, toast.

It does **not** include: settings pages, login flow, onboarding, mobile breakpoints. Add those as separate route files following the same component conventions.

## Caveats

This was built **without** a Dash codebase or Figma file. All visual decisions trace back to the brief ("Dash — Orange") + the 4 reference WebPs the user provided as mood guides. If a real source-of-truth exists, attach it and I'll recalibrate.
