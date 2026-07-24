type PillVariant = 'lead' | 'campanha' | 'template' | 'instancia'

interface StatusPillProps {
  status: string
  variant: PillVariant
}

const colorMap: Record<PillVariant, Record<string, string>> = {
  lead: {
    'Enviado': 'bg-blue-50 text-blue-700 border-blue-200',
    'Respondido': 'bg-green-50 text-green-700 border-green-200',
    'Reativado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Erro no Disparo': 'bg-red-50 text-red-700 border-red-200',
    'Pausado (Horário Excedido)': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  campanha: {
    'Em andamento': 'bg-green-50 text-green-700 border-green-200',
    'Concluída': 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
  template: {
    'Aprovado': 'bg-green-50 text-green-700 border-green-200',
    'em_revisao': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Em Revisão': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Rejeitado': 'bg-red-50 text-red-700 border-red-200',
  },
  instancia: {
    'Conectado': 'bg-green-50 text-green-700 border-green-200',
    'Desconectado': 'bg-red-50 text-red-700 border-red-200',
    'desconhecido': 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
}

const fallback = 'bg-zinc-100 text-zinc-600 border-zinc-200'

export default function StatusPill({ status, variant }: StatusPillProps) {
  const cls = colorMap[variant]?.[status] ?? fallback
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}
    >
      {status}
    </span>
  )
}
