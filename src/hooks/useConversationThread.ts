import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ConversationThread, Message, AIClassification, ConversationData } from '../types';
import { mockDispatches, mockConversations, mockConversationData } from '../mocks/mockData';
import { parseUTCDate } from '../lib/date';
import { formatTemplateMessage } from '../lib/template';

interface UseConversationThreadState {
  conversation: ConversationThread | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Module-level cache for conversation threads to enable instant load / Stale-While-Revalidate
const threadCache = new Map<string, ConversationThread>();

/**
 * Hook para buscar uma conversa completa com histórico e dados extraídos
 */
export const useConversationThread = (dispatchId: string): UseConversationThreadState => {
  const [conversation, setConversation] = useState<ConversationThread | null>(() => {
    return threadCache.get(dispatchId) || null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !threadCache.has(dispatchId);
  });
  const [error, setError] = useState<string | null>(null);

  // Sync state if dispatchId changes and is in cache (or not)
  useEffect(() => {
    if (dispatchId) {
      const cached = threadCache.get(dispatchId);
      if (cached) {
        setConversation(cached);
        setIsLoading(false);
      } else {
        setConversation(null);
        setIsLoading(true);
      }
    } else {
      setConversation(null);
      setIsLoading(false);
    }
    setError(null);
  }, [dispatchId]);

  const fetchConversation = useCallback(async () => {
    if (!dispatchId) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    try {
      if (!threadCache.has(dispatchId)) {
        setIsLoading(true);
      }
      setError(null);

      const normalizeStatus = (status: string | null): any => {
        if (!status) return 'enviado';
        const s = status.toLowerCase().trim();
        if (s === 'sem interesse') return 'sem_interesse';
        if (s === 'reativado') return 'interessado';
        if (s === 'erro no disparo' || s === 'erro') return 'erro';
        return s;
      };

      const parseResumoInteresse = (resumo: string | null): ConversationData => {
        const data: ConversationData = {};
        if (!resumo) return data;
        
        const parts = resumo.split('|');
        parts.forEach(part => {
          const splitPart = part.split(':');
          if (splitPart.length >= 2) {
            const key = splitPart[0].trim();
            const value = splitPart.slice(1).join(':').trim();
            const keyLower = key.toLowerCase();
            if (keyLower.includes('bairro') || keyLower.includes('regiao')) {
              data.bairro = value;
            } else if (keyLower.includes('valor') || keyLower.includes('orcamento') || keyLower.includes('faixa')) {
              data.valor_buscado = value;
            } else if (keyLower.includes('tipo')) {
              data.tipo_imovel = value;
            }
          }
        });
        return data;
      };

      // 1. Buscar o lead principal em leads_reativacao
      const { data: leadData, error: leadError } = await supabase
        .from('leads_reativacao')
        .select('*')
        .eq('id', dispatchId)
        .single();

      if (leadError) {
        throw new Error(`Erro ao buscar lead: ${leadError.message}`);
      }

      if (!leadData) {
        throw new Error('Lead não encontrado.');
      }

      // Buscar todos os leads com o mesmo telefone (normalizado sem DDI 55)
      const cleanPhone = leadData.telefone.replace(/\D/g, '');
      const localPhone = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;

      // Executar a busca de dispatches relacionados e conversas_ia em paralelo
      const [allLeadsResult, conversaIaResult] = await Promise.all([
        supabase
          .from('leads_reativacao')
          .select('*')
          .or(`telefone.eq.${localPhone},telefone.eq.55${localPhone}`)
          .order('data_envio', { ascending: true }),
        supabase
          .from('conversas_ia')
          .select('*')
          .or(`telefone.eq.${localPhone},telefone.eq.55${localPhone}`)
          .maybeSingle()
      ]);

      const allLeadsData = allLeadsResult.data;
      const allLeadsError = allLeadsResult.error;
      const conversaIaData = conversaIaResult.data;

      if (allLeadsError) {
        console.warn('⚠️ Erro ao buscar dispatches relacionados:', allLeadsError.message);
      }

      const leadsList = allLeadsData && allLeadsData.length > 0 ? allLeadsData : [leadData];

      // Determinar o lead mais recente da lista para puxar dados de conversas_ia e metadados
      const mostRecentLead = leadsList[leadsList.length - 1];

      // Montar o objeto de conversa e mensagens de forma mesclada
      const messages: Message[] = [];

      leadsList.forEach((leadItem) => {
        const rawHistory = leadItem.historico_mensagens;
        const currentDispatchId = leadItem.id;
        const leadItemFirstName = leadItem.nome_lead ? leadItem.nome_lead.split(' ')[0] : 'Cliente';

        if (Array.isArray(rawHistory) && rawHistory.length > 0) {
          rawHistory.forEach((msg: any, index: number) => {
            const sender = (msg.remetente || 'ia').toLowerCase();
            let mappedSender: 'user' | 'lead' | 'ia' = 'ia';
            if (sender === 'lead') mappedSender = 'lead';
            else if (sender === 'user') mappedSender = 'user';
            else if (sender === 'ia') mappedSender = 'ia';
            else if (sender === 'template_waba') mappedSender = 'ia';

            const textoMsg = formatTemplateMessage(msg.texto || msg.mensagem || '', leadItemFirstName);

            messages.push({
              id: `${currentDispatchId}-msg-${index}`,
              dispatch_id: currentDispatchId,
              telefone: leadItem.telefone,
              texto: textoMsg,
              sender: mappedSender,
              timestamp: parseUTCDate(msg.timestamp || leadItem.data_envio),
              tipo_campanha: msg.tipo_campanha || leadItem.tipo_campanha || 'reativacao',
            });
          });
        } else {
          // Fallback: usar mensagem_enviada como a primeira mensagem
          if (leadItem.mensagem_enviada) {
            const textoMsg = formatTemplateMessage(leadItem.mensagem_enviada, leadItemFirstName);
            messages.push({
              id: `${currentDispatchId}-enviada`,
              dispatch_id: currentDispatchId,
              telefone: leadItem.telefone,
              texto: textoMsg,
              sender: 'ia',
              timestamp: parseUTCDate(leadItem.data_envio),
              tipo_campanha: leadItem.tipo_campanha || 'reativacao',
            });
          }
        }

        // Se o lead respondeu, e o histórico JSONB ainda não incluiu a resposta, inclua-a
        const leadHasResponded = !!leadItem.data_resposta || !!leadItem.ultima_resposta_lead;
        const alreadyHasLeadMsg = messages.some((m) => m.sender === 'lead' && m.texto === leadItem.ultima_resposta_lead);
        if (leadHasResponded && !alreadyHasLeadMsg && leadItem.ultima_resposta_lead) {
          messages.push({
            id: `${currentDispatchId}-lead-resp`,
            dispatch_id: currentDispatchId,
            telefone: leadItem.telefone,
            texto: leadItem.ultima_resposta_lead,
            sender: 'lead',
            timestamp: parseUTCDate(leadItem.data_resposta || leadItem.data_envio),
            tipo_campanha: leadItem.tipo_campanha || 'reativacao',
          });
        }
      });

      // Ordenar mensagens de forma estritamente cronológica
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Deduplicar mensagens consecutivas com o mesmo remetente e conteúdo muito próximo
      const deduplicatedMessages: Message[] = [];
      messages.forEach((msg) => {
        const last = deduplicatedMessages[deduplicatedMessages.length - 1];
        if (last && last.sender === msg.sender && last.texto.trim() === msg.texto.trim() && Math.abs(last.timestamp.getTime() - msg.timestamp.getTime()) < 30000) {
          // Atualiza o timestamp para o mais recente se for do lead, ou apenas ignora duplicada
          if (msg.sender === 'lead') {
            last.timestamp = msg.timestamp;
          }
          return;
        }
        deduplicatedMessages.push(msg);
      });

      // 4. Extrair dados
      const extractedData = parseResumoInteresse(conversaIaData?.resumo_interesse || null);

      // 5. Classificação da IA (usando os dados do lead mais recente)
      const aiClassification: AIClassification = {
        interesse: conversaIaData?.interesse_detectado ?? (mostRecentLead.status_reativacao === 'Interessado'),
        confianca: conversaIaData?.interesse_detectado ? 95 : 50,
        motivo: conversaIaData?.resumo_interesse || (mostRecentLead.status_reativacao === 'Interessado' ? 'Lead demonstrou interesse no imóvel' : 'Aguardando resposta ou sem interesse demonstrado'),
        opt_out: mostRecentLead.status_reativacao === 'Sem interesse',
      };

      const newConversation: ConversationThread = {
        dispatch: {
          id: mostRecentLead.id,
          telefone: mostRecentLead.telefone,
          nome: mostRecentLead.nome_lead,
          tipo_campanha: mostRecentLead.tipo_campanha || 'reativacao',
          status: normalizeStatus(mostRecentLead.status_reativacao),
          template_nome: '[Template WABA]',
          timestamp_envio: mostRecentLead.data_envio ? parseUTCDate(mostRecentLead.data_envio) : new Date(),
          timestamp_resposta: mostRecentLead.data_resposta ? parseUTCDate(mostRecentLead.data_resposta) : undefined,
          id_crm: mostRecentLead.lead_id_cvcrm ? parseInt(mostRecentLead.lead_id_cvcrm, 10) : undefined,
          url_imagem: undefined,
          observacao: mostRecentLead.observacao_crm,
        },
        messages: deduplicatedMessages,
        extracted_data: extractedData,
        ai_classification: aiClassification,
      };

      threadCache.set(dispatchId, newConversation);
      setConversation(newConversation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar conversa';
      console.warn('⚠️ Usando dados mock (Supabase offline):', message);

      // Usar dados mock em modo demo
      const mockDispatch = mockDispatches.find(d => d.id === dispatchId);
      if (mockDispatch) {
        const messages = mockConversations.filter(m => m.dispatch_id === dispatchId);

        const mockConv: ConversationThread = {
          dispatch: mockDispatch,
          messages,
          extracted_data: mockConversationData,
          ai_classification: {
            interesse: true,
            confianca: 85,
            motivo: 'Lead demonstrou interesse no imóvel',
            opt_out: false,
          },
        };
        threadCache.set(dispatchId, mockConv);
        setConversation(mockConv);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatchId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    isLoading,
    error,
    refetch: fetchConversation,
  };
};
