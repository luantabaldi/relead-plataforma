import React, { useState } from 'react';
import { useLeadsList, Lead, MOTIVOS_OBJECAO, TIPOS_ERRO, isSemInteresse, isErro, isRespostaAutomatica, PAGE_SIZE_OPTIONS } from '../hooks/useLeadsList';
import { useCampaignNames } from '../hooks/useCampaignNames';
import { Icon } from './Icon';
import '../styles/leads-tab.css';

/** Janela de páginas com reticências (1 … 4 5 [6] 7 8 … 42) — evita
 * renderizar dezenas de botões quando a base tem muitas páginas. */
function getPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(keep).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis');
    result.push(p);
    prev = p;
  }
  return result;
}

export const LeadsTab: React.FC = () => {
  const {
    leads, isLoading, filters, setFilters, stats, empreendimentoOptions, updateLeadClassification,
    page, setPage, pageSize, setPageSize, totalCount, totalPages,
  } = useLeadsList();
  const { names: campanhaOptions } = useCampaignNames();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const advancedFilterCount = [
    filters.status, filters.nomeCampanha, filters.empreendimentoId, filters.dataInicio, filters.dataFim,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      nomeCampanha: '',
      empreendimentoId: '',
      dataInicio: null,
      dataFim: null,
    });
  };

  const hasActiveFilters =
    filters.searchTerm || filters.status || filters.nomeCampanha || filters.empreendimentoId || filters.dataInicio || filters.dataFim;

  // Fundo pastel + texto de tom mais escuro da mesma família — nunca mais
  // um bloco de cor sólida com texto branco (ex.: "Pendente" chapado).
  const getStatusTone = (status: string): { bg: string; text: string } => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'respondido') return { bg: 'var(--amber-50)', text: '#92400E' };
    if (s === 'reativado' || s === 'interessado') return { bg: 'var(--green-50)', text: '#166534' };
    if (isErro(status)) return { bg: 'var(--red-50)', text: '#991B1B' };
    if (isRespostaAutomatica(status)) return { bg: '#F3E8FD', text: '#6B21A8' };
    return { bg: 'var(--paper-100)', text: 'var(--ink-100)' }; // pendente / sem resposta / demais
  };

  const getStatusLabel = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'respondido') return 'Respondido';
    if (s === 'reativado' || s === 'interessado') return 'Interessado';
    if (isErro(status)) return 'Erro';
    if (isSemInteresse(status)) return 'Sem interesse';
    if (isRespostaAutomatica(status)) return 'Resposta automática (bot)';
    if (s === 'pendente') return 'Pendente';
    return 'Sem resposta';
  };

  const parseDateInput = (value: string): Date | null => (value ? new Date(value + 'T00:00:00') : null);
  const toDateInputValue = (date: Date | null): string => (date ? date.toISOString().split('T')[0] : '');

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, page * pageSize);

  if (isLoading && leads.length === 0) {
    return (
      <div className="leads-tab-container">
        <div className="loading">Carregando leads...</div>
      </div>
    );
  }

  return (
    <div className="leads-tab-container">
      {/* Header — título solto sobre o fundo off-white da página */}
      <div className="leads-header">
        <div className="header-title">
          <h2>Base de <em>Leads</em></h2>
          <span className="lead-count">
            {totalCount > 0 ? `${rangeStart}–${rangeEnd} de ${totalCount.toLocaleString('pt-BR')} leads` : '0 leads'}
          </span>
        </div>

        {/* Stats Cards — brancos puros com sombra sutil, sem borda */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.respondidos}</div>
            <div className="stat-label">Respondidos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.ativados}</div>
            <div className="stat-label">Ativados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.erros}</div>
            <div className="stat-label">Erros</div>
          </div>
        </div>
      </div>

      {/* Card único: filtros + tabela + paginação */}
      <div className="leads-card">
        <div className="filter-panel">
          <div className="filter-content">
            <div className="filter-search-row">
              <div className="search-input-wrap">
                <Icon name="search" size={16} className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Buscar por telefone ou nome…"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="filter-input search-input"
                  aria-label="Buscar por telefone ou nome"
                />
              </div>
              <button
                type="button"
                className={`btn-advanced-filters${advancedFilterCount > 0 ? ' active' : ''}`}
                onClick={() => setShowAdvanced((s) => !s)}
                aria-expanded={showAdvanced}
              >
                <Icon name="filter" size={14} />
                Filtros avançados
                {advancedFilterCount > 0 && <span className="filter-count-badge">{advancedFilterCount}</span>}
                <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} />
              </button>
            </div>

            {showAdvanced && (
            <div className="filter-grid">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="filter-input"
                >
                  <option value="">Todos os status</option>
                  <option value="respondido">Respondido</option>
                  <option value="ativado">Ativado / Interessado</option>
                  <option value="sem_interesse">Sem interesse</option>
                  <option value="resposta_automatica">Resposta automática (bot)</option>
                  <option value="sem_resposta">Sem resposta</option>
                  <option value="pendente">Pendente</option>
                  <option value="erro">Erro</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Campanha</label>
                <select
                  value={filters.nomeCampanha}
                  onChange={(e) => setFilters({ ...filters, nomeCampanha: e.target.value })}
                  className="filter-input"
                >
                  <option value="">Todas as campanhas</option>
                  {campanhaOptions.map((nome) => (
                    <option key={nome} value={nome}>{nome}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Empreendimento</label>
                <select
                  value={filters.empreendimentoId}
                  onChange={(e) => setFilters({ ...filters, empreendimentoId: e.target.value })}
                  className="filter-input"
                >
                  <option value="">Todos os empreendimentos</option>
                  {empreendimentoOptions.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Data Início</label>
                <input
                  type="date"
                  value={toDateInputValue(filters.dataInicio)}
                  onChange={(e) => setFilters({ ...filters, dataInicio: parseDateInput(e.target.value) })}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Data Fim</label>
                <input
                  type="date"
                  value={toDateInputValue(filters.dataFim)}
                  onChange={(e) => setFilters({ ...filters, dataFim: parseDateInput(e.target.value) })}
                  className="filter-input"
                />
              </div>
            </div>
            )}

            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="leads-list-container">
          {leads.length > 0 ? (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Telefone</th>
                  <th>Nome</th>
                  <th>Campanha</th>
                  <th>Empreendimento</th>
                  <th>Status</th>
                  <th>Motivo / Erro</th>
                  <th>Enviado em</th>
                  <th>Respondido em</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: Lead) => {
                  const tone = getStatusTone(lead.status_reativacao);
                  return (
                  <tr key={lead.id}>
                    <td className="phone">{lead.telefone}</td>
                    <td className="name">{lead.nome_lead}</td>
                    <td className="campaign">{lead.nome_campanha || '-'}</td>
                    <td className="campaign">{lead.empreendimento_nome || '-'}</td>
                    <td className="status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: tone.bg, color: tone.text }}
                      >
                        {getStatusLabel(lead.status_reativacao)}
                      </span>
                    </td>
                    <td className="classification">
                      {isSemInteresse(lead.status_reativacao) && (
                        <select
                          className="classification-select"
                          value={lead.motivo_objecao || ''}
                          onChange={(e) => updateLeadClassification(lead.id, 'motivo_objecao', e.target.value)}
                        >
                          <option value="">Classificar objeção…</option>
                          {MOTIVOS_OBJECAO.map((motivo) => (
                            <option key={motivo} value={motivo}>{motivo}</option>
                          ))}
                        </select>
                      )}
                      {isErro(lead.status_reativacao) && (
                        <select
                          className="classification-select"
                          value={lead.tipo_erro || ''}
                          onChange={(e) => updateLeadClassification(lead.id, 'tipo_erro', e.target.value)}
                        >
                          <option value="">Classificar erro…</option>
                          {TIPOS_ERRO.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      )}
                      {!isSemInteresse(lead.status_reativacao) && !isErro(lead.status_reativacao) && '-'}
                    </td>
                    <td className="date">
                      {lead.data_envio.toLocaleString('pt-BR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="date">
                      {lead.data_resposta
                        ? lead.data_resposta.toLocaleString('pt-BR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Icon name="inbox" size={32} />
              <p>Nenhum lead encontrado</p>
              {hasActiveFilters && <p className="text-muted">Tente ajustar os filtros</p>}
            </div>
          )}
        </div>

        {/* Paginação — navega a base inteira, não só os primeiros 1.000 */}
        {totalCount > 0 && (
          <div className="leads-pagination">
            <span className="pagination-range">
              {rangeStart}–{rangeEnd} de {totalCount.toLocaleString('pt-BR')}
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                <Icon name="chevron-left" size={14} /> Anterior
              </button>

              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="pagination-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`pagination-page${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Próxima <Icon name="chevron-right" size={14} />
              </button>
            </div>

            <label className="pagination-size">
              Linhas por página:
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
