import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  delta?: string
  deltaType?: 'up' | 'down'
}

export default function KpiCard({ label, value, icon: Icon, delta, deltaType }: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(42, 57, 255, 0.1)',
            color: 'var(--color-green-primary)',
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className="text-2xl font-bold leading-none"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {value}
        </span>

        {delta && (
          <div
            className="flex items-center gap-1 text-xs font-medium pb-0.5"
            style={{
              color: deltaType === 'up' ? 'var(--color-green-primary)' : '#DC2626',
            }}
          >
            {deltaType === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  )
}
