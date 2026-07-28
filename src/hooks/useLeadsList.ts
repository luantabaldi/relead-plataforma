import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  telefone: string;
  nome_lead: string;
  tipo_campanha: string;
  status_reativacao: string;
  empreendimento_id?: string;
  empreendimento_nome?: string;
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

export interface LeadsFilters {
  searchTerm: string;
  status: string; // '' | 'respondido' | 'ativado' | 'erro' | 'pendente' | 'sem_resposta'
  nomeCampanha: string; // '' = todas
  empreendimentoId: string; // '' = todos
  dataInicio: Date | null;
  dataFim: Date | null;
}

const defaultFilters: LeadsFilters = {
  searchTerm: '',
  status: '',
  nomeCampanha: '',
  empreendimentoId: '',
  dataInicio: null,
  dataFim: null,
};

export const useLeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [empreendimentosMap, setEmpreendimentosMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LeadsFilters>(defaultFilters);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);

      const [leadsResult, empreendimentosResult] = await Promise.all([
        supabase
          .from('leads_reativacao')
          .select('id, telefone, nome_lead, tipo_campanha, status_reativacao, empreendimento_id, data_envio, data_resposta, ultima_resposta_lead, nome_campanha')
          .not('nome_lead', 'is', null)
          .order('data_envio', { ascending: false }),
        supabase
          .from('empreendimentos')
          .select('id, nome'),
      ]);

      if (leadsResult.error) throw leadsResult.error;

      const empMap: Record<string, string> = {};
      (empreendimentosResult.data || []).forEach((e: any) => {
        empMap[e.id] = e.nome;
      });
      setEmpreendimentosMap(empMap);

      const leadsData: Lead[] = (leadsResult.data || []).map((lead: any) => ({
        ...lead,
        empreendimento_nome: lead.empreendimento_id ? empMap[lead.empreendimento_id] || `#${lead.empreendimento_id}` : undefined,
        data_envio: lead.data_envio ? new Date(lead.data_envio) : new Date(),
        data_resposta: lead.data_resposta ? new Date(lead.data_resposta) : undefined,
      }));

      setLeads(leadsData);
    } catch (err) {
      console.warn('⚠️ Erro ao buscar leads:', err);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const statusMatches = (lead: Lead, filterStatus: string): boolean => {
    if (!filterStatus) return true;
    const status = (lead.status_reativacao || '').toLowerCase();
    switch (filterStatus) {
      case 'respondido':
        return status === 'respondido';
      case 'ativado':
        return status === 'reativado' || status === 'interessado';
      case 'erro':
        return status === 'erro' || status === 'erro no disparo';
      case 'pendente':
        return status === 'pendente';
      case 'sem_resposta':
        return status === 'enviado';
      default:
        return true;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = filters.searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      lead.telefone.toLowerCase().includes(searchLower) ||
      (lead.nome_lead || '').toLowerCase().includes(searchLower);

    const matchesCampanha = !filters.nomeCampanha || lead.nome_campanha === filters.nomeCampanha;
    const matchesEmpreendimento = !filters.empreendimentoId || lead.empreendimento_id === filters.empreendimentoId;
    const matchesStatus = statusMatches(lead, filters.status);

    const startDate = filters.dataInicio ? new Date(filters.dataInicio).setHours(0, 0, 0, 0) : null;
    const endDate = filters.dataFim ? new Date(filters.dataFim).setHours(23, 59, 59, 999) : null;
    const leadDate = lead.data_envio.getTime();
    const matchesDate = (!startDate || leadDate >= startDate) && (!endDate || leadDate <= endDate);

    return matchesSearch && matchesCampanha && matchesEmpreendimento && matchesStatus && matchesDate;
  });

  const stats: LeadsStats = {
    total: filteredLeads.length,
    respondidos: 0,
    ativados: 0,
    nao_respondidos: 0,
    erros: 0,
  };

  filteredLeads.forEach((lead: Lead) => {
    const status = (lead.status_reativacao || '').toLowerCase();
    if (status === 'respondido') stats.respondidos += 1;
    else if (status === 'reativado' || status === 'interessado') stats.ativados += 1;
    else if (status === 'erro' || status === 'erro no disparo') stats.erros += 1;
    else if (status !== 'pendente') stats.nao_respondidos += 1;
  });

  // Listas para os selects de filtro
  const campanhaOptions = Array.from(new Set(leads.map(l => l.nome_campanha).filter(Boolean))) as string[];
  const empreendimentoOptions = Object.entries(empreendimentosMap).map(([id, nome]) => ({ id, nome }));

  return {
    leads: filteredLeads,
    allLeads: leads,
    isLoading,
    filters,
    setFilters,
    stats,
    refetch: fetchLeads,
    campanhaOptions,
    empreendimentoOptions,
  };
};
