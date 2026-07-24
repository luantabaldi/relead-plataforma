'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart2,
  Building2,
  LogOut,
  MessageSquareShare,
  Settings,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const sections = [
  {
    label: 'Dashboard',
    items: [
      { href: '/', label: 'Visão Geral', icon: BarChart2 },
      { href: '/campanhas', label: 'Campanhas', icon: Building2 },
    ],
  },
  {
    label: 'Leads',
    items: [{ href: '/leads', label: 'Leads', icon: Users }],
  },
  {
    label: 'Operação',
    items: [
      { href: '/disparo', label: 'Disparo', icon: MessageSquareShare },
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

interface SidebarProps {
  userEmail: string
  userInitials: string
}

export default function Sidebar({ userEmail, userInitials }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="flex flex-col w-[200px] shrink-0 h-full"
      style={{
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="px-4 py-[18px]"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span className="text-[15px] font-bold" style={{ color: 'var(--color-green-primary)' }}>
          Sym
        </span>
        <span className="text-[15px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {' '}Imóveis
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p
              className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors"
                    style={{
                      color: active
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                      background: active ? 'var(--color-bg-card)' : 'transparent',
                      borderLeft: active
                        ? '2px solid var(--color-green-primary)'
                        : '2px solid transparent',
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5 mb-2 px-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: 'var(--color-green-primary)', color: '#fff' }}
          >
            {userInitials}
          </div>
          <span
            className="text-xs truncate flex-1"
            style={{ color: 'var(--color-text-secondary)' }}
            title={userEmail}
          >
            {userEmail}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-red-50"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
