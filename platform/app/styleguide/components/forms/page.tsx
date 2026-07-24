import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
        <p className="text-muted-foreground mt-2">
          Input fields and controls for creating campaigns and filtering leads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Text Inputs</CardTitle>
            <CardDescription>Standard text fields with labels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="nome@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input type="text" id="name" placeholder="Ex: Lançamento Junho" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disabled">Campo Desativado</Label>
              <Input disabled type="text" id="disabled" placeholder="Não editável" />
            </div>
          </CardContent>
        </Card>

        {/* Selection Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Selection & Toggles</CardTitle>
            <CardDescription>Dropdowns and checkboxes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Empreendimento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sky">Residencial Sky</SelectItem>
                  <SelectItem value="garden">Vila Garden</SelectItem>
                  <SelectItem value="ocean">Ocean View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito os termos de uso e privacidade
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="marketing" defaultChecked />
              <label
                htmlFor="marketing"
                className="text-sm font-medium leading-none"
              >
                Enviar notificações de marketing
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-xl p-8 bg-card shadow-sm max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Exemplo de Formulário</h3>
          <p className="text-sm text-muted-foreground">Preencha para iniciar um novo disparo.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID do Empreendimento (CV CRM)</Label>
            <Input type="number" placeholder="0000" />
          </div>
          <div className="space-y-2">
            <Label>Template do WhatsApp</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reativacao_v1">Reativação Padrão</SelectItem>
                <SelectItem value="oferta_ativa">Oferta Ativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Criar Campanha</Button>
        </div>
      </div>
    </div>
  )
}
