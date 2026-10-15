import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nomesDeCampanhasComStatus, resumirCampanha } from '../lib/resumoCampanhas';

export interface PausedCampaign {
  nome_campanha: string;
  tipo_campanha: string;
  total: number;
  pausado: number;
  enviado: number;
  erro: number;
}

/**
 * Campanhas com pelo menos um lead "Pausado" em leads_reativacao — disparos
 * interrompidos manualmente (via botão "Parar") que não têm mais leads
 * "Pendente" e por isso somem de useActiveDispatches. Retomar volta esses
 * leads para "Pendente" e o n8n precisa ser re-acionado para processá-los.
 *
 * Mesma contagem por consulta de contagem do painel de disparos ativos.
 */
export const usePausedDispatches = () => {
  const [campaigns, setCampaigns] = useState<PausedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPaused = useCallback(async () => {
    try {
      const nomes = await nomesDeCampanhasComStatus('Pausado');
      if (nomes.length === 0) {
        setCampaigns([]);
        return;
      }
      const resumos = await Promise.all(nomes.map((n) => resumirCampanha(n)));
      setCampaigns(
        resumos
          // Uma campanha com leads pendentes está em andamento, não pausada.
          .filter((r) => r.pausado > 0 && r.pendente === 0)
          .map((r) => ({
            nome_campanha: r.nome_campanha,
            tipo_campanha: r.tipo_campanha,
            total: r.total,
            pausado: r.pausado,
            enviado: r.enviado,
            erro: r.erro,
          }))
      );
    } catch (err) {
      console.warn('⚠️ Erro ao buscar disparos pausados:', err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaused();

    const agendar = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(fetchPaused, 800);
    };

    let channel: any = null;
    try {
      channel = supabase
        .channel('paused-dispatches-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_reativacao' }, agendar)
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de disparos pausados:', err);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de disparos pausados:', err);
      }
    };
  }, [fetchPaused]);

  return { campaigns, isLoading, refetch: fetchPaused };
};
