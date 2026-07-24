'use client'

import { useRouter } from 'next/navigation'

const OPTIONS = [
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Este mês', value: 'este_mes' },
  { label: 'Mês anterior', value: 'mes_anterior' },
]

export default function PeriodoFilter({ periodo }: { periodo: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = opt.value === periodo
        return (
          <button
            key={opt.value}
            onClick={() => router.push(`/campanhas?periodo=${opt.value}`)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: active ? 'var(--color-green-primary)' : 'var(--color-bg-card)',
              color: active ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
