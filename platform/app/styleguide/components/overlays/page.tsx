import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Edit, Trash, ExternalLink } from "lucide-react"

export default function OverlaysPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overlays</h1>
        <p className="text-muted-foreground mt-2">
          Dialogs and menus that appear over the main content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dialog Example */}
        <Card>
          <CardHeader>
            <CardTitle>Dialogs (Modals)</CardTitle>
            <CardDescription>Focused tasks and confirmations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Ver Detalhes do Lead</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lead: João da Silva</DialogTitle>
                  <DialogDescription>
                    Informações completas e histórico de contato.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Telefone</p>
                      <p className="font-medium">+55 11 99999-9999</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">Qualificado</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-sm italic">
                    "O cliente demonstrou interesse em unidades de 2 quartos com vista para o mar."
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost">Fechar</Button>
                  <Button>Abrir no CV CRM</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Dropdown Menu Example */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown Menus</CardTitle>
            <CardDescription>Contextual actions for list items.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 border rounded-lg bg-card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ação para o Lead</p>
                <p className="text-xs text-muted-foreground">Clique no ícone para ver opções</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Editar Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ExternalLink className="mr-2 h-4 w-4" /> Ver no CRM
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" /> Excluir permanentemente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
