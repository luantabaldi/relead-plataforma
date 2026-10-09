import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Aciona no n8n a sincronização de templates, status do número e custos com a Meta. */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_SYNC
  if (!webhookUrl) {
    return NextResponse.json(
      { success: false, error: 'Webhook de sincronização não configurado no servidor (N8N_WEBHOOK_SYNC)' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origem: 'plataforma', usuario: user.email }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Webhook retornou ${res.status}` },
        { status: 502 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 502 }
    )
  }
}
