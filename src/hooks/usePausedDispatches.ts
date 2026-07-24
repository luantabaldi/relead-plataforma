import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
 */
export const usePausedDispatches = () => {
  const [campaigns, setCampaigns] = useState<PausedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaused = useCallback(async () => {
    try {
      const { data: pausedRows, error: pausedError } = await supabase
        .from('leads_reativacao')
        .select('nome_campanha')
        .eq('status_reativacao', 'Pausado')
        .limit(2000);

      if (pausedError) throw pausedError;

      const pausedNames = Array.from(
        new Set((pausedRows || []).map((r: any) => r.nome_campanha).filter(Boolean))
      );

      if (pausedNames.length === 0) {
        setCampaigns([]);
        return;
      }

      const { data: allRows, error: allError } = await supabase
        .from('leads_reativacao')
        .select('nome_campanha, tipo_campanha, status_reativacao')
        .in('nome_campanha', pausedNames);

      if (allError) throw allError;

      const byCampaign = new Map<string, PausedCampaign>();
      (allRows || []).forEach((row: any) => {
        const key = row.nome_campanha;
        if (!byCampaign.has(key)) {
          byCampaign.set(key, {
            nome_campanha: key,
            tipo_campanha: row.tipo_campanha || 'prospeccao',
            total: 0,
            pausado: 0,
            enviado: 0,
            erro: 0,
          });
        }
        const entry = byCampaign.get(key)!;
        entry.total += 1;
        const status = (row.status_reativacao || '').toLowerCase();
        if (status === 'pausado') entry.pausado += 1;
        else if (status === 'erro' || status === 'erro no disparo') entry.erro += 1;
        else if (status !== 'pendente') entry.enviado += 1;
      });

      setCampaigns(Array.from(byCampaign.values()));
    } catch (err) {
      console.warn('⚠️ Erro ao buscar disparos pausados:', err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaused();

    let channel: any = null;
    try {
      channel = supabase
        .channel('paused-dispatches-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          () => fetchPaused()
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de disparos pausados:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de disparos pausados:', err);
      }
    };
  }, [fetchPaused]);

  return { campaigns, isLoading, refetch: fetchPaused };
};
