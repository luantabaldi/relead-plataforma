'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pause, Play, Wifi, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string
  nome_lead: string
  telefone: string
  status_reativacao: string
  data_envio: string | null
  data_resposta: string | null
}

type FeedEvent = {
  key: string
  nome_lead: string
  telefone: string
  status: string
  ts: number
  isError: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const ERROR_STATUSES = new Set(['Erro no Disparo', 'Pausado (Horário Excedido)'])

const STATUS_COLOR: Record<string, string> = {
  Enviado: '#0284C7',
  Respondido: '#16A34A',
  Reativado: '#2A39FF',
  'Erro no Disparo': '#DC2626',
  'Pausado (Horário Excedido)': '#D97706',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 2) return 'agora'
  if (diff < 60) return `há ${diff}s`
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  return `há ${Math.floor(diff / 3600)}h`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CountCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}

function FeedRow({ evt, tick }: { evt: FeedEvent; tick: number }) {
  const color = STATUS_COLOR[evt.status] ?? '#a1a1aa'
  return (
    <div
      className="feed-row px-5 py-3 flex items-center gap-3"
      style={evt.isError ? { background: 'rgba(220,38,38,0.06)' } : undefined}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {evt.nome_lead}
        </p>
        <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
          {evt.telefone}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold" style={{ color }}>
          {evt.status}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {relativeTime(evt.ts)}
        </p>
      </div>
      {/* tick is consumed here to trigger re-render for relative time */}
      <span className="sr-only">{tick}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MonitoramentoClient() {
  const searchParams = useSearchParams()
  const campanha = searchParams.get('campanha') ?? ''
  const expectedTotal = parseInt(searchParams.get('total') ?? '0', 10)

  const supabase = useRef(createClient()).current

  const [leads, setLeads] = useState<LeadRow[]>([])
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [tick, setTick] = useState(0)

  const pausedRef = useRef(false)
  const bufferRef = useRef<FeedEvent[]>([])

  // Tick every second to update relative timestamps
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Initial fetch of latest 50 leads for this campaign
  useEffect(() => {
    if (!campanha) return
    supabase
      .from('leads_reativacao')
      .select('id, nome_lead, telefone, status_reativacao, data_envio, data_resposta')
      .eq('nome_campanha', campanha)
      .order('data_envio', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setLeads(data as LeadRow[])
      })
  }, [campanha, supabase])

  // Realtime subscription — read-only, no writes
  useEffect(() => {
    if (!campanha) return

    const channel = supabase
      .channel(`monitor-${campanha}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads_reativacao',
          filter: `nome_campanha=eq.${campanha}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as LeadRow
          if (!row) return

          setLeads(prev => {
            const idx = prev.findIndex(l => l.id === row.id)
            if (idx === -1) return [row, ...prev].slice(0, 200)
            const next = [...prev]
            next[idx] = { ...next[idx], ...row }
            return next
          })

          const evt: FeedEvent = {
            key: `${row.id}-${Date.now()}`,
            nome_lead: row.nome_lead,
            telefone: row.telefone,
            status: row.status_reativacao,
            ts: Date.now(),
            isError: ERROR_STATUSES.has(row.status_reativacao),
          }

          if (pausedRef.current) {
            bufferRef.current.push(evt)
            setBuffered(bufferRef.current.length)
          } else {
            setFeed(prev => [evt, ...prev].slice(0, 100))
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campanha, supabase])

  // Derived counters
  const counts = leads.reduce(
    (acc, l) => {
      const s = l.status_reativacao
      if (s === 'Enviado') acc.enviados++
      else if (s === 'Respondido') acc.respondidos++
      else if (s === 'Reativado') acc.reativados++
      else if (ERROR_STATUSES.has(s)) acc.erros++
      return acc
    },
    { enviados: 0, respondidos: 0, reativados: 0, erros: 0 }
  )

  const totalProcessed = leads.length
  const progressPct =
    expectedTotal > 0 ? Math.min(100, Math.round((totalProcessed / expectedTotal) * 100)) : 0

  const handleTogglePause = () => {
    if (pausedRef.current) {
      pausedRef.current = false
      setPaused(false)
      const buf = bufferRef.current.splice(0)
      setBuffered(0)
      if (buf.length > 0) {
        setFeed(prev => [...buf.reverse(), ...prev].slice(0, 100))
      }
    } else {
      pausedRef.current = true
      setPaused(true)
    }
  }

  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }
  const muted = { color: 'var(--color-text-secondary)' }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/disparo"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
          style={muted}
        >
          <ArrowLeft className="h-4 w-4" />
          Nova campanha
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: connected ? '#16A34A' : '#D97706' }}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {connected ? 'Conectado' : 'Reconectando...'}
          </span>

          <button
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={card}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            {paused ? 'Retomar' : 'Pausar'}
            {paused && buffered > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                {buffered}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {campanha || '—'}
        </h1>
        <p className="text-sm mt-0.5" style={muted}>
          Monitoramento em tempo real
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-5 space-y-3" style={card}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Progresso do disparo
          </p>
          <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {totalProcessed} de {expectedTotal > 0 ? expectedTotal : '?'}
            {expectedTotal > 0 && (
              <span className="ml-1.5 font-normal" style={muted}>
                ({progressPct}%)
              </span>
            )}
          </p>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: 'var(--color-bg-secondary)' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'var(--color-green-primary)' }}
          />
        </div>
      </div>

      {/* Counter cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CountCard label="Enviados" value={counts.enviados} color="#0284C7" />
        <CountCard label="Respondidos" value={counts.respondidos} color="#16A34A" />
        <CountCard label="Reativados" value={counts.reativados} color="#2A39FF" />
        <CountCard label="Erros" value={counts.erros} color="#DC2626" />
      </div>

      {/* Event feed */}
      <div className="rounded-xl overflow-hidden" style={card}>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Feed de eventos
          </p>
          {paused && (
            <span className="text-[11px] text-yellow-700 font-medium">
              Pausado · {buffered} em fila
            </span>
          )}
        </div>

        {feed.length === 0 ? (
          <div className="flex items-center justify-center py-14">
            <p className="text-sm" style={muted}>
              Aguardando eventos…
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {feed.map(evt => (
              <FeedRow key={evt.key} evt={evt} tick={tick} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feed-row { animation: fadeSlideIn 0.25s ease both; }
      `}</style>
    </div>
  )
}
