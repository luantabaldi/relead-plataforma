import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CustoPeriodo {
  dataInicio: Date;
  dataFim: Date;
}

interface UseCustoPeriodoState {
  custoTotalUsd: number;
  isLoading: boolean;
}

/**
 * Custo total (Meta) só para o período da aba Performance — deliberadamente
 * separado de useMetaKpis/kpiPeriod (aba Custos & Saúde) pelo mesmo motivo:
 * trocar o período de uma tela não deve re-buscar dados da outra. Só busca
 * a soma de custo, sem os dados de templates/número/saúde que useMetaKpis
 * carrega, para não duplicar aquele fetch mais pesado.
 */
export const useCustoPeriodo = (period: CustoPeriodo): UseCustoPeriodoState => {
  const [custoTotalUsd, setCustoTotalUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCusto = useCallback(async () => {
    try {
      setIsLoading(true);
      const dataInicioStr = period.dataInicio.toISOString().split('T')[0];
      const dataFimStr = period.dataFim.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('custos_conversas_meta')
        .select('custo_usd')
        .gte('data', dataInicioStr)
        .lte('data', dataFimStr);

      if (error) throw error;

      const total = (data || []).reduce((sum: number, c: any) => sum + Number(c.custo_usd || 0), 0);
      setCustoTotalUsd(total);
    } catch (err) {
      console.warn('⚠️ Erro ao buscar custo do período:', err);
      setCustoTotalUsd(0);
    } finally {
      setIsLoading(false);
    }
  }, [period.dataInicio, period.dataFim]);

  useEffect(() => {
    fetchCusto();
  }, [fetchCusto]);

  return { custoTotalUsd, isLoading };
};
