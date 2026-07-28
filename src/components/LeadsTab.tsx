import React, { useState } from 'react';
import { useLeadsList, Lead, MOTIVOS_OBJECAO, TIPOS_ERRO, isSemInteresse, isErro } from '../hooks/useLeadsList';
import { Icon } from './Icon';
import '../styles/leads-tab.css';

export const LeadsTab: React.FC = () => {
  const { leads, allLeads, isLoading, filters, setFilters, stats, campanhaOptions, empreendimentoOptions, updateLeadClassification } = useLeadsList();
  const [showFilters, setShowFilters] = useState(false);

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

  const getStatusColor = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'respondido') return '#EA7317'; // orange
    if (s === 'reativado' || s === 'interessado') return '#4CAF50'; // green
    if (s === 'erro' || s === 'erro no disparo') return '#F44336'; // red
    return '#999'; // gray
  };

  const getStatusLabel = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'respondido') return 'Respondido';
    if (s === 'reativado' || s === 'interessado') return 'Interessado';
    if (isErro(status)) return 'Erro';
    if (isSemInteresse(status)) return 'Sem interesse';
    if (s === 'pendente') return 'Pendente';
    return 'Sem resposta';
  };

  const parseDateInput = (value: string): Date | null => (value ? new Date(value + 'T00:00:00') : null);
  const toDateInputValue = (date: Date | null): string => (date ? date.toISOString().split('T')[0] : '');

  if (isLoading) {
    return (
      <div className="leads-tab-container">
        <div className="loading">Carregando leads...</div>
      </div>
    );
  }

  return (
    <div className="leads-tab-container">
      {/* Header e Filtros */}
      <div className="leads-header">
        <div className="header-title">
          <h2>Base de Leads</h2>
          <span className="lead-count">
            {leads.length} de {allLeads.length} leads
          </span>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{stats.respondidos}</div>
            <div className="stat-label">Respondidos</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{stats.ativados}</div>
            <div className="stat-label">Ativados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.erros}</div>
            <div className="stat-label">Erros</div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={16} />
          Filtros
        </button>

        {showFilters && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="filter-group">
                <label>Buscar por Telefone ou Nome</label>
                <input
                  type="text"
                  placeholder="Ex: 11999999999 ou João"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="filter-input"
                />
              </div>

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

            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        )}
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
              {leads.map((lead: Lead) => (
                <tr key={lead.id}>
                  <td className="phone">{lead.telefone}</td>
                  <td className="name">{lead.nome_lead}</td>
                  <td className="campaign">{lead.nome_campanha || '-'}</td>
                  <td className="campaign">{lead.empreendimento_nome || '-'}</td>
                  <td className="status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(lead.status_reativacao) }}
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
              ))}
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
    </div>
  );
};
