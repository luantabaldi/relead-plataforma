import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BlacklistEntry {
  id: string;
  telefone: string;
  nome?: string;
  motivo: string;
  data_bloqueio: string;
  adicionado_por?: string;
}

export const useBlacklist = () => {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlacklist = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('blacklist')
        .select('*')
        .order('data_bloqueio', { ascending: false });

      if (err) throw err;
      setEntries(data || []);
    } catch (err: any) {
      console.error('❌ Erro ao carregar blacklist:', err);
      setError(err.message || 'Erro ao carregar blacklist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlacklist();
  }, []);

  const addToBlacklist = async (telefone: string, nome?: string, motivo?: string) => {
    try {
      const { data, error: err } = await supabase
        .from('blacklist')
        .insert({
          telefone,
          nome,
          motivo: motivo || 'Solicitação do lead',
          data_bloqueio: new Date().toISOString(),
        })
        .select()
        .single();

      if (err) throw err;
      setEntries([data, ...entries]);
      return data;
    } catch (err: any) {
      console.error('❌ Erro ao adicionar à blacklist:', err);
      throw err;
    }
  };

  const removeFromBlacklist = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('blacklist')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setEntries(entries.filter(e => e.id !== id));
    } catch (err: any) {
      console.error('❌ Erro ao remover da blacklist:', err);
      throw err;
    }
  };

  const isBlocked = (telefone: string) => {
    return entries.some(e => e.telefone === telefone);
  };

  return {
    entries,
    isLoading,
    error,
    loadBlacklist,
    addToBlacklist,
    removeFromBlacklist,
    isBlocked,
  };
};
