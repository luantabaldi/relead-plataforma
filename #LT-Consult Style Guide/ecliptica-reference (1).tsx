/**
 * ============================================================
 * ECLIPTICA — Design System Reference
 * ============================================================
 * Arquivo único de referência. Copie para novos projetos.
 *
 * CONTEÚDO:
 *   1. GLOBALS_CSS      → cole em /app/globals.css
 *   2. navigation       → cole em /app/styleguide/navigation.ts
 *   3. SETUP_COMMANDS   → comandos para novo projeto
 *   4. TOKENS           → tabela de referência rápida
 *
 * STACK: Next.js 15 · Tailwind CSS v4 · shadcn/ui · DM Sans
 * REFERÊNCIA: Ecliptica (branco/azul/preto · B2B · minimalismo editorial bold)
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBALS.CSS
// Cole o conteúdo desta string em /app/globals.css
// ─────────────────────────────────────────────────────────────────────────────

export const GLOBALS_CSS = `
@import "tailwindcss";

/* ============================================================
   ECLIPTICA — Design Tokens
   Cor primária : #2563EB (Azul Ecliptica)
   Fonte        : DM Sans
   Radius       : 0.5rem (8px)
   Estilo       : Minimalismo editorial bold · Agência B2B
   ============================================================ */

:root {

  /* ── BASE ────────────────────────────────────────────── */
  --background:              oklch(97% 0 0);       /* #F5F5F5 — fundo da página        */
  --foreground:              oklch(4% 0 0);         /* #0A0A0A — texto principal        */

  /* ── CARD / SURFACE ──────────────────────────────────── */
  --card:                    oklch(100% 0 0);       /* #FFFFFF                          */
  --card-foreground:         oklch(4% 0 0);

  /* ── POPOVER / DROPDOWN / TOOLTIP ───────────────────── */
  --popover:                 oklch(100% 0 0);
  --popover-foreground:      oklch(4% 0 0);

  /* ── PRIMARY — Azul Ecliptica ────────────────────────── */
  --primary:                 oklch(51% 0.21 264);   /* #2563EB                          */
  --primary-foreground:      oklch(100% 0 0);       /* #FFFFFF                          */

  /* ── SECONDARY ───────────────────────────────────────── */
  --secondary:               oklch(95% 0 0);        /* #F3F4F6                          */
  --secondary-foreground:    oklch(20% 0 0);        /* #374151                          */

  /* ── MUTED ───────────────────────────────────────────── */
  --muted:                   oklch(95% 0 0);        /* #F3F4F6 — fundo de campos/badges */
  --muted-foreground:        oklch(45% 0 0);        /* #6B7280 — texto secundário       */

  /* ── ACCENT ──────────────────────────────────────────── */
  --accent:                  oklch(95% 0 0);
  --accent-foreground:       oklch(20% 0 0);

  /* ── DESTRUCTIVE ─────────────────────────────────────── */
  --destructive:             oklch(55% 0.22 25);    /* vermelho — erros e delete        */
  --destructive-foreground:  oklch(100% 0 0);

  /* ── BORDERS & INPUTS ────────────────────────────────── */
  --border:                  oklch(90% 0 0);        /* #E5E7EB                          */
  --input:                   oklch(87% 0 0);        /* ligeiramente mais escuro         */
  --ring:                    oklch(51% 0.21 264);   /* = primary · usado em focus ring  */

  /* ── BORDER RADIUS ───────────────────────────────────── */
  --radius:                  0.5rem;                /* 8px — base para cálculos abaixo  */
  /*   --radius-sm  = 4px  (calc -4px)
       --radius-md  = 8px  (= --radius)
       --radius-lg  = 12px (calc +4px)
       --radius-xl  = 16px (calc +8px)               */

  /* ── CHART COLORS ────────────────────────────────────── */
  --chart-1:                 oklch(51% 0.21 264);   /* azul primário                    */
  --chart-2:                 oklch(20% 0 0);        /* preto                            */
  --chart-3:                 oklch(55% 0.15 220);   /* azul médio                       */
  --chart-4:                 oklch(45% 0 0);        /* cinza médio                      */
  --chart-5:                 oklch(70% 0.12 264);   /* azul claro                       */

  /* ── SIDEBAR ─────────────────────────────────────────── */
  --sidebar:                 oklch(100% 0 0);
  --sidebar-foreground:      oklch(4% 0 0);
  --sidebar-primary:         oklch(51% 0.21 264);
  --sidebar-primary-foreground: oklch(100% 0 0);
  --sidebar-accent:          oklch(95% 0 0);
  --sidebar-accent-foreground: oklch(20% 0 0);
  --sidebar-border:          oklch(90% 0 0);
  --sidebar-ring:            oklch(51% 0.21 264);

  /* ── SEMANTIC — Success / Warning / Info ─────────────── */
  --success:                 oklch(52% 0.17 145);   /* verde                            */
  --success-foreground:      oklch(100% 0 0);
  --warning:                 oklch(72% 0.19 80);    /* âmbar                            */
  --warning-foreground:      oklch(15% 0 0);        /* escuro p/ contraste no amarelo   */
  --info:                    oklch(56% 0.18 240);   /* azul informação                  */
  --info-foreground:         oklch(100% 0 0);

}

/* ============================================================
   DARK MODE — Preto profundo Ecliptica
   Fundo : #111111 · Card : #1E1E1E · Borda : #2D2D2D
   ============================================================ */

.dark {

  /* ── BASE ────────────────────────────────────────────── */
  --background:              oklch(8% 0 0);         /* #111111 — preto profundo         */
  --foreground:              oklch(95% 0 0);        /* #F2F2F2 — texto claro            */

  /* ── CARD / SURFACE ──────────────────────────────────── */
  --card:                    oklch(13% 0 0);        /* #1E1E1E                          */
  --card-foreground:         oklch(95% 0 0);

  /* ── POPOVER ─────────────────────────────────────────── */
  --popover:                 oklch(13% 0 0);
  --popover-foreground:      oklch(95% 0 0);

  /* ── PRIMARY ─────────────────────────────────────────── */
  --primary:                 oklch(56% 0.22 264);   /* azul um pouco mais claro no dark */
  --primary-foreground:      oklch(100% 0 0);

  /* ── SECONDARY ───────────────────────────────────────── */
  --secondary:               oklch(18% 0 0);        /* #2D2D2D                          */
  --secondary-foreground:    oklch(90% 0 0);

  /* ── MUTED ───────────────────────────────────────────── */
  --muted:                   oklch(18% 0 0);
  --muted-foreground:        oklch(60% 0 0);

  /* ── ACCENT ──────────────────────────────────────────── */
  --accent:                  oklch(18% 0 0);
  --accent-foreground:       oklch(90% 0 0);

  /* ── DESTRUCTIVE ─────────────────────────────────────── */
  --destructive:             oklch(50% 0.22 25);
  --destructive-foreground:  oklch(100% 0 0);

  /* ── BORDERS & INPUTS ────────────────────────────────── */
  --border:                  oklch(22% 0 0);        /* #2D2D2D                          */
  --input:                   oklch(25% 0 0);
  --ring:                    oklch(56% 0.22 264);

  /* ── CHART COLORS ────────────────────────────────────── */
  --chart-1:                 oklch(56% 0.22 264);
  --chart-2:                 oklch(90% 0 0);
  --chart-3:                 oklch(62% 0.15 220);
  --chart-4:                 oklch(50% 0 0);
  --chart-5:                 oklch(72% 0.12 264);

  /* ── SIDEBAR ─────────────────────────────────────────── */
  --sidebar:                 oklch(10% 0 0);
  --sidebar-foreground:      oklch(90% 0 0);
  --sidebar-primary:         oklch(56% 0.22 264);
  --sidebar-primary-foreground: oklch(100% 0 0);
  --sidebar-accent:          oklch(18% 0 0);
  --sidebar-accent-foreground: oklch(90% 0 0);
  --sidebar-border:          oklch(22% 0 0);
  --sidebar-ring:            oklch(56% 0.22 264);

  /* ── SEMANTIC ────────────────────────────────────────── */
  --success:                 oklch(57% 0.17 145);
  --success-foreground:      oklch(100% 0 0);
  --warning:                 oklch(72% 0.19 80);
  --warning-foreground:      oklch(15% 0 0);
  --info:                    oklch(60% 0.18 240);
  --info-foreground:         oklch(100% 0 0);

}

/* ============================================================
   TAILWIND v4 — @theme inline bridge
   Conecta as CSS variables ao sistema de classes do Tailwind.
   Exemplo: bg-primary, text-muted-foreground, border-border
   ============================================================ */

@theme inline {

  /* Cores base */
  --color-background:                  var(--background);
  --color-foreground:                  var(--foreground);
  --color-card:                        var(--card);
  --color-card-foreground:             var(--card-foreground);
  --color-popover:                     var(--popover);
  --color-popover-foreground:          var(--popover-foreground);

  /* Cores de componente */
  --color-primary:                     var(--primary);
  --color-primary-foreground:          var(--primary-foreground);
  --color-secondary:                   var(--secondary);
  --color-secondary-foreground:        var(--secondary-foreground);
  --color-muted:                       var(--muted);
  --color-muted-foreground:            var(--muted-foreground);
  --color-accent:                      var(--accent);
  --color-accent-foreground:           var(--accent-foreground);
  --color-destructive:                 var(--destructive);
  --color-destructive-foreground:      var(--destructive-foreground);

  /* Borders */
  --color-border:                      var(--border);
  --color-input:                       var(--input);
  --color-ring:                        var(--ring);

  /* Sidebar */
  --color-sidebar:                     var(--sidebar);
  --color-sidebar-foreground:          var(--sidebar-foreground);
  --color-sidebar-primary:             var(--sidebar-primary);
  --color-sidebar-primary-foreground:  var(--sidebar-primary-foreground);
  --color-sidebar-accent:              var(--sidebar-accent);
  --color-sidebar-accent-foreground:   var(--sidebar-accent-foreground);
  --color-sidebar-border:              var(--sidebar-border);
  --color-sidebar-ring:                var(--sidebar-ring);

  /* Semantic */
  --color-success:                     var(--success);
  --color-success-foreground:          var(--success-foreground);
  --color-warning:                     var(--warning);
  --color-warning-foreground:          var(--warning-foreground);
  --color-info:                        var(--info);
  --color-info-foreground:             var(--info-foreground);

  /* Charts */
  --color-chart-1:                     var(--chart-1);
  --color-chart-2:                     var(--chart-2);
  --color-chart-3:                     var(--chart-3);
  --color-chart-4:                     var(--chart-4);
  --color-chart-5:                     var(--chart-5);

  /* Radius — derivados do --radius base (0.5rem = 8px) */
  --radius-sm:                         calc(var(--radius) - 4px);  /* 4px  */
  --radius-md:                         var(--radius);              /* 8px  */
  --radius-lg:                         calc(var(--radius) + 4px);  /* 12px */
  --radius-xl:                         calc(var(--radius) + 8px);  /* 16px */

}

/* ============================================================
   BASE STYLES
   ============================================================ */

body {
  background:               var(--background);
  color:                    var(--foreground);
  font-family:              'DM Sans', system-ui, -apple-system, sans-serif;
  font-size:                14px;
  line-height:              1.6;
  -webkit-font-smoothing:   antialiased;
  -moz-osx-font-smoothing:  grayscale;
}

* {
  border-color: var(--border);
}
`

// ─────────────────────────────────────────────────────────────────────────────
// 2. NAVIGATION
// Cole em /app/styleguide/navigation.ts
// (ou importe direto: import { navigation } from "@/design-system-reference")
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  name: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigation: NavSection[] = [

  /* ── Foundation ─────────────────────────────────────────
     Tokens de design: cores, tipografia, espaçamentos, radius
     ───────────────────────────────────────────────────── */
  {
    title: "Foundation",
    items: [
      { name: "Design Tokens",    href: "/styleguide" },
      { name: "Colors",           href: "/styleguide/colors" },
      { name: "Typography",       href: "/styleguide/typography" },
      { name: "Spacing & Radius", href: "/styleguide/spacing" },
    ],
  },

  /* ── Components ──────────────────────────────────────────
     Um link por página de showcase.
     Adicione novos componentes aqui para aparecerem na sidebar.
     ───────────────────────────────────────────────────── */
  {
    title: "Components",
    items: [
      { name: "Button",                   href: "/styleguide/components/button" },
      { name: "Badge",                    href: "/styleguide/components/badge" },
      { name: "Card",                     href: "/styleguide/components/card" },
      { name: "Input",                    href: "/styleguide/components/input" },
      { name: "Select",                   href: "/styleguide/components/select" },
      { name: "Checkbox, Radio & Switch", href: "/styleguide/components/checkbox-radio-switch" },
      { name: "Dialog & Alert Dialog",    href: "/styleguide/components/dialog" },
      { name: "Dropdown Menu",            href: "/styleguide/components/dropdown-menu" },
      { name: "Tabs",                     href: "/styleguide/components/tabs" },
      { name: "Table",                    href: "/styleguide/components/table" },
      { name: "Skeleton & Spinner",       href: "/styleguide/components/skeleton-spinner" },
      { name: "Tooltip & Popover",        href: "/styleguide/components/tooltip-popover" },
      // ↓ adicione novos componentes aqui ↓
    ],
  },

  /* ── Patterns ────────────────────────────────────────────
     Páginas completas e composições (Prompt 3).
     ───────────────────────────────────────────────────── */
  {
    title: "Patterns",
    items: [
      // ↓ adicione páginas completas aqui ↓
    ],
  },

]

// ─────────────────────────────────────────────────────────────────────────────
// 3. SETUP — comandos para novo projeto
// ─────────────────────────────────────────────────────────────────────────────

export const SETUP_COMMANDS = `
# 1. Criar projeto
npx create-next-app@latest meu-projeto --typescript --tailwind --app
cd meu-projeto

# 2. Inicializar shadcn (escolha: Default · Neutral · CSS variables: Yes)
npx shadcn@latest init

# 3. Instalar todos os componentes usados no styleguide
npx shadcn@latest add button badge card input label select checkbox radio-group \\
  switch dialog alert-dialog dropdown-menu tabs table skeleton avatar tooltip popover

# 4. Instalar DM Sans — adicione ao app/layout.tsx:
#    import { DM_Sans } from "next/font/google"
#    const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400","500","600","700"] })

# 5. Colar GLOBALS_CSS → /app/globals.css
# 6. Colar navigation  → /app/styleguide/navigation.ts
` as const

// ─────────────────────────────────────────────────────────────────────────────
// 4. TOKENS — tabela de referência rápida (objeto tipado)
// ─────────────────────────────────────────────────────────────────────────────

export const tokens = {
  colors: {
    // [ light hex,   dark hex ]
    background:         ["#F5F5F5",  "#111111"],
    foreground:         ["#0A0A0A",  "#F2F2F2"],
    card:               ["#FFFFFF",  "#1E1E1E"],
    cardForeground:     ["#0A0A0A",  "#F2F2F2"],
    primary:            ["#2563EB",  "#3B82F6"],
    primaryForeground:  ["#FFFFFF",  "#FFFFFF"],
    secondary:          ["#F3F4F6",  "#2D2D2D"],
    muted:              ["#F3F4F6",  "#262626"],
    mutedForeground:    ["#6B7280",  "#9CA3AF"],
    border:             ["#E5E7EB",  "#2D2D2D"],
    input:              ["#DCDCDC",  "#333333"],
    ring:               ["#2563EB",  "#3B82F6"],
    destructive:        ["#DC2626",  "#EF4444"],
    success:            ["#16A34A",  "#22C55E"],
    warning:            ["#D97706",  "#F59E0B"],
    info:               ["#0284C7",  "#38BDF8"],
  },
  radius: {
    sm:  "4px",
    md:  "8px",   // --radius base
    lg:  "12px",
    xl:  "16px",
  },
  font: {
    family:  "DM Sans",
    weights: [400, 500, 600, 700] as const,
  },
} as const

// Tipos utilitários derivados dos tokens
export type ColorToken   = keyof typeof tokens.colors
export type RadiusToken  = keyof typeof tokens.radius
export type FontWeight   = typeof tokens.font.weights[number]
