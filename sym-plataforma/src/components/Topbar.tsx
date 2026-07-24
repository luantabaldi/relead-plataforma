'use client'

import { usePathname } from 'next/navigation'
import { Activity } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/campanhas': 'Campanhas',
  '/leads': 'Leads',
  '/disparo': 'Disparo',
  '/disparo/monitoramento': 'Monitoramento de Disparo',
  '/configuracoes': 'Configurações',
}

function getTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname]
  if (pathname.startsWith('/leads/')) return 'Detalhes do Lead'
  return 'Sym Imóveis'
}

export default function Topbar() {
  const pathname = usePathname()

  return (
    <header
      className="flex items-center justify-between px-6 h-14 shrink-0"
      style={{
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <h1
        className="text-sm font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {getTitle(pathname)}
      </h1>

      <div
        className="flex items-center gap-1.5 text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Activity className="h-3.5 w-3.5" style={{ color: 'var(--color-green-primary)' }} />
        <span>Dados em tempo real</span>
      </div>
    </header>
  )
}
