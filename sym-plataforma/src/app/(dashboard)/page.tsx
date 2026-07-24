import { Suspense } from 'react'
import { Send, MessageSquare, Bot, Ban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import KpiCard from '@/components/KpiCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import DisparosPorDiaChart from '@/components/charts/DisparosPorDiaChart'
import FunilConversao from '@/components/charts/FunilConversao'

const fmt = (n: number) => n.toFixed(1).replace('.', ',') + '%'

// ─── Section: KPI Cards ───────────────────────────────────────────────────────

async function KpiSection() {
  const supabase = await createClient()
  const { data } = await supabase.from('view_kpis_gerais').select('*').single()
  if (!data) return null

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        label="Volume Disparado"
        value={data.total_disparos.toLocaleString('pt-BR')}
        icon={Send}
      />
      <KpiCard
        label="Taxa de Resposta"
        value={fmt(data.taxa_resposta)}
        icon={MessageSquare}
      />
      <KpiCard
        label="Qualificação IA"
        value={fmt(data.taxa_qualificacao_ia)}
        icon={Bot}
      />
      <KpiCard
        label="Opt-out"
        value={fmt(data.taxa_optout)}
        icon={Ban}
      />
    </div>
  )
}

// ─── Section: Bar Chart + Funnel (side-by-side) ───────────────────────────────

async function ChartsRow() {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString().split('T')[0]

  const [{ data: diasData }, { data: funilData }] = await Promise.all([
    supabase.from('view_disparos_por_dia').select('*').gte('dia', since).order('dia'),
    supabase.from('view_funil_conversao').select('*'),
  ])

  const cardStyle = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
  }

  const sectionTitle = {
    color: 'var(--color-text-secondary)',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl p-5" style={cardStyle}>
        <p
          className="text-[11px] font-semibold uppercase tracking-wider mb-4"
          style={sectionTitle}
        >
          Disparos por Dia
        </p>
        <DisparosPorDiaChart data={diasData ?? []} />
      </div>

      <div className="rounded-xl p-5" style={cardStyle}>
        <p
          className="text-[11px] font-semibold uppercase tracking-wider mb-4"
          style={sectionTitle}
        >
          Funil de Conversão
        </p>
        <FunilConversao data={funilData ?? []} />
      </div>
    </div>
  )
}

// ─── Section: Campaign Performance Table ─────────────────────────────────────

async function CampanhasSection() {
  const supabase = await createClient()
  const { data: campanhas } = await supabase.from('view_dashboard_campanhas').select('*')
  if (!campanhas?.length) return null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Performance por Tipo de Campanha
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Tipo', 'Disparos', 'Respondidos', 'Reativados', 'Conversão'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campanhas.map((c, i) => (
            <tr
              key={c.tipo_campanha}
              style={
                i < campanhas.length - 1
                  ? { borderBottom: '1px solid var(--color-border)' }
                  : undefined
              }
            >
              <td
                className="px-5 py-4 font-medium capitalize"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {c.tipo_campanha}
              </td>
              <td className="px-5 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                {c.total_disparos.toLocaleString('pt-BR')}
              </td>
              <td className="px-5 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                {c.respondidos.toLocaleString('pt-BR')}
              </td>
              <td className="px-5 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                {c.reativados.toLocaleString('pt-BR')}
              </td>
              <td className="px-5 py-4">
                <span
                  className="font-semibold"
                  style={{ color: 'var(--color-green-primary)' }}
                >
                  {fmt(c.taxa_conversao)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSpinner />}>
        <KpiSection />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <ChartsRow />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <CampanhasSection />
      </Suspense>
    </div>
  )
}
