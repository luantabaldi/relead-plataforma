import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findBlocked, isBlockedIn, normalizeTelefone } from '@/lib/blacklist'
import { tipoCampanhaDoAgente } from '@/lib/agentes'

interface LeadDoCsv {
  nome: string
  telefone: string
  observacao: string
}

interface PayloadDisparo {
  nome_campanha: string
  template_id: string
  id_empreendimento: string
  link_imagem: string | null
  phone_number_id: string
  agente_slug: string
  leads: LeadDoCsv[]
}

const CHUNK = 500

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const body: PayloadDisparo = await request.json()

    if (!body.nome_campanha?.trim()) return fail('nome_campanha é obrigatório', 400)
    if (!body.template_id?.trim()) return fail('template_id é obrigatório', 400)
    if (!body.id_empreendimento?.trim()) return fail('id_empreendimento é obrigatório', 400)
    if (!body.phone_number_id?.trim()) return fail('Selecione o número do disparo', 400)
    if (!body.agente_slug?.trim()) return fail('Selecione o agente de mensagem', 400)
    if (!Array.isArray(body.leads) || body.leads.length === 0) return fail('leads[] não pode estar vazio', 400)

    // Sem sessão não há como consultar blacklist nem gravar leads: falha fechada.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail('Não autenticado', 401)

    // Valida no servidor o que o cliente escolheu (template aprovado, número ativo, agente ativo)
    const [tpl, numero, agente, emp] = await Promise.all([
      supabase.from('templates_wpp').select('id, nome, status_meta').eq('id', body.template_id).maybeSingle(),
      supabase
        .from('numeros_whatsapp_status')
        .select('phone_number_id, status, ativo')
        .eq('phone_number_id', body.phone_number_id)
        .maybeSingle(),
      supabase.from('agentes').select('slug, ativo').eq('slug', body.agente_slug).maybeSingle(),
      supabase.from('empreendimentos').select('nome').eq('id', body.id_empreendimento).maybeSingle(),
    ])
    if (tpl.error || numero.error || agente.error) return fail('Falha ao validar as opções do disparo', 500)
    if (!tpl.data || !['APPROVED', 'Aprovado'].includes(tpl.data.status_meta)) {
      return fail('O template selecionado não está aprovado pela Meta', 422)
    }
    if (!numero.data || numero.data.ativo === false || (numero.data.status && numero.data.status !== 'CONNECTED')) {
      return fail('O número selecionado não está ativo ou conectado', 422)
    }
    if (!agente.data || agente.data.ativo === false) return fail('O agente selecionado não está ativo', 422)

    // Cada número pode ter o próprio workflow de disparo (a instância de envio fica no workflow).
    // Convenção: N8N_WEBHOOK_DISPARO_<phone_number_id>; sem ela, usa o webhook padrão.
    // O id já foi confirmado no banco acima, então o nome da variável é seguro.
    const webhookUrl =
      process.env[`N8N_WEBHOOK_DISPARO_${numero.data.phone_number_id}`] ?? process.env.N8N_WEBHOOK_DISPARO
    if (!webhookUrl) return fail('Webhook de disparo não configurado no servidor', 500)

    // O workflow identifica a campanha pelo nome: um nome já usado misturaria leads de disparos diferentes.
    const { count: jaExiste, error: errNome } = await supabase
      .from('leads_reativacao')
      .select('id', { count: 'exact', head: true })
      .eq('nome_campanha', body.nome_campanha.trim())
    if (errNome) return fail('Falha ao verificar o nome da campanha', 500)
    if ((jaExiste ?? 0) > 0) {
      return fail(`Já existe uma campanha chamada "${body.nome_campanha.trim()}". Use outro nome.`, 409)
    }

    // Blacklist: revalidada no servidor (o filtro do cliente pode ser burlado). Falha fechada.
    let blocked: Set<string>
    try {
      blocked = await findBlocked(supabase, body.leads.map((l) => l.telefone))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Falha ao consultar blacklist', 500)
    }

    // Remove bloqueados e telefones repetidos no próprio arquivo
    const vistos = new Set<string>()
    const leadsPermitidos: (LeadDoCsv & { tel: string })[] = []
    for (const l of body.leads) {
      const tel = normalizeTelefone(l.telefone)
      if (isBlockedIn(blocked, l.telefone) || vistos.has(tel)) continue
      vistos.add(tel)
      leadsPermitidos.push({ ...l, tel })
    }
    const removidos = body.leads.length - leadsPermitidos.length
    if (leadsPermitidos.length === 0) {
      return fail('Todos os leads estão na blacklist ou repetidos. Nenhum disparo foi feito.', 422)
    }

    // O workflow de disparo lê os leads 'Pendente' da campanha: gravamos antes de chamá-lo.
    const tipoCampanha = tipoCampanhaDoAgente(body.agente_slug)
    const rows = leadsPermitidos.map((l) => ({
      telefone: l.tel,
      nome_lead: l.nome,
      status_reativacao: 'Pendente',
      tipo_campanha: tipoCampanha,
      nome_campanha: body.nome_campanha.trim(),
      observacao_crm: l.observacao || null,
      empreendimento_id: body.id_empreendimento,
      empreendimento_nome: emp.data?.nome ?? null,
      mensagem_enviada: tpl.data!.nome,
      phone_number_id: body.phone_number_id,
      agente_slug: body.agente_slug,
    }))

    const insertedIds: string[] = []
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { data, error } = await supabase.from('leads_reativacao').insert(rows.slice(i, i + CHUNK)).select('id')
      if (error) {
        await desfazer(supabase, insertedIds)
        return fail(`Falha ao registrar os leads da campanha: ${error.message}`, 500)
      }
      insertedIds.push(...(data ?? []).map((r) => r.id as string))
    }

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_campanha: body.nome_campanha.trim(),
        template_id: body.template_id,
        template_nome: tpl.data.nome,
        id_empreendimento: body.id_empreendimento,
        tipo_campanha: tipoCampanha,
        agente_slug: body.agente_slug,
        phone_number_id: body.phone_number_id,
        imagem_url: body.link_imagem || null,
        link_imagem: body.link_imagem || null,
        total: leadsPermitidos.length,
      }),
    }).catch(() => null)

    if (!n8nRes || !n8nRes.ok) {
      await desfazer(supabase, insertedIds)
      const text = n8nRes ? await n8nRes.text().catch(() => '') : ''
      return fail(
        n8nRes
          ? `Webhook retornou ${n8nRes.status}${text ? `: ${text.slice(0, 200)}` : ''}`
          : 'Não foi possível contatar o webhook de disparo',
        502
      )
    }

    return NextResponse.json({ success: true, enviados: leadsPermitidos.length, removidos })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro desconhecido', 500)
  }
}

/** Se o n8n não aceitou o disparo, os leads gravados como Pendente são removidos para não ficarem órfãos. */
async function desfazer(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  for (let i = 0; i < ids.length; i += CHUNK) {
    await supabase.from('leads_reativacao').delete().in('id', ids.slice(i, i + CHUNK))
  }
}
