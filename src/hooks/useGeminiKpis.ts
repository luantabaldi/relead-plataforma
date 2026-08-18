import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface GeminiKpisPeriod {
  dataInicio: Date;
  dataFim: Date;
}

export interface CustoGeminiPorDia {
  data: string;
  custo_usd: number;
}

export interface CustoGeminiPorCampanha {
  nomeCampanha: string;
  chamadas: number;
  tokensTotal: number;
  custoUsd: number;
}

interface UseGeminiKpisState {
  custoTotalUsd: number;
  tokensTotal: number;
  totalChamadas: number;
  custoPorDia: CustoGeminiPorDia[];
  custoPorCampanha: CustoGeminiPorCampanha[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custo real do Gemini vem de um job periódico separado (n8n "Gemini - Sync
 * Custos de Tokens") que lê o uso de tokens direto do histórico de execuções
 * do WK2 — não dá pra capturar isso inline no fluxo de resposta porque o
 * n8n não expõe o tokenUsage do sub-node de modelo LangChain via $() pra um
 * Code node no fluxo principal.
 */
export const useGeminiKpis = (period: GeminiKpisPeriod): UseGeminiKpisState => {
  const [custoTotalUsd, setCustoTotalUsd] = useState(0);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [totalChamadas, setTotalChamadas] = useState(0);
  const [custoPorDia, setCustoPorDia] = useState<CustoGeminiPorDia[]>([]);
  const [custoPorCampanha, setCustoPorCampanha] = useState<CustoGeminiPorCampanha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dataInicioIso = period.dataInicio.toISOString();
      const dataFimIso = period.dataFim.toISOString();

      const fetchAllCustos = async () => {
        const PAGE_SIZE = 1000;
        const MAX_PAGES = 50;
        let allRows: any[] = [];
        for (let page = 0; page < MAX_PAGES; page++) {
          const from = page * PAGE_SIZE;
          const { data: pageData, error: pageError } = await supabase
            .from('custos_gemini_ia')
            .select('*')
            .gte('criado_em', dataInicioIso)
            .lte('criado_em', dataFimIso)
            .range(from, from + PAGE_SIZE - 1);

          if (pageError) throw pageError;

          allRows = allRows.concat(pageData || []);
          if (!pageData || pageData.length < PAGE_SIZE) break;
        }
        return allRows;
      };

      const rows = await fetchAllCustos();

      const totalUsd = rows.reduce((sum: number, r: any) => sum + Number(r.custo_usd || 0), 0);
      const totalTokens = rows.reduce((sum: number, r: any) => sum + Number(r.tokens_total || 0), 0);
      setCustoTotalUsd(totalUsd);
      setTokensTotal(totalTokens);
      setTotalChamadas(rows.length);

      const porDiaMap: Record<string, number> = {};
      rows.forEach((r: any) => {
        const dia = (r.criado_em || '').split('T')[0];
        if (!dia) return;
        porDiaMap[dia] = (porDiaMap[dia] || 0) + Number(r.custo_usd || 0);
      });
      setCustoPorDia(
        Object.entries(porDiaMap)
          .map(([data, custo_usd]) => ({ data, custo_usd }))
          .sort((a, b) => a.data.localeCompare(b.data))
      );

      const porCampanhaMap: Record<string, { chamadas: number; tokens: number; custo: number }> = {};
      rows.forEach((r: any) => {
        const nome = r.nome_campanha || 'Sem campanha';
        if (!porCampanhaMap[nome]) porCampanhaMap[nome] = { chamadas: 0, tokens: 0, custo: 0 };
        porCampanhaMap[nome].chamadas += 1;
        porCampanhaMap[nome].tokens += Number(r.tokens_total || 0);
        porCampanhaMap[nome].custo += Number(r.custo_usd || 0);
      });
      setCustoPorCampanha(
        Object.entries(porCampanhaMap)
          .map(([nomeCampanha, s]) => ({
            nomeCampanha,
            chamadas: s.chamadas,
            tokensTotal: s.tokens,
            custoUsd: s.custo,
          }))
          .sort((a, b) => b.custoUsd - a.custoUsd)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar custo do Gemini';
      console.warn('⚠️ Erro ao buscar KPIs do Gemini:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [period.dataInicio, period.dataFim]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  return {
    custoTotalUsd,
    tokensTotal,
    totalChamadas,
    custoPorDia,
    custoPorCampanha,
    isLoading,
    error,
    refetch: fetchKpis,
  };
};
