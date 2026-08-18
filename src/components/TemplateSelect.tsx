import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface TemplateOption {
  id: string;
  nome: string;
  tipo?: string;
  status_meta?: string;
}

interface TemplateSelectProps {
  templates: TemplateOption[];
  campaignType: string;
  value: string;
  isLoading: boolean;
  onChange: (id: string, nome: string) => void;
}

const isTemplateApproved = (t: { status_meta?: string }) => !t.status_meta || t.status_meta === 'APPROVED';

/**
 * Custom listbox replacing a native <select> for the template picker.
 * A native <select>'s dropdown is an OS-level popup that can't be height-
 * limited or scroll-contained from CSS — with enough templates it grows
 * past the viewport and drags the whole page into scroll. This one is a
 * regular positioned panel, so max-height + overflow-y actually work.
 */
export const TemplateSelect: React.FC<TemplateSelectProps> = ({ templates, campaignType, value, isLoading, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const filtered = templates.filter((t) => !t.tipo || t.tipo === campaignType || t.tipo === 'nao_classificado');
  const selected = templates.find((t) => t.id === value);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="input"
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: selected ? 'var(--ink-200)' : 'var(--paper-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isLoading ? 'Carregando templates…' : selected ? selected.nome : 'Selecione um template'}
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} style={{ color: 'var(--ink-50)', flexShrink: 0, marginLeft: 8 }} />
      </button>

      {open && (
        <div
          role="listbox"
          className="thin-scroll"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30,
            background: 'var(--paper-0)', border: '1px solid var(--paper-200)', borderRadius: 12,
            boxShadow: 'var(--shadow-md)', maxHeight: 256, overflowY: 'auto', padding: 6,
          }}
        >
          {isLoading ? (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-50)' }}>Carregando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--ink-50)' }}>Nenhum template cadastrado</div>
          ) : (
            filtered.map((t) => {
              const approved = isTemplateApproved(t);
              const unclassified = t.tipo === 'nao_classificado';
              const disabled = !approved || unclassified;
              let suffix = '';
              if (!approved) suffix = t.status_meta === 'REJECTED' ? 'Rejeitado pela Meta' : 'Aguardando aprovação';
              else if (unclassified) suffix = 'Classifique o tipo em Gerenciar';
              const isSelected = value === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onChange(t.id, t.nome);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '8px 10px', borderRadius: 8, border: 0,
                    background: isSelected ? 'var(--paper-100)' : 'transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                    transition: 'background 120ms var(--ease-snap)',
                  }}
                  onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--paper-100)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'var(--paper-100)' : 'transparent'; }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-300)' }}>{t.nome}</span>
                  {suffix && (
                    <span style={{ fontSize: 11, color: !approved ? 'var(--red-500)' : 'var(--ink-50)' }}>{suffix}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
