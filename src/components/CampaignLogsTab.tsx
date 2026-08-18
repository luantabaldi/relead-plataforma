import React, { useState } from 'react';
import { CampaignLog, useCampaignLogs } from '../hooks/useCampaignLogs';
import { useN8nStatus } from '../hooks/useN8nStatus';
import { Icon } from './Icon';

interface CampaignLogsTabProps {
  visible?: boolean;
}

export const CampaignLogsTab: React.FC<CampaignLogsTabProps> = ({ visible = true }) => {
  const {
    campaigns,
    allCampaigns,
    isLoading,
    dateRange,
    setDateRange,
    selectedCampaignName,
    setSelectedCampaignName,
    selectedTipo,
    setSelectedTipo,
    selectedStatus,
    setSelectedStatus,
    exportToCSV,
  } = useCampaignLogs();
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignLog | null>(null);
  const n8nStatus = useN8nStatus();

  const hasActiveFilters = !!(dateRange.start || dateRange.end || selectedCampaignName || selectedTipo || selectedStatus);
  const clearFilters = () => {
    setDateRange({ start: null, end: null });
    setSelectedCampaignName(null);
    setSelectedTipo(null);
    setSelectedStatus(null);
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid var(--paper-300)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    color: 'var(--ink-500)',
  };
  const dateInputStyle: React.CSSProperties = {
    padding: '6px 10px',
    border: '1px solid var(--paper-300)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'inherit',
  };

  if (!visible) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTaxaColor = (taxa: number) => {
    if (taxa === 0) return '#999';
    if (taxa < 10) return '#d97706';
    if (taxa < 30) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Lista de campanhas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--ink-500)' }}>
              Histórico de Campanhas
            </h2>
            {n8nStatus.lastExecution && (
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--ink-100)' }}>
                Último sincronismo: {new Date(n8nStatus.lastExecution.timestamp).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-200)' }}>
                {campaigns.length} de {allCampaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}
              </span>
              <div style={{ fontSize: '11px', color: n8nStatus.isRunning ? '#10b981' : 'var(--ink-100)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: n8nStatus.isRunning ? '#10b981' : '#d1d5db' }} />
                {n8nStatus.isRunning ? 'Sincronizando...' : 'Atualizado'}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros — expostos direto na barra, sem esconder atrás de um botão genérico */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '12px', backgroundColor: 'var(--paper-50)', borderRadius: '8px', border: '1px solid var(--paper-200)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)', marginBottom: '4px' }}>
              Status
            </label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value ? (e.target.value as 'ativa' | 'concluida') : null)}
              style={selectStyle}
            >
              <option value="">Todos</option>
              <option value="ativa">Ativa</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)', marginBottom: '4px' }}>
              Tipo de campanha
            </label>
            <select
              value={selectedTipo || ''}
              onChange={(e) => setSelectedTipo(e.target.value || null)}
              style={selectStyle}
            >
              <option value="">Todos</option>
              <option value="prospeccao">Prospecção</option>
              <option value="reativacao">Reativação</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)', marginBottom: '4px' }}>
              Criada de
            </label>
            <input
              type="date"
              value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
              style={dateInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)', marginBottom: '4px' }}>
              até
            </label>
            <input
              type="date"
              value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
              style={dateInputStyle}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)', marginBottom: '4px' }}>
              Campanha
            </label>
            <select
              value={selectedCampaignName || ''}
              onChange={(e) => setSelectedCampaignName(e.target.value || null)}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">Todas as campanhas</option>
              {allCampaigns.map(c => (
                <option key={c.nome_campanha} value={c.nome_campanha}>
                  {c.nome_campanha}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#dc2626',
                  height: 30,
                }}
              >
                Limpar filtros
              </button>
            )}
            <button
              onClick={exportToCSV}
              style={{
                padding: '6px 12px',
                backgroundColor: 'white',
                border: '1px solid var(--paper-300)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--ink-500)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: 30,
              }}
            >
              <Icon name="download" size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--ink-100)' }}>
            <Icon name="refresh" size={20} style={{ marginRight: '8px', animation: 'spin 2s linear infinite' }} />
            Carregando campanhas...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-100)', padding: '40px 20px' }}>
            Nenhuma campanha encontrada
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {campaigns.map((campaign) => (
              <div
                key={campaign.nome_campanha}
                onClick={() => setSelectedCampaign(campaign)}
                style={{
                  padding: '16px',
                  backgroundColor: selectedCampaign?.nome_campanha === campaign.nome_campanha ? 'var(--orange-50)' : 'var(--paper-50)',
                  border: selectedCampaign?.nome_campanha === campaign.nome_campanha ? '2px solid var(--orange-500)' : '1px solid var(--paper-200)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCampaign?.nome_campanha !== campaign.nome_campanha) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--paper-100)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--paper-300)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCampaign?.nome_campanha !== campaign.nome_campanha) {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--paper-50)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--paper-200)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--ink-500)' }}>
                      {campaign.nome_campanha}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-200)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '999px',
                          color: campaign.status === 'ativa' ? '#065f46' : 'var(--ink-200)',
                          backgroundColor: campaign.status === 'ativa' ? '#d1fae5' : 'var(--paper-200)',
                        }}
                      >
                        {campaign.status === 'ativa' ? 'Ativa' : 'Concluída'}
                      </span>
                      {campaign.tipo_campanha} • {formatDate(campaign.data_inicio)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-500)' }}>
                      {campaign.total}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-100)' }}>leads</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <div style={{ color: 'var(--ink-100)', marginBottom: '2px' }}>Responderam</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-500)' }}>
                      {campaign.respondidos} ({campaign.taxa_resposta}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-100)', marginBottom: '2px' }}>Interessados</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-500)' }}>
                      {campaign.interessados} ({campaign.taxa_interesse}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--ink-100)', marginBottom: '2px' }}>Erros</div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-500)' }}>
                      {campaign.erros} ({campaign.taxa_erro}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detalhes da campanha selecionada */}
      {selectedCampaign && (
        <div style={{ flex: 1, backgroundColor: 'var(--paper-50)', borderRadius: '8px', padding: '24px', border: '1px solid var(--paper-200)', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--ink-500)' }}>
            Detalhes da Campanha
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Nome da campanha */}
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)' }}>
                Campanha
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                {selectedCampaign.nome_campanha}
              </p>
            </div>

            {/* Tipo de campanha */}
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)' }}>
                Tipo
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                {selectedCampaign.tipo_campanha}
              </p>
            </div>

            {/* Data início */}
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)' }}>
                Início
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                {formatDate(selectedCampaign.data_inicio)} às {formatTime(selectedCampaign.data_inicio)}
              </p>
            </div>

            {/* Data fim */}
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)' }}>
                Conclusão
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                {formatDate(selectedCampaign.data_fim)} às {formatTime(selectedCampaign.data_fim)}
              </p>
            </div>

            {/* Empreendimento */}
            {selectedCampaign.empreendimento && (
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-200)' }}>
                  Empreendimento
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-500)' }}>
                  {selectedCampaign.empreendimento}
                </p>
              </div>
            )}
          </div>

          {/* Métricas principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Total de Leads
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                {selectedCampaign.total}
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Enviados
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                {selectedCampaign.enviados}
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Respondidos
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                  {selectedCampaign.respondidos}
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: getTaxaColor(selectedCampaign.taxa_resposta) }}>
                  {selectedCampaign.taxa_resposta}%
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Interessados
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                  {selectedCampaign.interessados}
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: getTaxaColor(selectedCampaign.taxa_interesse) }}>
                  {selectedCampaign.taxa_interesse}%
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Erros
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                  {selectedCampaign.erros}
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: getTaxaColor(selectedCampaign.taxa_erro) }}>
                  {selectedCampaign.taxa_erro}%
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid var(--paper-200)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--ink-200)', textTransform: 'uppercase' }}>
                Duração
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink-500)' }}>
                {Math.ceil((selectedCampaign.data_fim.getTime() - selectedCampaign.data_inicio.getTime()) / 60000)}m
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
