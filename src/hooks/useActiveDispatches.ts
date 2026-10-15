import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nomesDeCampanhasComStatus, resumirCampanha } from '../lib/resumoCampanhas';

export interface ActiveCampaign {
  nome_campanha: string;
  tipo_campanha: string;
  total: number;
  pendente: number;
  enviado: number;
  erro: number;
  pausado: number;
}

/**
 * Campanhas com pelo menos um lead ainda "Pendente" em leads_reativacao —
 * ou seja, disparos que o n8n está processando agora. Atualiza em tempo real
 * via subscription, então a barra de progresso anda sozinha na tela.
 *
 * As contagens vêm de consultas de contagem no banco (lib/resumoCampanhas):
 * antes, a lista era lida em memória e cortada em 1.000 linhas, e tudo que não
 * era pendente ou erro (inclusive pausados e cancelados) era contado como "enviado".
 */
export const useActiveDispatches = () => {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const nomes = await nomesDeCampanhasComStatus('Pendente');
      if (nomes.length === 0) {
        setCampaigns([]);
        return;
      }
      const resumos = await Promise.all(nomes.map((n) => resumirCampanha(n)));
      setCampaigns(
        resumos.map((r) => ({
          nome_campanha: r.nome_campanha,
          tipo_campanha: r.tipo_campanha,
          total: r.total,
          pendente: r.pendente,
          enviado: r.enviado,
          erro: r.erro,
          pausado: r.pausado,
        }))
      );
    } catch (err) {
      console.warn('⚠️ Erro ao buscar disparos em andamento:', err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();

    // Debounce: gravar 2 mil leads de uma vez dispara um evento por linha.
    const agendar = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(fetchActive, 800);
    };

    let channel: any = null;
    try {
      channel = supabase
        .channel('active-dispatches-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_reativacao' }, agendar)
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de disparos ativos:', err);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de disparos ativos:', err);
      }
    };
  }, [fetchActive]);

  return { campaigns, isLoading, refetch: fetchActive };
};
