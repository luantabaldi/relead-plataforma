import React, { useState } from 'react';
import { useBlacklist } from '../hooks/useBlacklist';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { Icon } from './Icon';
import { friendlyError } from '../lib/friendlyError';

export const BlacklistTab: React.FC = () => {
  const { entries, isLoading, addToBlacklist, removeFromBlacklist } = useBlacklist();
  const { notify } = useToast();
  const [confirm, confirmDialog] = useConfirm();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntry, setNewEntry] = useState({ telefone: '', nome: '', motivo: '' });

  const filteredEntries = entries.filter(e =>
    e.telefone.includes(searchTerm) ||
    (e.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (e.motivo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.telefone.trim()) {
      notify('err', 'Telefone é obrigatório');
      return;
    }

    if (entries.some(e => e.telefone === newEntry.telefone)) {
      notify('err', 'Este telefone já está na blacklist');
      return;
    }

    try {
      await addToBlacklist(
        newEntry.telefone.trim(),
        newEntry.nome.trim() || undefined,
        newEntry.motivo.trim() || 'Adicionado manualmente'
      );
      notify('ok', 'Lead adicionado à blacklist');
      setNewEntry({ telefone: '', nome: '', motivo: '' });
      setIsAdding(false);
    } catch (err) {
      console.error('Erro ao adicionar:', err);
      notify('err', friendlyError(err, 'Não foi possível adicionar à blacklist'));
    }
  };

  const handleRemove = async (id: string, telefone: string) => {
    const ok = await confirm({
      title: 'Remover da blacklist?',
      message: `O lead ${telefone} poderá receber mensagens novamente.`,
      confirmLabel: 'Remover',
      tone: 'danger',
    });

    if (!ok) return;

    try {
      await removeFromBlacklist(id);
      notify('ok', 'Lead removido da blacklist');
    } catch (err) {
      console.error('Erro ao remover:', err);
      notify('err', friendlyError(err, 'Não foi possível remover da blacklist'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="t-h2" style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="x-circle" size={20} /> Blacklist de leads
          </h3>
          <p className="t-caption" style={{ margin: '4px 0 0', color: 'var(--ink-200)' }}>
            {entries.length} lead{entries.length !== 1 ? 's' : ''} bloqueado{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn primary"
          >
            <Icon name="plus" size={14} /> Adicionar à blacklist
          </button>
        )}
      </div>

      {/* Formulário de Adição */}
      {isAdding && (
        <div className="card" style={{ padding: 24, gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <h4 className="t-serif" style={{ fontSize: 18, margin: 0, color: 'var(--navy-700)' }}>
            Adicionar lead à blacklist
          </h4>

          <form onSubmit={handleAddToBlacklist} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="blacklistPhoneInput">Telefone *</label>
                <input
                  id="blacklistPhoneInput"
                  type="tel"
                  className="input"
                  placeholder="ex: 5548999999999"
                  value={newEntry.telefone}
                  onChange={(e) => setNewEntry({ ...newEntry, telefone: e.target.value })}
                  autoComplete="tel"
                  required
                />
                <span className="t-caption">Número sem formatação (com código do país)</span>
              </div>

              <div className="field">
                <label htmlFor="blacklistNameInput">Nome (opcional)</label>
                <input
                  id="blacklistNameInput"
                  type="text"
                  className="input"
                  placeholder="ex: Luciano Godoi"
                  value={newEntry.nome}
                  onChange={(e) => setNewEntry({ ...newEntry, nome: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="blacklistReasonInput">Motivo do bloqueio</label>
              <textarea
                id="blacklistReasonInput"
                className="input"
                placeholder="ex: Pediu para remover número da lista"
                value={newEntry.motivo}
                onChange={(e) => setNewEntry({ ...newEntry, motivo: e.target.value })}
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', marginTop: 8 }}>
              <button type="submit" className="btn primary">
                <Icon name="check" size={14} /> Adicionar à blacklist
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewEntry({ telefone: '', nome: '', motivo: '' });
                }}
                className="btn secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Pesquisa */}
      {entries.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Icon
            name="search"
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-200)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Buscar por telefone, nome ou motivo…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      )}

      {/* Tabela de Blacklist */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--paper-200)', height: 50 }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="skeleton-line skeleton-pulse" style={{ width: '25%', height: 12 }} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="skeleton-line skeleton-pulse" style={{ width: '30%', height: 12 }} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: 12 }} />
                    </td>
                    <td style={{ padding: '14px 20px', width: 120 }}>
                      <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: 12 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
            <Icon name="x-circle" size={28} style={{ color: 'var(--paper-300)', marginBottom: 12, opacity: 0.5 }} />
            <p style={{ margin: 0, marginBottom: 16 }}>Nenhum lead na blacklist ainda</p>
            <p className="t-caption" style={{ margin: 0, color: 'var(--ink-300)' }}>
              Leads adicionados aqui não receberão mensagens em disparos futuros.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
            <p style={{ margin: 0 }}>Nenhum resultado encontrado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 150 }}>Telefone</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 180 }}>Nome</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Motivo do bloqueio</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 150 }}>Data do bloqueio</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: idx === filteredEntries.length - 1 ? 'none' : '1px solid var(--paper-200)',
                    background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                    {entry.telefone}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink-100)' }}>
                    {entry.nome || <em style={{ color: 'var(--ink-300)' }}>Sem nome</em>}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink-100)' }}>
                    {entry.motivo}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--ink-50)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {new Date(entry.data_bloqueio).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.id, entry.telefone)}
                      className="btn ghost"
                      style={{ padding: 6, minWidth: 'auto' }}
                      title="Remover da blacklist"
                      aria-label="Remover da blacklist"
                    >
                      <Icon name="trash" size={14} style={{ color: 'var(--rose-500)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog}
    </div>
  );
};
