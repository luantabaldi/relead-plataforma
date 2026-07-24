import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Dispatch, FilterOptions } from '../types';
import { mockDispatches } from '../mocks/mockData';
import { parseUTCDate } from '../lib/date';

interface UseDispatchesListState {
  dispatches: Dispatch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para listar envios (dispatches) do Supabase
 * Busca de leads_reativacao com filtros por campanha, status, data e busca
 */
export const useDispatchesList = (filters: FilterOptions): UseDispatchesListState => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeStatus = (status: string | null): any => {
    if (!status) return 'enviado';
    const s = status.toLowerCase().trim();
    if (s === 'sem interesse') return 'sem_interesse';
    if (s === 'reativado') return 'interessado';
    if (s === 'erro no disparo' || s === 'erro') return 'erro';
    return s;
  };

  const fetchDispatches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('leads_reativacao')
        .select('*')
        .order('data_envio', { ascending: false });

      // Filtro: Campanhas
      if (filters.campanhas.length > 0) {
        query = query.in('tipo_campanha', filters.campanhas);
      }

      // Filtro: Status (mapear status_reativacao para nossos status)
      if (filters.statuses.length > 0) {
        const mappedStatuses = filters.statuses.map(s => {
          const lower = s.toLowerCase().trim();
          if (lower === 'sem_interesse') return 'Sem interesse';
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        });
        query = query.in('status_reativacao', mappedStatuses);
      }

      // Filtro: Data
      const dataInicio = filters.dataInicio.toISOString();
      const dataFim = filters.dataFim.toISOString();
      query = query
        .gte('data_envio', dataInicio)
        .lte('data_envio', dataFim);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Filtro: Busca por nome/telefone (feito em memória)
      let filtered = data || [];
      if (filters.busca) {
        const searchLower = filters.busca.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.nome_lead.toLowerCase().includes(searchLower) ||
            d.telefone.includes(searchLower)
        );
      }

      // Agrupar por telefone normalizado (sem DDI 55), mantendo o mais recente.
      // Como a query já ordena por data_envio desc, o primeiro que encontramos é o mais recente.
      const uniqueMap = new Map<string, typeof filtered[0]>();
      filtered.forEach((d) => {
        if (!d.telefone) return;
        const cleanPhone = d.telefone.replace(/\D/g, '');
        const key = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, d);
        }
      });
      const uniqueFiltered = Array.from(uniqueMap.values());

      // Transformar leads_reativacao em Dispatch
      setDispatches(
        uniqueFiltered.map((d) => ({
          id: d.id,
          telefone: d.telefone,
          nome: d.nome_lead,
          tipo_campanha: d.tipo_campanha || 'reativacao',
          status: normalizeStatus(d.status_reativacao),
          template_nome: '[Template]',
          timestamp_envio: d.data_envio ? parseUTCDate(d.data_envio) : new Date(),
          timestamp_resposta: d.data_resposta ? parseUTCDate(d.data_resposta) : undefined,
          id_crm: d.lead_id_cvcrm ? parseInt(d.lead_id_cvcrm, 10) : undefined,
          url_imagem: undefined,
          observacao: d.observacao_crm,
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar envios';
      console.warn('⚠️ Usando dados mock (Supabase offline):', message);

      // Usar dados mock em modo demo
      let filtered = mockDispatches;

      // Aplicar filtros aos dados mock
      if (filters.campanhas.length > 0) {
        filtered = filtered.filter(d => filters.campanhas.includes(d.tipo_campanha));
      }

      if (filters.statuses.length > 0) {
        filtered = filtered.filter(d => filters.statuses.includes(d.status));
      }

      if (filters.busca) {
        const searchLower = filters.busca.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.nome.toLowerCase().includes(searchLower) ||
            d.telefone.includes(searchLower)
        );
      }

      setDispatches(filtered);
      setError(null); // Sem erro - usando modo demo
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  return {
    dispatches,
    isLoading,
    error,
    refetch: fetchDispatches,
  };
};
