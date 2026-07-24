import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageStatus } from '../types';


/**
 * Hook para atualizar status de um dispatch
 */
export const useUpdateDispatchStatus = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateStatus = async (
    dispatchId: string,
    newStatus: MessageStatus
  ): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(false);

      let dbStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      if (newStatus === 'sem_interesse') dbStatus = 'Sem interesse';
      if (newStatus === 'interessado') dbStatus = 'Reativado';
      if (newStatus === 'erro') dbStatus = 'Erro no Disparo';

      const { error: updateError } = await supabase
        .from('leads_reativacao')
        .update({
          status_reativacao: dbStatus,
        })
        .eq('id', dispatchId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      console.log(`✅ Status atualizado para: ${newStatus}`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(message);
      console.error('❌ Erro em updateStatus:', message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateStatus,
    isUpdating,
    error,
    success,
  };
};

/**
 * Hook para marcar um lead como interessado (envia para CV CRM)
 */
export const useMarkAsInterested = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsInterested = async (
    dispatchId: string,
    crmData?: any
  ): Promise<{ ok: boolean; crmSynced: boolean }> => {
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Atualizar status no Supabase
      const { error: updateError } = await supabase
        .from('leads_reativacao')
        .update({
          status_reativacao: 'Reativado',
        })
        .eq('id', dispatchId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 2. Enviar para CV CRM (integração externa) — falha aqui não desfaz o passo 1,
      // mas o chamador precisa saber que o CRM ficou dessincronizado.
      let crmSynced = true;
      if (crmData?.id_crm) {
        try {
          const crmResponse = await fetch('/api/cv-crm/update-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_id: crmData.id_crm,
              status: 'ativo',
              midia: 'ia-whatsapp',
              dados: {
                bairro: crmData.bairro,
                valor: crmData.valor_buscado,
                tipo_imovel: crmData.tipo_imovel,
              },
            }),
          });

          if (!crmResponse.ok) {
            crmSynced = false;
            console.warn('⚠️ Erro ao sincronizar com CRM:', await crmResponse.text());
          }
        } catch (crmErr) {
          crmSynced = false;
          console.warn('⚠️ Erro na integração CRM:', crmErr);
        }
      }

      console.log('✅ Lead marcado como interessado');
      return { ok: true, crmSynced };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como interessado';
      setError(message);
      console.error('❌ Erro em markAsInterested:', message);
      return { ok: false, crmSynced: false };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    markAsInterested,
    isUpdating,
    error,
  };
};

/**
 * Hook para marcar como sem interesse + opt-out
 */
export const useMarkAsDisinterested = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsDisinterested = async (dispatchId: string): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);

      // 1. Atualizar status no Supabase
      const { data: leadData } = await supabase
        .from('leads_reativacao')
        .select('telefone')
        .eq('id', dispatchId)
        .single();

      const { error: updateError } = await supabase
        .from('leads_reativacao')
        .update({
          status_reativacao: 'Sem interesse',
        })
        .eq('id', dispatchId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 2. Atualizar interesse_detectado na tabela conversas_ia
      if (leadData?.telefone) {
        const { error: optOutError } = await supabase
          .from('conversas_ia')
          .update({ interesse_detectado: false })
          .eq('telefone', leadData.telefone);

        if (optOutError) {
          console.warn('⚠️ Erro ao atualizar interesse_detectado:', optOutError.message);
        }
      }

      console.log('✅ Lead marcado como sem interesse (opt-out)');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como sem interesse';
      setError(message);
      console.error('❌ Erro em markAsDisinterested:', message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    markAsDisinterested,
    isUpdating,
    error,
  };
};
