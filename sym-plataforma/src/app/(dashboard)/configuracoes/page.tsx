'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, RefreshCw, X, Loader2, MessageSquare, Wifi } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatusPill from '@/components/StatusPill'

// ── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id: string
  nome: string
  tipo: string | null
  status_meta: string
}

type Instancia = {
  id: string
  numero: string | null
  setor: string | null
  status: string
}

type Tab = 'templates' | 'instancias'

// ── Constants ─────────────────────────────────────────────────────────────────

const TIPO_OPTIONS = ['Reativação', 'Prospecção']
const SETOR_OPTIONS = ['Planta', 'Pronto para morar', 'Locação']

// ── Shared modal primitives ───────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors focus:ring-1'
const inputStyle = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
}

function SaveButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
      style={{ background: 'var(--color-green-primary)', color: '#fff' }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Salvar
    </button>
  )
}

// ── Templates tab ─────────────────────────────────────────────────────────────

function TemplatesTab({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const [rows, setRows] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; row: Template | null }>({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const nomeRef = useRef<HTMLInputElement>(null)
  const tipoRef = useRef<HTMLSelectElement>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('templates_wpp')
      .select('id, nome, tipo, status_meta')
      .order('nome')
    setRows((data as Template[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => setModal({ open: true, row: null })
  const openEdit = (r: Template) => setModal({ open: true, row: r })
  const closeModal = () => setModal({ open: false, row: null })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nome = nomeRef.current?.value.trim() ?? ''
    const tipo = tipoRef.current?.value ?? ''
    if (!nome) { toast.error('Nome é obrigatório'); return }

    setSaving(true)
    try {
      if (modal.row) {
        const { error } = await supabase
          .from('templates_wpp')
          .update({ nome, tipo: tipo || null })
          .eq('id', modal.row.id)
        if (error) throw error
        toast.success('Template atualizado')
      } else {
        const { error } = await supabase
          .from('templates_wpp')
          .insert({ nome, tipo: tipo || null })
        if (error) throw error
        toast.success('Template criado')
      }
      closeModal()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const muted = { color: 'var(--color-text-secondary)' }
  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm" style={muted}>
            {rows.length} template{rows.length !== 1 ? 's' : ''} cadastrado{rows.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--color-green-primary)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" />
            Novo template
          </button>
        </div>

        <div className="rounded-xl overflow-hidden" style={card}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={muted} />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <MessageSquare className="h-8 w-8 opacity-30" style={muted} />
              <p className="text-sm" style={muted}>Nenhum template cadastrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Nome', 'Tipo', 'Status Meta', 'Ações'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={muted}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {r.nome}
                    </td>
                    <td className="px-4 py-3" style={muted}>
                      {r.tipo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status_meta} variant="template" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          onClick={() =>
                            toast.info(
                              'Verifique o status deste template diretamente no painel Meta Business.'
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Sincronizar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.open && (
        <Modal
          title={modal.row ? 'Editar template' : 'Novo template'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome">
              <input
                ref={nomeRef}
                defaultValue={modal.row?.nome ?? ''}
                placeholder="Ex: Reativação Planta Q1"
                className={inputCls}
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Field label="Tipo">
              <select
                ref={tipoRef}
                defaultValue={modal.row?.tipo ?? ''}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Selecione...</option>
                {TIPO_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <SaveButton loading={saving} />
          </form>
        </Modal>
      )}
    </>
  )
}

// ── Instâncias tab ────────────────────────────────────────────────────────────

function InstanciasTab({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const [rows, setRows] = useState<Instancia[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; row: Instancia | null }>({ open: false, row: null })
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const numeroRef = useRef<HTMLInputElement>(null)
  const setorRef = useRef<HTMLSelectElement>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('instancias_wpp')
      .select('id, numero, setor, status')
      .order('setor')
    setRows((data as Instancia[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => setModal({ open: true, row: null })
  const openEdit = (r: Instancia) => setModal({ open: true, row: r })
  const closeModal = () => setModal({ open: false, row: null })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numero = numeroRef.current?.value.trim() ?? ''
    const setor = setorRef.current?.value ?? ''
    if (!numero) { toast.error('Número é obrigatório'); return }

    setSaving(true)
    try {
      if (modal.row) {
        const { error } = await supabase
          .from('instancias_wpp')
          .update({ numero, setor: setor || null })
          .eq('id', modal.row.id)
        if (error) throw error
        toast.success('Instância atualizada')
      } else {
        const { error } = await supabase
          .from('instancias_wpp')
          .insert({ numero, setor: setor || null })
        if (error) throw error
        toast.success('Instância criada')
      }
      closeModal()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (r: Instancia) => {
    const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL
    if (!apiUrl) {
      toast.info('Integração Evolution API não configurada. Atualize o status manualmente.')
      return
    }

    setUpdatingId(r.id)
    try {
      const res = await fetch(
        `${apiUrl}/instance/connectionState/${r.numero}`,
        { headers: { apikey: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY ?? '' } }
      )
      if (!res.ok) throw new Error(`Evolution API retornou ${res.status}`)
      const json = await res.json()
      const newStatus: string = json?.instance?.state === 'open' ? 'Conectado' : 'Desconectado'

      const { error } = await supabase
        .from('instancias_wpp')
        .update({ status: newStatus })
        .eq('id', r.id)
      if (error) throw error

      toast.success(`Status atualizado: ${newStatus}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status')
    } finally {
      setUpdatingId(null)
    }
  }

  const muted = { color: 'var(--color-text-secondary)' }
  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm" style={muted}>
            {rows.length} instância{rows.length !== 1 ? 's' : ''} cadastrada{rows.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--color-green-primary)', color: '#fff' }}
          >
            <Plus className="h-4 w-4" />
            Nova instância
          </button>
        </div>

        <div className="rounded-xl overflow-hidden" style={card}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin" style={muted} />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <Wifi className="h-8 w-8 opacity-30" style={muted} />
              <p className="text-sm" style={muted}>Nenhuma instância cadastrada</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Número', 'Setor', 'Status', 'Ações'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={muted}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {r.numero ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={muted}>
                      {r.setor ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} variant="instancia" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r)}
                          disabled={updatingId === r.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
                          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                          {updatingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Atualizar status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.open && (
        <Modal
          title={modal.row ? 'Editar instância' : 'Nova instância'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Número">
              <input
                ref={numeroRef}
                defaultValue={modal.row?.numero ?? ''}
                placeholder="Ex: 5511999990000"
                className={inputCls}
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Field label="Setor">
              <select
                ref={setorRef}
                defaultValue={modal.row?.setor ?? ''}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Selecione...</option>
                {SETOR_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <SaveButton loading={saving} />
          </form>
        </Modal>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const supabase = useRef(createClient()).current
  const [tab, setTab] = useState<Tab>('templates')

  const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Gerencie templates e instâncias WhatsApp
        </p>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex rounded-xl p-1 gap-1" style={card}>
        {(
          [
            { key: 'templates' as Tab, label: 'Templates' },
            { key: 'instancias' as Tab, label: 'Instâncias WhatsApp' },
          ]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tab === key
                ? { background: 'var(--color-green-primary)', color: '#fff' }
                : { color: 'var(--color-text-secondary)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'templates' ? (
        <TemplatesTab supabase={supabase} />
      ) : (
        <InstanciasTab supabase={supabase} />
      )}
    </div>
  )
}
