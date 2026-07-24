import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const emailPrefix = user.email?.split('@')[0] ?? 'U'
  const userInitials = emailPrefix.slice(0, 2).toUpperCase()
  const userEmail = user.email ?? ''

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <Sidebar userEmail={userEmail} userInitials={userInitials} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
