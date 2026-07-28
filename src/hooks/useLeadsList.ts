import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  telefone: string;
  nome_lead: string;
  tipo_campanha: string;
  status_reativacao: string;
  empreendimento_id?: string;
  data_envio: Date;
  data_resposta?: Date;
  ultima_resposta_lead?: string;
  nome_campanha?: string;
}

export interface LeadsStats {
  total: number;
  respondidos: number;
  ativados: number;
  nao_respondidos: number;
  erros: number;
}

export const useLeadsList = (selectedCampaignName?: string | null) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    respondidos: false,
    ativados: false,
  });
  const [stats, setStats] = useState<LeadsStats>({
    total: 0,
    respondidos: 0,
    ativados: 0,
    nao_respondidos: 0,
    erros: 0,
  });

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('leads_reativacao')
        .select('id, telefone, nome_lead, tipo_campanha, status_reativacao, empreendimento_id, data_envio, data_resposta, ultima_resposta_lead, nome_campanha')
        .not('nome_lead', 'is', null);

      if (selectedCampaignName) {
        query = query.eq('nome_campanha', selectedCampaignName);
      }

      const { data: allLeads, error } = await query.order('data_envio', { ascending: false });

      if (error) throw error;

      const leadsData = (allLeads || []).map((lead: any) => ({
        ...lead,
        data_envio: lead.data_envio ? new Date(lead.data_envio) : new Date(),
        data_resposta: lead.data_resposta ? new Date(lead.data_resposta) : undefined,
      }));

      setLeads(leadsData);

      // Calcular estatísticas
      const stats: LeadsStats = {
        total: leadsData.length,
        respondidos: 0,
        ativados: 0,
        nao_respondidos: 0,
        erros: 0,
      };

      leadsData.forEach((lead: Lead) => {
        const status = (lead.status_reativacao || '').toLowerCase();
        if (status === 'respondido') {
          stats.respondidos += 1;
        } else if (status === 'reativado' || status === 'interessado') {
          stats.ativados += 1;
        } else if (status === 'erro' || status === 'erro no disparo') {
          stats.erros += 1;
        } else if (status !== 'pendente') {
          stats.nao_respondidos += 1;
        }
      });

      setStats(stats);
    } catch (err) {
      console.warn('⚠️ Erro ao buscar leads:', err);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampaignName]);

  useEffect(() => {
    fetchLeads();

    let channel: any = null;
    try {
      channel = supabase
        .channel('leads-list-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          () => fetchLeads()
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de leads:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de leads:', err);
      }
    };
  }, [fetchLeads]);

  const filteredLeads = leads.filter(lead => {
    // Filtro de busca (telefone ou nome)
    const searchLower = filters.searchTerm.toLowerCase();
    const matchesSearch =
      lead.telefone.toLowerCase().includes(searchLower) ||
      lead.nome_lead.toLowerCase().includes(searchLower);

    // Filtro de status
    const status = (lead.status_reativacao || '').toLowerCase();
    const matchesStatus =
      (!filters.respondidos && !filters.ativados) ||
      (filters.respondidos && status === 'respondido') ||
      (filters.ativados && (status === 'reativado' || status === 'interessado'));

    return matchesSearch && matchesStatus;
  });

  // Agrupar por empreendimento
  const ledgerByEmpreendimento = filteredLeads.reduce((acc, lead) => {
    const empreendimentoId = lead.empreendimento_id || 'Sem empreendimento';
    if (!acc[empreendimentoId]) {
      acc[empreendimentoId] = [];
    }
    acc[empreendimentoId].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  return {
    leads: filteredLeads,
    allLeads: leads,
    isLoading,
    filters,
    setFilters,
    stats,
    refetch: fetchLeads,
    ledgerByEmpreendimento,
  };
};
