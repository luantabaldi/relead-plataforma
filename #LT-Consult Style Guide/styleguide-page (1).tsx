/**
 * Coloque este arquivo em: /app/styleguide/page.tsx
 * Acesse em: http://localhost:3000/styleguide
 *
 * Depende de: ecliptica-reference.tsx na raiz do projeto
 * Instale antes: npx shadcn@latest add badge
 */

import { tokens, SETUP_COMMANDS } from "@/ecliptica-reference"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-5">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Divider() {
  return <hr className="border-border my-10" />
}

// ─── Color Swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({
  name,
  light,
  dark,
}: {
  name: string
  light: string
  dark: string
}) {
  const label = name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())

  return (
    <div className="flex flex-col gap-2">
      {/* Light swatch */}
      <div
        className="h-12 w-full rounded-md border border-border"
        style={{ background: light }}
        title={`Light: ${light}`}
      />
      {/* Dark swatch */}
      <div
        className="h-12 w-full rounded-md border border-border"
        style={{ background: dark }}
        title={`Dark: ${dark}`}
      />
      <div>
        <p className="text-xs font-medium leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{light}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{dark}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StyleguidePage() {
  const colorEntries = Object.entries(tokens.colors) as [
    string,
    readonly [string, string]
  ][]

  // Separar por grupos
  const brandColors   = colorEntries.filter(([k]) =>
    ["background", "foreground", "card", "cardForeground"].includes(k)
  )
  const mainColors    = colorEntries.filter(([k]) =>
    ["primary", "primaryForeground", "secondary", "muted", "mutedForeground"].includes(k)
  )
  const borderColors  = colorEntries.filter(([k]) =>
    ["border", "input", "ring"].includes(k)
  )
  const semanticColors = colorEntries.filter(([k]) =>
    ["destructive", "success", "warning", "info"].includes(k)
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-md bg-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Ecliptica</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-lg">
            Design system reference — tokens de cor, tipografia, radius e comandos de setup.
            Fonte dos dados:{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
              ecliptica-reference.tsx
            </code>
          </p>
          <div className="flex gap-3 mt-4">
            <div className="text-xs px-3 py-1.5 bg-muted rounded-md border border-border font-mono">
              {tokens.font.family}
            </div>
            <div className="text-xs px-3 py-1.5 bg-muted rounded-md border border-border font-mono">
              --radius: {tokens.radius.md}
            </div>
            <div className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20 font-mono">
              {tokens.colors.primary[0]}
            </div>
          </div>
        </div>

        <Divider />

        {/* ── Cores base ── */}
        <Section title="Colors — Base & Surface">
          <div className="mb-2 flex gap-6 text-[10px] text-muted-foreground font-mono">
            <span>▲ light</span>
            <span>▼ dark</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {brandColors.map(([key, [light, dark]]) => (
              <ColorSwatch key={key} name={key} light={light} dark={dark} />
            ))}
          </div>
        </Section>

        <Section title="Colors — Primary & Neutral">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {mainColors.map(([key, [light, dark]]) => (
              <ColorSwatch key={key} name={key} light={light} dark={dark} />
            ))}
          </div>
        </Section>

        <Section title="Colors — Borders & Ring">
          <div className="grid grid-cols-3 gap-4 max-w-sm">
            {borderColors.map(([key, [light, dark]]) => (
              <ColorSwatch key={key} name={key} light={light} dark={dark} />
            ))}
          </div>
        </Section>

        <Section title="Colors — Semantic">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {semanticColors.map(([key, [light, dark]]) => (
              <ColorSwatch key={key} name={key} light={light} dark={dark} />
            ))}
          </div>
          {/* Preview de badges semânticos */}
          <div className="flex flex-wrap gap-2 mt-6">
            {(
              [
                ["Ativo",    tokens.colors.success[0],    "#fff"],
                ["Atenção",  tokens.colors.warning[0],    "#111"],
                ["Erro",     tokens.colors.destructive[0],"#fff"],
                ["Info",     tokens.colors.info[0],       "#fff"],
              ] as [string, string, string][]
            ).map(([label, bg, color]) => (
              <span
                key={label}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: bg, color }}
              >
                {label}
              </span>
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Tipografia ── */}
        <Section title="Typography">
          <div className="space-y-5">
            {(
              [
                { size: "48px", weight: 700, label: "Display · 48/700", text: "Innovative Strategies" },
                { size: "32px", weight: 700, label: "H1 · 32/700",      text: "About Us" },
                { size: "24px", weight: 600, label: "H2 · 24/600",      text: "Our Services" },
                { size: "20px", weight: 600, label: "H3 · 20/600",      text: "Client Success Stories" },
                { size: "14px", weight: 400, label: "Body · 14/400",    text: "We help brands grow through innovative solutions and effective marketing strategies." },
                { size: "12px", weight: 400, label: "Caption · 12/400", text: "Data from 2023–2025 · 20 Years of Experience" },
              ] as { size: string; weight: number; label: string; text: string }[]
            ).map((t) => (
              <div key={t.label} className="flex items-baseline gap-4">
                <span className="text-[10px] text-muted-foreground font-mono w-32 shrink-0">
                  {t.label}
                </span>
                <span
                  style={{
                    fontSize: t.size,
                    fontWeight: t.weight,
                    fontFamily: tokens.font.family,
                    lineHeight: 1.2,
                  }}
                >
                  {t.text}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tokens.font.weights.map((w) => (
              <div
                key={w}
                className="px-4 py-2 bg-muted rounded-md border border-border text-sm"
                style={{ fontWeight: w, fontFamily: tokens.font.family }}
              >
                {tokens.font.family} {w}
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Radius ── */}
        <Section title="Border Radius">
          <div className="flex flex-wrap gap-6 items-end">
            {(Object.entries(tokens.radius) as [string, string][]).map(([name, value]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 border border-border bg-primary/10"
                  style={{ borderRadius: value }}
                />
                <div className="text-center">
                  <p className="text-xs font-medium">{name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{value}</p>
                </div>
              </div>
            ))}
            {/* Pill extra */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 border border-border bg-primary/10"
                style={{ borderRadius: "999px" }}
              />
              <div className="text-center">
                <p className="text-xs font-medium">full</p>
                <p className="text-[10px] text-muted-foreground font-mono">999px</p>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── Spacing visual ── */}
        <Section title="Spacing Scale">
          <div className="flex flex-col gap-2">
            {(
              [
                { name: "1",  px: "4px",  tw: "p-1"  },
                { name: "2",  px: "8px",  tw: "p-2"  },
                { name: "4",  px: "16px", tw: "p-4"  },
                { name: "6",  px: "24px", tw: "p-6"  },
                { name: "8",  px: "32px", tw: "p-8"  },
                { name: "12", px: "48px", tw: "p-12" },
              ] as { name: string; px: string; tw: string }[]
            ).map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground font-mono w-6">{s.name}</span>
                <div
                  className="bg-primary/20 border border-primary/30 h-4"
                  style={{ width: s.px }}
                />
                <span className="text-[10px] text-muted-foreground font-mono">{s.px}</span>
                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border">
                  {s.tw}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* ── Setup commands ── */}
        <Section title="Setup Commands">
          <pre className="bg-muted border border-border rounded-lg p-5 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap text-foreground">
            {SETUP_COMMANDS.trim()}
          </pre>
        </Section>

        <Divider />

        {/* ── Resumo ── */}
        <Section title="Design System Summary">
          <div className="border border-border rounded-lg overflow-hidden max-w-lg">
            {(
              [
                ["Cor primária",  `${tokens.colors.primary[0]} — Azul Ecliptica`],
                ["Fonte",         `${tokens.font.family} · ${tokens.font.weights.join(", ")}`],
                ["Estilo",        "Minimalismo editorial bold"],
                ["Radius padrão", `${tokens.radius.md} (--radius)`],
                ["Dark mode",     `${tokens.colors.background[1]} / card ${tokens.colors.card[1]}`],
                ["Sensação",      "Agência B2B moderna, confiante, limpa"],
              ] as [string, string][]
            ).map(([key, val], i) => (
              <div
                key={key}
                className={`flex gap-3 px-4 py-3 text-sm ${
                  i % 2 === 0 ? "bg-muted/50" : "bg-background"
                }`}
              >
                <span className="text-muted-foreground w-32 shrink-0">{key}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  )
}
