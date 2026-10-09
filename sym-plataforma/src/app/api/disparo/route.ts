import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findBlocked, isBlockedIn } from '@/lib/blacklist'

interface LeadDoCsv {
  nome: string
  telefone: string
  observacao: string
}

interface PayloadDisparo {
  nome_campanha: string
  template_nome: string
  id_empreendimento: string
  tipo_campanha: string
  link_imagem: string | null
  leads: LeadDoCsv[]
}

export async function POST(request: NextRequest) {
  try {
    const body: PayloadDisparo = await request.json()

    // Validate required fields
    if (!body.nome_campanha?.trim()) {
      return NextResponse.json({ success: false, error: 'nome_campanha é obrigatório' }, { status: 400 })
    }
    if (!body.template_nome?.trim()) {
      return NextResponse.json({ success: false, error: 'template_nome é obrigatório' }, { status: 400 })
    }
    if (!body.id_empreendimento?.trim()) {
      return NextResponse.json({ success: false, error: 'id_empreendimento é obrigatório' }, { status: 400 })
    }
    if (!body.tipo_campanha?.trim()) {
      return NextResponse.json({ success: false, error: 'tipo_campanha é obrigatório' }, { status: 400 })
    }
    if (!Array.isArray(body.leads) || body.leads.length === 0) {
      return NextResponse.json({ success: false, error: 'leads[] não pode estar vazio' }, { status: 400 })
    }

    // Blacklist: revalidada no servidor (o filtro do cliente pode ser burlado).
    // Falha fechada: sem sessão ou sem conseguir consultar, nada é enviado.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }
    let blocked: Set<string>
    try {
      blocked = await findBlocked(supabase, body.leads.map((l) => l.telefone))
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'Falha ao consultar blacklist' },
        { status: 500 }
      )
    }
    const leadsPermitidos = body.leads.filter((l) => !isBlockedIn(blocked, l.telefone))
    const removidos = body.leads.length - leadsPermitidos.length
    if (leadsPermitidos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Todos os leads estão na blacklist. Nenhum disparo foi feito.' },
        { status: 422 }
      )
    }
    body.leads = leadsPermitidos

    const webhookUrl = process.env.N8N_WEBHOOK_DISPARO
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'Webhook de disparo não configurado no servidor' },
        { status: 500 }
      )
    }

    // Forward payload to n8n — this route does NOT write to Supabase
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => '')
      return NextResponse.json(
        {
          success: false,
          error: `Webhook retornou ${n8nRes.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, enviados: body.leads.length, removidos })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
