'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { UploadCloud, Check, AlertCircle, ChevronRight, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadDoCsv {
  nome: string
  telefone: string
  observacao: string
}

interface ParsedRow {
  raw: Record<string, string>
  lead: LeadDoCsv | null
  error: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Nome', 'Leads', 'Configuração', 'Observações', 'Disparar']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function col(row: Record<string, string>, key: string): string {
  const k = Object.keys(row).find((c) => c.toLowerCase().trim() === key)
  return k ? (row[k] ?? '').trim() : ''
}

function validateRow(
  row: Record<string, string>
): { lead: LeadDoCsv; error: null } | { lead: null; error: string } {
  const nome = col(row, 'nome')
  const telefoneRaw = col(row, 'telefone')
  const observacao = col(row, 'observacao')

  if (!nome) return { lead: null, error: 'Campo "nome" ausente ou vazio' }
  if (!telefoneRaw) return { lead: null, error: 'Campo "telefone" ausente ou vazio' }

  const digits = telefoneRaw.replace(/[\s+\-().]/g, '')
  if (!/^\d{10,13}$/.test(digits)) {
    return { lead: null, error: `Telefone inválido: "${telefoneRaw}" (esperado 10–13 dígitos)` }
  }

  return { lead: { nome, telefone: digits, observacao }, error: null }
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const card = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }
const muted = { color: 'var(--color-text-secondary)' }
const primary = { color: 'var(--color-text-primary)' }
const divider = { borderBottom: '1px solid var(--color-border)' }

function inputStyle(focused = false): React.CSSProperties {
  return {
    background: 'var(--color-bg-secondary)',
    border: `1px solid ${focused ? 'var(--color-green-primary)' : 'var(--color-border)'}`,
    color: 'var(--color-text-primary)',
    transition: 'border-color 0.15s',
  }
}

function btnPrimaryStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'rgba(42,57,255,0.2)' : 'var(--color-green-primary)',
    color: disabled ? 'rgba(0,0,0,0.3)' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

const btnSecondaryStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-secondary)',
}

const inputCls = 'w-full rounded-lg px-4 py-3 text-sm outline-none'

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start w-full mb-8 px-2">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: active
                    ? 'var(--color-green-primary)'
                    : done
                    ? 'rgba(42,57,255,0.1)'
                    : 'var(--color-bg-secondary)',
                  color: active ? '#fff' : done ? 'var(--color-green-primary)' : 'var(--color-text-secondary)',
                  border: `2px solid ${active ? 'var(--color-green-primary)' : done ? 'rgba(42,57,255,0.35)' : 'var(--color-border)'}`,
                }}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className="text-[10px] font-medium whitespace-nowrap text-center"
                style={{
                  color: active ? 'var(--color-green-primary)' : done ? 'rgba(42,57,255,0.7)' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mt-4 mx-1.5"
                style={{ background: done ? 'rgba(42,57,255,0.3)' : 'var(--color-border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Campaign Name ────────────────────────────────────────────────────

interface Step1Props {
  initialNome: string
  onNext: (nome: string) => void
}

function Step1({ initialNome, onNext }: Step1Props) {
  const [value, setValue] = useState(initialNome)
  const [focused, setFocused] = useState(false)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" style={primary}>
          Nome da campanha <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onNext(value.trim())}
          placeholder="ex: reativacao_loockwood_maio26"
          className={inputCls}
          style={inputStyle(focused)}
          autoFocus
        />
        <p className="text-xs" style={muted}>
          Use letras minúsculas e underscores. Este nome aparecerá nos relatórios.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onNext(value.trim())}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={btnPrimaryStyle(!value.trim())}
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: CSV Upload ───────────────────────────────────────────────────────

interface Step2Props {
  parsedRows: ParsedRow[]
  validLeads: LeadDoCsv[]
  isDragging: boolean
  onSetDragging: (v: boolean) => void
  onFileParsed: (rows: ParsedRow[], valid: LeadDoCsv[]) => void
  onBack: () => void
  onNext: () => void
}

function Step2({
  parsedRows,
  validLeads,
  isDragging,
  onSetDragging,
  onFileParsed,
  onBack,
  onNext,
}: Step2Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rows: ParsedRow[] = data.map((raw) => {
          const { lead, error } = validateRow(raw)
          return { raw, lead, error }
        })
        const valid = rows.filter((r) => r.lead !== null).map((r) => r.lead!)
        onFileParsed(rows, valid)
      },
    })
  }

  const errorCount = parsedRows.filter((r) => r.error !== null).length
  const preview = parsedRows.slice(0, 5)

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDrop={(e) => {
          e.preventDefault()
          onSetDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) processFile(file)
        }}
        onDragOver={(e) => { e.preventDefault(); onSetDragging(true) }}
        onDragLeave={() => onSetDragging(false)}
        onClick={() => fileRef.current?.click()}
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? 'var(--color-green-primary)' : 'var(--color-border)',
          background: isDragging ? 'rgba(42,57,255,0.04)' : 'var(--color-bg-secondary)',
        }}
      >
        <UploadCloud
          className="h-10 w-10"
          style={{ color: isDragging ? 'var(--color-green-primary)' : 'var(--color-text-secondary)' }}
        />
        <div className="text-center">
          <p className="text-sm font-medium" style={primary}>
            Arraste o CSV ou clique para selecionar
          </p>
          <p className="text-xs mt-1" style={muted}>
            Colunas obrigatórias:{' '}
            <code className="font-mono">nome</code>,{' '}
            <code className="font-mono">telefone</code>
            {' '}· Opcional:{' '}
            <code className="font-mono">observacao</code>
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Counter badge */}
      {parsedRows.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: 'var(--color-bg-secondary)' }}
        >
          <span style={primary}>
            <strong>{validLeads.length}</strong> lead{validLeads.length !== 1 ? 's' : ''} carregado{validLeads.length !== 1 ? 's' : ''}
          </span>
          {errorCount > 0 && (
            <>
              <span style={muted}>·</span>
              <span style={{ color: '#DC2626' }}>
                <strong>{errorCount}</strong> com erro de formato
              </span>
              <span className="text-xs" style={muted}>(removidos automaticamente)</span>
            </>
          )}
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={card}>
          <div className="px-4 py-3" style={divider}>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
              Preview — primeiros {preview.length} registros
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr style={divider}>
                  {['#', 'Nome', 'Telefone', 'Observação', 'Validação'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[10px]"
                      style={muted}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => {
                  const hasError = row.error !== null
                  return (
                    <tr
                      key={i}
                      style={{
                        ...(i < preview.length - 1 ? divider : {}),
                        background: hasError ? 'rgba(248,113,113,0.04)' : 'transparent',
                      }}
                    >
                      <td className="px-4 py-2.5" style={muted}>{i + 1}</td>
                      <td className="px-4 py-2.5" style={hasError ? { color: '#DC2626' } : primary}>
                        {col(row.raw, 'nome') || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={hasError ? { color: '#DC2626' } : muted}>
                        {col(row.raw, 'telefone') || '—'}
                      </td>
                      <td className="px-4 py-2.5" style={muted}>
                        {col(row.raw, 'observacao') || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {hasError ? (
                          <span className="flex items-center gap-1.5" style={{ color: '#DC2626' }}>
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {row.error}
                          </span>
                        ) : (
                          <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-green-primary)' }} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={btnSecondaryStyle}
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={validLeads.length === 0}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={btnPrimaryStyle(validLeads.length === 0)}
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Campaign Config ──────────────────────────────────────────────────

interface Step3Props {
  nome: string
  leadsCount: number
  template: string
  idEmpreendimento: string
  tipoCampanha: string
  linkImagem: string
  approvedTemplates: string[] | null
  onTemplateChange: (v: string) => void
  onIdChange: (v: string) => void
  onTipoChange: (v: string) => void
  onLinkChange: (v: string) => void
  onBack: () => void
  onNext: () => void
}

function Step3({
  nome, leadsCount, template, idEmpreendimento, tipoCampanha, linkImagem,
  approvedTemplates, onTemplateChange, onIdChange, onTipoChange, onLinkChange,
  onBack, onNext,
}: Step3Props) {
  const [idFocused, setIdFocused] = useState(false)
  const [tmplFocused, setTmplFocused] = useState(false)
  const [linkFocused, setLinkFocused] = useState(false)

  const useTextTemplate = approvedTemplates !== null && approvedTemplates.length === 0
  const step3Valid = template.trim() !== '' && idEmpreendimento.trim() !== '' && tipoCampanha !== ''

  return (
    <div className="space-y-6">
      {/* Template */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={primary}>
          Template <span style={{ color: '#DC2626' }}>*</span>
        </label>
        {approvedTemplates === null ? (
          <div className={inputCls} style={{ ...inputStyle(), opacity: 0.6 }}>
            Carregando templates...
          </div>
        ) : useTextTemplate ? (
          <input
            type="text"
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            onFocus={() => setTmplFocused(true)}
            onBlur={() => setTmplFocused(false)}
            placeholder="Nome do template"
            className={inputCls}
            style={inputStyle(tmplFocused)}
          />
        ) : (
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            className={inputCls}
            style={inputStyle()}
          >
            <option value="">Selecione um template aprovado</option>
            {approvedTemplates.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* ID Empreendimento */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={primary}>
          ID do Empreendimento (CV CRM) <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <input
          type="text"
          value={idEmpreendimento}
          onChange={(e) => onIdChange(e.target.value)}
          onFocus={() => setIdFocused(true)}
          onBlur={() => setIdFocused(false)}
          placeholder="ex: 4521"
          className={inputCls}
          style={inputStyle(idFocused)}
        />
        <p className="text-xs" style={muted}>
          Este ID será enviado para todos os leads desta campanha.
        </p>
      </div>

      {/* Tipo de campanha */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={primary}>
          Tipo de Campanha <span style={{ color: '#DC2626' }}>*</span>
        </label>
        <select
          value={tipoCampanha}
          onChange={(e) => onTipoChange(e.target.value)}
          className={inputCls}
          style={inputStyle()}
        >
          <option value="">Selecione o tipo</option>
          <option value="reativacao">Reativação</option>
          <option value="prospeccao">Prospecção</option>
        </select>
      </div>

      {/* Link da imagem */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={primary}>
          Link da Imagem
        </label>
        <input
          type="url"
          value={linkImagem}
          onChange={(e) => onLinkChange(e.target.value)}
          onFocus={() => setLinkFocused(true)}
          onBlur={() => setLinkFocused(false)}
          placeholder="https://..."
          className={inputCls}
          style={inputStyle(linkFocused)}
        />
        <p className="text-xs" style={muted}>
          Deixe em branco se não houver imagem.
        </p>
      </div>

      {/* Summary card — appears when all required fields are filled */}
      {step3Valid && (
        <div className="rounded-xl p-5 space-y-4" style={card}>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Resumo da campanha
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SummaryField label="Nome" value={nome} />
            <SummaryField label="Total de leads" value={`${leadsCount.toLocaleString('pt-BR')} lead${leadsCount !== 1 ? 's' : ''}`} />
            <SummaryField label="Template" value={template} />
            <SummaryField label="ID Empreendimento" value={idEmpreendimento} />
            <SummaryField label="Tipo" value={tipoCampanha} capitalize />
            {linkImagem && <SummaryField label="Imagem" value="Configurada" />}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={btnSecondaryStyle}
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!step3Valid}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold"
          style={btnPrimaryStyle(!step3Valid)}
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Observations + Dispatch ─────────────────────────────────────────

interface Step4Props {
  validLeads: LeadDoCsv[]
  onUpdateObservacao: (idx: number, obs: string) => void
  nome: string
  template: string
  idEmpreendimento: string
  tipoCampanha: string
  linkImagem: string
  confirmed: boolean
  onConfirmChange: (v: boolean) => void
  sending: boolean
  onDispatch: () => void
  onBack: () => void
}

function Step4({
  validLeads, onUpdateObservacao,
  nome, template, idEmpreendimento, tipoCampanha, linkImagem,
  confirmed, onConfirmChange,
  sending, onDispatch, onBack,
}: Step4Props) {
  const canDispatch = confirmed && validLeads.length > 0 && !sending

  return (
    <div className="space-y-6">
      {/* Counter */}
      <div
        className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--color-green-primary)' }} />
        <span style={primary}>
          <strong>{validLeads.length}</strong> lead{validLeads.length !== 1 ? 's' : ''} prontos para disparo
        </span>
      </div>

      {/* Editable leads table */}
      <div className="rounded-xl overflow-hidden" style={card}>
        <div className="px-4 py-3" style={divider}>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
            Editar observações individuais (opcional)
          </p>
        </div>
        <div className="overflow-auto" style={{ maxHeight: 400 }}>
          <table className="w-full min-w-[520px] text-sm">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ ...divider, background: 'var(--color-bg-card)' }}>
                {['#', 'Nome', 'Telefone', 'Observação'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                    style={muted}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validLeads.map((lead, i) => (
                <tr
                  key={i}
                  style={i < validLeads.length - 1 ? divider : undefined}
                >
                  <td className="px-4 py-2.5 text-xs" style={muted}>{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium" style={primary}>{lead.nome}</td>
                  <td className="px-4 py-2.5 font-mono text-xs" style={muted}>{lead.telefone}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={lead.observacao}
                      onChange={(e) => onUpdateObservacao(i, e.target.value)}
                      placeholder="Observação para este lead..."
                      className="w-full rounded-md px-3 py-1.5 text-xs outline-none"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final summary card */}
      <div className="rounded-xl p-5 space-y-4" style={card}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={muted}>
          Resumo final
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SummaryField label="Nome" value={nome} />
          <SummaryField label="Total de leads" value={`${validLeads.length.toLocaleString('pt-BR')}`} />
          <SummaryField label="Template" value={template} />
          <SummaryField label="ID Empreendimento" value={idEmpreendimento} />
          <SummaryField label="Tipo" value={tipoCampanha} capitalize />
          <SummaryField label="Imagem" value={linkImagem || 'Nenhuma'} />
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div
          className="relative mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center"
          style={{
            background: confirmed ? 'var(--color-green-primary)' : 'transparent',
            border: `1.5px solid ${confirmed ? 'var(--color-green-primary)' : 'var(--color-border)'}`,
            transition: 'all 0.15s',
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {confirmed && <Check className="h-2.5 w-2.5 text-white pointer-events-none" />}
        </div>
        <span className="text-sm leading-snug" style={primary}>
          Confirmo que revisei os leads e as configurações acima e desejo iniciar o disparo.
        </span>
      </label>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={sending}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ ...btnSecondaryStyle, opacity: sending ? 0.5 : 1 }}
        >
          Anterior
        </button>
        <button
          onClick={onDispatch}
          disabled={!canDispatch}
          className="flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-semibold"
          style={btnPrimaryStyle(!canDispatch)}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Iniciar Disparo
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Placeholder step ─────────────────────────────────────────────────────────

function StepPlaceholder({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl py-14 flex items-center justify-center"
        style={{ background: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border)' }}
      >
        <p className="text-sm" style={muted}>
          Etapa <strong style={primary}>{label}</strong> — em desenvolvimento
        </p>
      </div>
      <div className="flex">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={btnSecondaryStyle}
        >
          Anterior
        </button>
      </div>
    </div>
  )
}

// ─── Summary field ────────────────────────────────────────────────────────────

function SummaryField({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={muted}>
        {label}
      </p>
      <p
        className={`text-sm font-medium truncate ${capitalize ? 'capitalize' : ''}`}
        style={primary}
      >
        {value}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DisparoClient() {
  const router = useRouter()
  const supabase = useRef(createClient()).current

  // Navigation
  const [step, setStep] = useState(0)

  // Step 1
  const [nome, setNome] = useState('')

  // Step 2
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [validLeads, setValidLeads] = useState<LeadDoCsv[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Step 3
  const [template, setTemplate] = useState('')
  const [idEmpreendimento, setIdEmpreendimento] = useState('')
  const [tipoCampanha, setTipoCampanha] = useState('')
  const [linkImagem, setLinkImagem] = useState('')
  const [approvedTemplates, setApprovedTemplates] = useState<string[] | null>(null)

  // Step 4
  const [confirmed, setConfirmed] = useState(false)
  const [sending, setSending] = useState(false)

  // Load approved templates when step 3 is first reached
  useEffect(() => {
    if (step !== 2 || approvedTemplates !== null) return
    supabase
      .from('templates_wpp')
      .select('nome')
      .eq('status_meta', 'Aprovado')
      .order('nome')
      .then(({ data, error }) => {
        const names = error ? [] : (data?.map((t) => t.nome).filter(Boolean) ?? [])
        setApprovedTemplates(names)
      })
  }, [step])

  function updateObservacao(idx: number, obs: string) {
    setValidLeads((prev) => prev.map((l, i) => (i === idx ? { ...l, observacao: obs } : l)))
  }

  async function handleDispatch() {
    if (!confirmed || validLeads.length === 0) return
    setSending(true)
    try {
      const payload = {
        nome_campanha: nome,
        template_nome: template,
        id_empreendimento: idEmpreendimento,
        tipo_campanha: tipoCampanha,
        link_imagem: linkImagem || null,
        leads: validLeads,
      }
      const res = await fetch('/api/disparo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erro ao iniciar o disparo. Tente novamente.')
        return
      }
      router.push(`/disparo/monitoramento?campanha=${encodeURIComponent(nome)}&total=${validLeads.length}`)
    } catch {
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSending(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <Step1
            initialNome={nome}
            onNext={(v) => { setNome(v); setStep(1) }}
          />
        )
      case 1:
        return (
          <Step2
            parsedRows={parsedRows}
            validLeads={validLeads}
            isDragging={isDragging}
            onSetDragging={setIsDragging}
            onFileParsed={(rows, valid) => { setParsedRows(rows); setValidLeads(valid) }}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )
      case 2:
        return (
          <Step3
            nome={nome}
            leadsCount={validLeads.length}
            template={template}
            idEmpreendimento={idEmpreendimento}
            tipoCampanha={tipoCampanha}
            linkImagem={linkImagem}
            approvedTemplates={approvedTemplates}
            onTemplateChange={setTemplate}
            onIdChange={setIdEmpreendimento}
            onTipoChange={setTipoCampanha}
            onLinkChange={setLinkImagem}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )
      case 3:
        return (
          <Step4
            validLeads={validLeads}
            onUpdateObservacao={updateObservacao}
            nome={nome}
            template={template}
            idEmpreendimento={idEmpreendimento}
            tipoCampanha={tipoCampanha}
            linkImagem={linkImagem}
            confirmed={confirmed}
            onConfirmChange={setConfirmed}
            sending={sending}
            onDispatch={handleDispatch}
            onBack={() => setStep(2)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div>
      <StepIndicator current={step} />

      <div className="rounded-xl p-6 max-w-2xl mx-auto" style={card}>
        {renderStep()}
      </div>
    </div>
  )
}
