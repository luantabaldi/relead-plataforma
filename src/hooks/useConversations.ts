import { useState, useEffect, ReactElement } from 'react';
import { ConversationThread, FilterOptions } from '../types';
import { useDispatchesList } from './useDispatchesList';
import { useConversationThread } from './useConversationThread';
import { useRealtimeConversations } from './useRealtimeConversations';
import { useToast, ToastState } from './useToast';
import { useConfirm } from './useConfirm';
import { friendlyError } from '../lib/friendlyError';
import {
  useMarkAsInterested,
  useMarkAsDisinterested,
} from './useUpdateDispatchStatus';

interface UseConversationsState {
  conversations: ConversationThread[];
  isLoading: boolean;
  error: string | null;
  handleAction: (conversationId: string, action: string) => Promise<void>;
  refetch: () => void;
  selectedDispatchId: string;
  setSelectedDispatchId: (id: string) => void;
  pendingAction: string | null;
  toast: ToastState | null;
  dismissToast: () => void;
  confirmDialog: ReactElement;
}

/**
 * Hook principal que integra todos os hooks de Supabase
 * Gerencia estado global das conversas e ações
 */
export const useConversations = (
  initialFilters?: FilterOptions,
  useMockData: boolean = false
): UseConversationsState => {
  const [selectedDispatchId, setSelectedDispatchId] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      campanhas: [],
      statuses: [],
      dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dataFim: new Date(),
      busca: '',
    }
  );

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Hooks de Supabase
  const { dispatches, isLoading: isLoadingDispatches, error: dispatchError, refetch: refetchDispatches } =
    useDispatchesList(filters);

  const { conversation, isLoading: isLoadingConversation } =
    useConversationThread(selectedDispatchId);


  const { markAsInterested } = useMarkAsInterested();
  const { markAsDisinterested } = useMarkAsDisinterested();
  const { toast, notify, dismiss: dismissToast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Real-time subscriptions
  useRealtimeConversations(
    (event) => {
      // Dispatch atualizado
      if (event.action === 'UPDATE') {
        refetchDispatches();
      }
    },
    (event) => {
      // Nova mensagem recebida
      if (event.action === 'INSERT' && selectedDispatchId) {
        console.log('🔔 Notificação: Nova mensagem recebida!');
        // Recarregar conversa atual
      }
    }
  );

  // Combinação de conversas e dados selecionados
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(isLoadingDispatches);
    setError(dispatchError);

    // Montar array de conversas
    const convs: ConversationThread[] = dispatches.map((dispatch) => {
      // Se esta é a conversa selecionada, usar dados completos
      if (conversation?.dispatch.id === dispatch.id && conversation) {
        return conversation;
      }

      // Caso contrário, usar dados básicos (sem mensagens)
      return {
        dispatch,
        messages: [],
        extracted_data: {},
        ai_classification: {
          interesse: false,
          confianca: 0,
          motivo: 'Carregando…',
          opt_out: false,
        },
      };
    });

    setConversations(convs);
  }, [dispatches, conversation, isLoadingDispatches, isLoadingConversation, dispatchError]);

  const handleAction = async (conversationId: string, action: string) => {
    const conv = conversations.find((c) => c.dispatch.id === conversationId);
    if (!conv) return;

    if (action === 'reenviar') {
      const ok = await confirm({
        title: 'Reenviar mensagem?',
        message: `A mensagem será enviada novamente para ${conv.dispatch.nome} (${conv.dispatch.telefone}).`,
        confirmLabel: 'Reenviar',
      });
      if (!ok) return;
    }

    setPendingAction(action);
    try {
      switch (action) {
        case 'reenviar': {
          const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL;
          if (!webhookUrl) {
            throw new Error('Webhook de reenvio não configurado (REACT_APP_N8N_WEBHOOK_URL).');
          }
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dispatch_id: conv.dispatch.id,
              telefone: conv.dispatch.telefone,
              nome: conv.dispatch.nome,
              template_nome: conv.dispatch.template_nome,
            }),
          });
          if (!response.ok) {
            throw new Error(`Webhook respondeu com status ${response.status}`);
          }
          notify('ok', 'Mensagem reenviada com sucesso.');
          break;
        }

        case 'marcar-interessado': {
          const result = await markAsInterested(conversationId, {
            id_crm: conv.dispatch.id_crm,
            bairro: conv.extracted_data.bairro,
            valor_buscado: conv.extracted_data.valor_buscado,
            tipo_imovel: conv.extracted_data.tipo_imovel,
          });
          if (result.ok) {
            if (result.crmSynced) {
              notify('ok', 'Lead marcado como interessado.');
            } else {
              notify('err', 'Lead marcado como interessado, mas a sincronização com o CRM falhou. Verifique manualmente mais tarde.');
            }
            refetchDispatches();
          } else {
            notify('err', friendlyError(null, 'Não foi possível marcar o lead como interessado.'));
          }
          break;
        }

        case 'marcar-sem-interesse': {
          const success = await markAsDisinterested(conversationId);
          if (success) {
            notify('ok', 'Lead marcado como sem interesse (opt-out).');
            refetchDispatches();
          } else {
            notify('err', friendlyError(null, 'Não foi possível marcar o lead como sem interesse.'));
          }
          break;
        }

        case 'copiar-crm': {
          const crmData = {
            nome: conv.dispatch.nome,
            telefone: conv.dispatch.telefone,
            bairro: conv.extracted_data.bairro,
            valor: conv.extracted_data.valor_buscado,
            tipo: conv.extracted_data.tipo_imovel,
            campanha: conv.dispatch.tipo_campanha,
          };

          const jsonString = JSON.stringify(crmData, null, 2);
          await navigator.clipboard.writeText(jsonString);
          notify('ok', 'Dados copiados para a área de transferência.');
          break;
        }

        default:
          console.warn(`⚠️ Ação desconhecida: ${action}`);
      }
    } catch (err) {
      console.error('❌ Erro em handleAction:', err);
      notify('err', friendlyError(err, 'Não foi possível concluir a ação. Tente novamente.'));
    } finally {
      setPendingAction(null);
    }
  };

  return {
    conversations,
    isLoading,
    error,
    handleAction,
    refetch: refetchDispatches,
    selectedDispatchId,
    setSelectedDispatchId,
    pendingAction,
    toast,
    dismissToast,
    confirmDialog,
  };
};
