'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Minus, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatusPill from '@/components/StatusPill'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Enviado', value: 'Enviado' },
  { label: 'Respondido', value: 'Respondido' },
  { label: 'Reativado', value: 'Reativado' },
  { label: 'Erro', value: 'erro' },
  { label: 'Pausado', value: 'pausado' },
]

const STATUS_DB: Record<string, string> = {
  erro: 'Erro no Disparo',
  pausado: 'Pausado (Horário Excedido)',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string
  nome_lead: string
  telefone: string
  status_reativacao: string
  tipo_campanha: string
  nome_campanha: string | null
  data_envio: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escape(v: string | null | undefined) {
  return `"${(v ?? '').replace(/"/g, '""')}"`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useRef(createClient()).current

  // Filter state from URL
  const status = searchParams.get('status') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const campanha = searchParams.get('campanha') ?? ''
  const qualificados = searchParams.get('qualificados') === '1'
  const inicio = searchParams.get('inicio') ?? ''
  const fim = searchParams.get('fim') ?? ''
  const qParam = searchParams.get('q') ?? ''
  const pagina = Math.max(0, parseInt(searchParams.get('pagina') ?? '0', 10))

  // Local state
  const [searchInput, setSearchInput] = useState(qParam)
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [conversasMap, setConversasMap] = useState<Map<string, boolean>>(new Map())
  const [tipos, setTipos] = useState<string[]>([])
  const [campanhas, setCampanhas] = useState<string[]>([])

  const debouncedQ = useDebounce(searchInput, 400)

  // Push debounced search to URL (replace to avoid polluting history)
  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (debouncedQ === current) return
    const p = new URLSearchParams(searchParams.toString())
    if (debouncedQ) p.set('q', debouncedQ)
    else p.delete('q')
    p.delete('pagina')
    router.replace(`/leads?${p.toString()}`, { scroll: false })
  }, [debouncedQ])

  // Sync URL q back to input on external navigation (e.g. back button)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])

  // Load distinct dropdown values once
  useEffect(() => {
    async function loadOptions() {
      const [tiposRes, campanhasRes] = await Promise.all([
        supabase.from('leads_reativacao').select('tipo_campanha').order('tipo_campanha'),
        supabase
          .from('leads_reativacao')
          .select('nome_campanha')
          .not('nome_campanha', 'is', null)
          .order('nome_campanha'),
      ])
      setTipos([...new Set(tiposRes.data?.map((r) => r.tipo_campanha).filter(Boolean) ?? [])])
      setCampanhas([
        ...new Set(campanhasRes.data?.map((r) => r.nome_campanha).filter(Boolean) ?? []),
      ])
    }
    loadOptions()
  }, [])

  // Fetch leads page
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        // Resolve "apenas qualificados" filter via separate conversas_ia query
        let qualPhones: string[] | undefined
        if (qualificados) {
          const { data } = await supabase
            .from('conversas_ia')
            .select('telefone')
            .eq('interesse_detectado', true)
          qualPhones = data?.map((c) => c.telefone) ?? []
          if (qualPhones.length === 0) {
            if (!cancelled) { setLeads([]); setTotal(0) }
            return
          }
        }

        const dbStatus = STATUS_DB[status] ?? status

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function applyFilters(q: any) {
          if (dbStatus) q = q.eq('status_reativacao', dbStatus)
          if (tipo) q = q.eq('tipo_campanha', tipo)
          if (campanha) q = q.eq('nome_campanha', campanha)
          if (inicio) q = q.gte('data_envio', inicio)
          if (fim) q = q.lte('data_envio', `${fim}T23:59:59`)
          if (qParam) q = q.or(`nome_lead.ilike.%${qParam}%,telefone.ilike.%${qParam}%`)
          if (qualPhones) q = q.in('telefone', qualPhones)
          return q
        }

        const from = pagina * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        const { data, count } = await applyFilters(
          supabase
            .from('leads_reativacao')
            .select(
              'id, nome_lead, telefone, status_reativacao, tipo_campanha, nome_campanha, data_envio',
              { count: 'exact' }
            )
        )
          .order('data_envio', { ascending: false })
          .range(from, to)

        if (cancelled) return
        setLeads(data ?? [])
        setTotal(count ?? 0)

        // Enrich with conversas_ia — separate query by phone
        if (data?.length) {
          const phones = (data as LeadRow[]).map((l) => l.telefone)
          const { data: conversas } = await supabase
            .from('conversas_ia')
            .select('telefone, interesse_detectado')
            .in('telefone', phones)

          if (!cancelled) {
            const map = new Map<string, boolean>()
            conversas?.forEach((c) => map.set(c.telefone, c.interesse_detectado))
            setConversasMap(map)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [status, tipo, campanha, qualificados, inicio, fim, qParam, pagina])

  // ── URL update helpers ──────────────────────────────────────────────────────

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('pagina')
    router.push(`/leads?${p.toString()}`, { scroll: false })
  }

  function setPage(pg: number) {
    const p = new URLSearchParams(searchParams.toString())
    if (pg > 0) p.set('pagina', String(pg))
    else p.delete('pagina')
    router.push(`/leads?${p.toString()}`, { scroll: false })
  }

  // ── CSV Export ──────────────────────────────────────────────────────────────

  async function handleExportCSV() {
    setExporting(true)
    try {
      let qualPhones: string[] | undefined
      if (qualificados) {
        const { data } = await supabase
          .from('conversas_ia')
          .select('telefone')
          .eq('interesse_detectado', true)
        qualPhones = data?.map((c) => c.telefone) ?? []
        if (!qualPhones.length) return
      }

      const dbStatus = STATUS_DB[status] ?? status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from('leads_reativacao')
        .select('nome_lead, telefone, status_reativacao, tipo_campanha, nome_campanha, data_envio')

      if (dbStatus) q = q.eq('status_reativacao', dbStatus)
      if (tipo) q = q.eq('tipo_campanha', tipo)
      if (campanha) q = q.eq('nome_campanha', campanha)
      if (inicio) q = q.gte('data_envio', inicio)
      if (fim) q = q.lte('data_envio', `${fim}T23:59:59`)
      if (qParam) q = q.or(`nome_lead.ilike.%${qParam}%,telefone.ilike.%${qParam}%`)
      if (qualPhones) q = q.in('telefone', qualPhones)

      const { data } = await q.order('data_envio', { ascending: false })
      if (!data?.length) return

      const headers = ['Nome', 'Telefone', 'Status', 'Tipo', 'Campanha', 'Data Envio']
      const rows = (data as LeadRow[]).map((l) =>
        [
          l.nome_lead,
          l.telefone,
          l.status_reativacao,
          l.tipo_campanha,
          l.nome_campanha ?? '',
          l.data_envio,
        ].map((v) => escape(String(v ?? '')))
      )

      // BOM for Excel UTF-8 compatibility
      const csv =
        '﻿' + [headers.map(escape), ...rows].map((r) => r.join(',')).join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const fromRow = total === 0 ? 0 : pagina * PAGE_SIZE + 1
  const toRow = Math.min((pagina + 1) * PAGE_SIZE, total)

  // ── Styles ──────────────────────────────────────────────────────────────────

  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }
  const muted = { color: 'var(--color-text-secondary)' }
  const primary = { color: 'var(--color-text-primary)' }
  const divider = '1px solid var(--color-border)'

  const inputStyle = useMemo(
    () => ({
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
    }),
    []
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Status Chips ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = opt.value === status
          return (
            <button
              key={opt.value}
              onClick={() => setParam('status', opt.value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: active ? 'var(--color-green-primary)' : 'var(--color-bg-card)',
                color: active ? '#fff' : 'var(--color-text-secondary)',
                border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── Secondary Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={tipo}
          onChange={(e) => setParam('tipo', e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
          style={inputStyle}
        >
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={campanha}
          onChange={(e) => setParam('campanha', e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
          style={inputStyle}
        >
          <option value="">Todas as campanhas</option>
          {campanhas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={inicio}
          onChange={(e) => setParam('inicio', e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
        <input
          type="date"
          value={fim}
          onChange={(e) => setParam('fim', e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />

        <button
          onClick={() => setParam('qualificados', qualificados ? '' : '1')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            background: qualificados ? 'rgba(29, 158, 117, 0.15)' : 'var(--color-bg-card)',
            border: `1px solid ${qualificados ? 'var(--color-green-primary)' : 'var(--color-border)'}`,
            color: qualificados ? 'var(--color-green-primary)' : 'var(--color-text-secondary)',
          }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
            style={{
              background: qualificados ? 'var(--color-green-primary)' : 'transparent',
              border: `1.5px solid ${qualificados ? 'transparent' : 'var(--color-border)'}`,
            }}
          >
            {qualificados && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          Apenas qualificados
        </button>
      </div>

      {/* ── Search + Export ── */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="flex-1 max-w-sm rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <button
          onClick={handleExportCSV}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            ...inputStyle,
            color: 'var(--color-text-secondary)',
            opacity: exporting || total === 0 ? 0.5 : 1,
            cursor: exporting || total === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar CSV
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl overflow-hidden" style={card}>
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div
              className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'var(--color-green-primary)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-sm" style={muted}>
            Nenhum lead encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr style={{ borderBottom: divider }}>
                  {['Nome', 'Telefone', 'Status', 'Campanha', 'Data Envio', 'Interesse IA', 'Ações'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={muted}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    style={i < leads.length - 1 ? { borderBottom: divider } : undefined}
                  >
                    <td
                      className="px-4 py-3.5 text-sm font-medium whitespace-nowrap"
                      style={primary}
                    >
                      {lead.nome_lead}
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm whitespace-nowrap font-mono text-xs"
                      style={muted}
                    >
                      {lead.telefone}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusPill status={lead.status_reativacao} variant="lead" />
                    </td>
                    <td
                      className="px-4 py-3.5 text-sm capitalize whitespace-nowrap"
                      style={muted}
                    >
                      {lead.nome_campanha ?? lead.tipo_campanha}
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap" style={muted}>
                      {fmtDate(lead.data_envio)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {conversasMap.get(lead.telefone) === true ? (
                        <Check
                          className="h-4 w-4 mx-auto"
                          style={{ color: 'var(--color-green-primary)' }}
                        />
                      ) : (
                        <Minus
                          className="h-4 w-4 mx-auto opacity-30"
                          style={muted}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {total > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: divider }}
          >
            <span className="text-xs" style={muted}>
              Mostrando {fromRow}–{toRow} de {total.toLocaleString('pt-BR')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(pagina - 1)}
                disabled={pagina === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color:
                    pagina === 0 ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                  opacity: pagina === 0 ? 0.4 : 1,
                  cursor: pagina === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft className="h-3 w-3" /> Anterior
              </button>
              <button
                onClick={() => setPage(pagina + 1)}
                disabled={pagina >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color:
                    pagina >= totalPages - 1
                      ? 'var(--color-text-secondary)'
                      : 'var(--color-text-primary)',
                  opacity: pagina >= totalPages - 1 ? 0.4 : 1,
                  cursor: pagina >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Próxima <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
