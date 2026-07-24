import React, { useState, useEffect } from 'react';
import { ConversationThread as ConversationThreadType, FilterOptions } from '../types';
import { FilterBar } from './FilterBar';
import { ConversationThread } from './ConversationThread';
import { Icon } from './Icon';
import { statusMeta, avatarTone, initials } from './statusMeta';
import { useConversationThread } from '../hooks/useConversationThread';

interface DashboardProps {
  conversations: ConversationThreadType[];
  isLoading?: boolean;
  onAction?: (conversationId: string, action: string) => void;
  pendingAction?: string | null;
  selectedDispatchId?: string;
  onSelectConversation?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  conversations,
  isLoading = false,
  onAction,
  pendingAction,
  selectedDispatchId,
  onSelectConversation,
}) => {
  const [localSelectedId, setLocalSelectedId] = useState<string>('');
  const activeId = selectedDispatchId !== undefined ? selectedDispatchId : localSelectedId;
  const setActiveId = onSelectConversation !== undefined ? onSelectConversation : setLocalSelectedId;

  // Busca o thread completo (com mensagens) para a conversa selecionada
  const { conversation: fullConversation, isLoading: isLoadingThread } = useConversationThread(activeId);

  // Para a lista, usa dados básicos do array; para o painel direito, usa o thread enriquecido
  const selectedConversation = fullConversation ||
    conversations.find((c) => c.dispatch.id === activeId) ||
    conversations[0] ||
    null;

  const [filteredConversations, setFilteredConversations] = useState<ConversationThreadType[]>(conversations);
  const [filters, setFilters] = useState<FilterOptions>({
    campanhas: [],
    statuses: [],
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataFim: new Date(),
    busca: '',
  });

  // Paginação da lista (evita renderizar centenas de itens de uma vez)
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    let filtered = conversations;

    if (filters.campanhas.length > 0) {
      filtered = filtered.filter((conv) => filters.campanhas.includes(conv.dispatch.tipo_campanha));
    }
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((conv) => filters.statuses.includes(conv.dispatch.status));
    }
    if (filters.busca) {
      const searchLower = filters.busca.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.dispatch.nome.toLowerCase().includes(searchLower) ||
          conv.dispatch.telefone.includes(searchLower)
      );
    }

    const dataInicio = filters.dataInicio.getTime();
    const dataFim = filters.dataFim.getTime();
    filtered = filtered.filter((conv) => {
      const timestamp = conv.dispatch.timestamp_envio.getTime();
      return timestamp >= dataInicio && timestamp <= dataFim;
    });

    setFilteredConversations(filtered);

    if (
      filtered.length > 0 &&
      (!activeId || !filtered.some((c) => c.dispatch.id === activeId))
    ) {
      setActiveId(filtered[0].dispatch.id);
    }
  }, [filters, conversations, activeId, setActiveId]);

  const handleAction = (action: string) => {
    if (selectedConversation && onAction) {
      onAction(selectedConversation.dispatch.id, action);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredConversations.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredConversations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div
      className="flex gap-5"
      style={{ flex: 1, minHeight: 0, padding: '24px 32px 32px', overflow: 'hidden' }}
    >
      {/* ── Left: list ── */}
      <div
        className="card"
        style={{ width: 360, padding: 0, gap: 0, overflow: 'hidden', flexShrink: 0 }}
      >
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--paper-200)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="t-serif" style={{ fontSize: 24, margin: 0 }}>Conversas</h3>
            <span className="t-mono tnum" style={{ fontSize: 12, color: 'var(--ink-50)' }}>
              {filteredConversations.length}
            </span>
          </div>
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll" style={{ minHeight: 0 }}>
          {isLoading ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <style>{`
                @keyframes skeleton-pulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 0.35; }
                }
                .skeleton-pulse {
                  animation: skeleton-pulse 1.5s infinite ease-in-out;
                  background: var(--paper-100);
                  border-radius: 14px;
                  padding: 12px;
                  display: flex;
                  gap: 12px;
                  align-items: center;
                }
                .skeleton-circle {
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: var(--paper-300);
                  flex-shrink: 0;
                }
                .skeleton-text-1 {
                  height: 12px;
                  width: 60%;
                  background: var(--paper-300);
                  border-radius: 4px;
                  margin-bottom: 8px;
                }
                .skeleton-text-2 {
                  height: 10px;
                  width: 40%;
                  background: var(--paper-200);
                  border-radius: 4px;
                }
              `}</style>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-pulse">
                  <div className="skeleton-circle" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-text-1" />
                    <div className="skeleton-text-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty">
              <span className="ic"><Icon name="inbox" size={24} /></span>
              <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>
                Nenhuma conversa encontrada
              </span>
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              {pageItems.map((conv) => {
                const meta = statusMeta(conv.dispatch.status);
                const isSel = selectedConversation?.dispatch.id === conv.dispatch.id;
                return (
                  <button
                    key={conv.dispatch.id}
                    onClick={() => setActiveId(conv.dispatch.id)}
                    className="message"
                    style={{
                      width: '100%', textAlign: 'left', border: 0, cursor: 'pointer',
                      background: isSel ? 'var(--navy-50)' : 'transparent',
                      borderRadius: 14, padding: 12, marginBottom: 4,
                      display: 'flex', gap: 12, alignItems: 'center',
                      transition: 'background 120ms var(--ease-snap)',
                    }}
                  >
                    <span className={`lead-av ${avatarTone(conv.dispatch.nome)}`}>
                      {initials(conv.dispatch.nome)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          fontWeight: 600, color: 'var(--ink-300)', fontSize: 13,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {conv.dispatch.nome}
                        </span>
                        <span className="t-mono" style={{ fontSize: 10, color: 'var(--ink-50)', flexShrink: 0 }}>
                          {timeDiff(new Date(conv.dispatch.timestamp_envio))}
                        </span>
                      </span>
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 5 }}>
                        <span className="t-mono tnum" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                          {conv.dispatch.telefone}
                        </span>
                        <span className={`chip ${meta.chip}`}>
                          <span className="dot" />{meta.label}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderTop: '1px solid var(--paper-200)', flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn ghost"
              style={{ padding: '6px 10px' }}
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="t-mono tnum" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn ghost"
              style={{ padding: '6px 10px' }}
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Próxima página"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Right: conversation thread ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {isLoadingThread && activeId ? (
          // Skeleton do painel direito enquanto busca os detalhes da conversa
          <div className="card" style={{ height: '100%', padding: 0, gap: 0, overflow: 'hidden' }}>
            <style>{`
              @keyframes thread-skeleton-pulse {
                0%, 100% { opacity: 0.55; }
                50% { opacity: 0.3; }
              }
              .thread-sk { animation: thread-skeleton-pulse 1.5s infinite ease-in-out; background: var(--paper-200); border-radius: 6px; }
            `}</style>
            {/* Header skeleton */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--paper-200)', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="thread-sk" style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="thread-sk" style={{ width: '45%', height: 14, marginBottom: 8 }} />
                <div className="thread-sk" style={{ width: '30%', height: 11 }} />
              </div>
            </div>
            {/* Messages area skeleton */}
            <div style={{ flex: 1, padding: '20px 24px', background: 'var(--paper-50)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ w: '60%', side: 'right' }, { w: '45%', side: 'left' }, { w: '70%', side: 'right' }, { w: '50%', side: 'left' }].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: s.side === 'right' ? 'flex-end' : 'flex-start' }}>
                  <div className="thread-sk" style={{ width: s.w, height: 36, borderRadius: 12 }} />
                </div>
              ))}
            </div>
          </div>
        ) : selectedConversation ? (
          <ConversationThread conversation={selectedConversation} onAction={handleAction} pendingAction={pendingAction ?? null} />
        ) : (
          <div className="card" style={{ height: '100%', justifyContent: 'center' }}>
            <div className="empty">
              <span className="ic"><Icon name="message-circle" size={24} /></span>
              <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>
                Selecione uma conversa para ver os detalhes
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function timeDiff(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}
