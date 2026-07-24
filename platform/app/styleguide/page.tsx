import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"

export default function StyleguidePage() {
  return (
    <div className="space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Design Tokens</h1>
        <p className="text-xl text-muted-foreground mt-2">
          The foundation of the LT Consult design system.
        </p>
      </header>

      {/* Colors */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Colors</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Brand</h3>
            <div className="space-y-2">
              <ColorSwatch name="Primary (Azul LT)" variable="--primary" color="#2A39FF" />
              <ColorSwatch name="Primary Foreground" variable="--primary-foreground" color="#FFFFFF" />
            </div>
          </div>

          {/* Neutral Scale */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Neutrals</h3>
            <div className="space-y-2">
              <ColorSwatch name="Background" variable="--background" color="#F5F5F5" />
              <ColorSwatch name="Foreground" variable="--foreground" color="#0A0A0A" />
              <ColorSwatch name="Card" variable="--card" color="#FFFFFF" />
              <ColorSwatch name="Muted" variable="--muted" color="#F3F4F6" />
              <ColorSwatch name="Muted Foreground" variable="--muted-foreground" color="#6B7280" />
              <ColorSwatch name="Border" variable="--border" color="#E5E7EB" />
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Semantic</h3>
            <div className="space-y-2">
              <ColorSwatch name="Success" variable="--success" color="#16A34A" />
              <ColorSwatch name="Warning" variable="--warning" color="#D97706" />
              <ColorSwatch name="Destructive" variable="--destructive" color="#DC2626" />
              <ColorSwatch name="Info" variable="--info" color="#0284C7" />
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Typography</h2>
        <Card>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground mb-4">--text-5xl / 48px / Bold</p>
              <h1 className="text-5xl font-bold tracking-tight">The quick brown fox jumps over the lazy dog</h1>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground mb-4">--text-3xl / 32px / Bold</p>
              <h2 className="text-3xl font-bold tracking-tight">The quick brown fox jumps over the lazy dog</h2>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground mb-4">--text-xl / 20px / Semibold</p>
              <h3 className="text-xl font-semibold tracking-tight">The quick brown fox jumps over the lazy dog</h3>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground mb-4">--text-base / 16px / Regular</p>
              <p className="text-base leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-muted-foreground mb-4">--text-sm / 14px / Regular</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Border Radius */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <RadiusExample label="Small (sm)" value="calc(var(--radius) - 4px)" />
          <RadiusExample label="Base (md)" value="calc(var(--radius) - 2px)" />
          <RadiusExample label="Large (lg)" value="var(--radius)" />
          <RadiusExample label="Pill (full)" value="9999px" />
        </div>
      </section>

      {/* Component Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Component Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Primary, secondary, and ghost variants.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts & Status</CardTitle>
              <CardDescription>Semantic feedback components.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>System update scheduled for tonight.</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-success text-success bg-success/5">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Success
                </Badge>
                <Badge variant="outline" className="border-warning text-warning bg-warning/5">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Warning
                </Badge>
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" /> Error
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function ColorSwatch({ name, variable, color }: { name: string; variable: string; color: string }) {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card">
      <div 
        className="w-12 h-12 rounded-md border shadow-sm" 
        style={{ backgroundColor: `var(${variable})` }} 
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{variable}</p>
      </div>
      <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
        {color}
      </div>
    </div>
  )
}

function RadiusExample({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div 
        className="aspect-square bg-primary/10 border-2 border-primary/20" 
        style={{ borderRadius: value }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs font-mono text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}
