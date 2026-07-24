'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import StatusPill from '@/components/StatusPill'

type SortKey = 'total_disparos' | 'taxa_conversao'

export interface CampanhaDashboard {
  nome_campanha: string | null
  tipo_campanha: string
  total_disparos: number
  enviados: number
  respondidos: number
  reativados: number
  erros: number
  taxa_conversao: number
  primeiro_envio: string
  ultimo_envio: string
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',') + '%'

function getStatus(ultimoEnvio: string): 'Em andamento' | 'Concluída' {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 2)
  return new Date(ultimoEnvio) >= cutoff ? 'Em andamento' : 'Concluída'
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-40" />
  return dir === 'asc' ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  )
}

export default function CampanhasContent({ data }: { data: CampanhaDashboard[] }) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) =>
        sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
      )
    : data

  const totalReativados = data.reduce((s, c) => s + c.reativados, 0)
  const melhor = data.reduce<CampanhaDashboard | null>(
    (max, c) => (!max || c.taxa_conversao > max.taxa_conversao ? c : max),
    null
  )

  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }
  const muted = { color: 'var(--color-text-secondary)' }
  const primary = { color: 'var(--color-text-primary)' }
  const divider = '1px solid var(--color-border)'

  const thCls =
    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-4 py-3.5 whitespace-nowrap text-sm'

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 flex flex-col gap-2" style={card}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Total de Campanhas
          </span>
          <span className="text-3xl font-bold" style={primary}>
            {data.length}
          </span>
        </div>

        <div className="rounded-xl p-5 flex flex-col gap-2" style={card}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Melhor Conversão
          </span>
          {melhor ? (
            <>
              <span
                className="text-3xl font-bold"
                style={{ color: 'var(--color-green-primary)' }}
              >
                {fmt(melhor.taxa_conversao)}
              </span>
              <span className="text-xs capitalize truncate" style={muted}>
                {melhor.nome_campanha ?? melhor.tipo_campanha}
              </span>
            </>
          ) : (
            <span className="text-3xl font-bold" style={primary}>
              —
            </span>
          )}
        </div>

        <div className="rounded-xl p-5 flex flex-col gap-2" style={card}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Leads Reativados
          </span>
          <span className="text-3xl font-bold" style={primary}>
            {totalReativados.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden" style={card}>
        {sorted.length === 0 ? (
          <div className="py-16 text-center text-sm" style={muted}>
            Nenhuma campanha no período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: divider }}>
                  <th className={thCls} style={muted}>
                    Nome da Campanha
                  </th>
                  <th className={thCls} style={muted}>
                    Tipo
                  </th>
                  <th
                    className={`${thCls} cursor-pointer select-none`}
                    style={muted}
                    onClick={() => handleSort('total_disparos')}
                  >
                    <span className="flex items-center gap-1">
                      Disparos
                      <SortIcon active={sortKey === 'total_disparos'} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thCls} style={muted}>
                    Respondidos
                  </th>
                  <th className={thCls} style={muted}>
                    Reativados
                  </th>
                  <th
                    className={`${thCls} cursor-pointer select-none`}
                    style={muted}
                    onClick={() => handleSort('taxa_conversao')}
                  >
                    <span className="flex items-center gap-1">
                      Conversão
                      <SortIcon active={sortKey === 'taxa_conversao'} dir={sortDir} />
                    </span>
                  </th>
                  <th className={thCls} style={muted}>
                    Primeiro Envio
                  </th>
                  <th className={thCls} style={muted}>
                    Último Envio
                  </th>
                  <th className={thCls} style={muted}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => {
                  const status = getStatus(c.ultimo_envio)
                  return (
                    <tr
                      key={`${c.tipo_campanha}-${c.primeiro_envio}`}
                      style={i < sorted.length - 1 ? { borderBottom: divider } : undefined}
                    >
                      <td className={tdCls} style={primary}>
                        <span className="font-medium">
                          {c.nome_campanha ?? (
                            <span style={muted}>—</span>
                          )}
                        </span>
                      </td>
                      <td className={`${tdCls} capitalize`} style={muted}>
                        {c.tipo_campanha}
                      </td>
                      <td className={tdCls} style={muted}>
                        {c.total_disparos.toLocaleString('pt-BR')}
                      </td>
                      <td className={tdCls} style={muted}>
                        {c.respondidos.toLocaleString('pt-BR')}
                      </td>
                      <td className={tdCls} style={muted}>
                        {c.reativados.toLocaleString('pt-BR')}
                      </td>
                      <td className={tdCls}>
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--color-green-primary)' }}
                        >
                          {fmt(c.taxa_conversao)}
                        </span>
                      </td>
                      <td className={tdCls} style={muted}>
                        {fmtDate(c.primeiro_envio)}
                      </td>
                      <td className={tdCls} style={muted}>
                        {fmtDate(c.ultimo_envio)}
                      </td>
                      <td className={tdCls}>
                        <StatusPill status={status} variant="campanha" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
