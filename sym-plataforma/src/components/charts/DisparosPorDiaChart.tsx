'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DisparosDia {
  dia: string
  total: number
  respondidos: number
  reativados: number
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: DisparosDia }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Total: <span style={{ color: 'var(--color-text-primary)' }}>{d.total}</span>
      </p>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Respondidos: <span style={{ color: 'var(--color-text-primary)' }}>{d.respondidos}</span>
      </p>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Reativados: <span style={{ color: 'var(--color-text-primary)' }}>{d.reativados}</span>
      </p>
    </div>
  )
}

interface Props {
  data: DisparosDia[]
}

export default function DisparosPorDiaChart({ data }: Props) {
  const formatted = data.map((d) => {
    const parts = d.dia.split('-')
    return { ...d, label: `${parts[2]}/${parts[1]}` }
  })

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#6B7280', fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#6B7280', fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="total" fill="#2A39FF" radius={[4, 4, 0, 0]} name="Total" />
      </BarChart>
    </ResponsiveContainer>
  )
}
