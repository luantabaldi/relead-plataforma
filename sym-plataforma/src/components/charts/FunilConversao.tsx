'use client'

interface FunilEtapa {
  etapa: string
  quantidade: number
  percentual_sobre_total: number
}

interface Props {
  data: FunilEtapa[]
}

const ETAPA_COLORS: Record<string, string> = {
  'Disparados': '#0284C7',
  'Respondidos': '#16A34A',
  'Qualificados IA': '#2A39FF',
  'Reativados': '#D97706',
}

const FALLBACK_COLORS = ['#0284C7', '#16A34A', '#2A39FF', '#D97706']

export default function FunilConversao({ data }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {data.map((etapa, i) => {
        const color = ETAPA_COLORS[etapa.etapa] ?? FALLBACK_COLORS[i] ?? '#6B7280'
        return (
          <div key={etapa.etapa} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {etapa.etapa}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {etapa.quantidade.toLocaleString('pt-BR')}
                </span>
                {' '}
                <span className="opacity-60">({etapa.percentual_sobre_total}%)</span>
              </span>
            </div>
            <div
              className="h-5 rounded overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.06)' }}
            >
              <div
                className="h-full rounded"
                style={{
                  width: `${etapa.percentual_sobre_total}%`,
                  background: color,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
