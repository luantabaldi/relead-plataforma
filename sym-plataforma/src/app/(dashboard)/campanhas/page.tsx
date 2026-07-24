import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import LoadingSpinner from '@/components/LoadingSpinner'
import PeriodoFilter from './PeriodoFilter'
import CampanhasContent, { type CampanhaDashboard } from './CampanhasContent'

function getPeriodRange(periodo: string): { gte: string; lte?: string } {
  const now = new Date()
  const toDate = (d: Date) => d.toISOString().split('T')[0]

  switch (periodo) {
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { gte: toDate(d) }
    }
    case 'este_mes': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return { gte: toDate(d) }
    }
    case 'mes_anterior': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { gte: toDate(first), lte: `${toDate(last)}T23:59:59` }
    }
    default: {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return { gte: toDate(d) }
    }
  }
}

async function CampanhasList({ periodo }: { periodo: string }) {
  const supabase = await createClient()
  const { gte, lte } = getPeriodRange(periodo)

  let query = supabase
    .from('view_dashboard_campanhas')
    .select('*')
    .gte('ultimo_envio', gte)

  if (lte) query = query.lte('ultimo_envio', lte)

  const { data } = await query

  return <CampanhasContent data={(data ?? []) as CampanhaDashboard[]} />
}

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo = '30d' } = await searchParams

  return (
    <div className="space-y-6">
      <PeriodoFilter periodo={periodo} />

      <Suspense fallback={<LoadingSpinner />}>
        <CampanhasList periodo={periodo} />
      </Suspense>
    </div>
  )
}
