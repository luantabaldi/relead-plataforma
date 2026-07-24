import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, Send } from "lucide-react"

export default function TabsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tabs</h1>
        <p className="text-muted-foreground mt-2">
          Organize related content into navigable sections.
        </p>
      </div>

      <div className="space-y-12">
        {/* Simple Tabs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Standard Tabs</h2>
          <Tabs defaultValue="overview" className="w-full max-w-2xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="analytics">Métricas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Visão Geral</CardTitle>
                  <CardDescription>Resumo de atividade das últimas 24 horas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Aqui você vê o volume total de leads processados.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Dados</CardTitle>
                  <CardDescription>Performance detalhada por canal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  Gráficos e estatísticas de conversão aparecerão aqui.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
               <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>Ajustes finos do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  Configure webhooks e limites de disparos.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Icon Tabs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tabs with Icons</h2>
          <Tabs defaultValue="leads" className="w-full">
            <TabsList>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Leads
              </TabsTrigger>
              <TabsTrigger value="disparos" className="flex items-center gap-2">
                <Send className="w-4 h-4" /> Disparos
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Relatórios
              </TabsTrigger>
            </TabsList>
            <div className="mt-4 p-8 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground italic">
              Conteúdo da tab selecionada aparecerá aqui.
            </div>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
