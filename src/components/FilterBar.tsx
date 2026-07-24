import React, { useState } from 'react';
import { FilterOptions, CampaignType, MessageStatus } from '../types';
import { Icon } from './Icon';
import { statusMeta, CAMPAIGN_LABEL } from './statusMeta';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const campaignOptions: CampaignType[] = ['reativacao', 'prospeccao'];
  const statusOptions: MessageStatus[] = ['enviado', 'respondido', 'interessado', 'sem_interesse', 'pausado', 'erro'];

  const activeCount = filters.campanhas.length + filters.statuses.length;

  const toggleCampaign = (campaign: CampaignType) => {
    const updated = filters.campanhas.includes(campaign)
      ? filters.campanhas.filter((c) => c !== campaign)
      : [...filters.campanhas, campaign];
    onFilterChange({ ...filters, campanhas: updated });
  };

  const toggleStatus = (status: MessageStatus) => {
    const updated = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: updated });
  };

  const handleDateChange = (type: 'inicio' | 'fim', date: string) => {
    const newDate = new Date(date);
    if (type === 'inicio') onFilterChange({ ...filters, dataInicio: newDate });
    else onFilterChange({ ...filters, dataFim: newDate });
  };

  const clearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    onFilterChange({ campanhas: [], statuses: [], dataInicio: thirtyDaysAgo, dataFim: today, busca: '' });
  };

  return (
    <div>
      {/* Search */}
      <div className="search" style={{ width: '100%', marginBottom: 10 }}>
        <Icon name="search" size={16} />
        <input
          id="filterSearchInput"
          name="busca"
          type="text"
          placeholder="Buscar por nome ou telefone"
          value={filters.busca || ''}
          onChange={(e) => onFilterChange({ ...filters, busca: e.target.value })}
          autoComplete="off"
          aria-label="Buscar conversas"
        />
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn secondary"
        style={{ width: '100%', justifyContent: 'space-between', padding: '9px 14px' }}
        aria-expanded={isOpen}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="filter" size={14} />
          Filtros
          {activeCount > 0 && (
            <span className="chip info" style={{ padding: '3px 7px' }}>{activeCount}</span>
          )}
        </span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 8 }}>Campanha</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {campaignOptions.map((c) => {
                const on = filters.campanhas.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCampaign(c)}
                    className={`chip ${on ? 'info' : 'neutral'}`}
                    style={{ cursor: 'pointer', border: 0, padding: '7px 11px' }}
                  >
                    {on && <Icon name="check" size={11} />}
                    {CAMPAIGN_LABEL[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="t-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {statusOptions.map((s) => {
                const meta = statusMeta(s);
                const on = filters.statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={`chip ${on ? meta.chip : 'neutral'}`}
                    style={{ cursor: 'pointer', border: 0, padding: '7px 11px', opacity: on ? 1 : 0.7 }}
                  >
                    <span className="dot" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="t-label" style={{ marginBottom: 8 }}>Período</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="filterDateStartInput"
                name="dataInicio"
                type="date"
                className="input tnum"
                style={{ padding: '9px 12px', fontSize: 12 }}
                value={filters.dataInicio.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('inicio', e.target.value)}
                aria-label="Data inicial"
              />
              <input
                id="filterDateEndInput"
                name="dataFim"
                type="date"
                className="input tnum"
                style={{ padding: '9px 12px', fontSize: 12 }}
                value={filters.dataFim.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('fim', e.target.value)}
                aria-label="Data final"
              />
            </div>
          </div>

          <button type="button" onClick={clearFilters} className="btn ghost" style={{ alignSelf: 'flex-start', padding: '8px 14px' }}>
            <Icon name="rotate-ccw" size={14} /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
};
