import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Agente, AgenteForm, formParaLinha } from '../lib/agentes';

const COLUNAS =
  'id, slug, nome, descricao, ativo, padrao, modo, tipo_campanha, perguntas, min_perguntas, criterio_qualificacao, instrucoes';

/** Agentes de IA (ativos e inativos) para a tela de gerenciamento. */
export const useAgentes = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('agentes')
        .select(COLUNAS)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setAgentes((data || []) as Agente[]);
    } catch (err: any) {
      console.error('❌ Erro ao carregar agentes:', err);
      setError(err.message || 'Erro ao carregar agentes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvar = async (form: AgenteForm) => {
    const linha = formParaLinha(form);
    const { error: err } = form.id
      ? await supabase.from('agentes').update(linha).eq('id', form.id)
      : await supabase.from('agentes').insert(linha);
    if (err) throw err;
    await carregar();
  };

  const alternarAtivo = async (agente: Agente) => {
    const { error: err } = await supabase
      .from('agentes')
      .update({ ativo: !agente.ativo, updated_at: new Date().toISOString() })
      .eq('id', agente.id);
    if (err) throw err;
    await carregar();
  };

  return { agentes, isLoading, error, carregar, salvar, alternarAtivo };
};
