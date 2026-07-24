import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Dispatch, Message } from '../types';

interface RealtimeEvent {
  type: 'dispatch' | 'message';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Dispatch | Message;
}

/**
 * Hook para real-time subscriptions em envios e mensagens
 * Detecta novos envios, respostas e atualizações de status
 */
export const useRealtimeConversations = (
  onDispatchUpdate?: (event: RealtimeEvent) => void,
  onMessageUpdate?: (event: RealtimeEvent) => void
) => {
  useEffect(() => {
    let leadsSubscription: any = null;
    let conversasIaSubscription: any = null;

    try {
      // Subscribe em atualizações de leads_reativacao
      leadsSubscription = supabase
        .channel('leads_reativacao-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          (payload) => {
            console.log('📨 Leads reativacao alterado:', payload);
            onDispatchUpdate?.({
              type: 'dispatch',
              action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              data: (payload.new || payload.old) as any,
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Inscrito em atualizações de leads_reativacao');
          } else if (status === 'CLOSED') {
            console.log('⚠️ Desconectado de atualizações de leads_reativacao');
          }
        });

      // Subscribe em atualizações de conversas_ia
      conversasIaSubscription = supabase
        .channel('conversas_ia-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversas_ia' },
          (payload) => {
            console.log('💬 Conversas IA alterada:', payload);
            onMessageUpdate?.({
              type: 'message',
              action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              data: (payload.new || payload.old) as any,
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Inscrito em atualizações de conversas_ia');
          } else if (status === 'CLOSED') {
            console.log('⚠️ Desconectado de atualizações de conversas_ia');
          }
        });
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime subscriptions (Supabase offline):', err);
    }

    return () => {
      try {
        if (leadsSubscription) leadsSubscription.unsubscribe();
        if (conversasIaSubscription) conversasIaSubscription.unsubscribe();
      } catch (err) {
        console.warn('⚠️ Falha ao liberar realtime subscriptions:', err);
      }
    };
  }, [onDispatchUpdate, onMessageUpdate]);
};
