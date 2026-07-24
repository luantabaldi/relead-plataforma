import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const leads = [
  {
    id: "LD-001",
    name: "Ricardo Silva",
    phone: "(11) 98765-4321",
    status: "Respondido",
    campaign: "Lançamento Sky",
    date: "2024-05-15",
  },
  {
    id: "LD-002",
    name: "Ana Oliveira",
    phone: "(11) 91234-5678",
    status: "Enviado",
    campaign: "Lançamento Sky",
    date: "2024-05-15",
  },
  {
    id: "LD-003",
    name: "Marcos Paulo",
    phone: "(11) 99887-7665",
    status: "Reativado",
    campaign: "Reativação Maio",
    date: "2024-05-14",
  },
]

export default function TablePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Table</h1>
        <p className="text-muted-foreground mt-2">
          Responsive tables for lead management and reports.
        </p>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableCaption>Lista recente de leads reativados.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.id}</TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.campaign}</TableCell>
                <TableCell>
                  <Badge 
                    variant={lead.status === "Reativado" ? "default" : lead.status === "Respondido" ? "secondary" : "outline"}
                    className={lead.status === "Reativado" ? "bg-success hover:bg-success/90" : ""}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{lead.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Usage</h3>
        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
          <code>{`import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"`}</code>
        </pre>
      </div>
    </div>
  )
}
