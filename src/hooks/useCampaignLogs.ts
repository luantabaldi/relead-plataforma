import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type CampaignStatus = 'ativa' | 'concluida';

export interface CampaignLog {
  nome_campanha: string;
  tipo_campanha: string;
  empreendimento?: string;
  total: number;
  enviados: number;
  respondidos: number;
  interessados: number;
  erros: number;
  pendentes: number;
  status: CampaignStatus;
  /** null quando nenhum lead da campanha tem data_envio ainda (só pendentes) —
   * nunca usar `new Date(null)` aqui, isso vira época Unix (31/12/69). */
  data_inicio: Date | null;
  data_fim: Date | null;
  taxa_resposta: number;
  taxa_interesse: number;
  taxa_erro: number;
}

export const useCampaignLogs = () => {
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Filtra pela data de criação da campanha (data_inicio, primeiro envio)
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedCampaignName, setSelectedCampaignName] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | null>(null);

  const fetchCampaignLogs = useCallback(async () => {
    try {
      setIsLoading(true);

      // Buscar todos os leads para agrupar por campanha
      const { data: allLeads, error } = await supabase
        .from('leads_reativacao')
        .select('nome_campanha, tipo_campanha, empreendimento_id, status_reativacao, data_envio, data_resposta')
        .not('nome_campanha', 'is', null)
        .order('data_envio', { ascending: false });

      if (error) throw error;

      // Agrupar por nome_campanha
      const byCampaign = new Map<string, CampaignLog>();

      (allLeads || []).forEach((lead: any) => {
        const key = lead.nome_campanha;

        if (!byCampaign.has(key)) {
          byCampaign.set(key, {
            nome_campanha: key,
            tipo_campanha: lead.tipo_campanha || 'prospeccao',
            empreendimento: lead.empreendimento_id ? `#${lead.empreendimento_id}` : undefined,
            total: 0,
            enviados: 0,
            respondidos: 0,
            interessados: 0,
            erros: 0,
            pendentes: 0,
            status: 'concluida',
            data_inicio: lead.data_envio ? new Date(lead.data_envio) : null,
            data_fim: lead.data_envio ? new Date(lead.data_envio) : null,
            taxa_resposta: 0,
            taxa_interesse: 0,
            taxa_erro: 0,
          });
        }

        const entry = byCampaign.get(key)!;
        entry.total += 1;

        // Atualizar datas
        if (lead.data_envio) {
          const sendDate = new Date(lead.data_envio);
          if (!entry.data_inicio || sendDate < entry.data_inicio) entry.data_inicio = sendDate;
          if (!entry.data_fim || sendDate > entry.data_fim) entry.data_fim = sendDate;
        }

        // Contar por status
        const status = (lead.status_reativacao || '').toLowerCase();
        if (status === 'respondido') {
          entry.respondidos += 1;
          entry.enviados += 1;
        } else if (status === 'reativado' || status === 'interessado') {
          entry.interessados += 1;
          entry.enviados += 1;
        } else if (status === 'erro' || status === 'erro no disparo') {
          entry.erros += 1;
        } else if (status === 'pendente') {
          entry.pendentes += 1;
        } else if (status === 'enviado') {
          entry.enviados += 1;
        }
      });

      // Calcular taxas, status (ativa = ainda tem lead pendente) e converter para array
      const logs = Array.from(byCampaign.values()).map(log => ({
        ...log,
        status: (log.pendentes > 0 ? 'ativa' : 'concluida') as CampaignStatus,
        taxa_resposta: log.total > 0 ? Math.round((log.respondidos / log.total) * 100) : 0,
        taxa_interesse: log.total > 0 ? Math.round((log.interessados / log.total) * 100) : 0,
        taxa_erro: log.total > 0 ? Math.round((log.erros / log.total) * 100) : 0,
      }));

      setCampaigns(logs.sort((a, b) => (b.data_fim?.getTime() ?? 0) - (a.data_fim?.getTime() ?? 0)));
    } catch (err) {
      console.warn('⚠️ Erro ao buscar logs de campanhas:', err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignLogs();

    let channel: any = null;
    try {
      channel = supabase
        .channel('campaign-logs-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          () => fetchCampaignLogs()
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de logs de campanhas:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de logs de campanhas:', err);
      }
    };
  }, [fetchCampaignLogs]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
    const endDate = dateRange.end ? new Date(dateRange.end).setHours(23, 59, 59, 999) : null;
    const campaignDate = campaign.data_inicio ? campaign.data_inicio.getTime() : null;

    // Sem data confirmada (só leads pendentes) só entra no filtro de período
    // se nenhum período estiver selecionado — não dá pra saber se "cabe".
    const dateMatch =
      (!startDate || (campaignDate !== null && campaignDate >= startDate)) &&
      (!endDate || (campaignDate !== null && campaignDate <= endDate));
    const nameMatch = !selectedCampaignName || campaign.nome_campanha === selectedCampaignName;
    const tipoMatch = !selectedTipo || campaign.tipo_campanha === selectedTipo;
    const statusMatch = !selectedStatus || campaign.status === selectedStatus;

    return dateMatch && nameMatch && tipoMatch && statusMatch;
  });

  const exportToCSV = () => {
    const headers = ['Campanha', 'Tipo', 'Status', 'Empreendimento', 'Total', 'Enviados', 'Respondidos', 'Tx Resp.', 'Interessados', 'Tx Int.', 'Erros', 'Tx Erro', 'Início', 'Conclusão', 'Duração (min)'];
    const rows = filteredCampaigns.map(c => [
      c.nome_campanha,
      c.tipo_campanha,
      c.status === 'ativa' ? 'Ativa' : 'Concluída',
      c.empreendimento || '-',
      c.total,
      c.enviados,
      c.respondidos,
      c.taxa_resposta + '%',
      c.interessados,
      c.taxa_interesse + '%',
      c.erros,
      c.taxa_erro + '%',
      c.data_inicio ? c.data_inicio.toLocaleString('pt-BR') : '--',
      c.data_fim ? c.data_fim.toLocaleString('pt-BR') : '--',
      c.data_inicio && c.data_fim ? Math.ceil((c.data_fim.getTime() - c.data_inicio.getTime()) / 60000) : '--',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-campanhas-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    campaigns: filteredCampaigns,
    allCampaigns: campaigns,
    isLoading,
    refetch: fetchCampaignLogs,
    dateRange,
    setDateRange,
    selectedCampaignName,
    setSelectedCampaignName,
    selectedTipo,
    setSelectedTipo,
    selectedStatus,
    setSelectedStatus,
    exportToCSV,
  };
};
