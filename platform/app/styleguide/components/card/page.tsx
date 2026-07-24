import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CardPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Card</h1>
        <p className="text-muted-foreground mt-2">
          Versatile containers for grouping related information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Card */}
        <Card>
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Uma breve descrição sobre o conteúdo abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este é o corpo principal do card. Use-o para exibir informações detalhadas, 
              formulários ou métricas.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost">Cancelar</Button>
            <Button>Salvar</Button>
          </CardFooter>
        </Card>

        {/* Lead Card Example */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interesse Recente</CardTitle>
            <Badge variant="secondary">Novo</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Residencial Sky</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lead: Ana Maria (+55 11 9...)
            </p>
            <div className="mt-4 p-3 bg-muted rounded-md text-xs italic">
              "Gostaria de saber mais sobre as unidades de 3 quartos."
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" className="w-full">Ver Conversa Completa</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
