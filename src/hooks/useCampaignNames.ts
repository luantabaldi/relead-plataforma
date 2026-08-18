import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseCampaignNamesState {
  names: string[];
  isLoading: boolean;
}

/**
 * Lista de nomes de campanha distintos em leads_reativacao, para popular
 * seletores de "campanha específica". Não é filtrada por período de propósito
 * — a lista de opções não deve encolher/crescer conforme o usuário troca o
 * período no filtro de Performance.
 */
export const useCampaignNames = (): UseCampaignNamesState => {
  const [names, setNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNames = useCallback(async () => {
    try {
      setIsLoading(true);

      // PostgREST corta em 1000 linhas por padrão — pagina pra pegar todos
      // os nomes de campanha mesmo com mais de 1000 leads na base.
      const PAGE_SIZE = 1000;
      const MAX_PAGES = 50;
      let allRows: any[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from('leads_reativacao')
          .select('nome_campanha')
          .not('nome_campanha', 'is', null)
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        allRows = allRows.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
      }

      const unique = Array.from(new Set(allRows.map((r: any) => r.nome_campanha).filter(Boolean))) as string[];
      setNames(unique.sort((a, b) => a.localeCompare(b, 'pt-BR')));
    } catch (err) {
      console.warn('⚠️ Erro ao buscar nomes de campanha:', err);
      setNames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  return { names, isLoading };
};
