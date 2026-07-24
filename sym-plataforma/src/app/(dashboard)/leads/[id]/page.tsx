import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatusPill from '@/components/StatusPill'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadDetail {
  id: string
  nome_lead: string
  telefone: string
  status_reativacao: string
  tipo_campanha: string
  nome_campanha: string | null
  lead_id_cvcrm: string | null
  data_envio: string
  data_resposta: string | null
  mensagem_enviada: string
  ultima_resposta_lead: string | null
  historico_mensagens: unknown
}

interface ConversaIA {
  status_conversa: string
  interesse_detectado: boolean
  resumo_interesse: string | null
  imovel_interesse: string | null
}

type ChatMessage = { role: 'bot' | 'user'; message: string; timestamp?: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDT(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeHistory(raw: unknown): ChatMessage[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return []

  // Format A: [{ role, message, timestamp? }]
  if (typeof raw[0] === 'object' && raw[0] !== null && 'role' in (raw[0] as object)) {
    return raw as ChatMessage[]
  }

  // Format B: alternating strings — even index = bot, odd = user
  return (raw as string[]).map((message, i) => ({
    role: (i % 2 === 0 ? 'bot' : 'user') as 'bot' | 'user',
    message,
  }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-wider mb-0.5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </p>
      <p
        className={`text-sm ${capitalize ? 'capitalize' : ''}`}
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </p>
    </div>
  )
}

function AiBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; bg: string; color: string; border: string }> = {
    interesse_confirmado: {
      label: 'Interesse confirmado',
      bg: 'rgba(42,57,255,0.08)',
      color: 'var(--color-green-primary)',
      border: 'rgba(42,57,255,0.2)',
    },
    sem_interesse: {
      label: 'Sem interesse',
      bg: 'rgba(220,38,38,0.08)',
      color: '#DC2626',
      border: 'rgba(220,38,38,0.2)',
    },
    ativa: {
      label: 'Em análise',
      bg: 'rgba(0,0,0,0.04)',
      color: 'var(--color-text-secondary)',
      border: 'var(--color-border)',
    },
  }
  const v = variants[status] ?? variants['ativa']
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
    >
      {v.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch lead
  const { data: rawLead, error } = await supabase
    .from('leads_reativacao')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !rawLead) notFound()

  const lead = rawLead as LeadDetail

  // 2. Fetch conversas_ia by phone — separate query (no FK)
  const { data: rawConversa } = await supabase
    .from('conversas_ia')
    .select('status_conversa, interesse_detectado, resumo_interesse, imovel_interesse')
    .eq('telefone', lead.telefone)
    .maybeSingle()

  const conversa = rawConversa as ConversaIA | null
  const history = normalizeHistory(lead.historico_mensagens)

  const crmUrl =
    process.env.NEXT_PUBLIC_CVCRM_BASE_URL && lead.lead_id_cvcrm
      ? `${process.env.NEXT_PUBLIC_CVCRM_BASE_URL}/${lead.lead_id_cvcrm}`
      : null

  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }
  const muted = { color: 'var(--color-text-secondary)' }
  const primary = { color: 'var(--color-text-primary)' }
  const divider = { borderBottom: '1px solid var(--color-border)' }

  return (
    <div className="space-y-5">

      {/* ── Back button ── */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
        style={muted}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para leads
      </Link>

      {/* ── Two-column grid (60 / 40) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ──── LEFT COLUMN ──── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Card: Lead data */}
          <div className="rounded-xl p-6 space-y-5" style={card}>

            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold" style={primary}>
                  {lead.nome_lead}
                </h2>
                <p className="text-sm font-mono mt-0.5" style={muted}>
                  {lead.telefone}
                </p>
              </div>
              <StatusPill status={lead.status_reativacao} variant="lead" />
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Data de envio" value={fmtDT(lead.data_envio)} />
              <Field label="Data de resposta" value={fmtDT(lead.data_resposta)} />
              <Field label="Tipo de campanha" value={lead.tipo_campanha} capitalize />
              <Field label="Nome da campanha" value={lead.nome_campanha ?? '—'} />
            </div>

            {/* Template message */}
            {lead.mensagem_enviada && (
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={muted}
                >
                  Template enviado
                </p>
                <p
                  className="text-sm leading-relaxed p-4 rounded-lg whitespace-pre-wrap"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {lead.mensagem_enviada}
                </p>
              </div>
            )}

            {/* CRM link */}
            {crmUrl && (
              <div>
                <a
                  href={crmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: 'rgba(42,57,255,0.08)',
                    color: 'var(--color-green-primary)',
                    border: '1px solid rgba(42,57,255,0.2)',
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver no CV CRM
                </a>
              </div>
            )}
          </div>

          {/* Card: AI Analysis (only if conversas_ia record exists) */}
          {conversa && (
            <div className="rounded-xl p-6 space-y-4" style={card}>
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={muted}
                >
                  Análise da IA
                </p>
                <AiBadge status={conversa.status_conversa} />
              </div>

              {conversa.resumo_interesse && (
                <p className="text-sm leading-relaxed" style={primary}>
                  {conversa.resumo_interesse}
                </p>
              )}

              {conversa.imovel_interesse && (
                <div
                  className="rounded-lg px-4 py-3"
                  style={{
                    background: 'rgba(42,57,255,0.06)',
                    border: '1px solid rgba(42,57,255,0.15)',
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-green-primary)' }}
                  >
                    Imóvel de interesse
                  </p>
                  <p className="text-sm font-medium" style={primary}>
                    {conversa.imovel_interesse}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ──── RIGHT COLUMN (40%) ──── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden" style={card}>

            <div className="px-5 py-4" style={divider}>
              <p
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={muted}
              >
                Histórico da conversa
              </p>
            </div>

            {history.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm" style={muted}>
                  Conversa não iniciada
                </p>
              </div>
            ) : (
              <div
                className="p-4 space-y-3 overflow-y-auto"
                style={{ maxHeight: 500 }}
              >
                {history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className="px-3 py-2 rounded-xl text-sm leading-relaxed"
                      style={
                        msg.role === 'user'
                          ? { background: '#2A39FF', color: '#fff' }
                          : {
                              background: 'var(--color-bg-secondary)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                            }
                      }
                    >
                      {msg.message}
                    </div>
                    {msg.timestamp && (
                      <span
                        className="mt-1 px-1"
                        style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
                      >
                        {fmtDT(msg.timestamp)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
