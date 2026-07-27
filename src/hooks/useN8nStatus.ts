import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface N8nStatusData {
  isRunning: boolean;
  lastExecution?: {
    timestamp: string;
    status: 'success' | 'running' | 'failed';
  };
  error?: string;
}

export const useN8nStatus = () => {
  const [status, setStatus] = useState<N8nStatusData>({ isRunning: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);

      // Tenta buscar de um endpoint de API (implementar no backend)
      try {
        const response = await fetch('/api/n8n/status', {
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          return;
        }
      } catch (err) {
        console.debug('API endpoint não disponível, usando dados de audit como fallback');
      }

      // Fallback: busca do audit_log da Supabase para determinar se há execução recente
      const { data: auditLogs, error } = await supabase
        .from('audit_log')
        .select('created_at, action, details')
        .eq('table_name', 'leads_reativacao')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const lastLog = auditLogs?.[0];
      if (lastLog) {
        const lastTime = new Date(lastLog.created_at);
        const nowTime = new Date();
        const diffMinutes = (nowTime.getTime() - lastTime.getTime()) / (1000 * 60);

        setStatus({
          isRunning: diffMinutes < 5,
          lastExecution: {
            timestamp: lastLog.created_at,
            status: diffMinutes < 5 ? 'running' : 'success',
          },
        });
      } else {
        setStatus({ isRunning: false });
      }
    } catch (err) {
      console.warn('⚠️ Erro ao buscar status do n8n:', err);
      setStatus({ isRunning: false, error: 'Falha ao obter status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...status, isLoading, refetch: fetchStatus };
};
