"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const chartData = [
  { month: "Jan", disparos: 186, respostas: 80 },
  { month: "Fev", disparos: 305, respostas: 200 },
  { month: "Mar", disparos: 237, respostas: 120 },
  { month: "Abr", disparos: 173, respostas: 190 },
  { month: "Mai", disparos: 209, respostas: 130 },
  { month: "Jun", disparos: 214, respostas: 140 },
]

const chartConfig = {
  disparos: {
    label: "Total de Disparos",
    color: "var(--primary)",
  },
  respostas: {
    label: "Leads Respondidos",
    color: "var(--success)",
  },
} satisfies ChartConfig

export default function ChartsPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
        <p className="text-muted-foreground mt-2">
          Data visualization using Recharts v3 and shadcn integration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance de Disparos</CardTitle>
            <CardDescription>Volume de envios vs. Respostas por mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar 
                  dataKey="disparos" 
                  fill="var(--color-disparos)" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="respostas" 
                  fill="var(--color-respostas)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração</CardTitle>
                    <CardDescription>Como utilizar as cores do Design System.</CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                        <code>{`const chartConfig = {
  disparos: {
    label: "Total de Disparos",
    color: "var(--primary)",
  },
  respostas: {
    label: "Leads Respondidos",
    color: "var(--success)",
  },
} satisfies ChartConfig`}</code>
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Acessibilidade</CardTitle>
                    <CardDescription>Suporte nativo a leitores de tela.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <p>
                        Utilizamos a prop <code>accessibilityLayer</code> no <code>BarChart</code> para garantir que os dados sejam navegáveis via teclado e compreensíveis por tecnologias assistivas.
                    </p>
                    <div className="p-3 bg-info/5 border border-info/20 rounded-md text-info-foreground">
                        Dica: Sempre adicione rótulos claros no config para que o tooltip seja útil.
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
