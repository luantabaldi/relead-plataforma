import React, { useState } from 'react';
import { useLeadsList, Lead } from '../hooks/useLeadsList';
import { Icon } from './Icon';
import '../styles/leads-tab.css';

interface LeadsTabProps {
  selectedCampaignName?: string | null;
}

export const LeadsTab: React.FC<LeadsTabProps> = ({ selectedCampaignName }) => {
  const { leads, allLeads, isLoading, filters, setFilters, stats, ledgerByEmpreendimento } = useLeadsList(selectedCampaignName);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEmpreendimentos, setExpandedEmpreendimentos] = useState<Set<string>>(new Set());

  const toggleEmpreendimento = (id: string) => {
    const newExpanded = new Set(expandedEmpreendimentos);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEmpreendimentos(newExpanded);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      respondidos: false,
      ativados: false,
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.respondidos || filters.ativados;

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
    if (s === 'erro' || s === 'erro no disparo') return 'Erro';
    if (s === 'pendente') return 'Pendente';
    return 'Sem resposta';
  };

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

            <div className="filter-group checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={filters.respondidos}
                  onChange={(e) => setFilters({ ...filters, respondidos: e.target.checked })}
                />
                Apenas respondidos
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.ativados}
                  onChange={(e) => setFilters({ ...filters, ativados: e.target.checked })}
                />
                Apenas ativados/interessados
              </label>
            </div>

            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empreendimentos com Leads */}
      <div className="empreendimentos-container">
        {Object.entries(ledgerByEmpreendimento).map(([empreendimentoId, empreendimentoLeads]) => (
          <div key={empreendimentoId} className="empreendimento-section">
            <div className="empreendimento-header" onClick={() => toggleEmpreendimento(empreendimentoId)}>
              <Icon
                name={expandedEmpreendimentos.has(empreendimentoId) ? 'chevron-down' : 'chevron-right'}
                size={16}
              />
              <span className="empreendimento-title">{empreendimentoId}</span>
              <span className="empreendimento-count">{empreendimentoLeads.length} leads</span>
            </div>

            {expandedEmpreendimentos.has(empreendimentoId) && (
              <div className="empreendimento-leads">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Telefone</th>
                      <th>Nome</th>
                      <th>Campanha</th>
                      <th>Status</th>
                      <th>Enviado em</th>
                      <th>Respondido em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empreendimentoLeads.map((lead: Lead) => (
                      <tr key={lead.id}>
                        <td className="phone">{lead.telefone}</td>
                        <td className="name">{lead.nome_lead}</td>
                        <td className="campaign">{lead.nome_campanha || '-'}</td>
                        <td className="status">
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(lead.status_reativacao) }}
                          >
                            {getStatusLabel(lead.status_reativacao)}
                          </span>
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
              </div>
            )}
          </div>
        ))}

        {leads.length === 0 && (
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
