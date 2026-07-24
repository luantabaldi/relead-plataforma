import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Trash, Plus, Loader2 } from "lucide-react"

export default function ButtonPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Button</h1>
        <p className="text-muted-foreground mt-2">
          Interactive button components with various styles and states.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Different visual styles for various contexts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
            <CardDescription>From compact to large scale.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
                <Plus className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* States & Icons */}
        <Card>
          <CardHeader>
            <CardTitle>States & Icons</CardTitle>
            <CardDescription>Buttons with loading states and icons.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Lead
            </Button>
            <Button variant="outline">
                <Send className="mr-2 h-4 w-4" /> Enviar Agora
            </Button>
            <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </Button>
            <Button variant="destructive" size="icon">
                <Trash className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
