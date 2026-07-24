import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ActiveCampaign {
  nome_campanha: string;
  tipo_campanha: string;
  total: number;
  pendente: number;
  enviado: number;
  erro: number;
}

/**
 * Campanhas com pelo menos um lead ainda "Pendente" em leads_reativacao —
 * ou seja, disparos que o n8n está processando agora. Atualiza em tempo real
 * via subscription, então a barra de progresso anda sozinha na tela.
 */
export const useActiveDispatches = () => {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    try {
      const { data: pendingRows, error: pendingError } = await supabase
        .from('leads_reativacao')
        .select('nome_campanha')
        .eq('status_reativacao', 'Pendente')
        .limit(2000);

      if (pendingError) throw pendingError;

      const activeNames = Array.from(
        new Set((pendingRows || []).map((r: any) => r.nome_campanha).filter(Boolean))
      );

      if (activeNames.length === 0) {
        setCampaigns([]);
        return;
      }

      const { data: allRows, error: allError } = await supabase
        .from('leads_reativacao')
        .select('nome_campanha, tipo_campanha, status_reativacao')
        .in('nome_campanha', activeNames);

      if (allError) throw allError;

      const byCampaign = new Map<string, ActiveCampaign>();
      (allRows || []).forEach((row: any) => {
        const key = row.nome_campanha;
        if (!byCampaign.has(key)) {
          byCampaign.set(key, {
            nome_campanha: key,
            tipo_campanha: row.tipo_campanha || 'prospeccao',
            total: 0,
            pendente: 0,
            enviado: 0,
            erro: 0,
          });
        }
        const entry = byCampaign.get(key)!;
        entry.total += 1;
        const status = (row.status_reativacao || '').toLowerCase();
        if (status === 'pendente') entry.pendente += 1;
        else if (status === 'erro' || status === 'erro no disparo') entry.erro += 1;
        else entry.enviado += 1;
      });

      setCampaigns(Array.from(byCampaign.values()));
    } catch (err) {
      console.warn('⚠️ Erro ao buscar disparos em andamento:', err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();

    let channel: any = null;
    try {
      channel = supabase
        .channel('active-dispatches-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          () => fetchActive()
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de disparos ativos:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de disparos ativos:', err);
      }
    };
  }, [fetchActive]);

  return { campaigns, isLoading, refetch: fetchActive };
};
