import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export const MOTIVOS_OBJECAO = [
  'Preço alto',
  'Já comprou/alugou',
  'Não é o momento',
  'Sem orçamento aprovado',
  'Localização não atende',
  'Solicitou remoção/opt-out',
  'Não respondeu mais',
  'Outro',
] as const;

export const TIPOS_ERRO = [
  'Número inválido/inexistente',
  'WhatsApp não instalado',
  'Falha de entrega (API)',
  'Template rejeitado pela Meta',
  'Opt-out/bloqueio',
  'Outro',
] as const;

export interface Lead {
  id: string;
  telefone: string;
  nome_lead: string;
  tipo_campanha: string;
  status_reativacao: string;
  empreendimento_id?: string;
  empreendimento_nome?: string;
  data_envio: Date;
  data_resposta?: Date;
  ultima_resposta_lead?: string;
  nome_campanha?: string;
  motivo_objecao?: string | null;
  tipo_erro?: string | null;
}

export interface LeadsStats {
  total: number;
  respondidos: number;
  ativados: number;
  nao_respondidos: number;
  erros: number;
}

export interface LeadsFilters {
  searchTerm: string;
  status: string; // '' | 'respondido' | 'ativado' | 'erro' | 'pendente' | 'sem_resposta' | 'sem_interesse' | 'resposta_automatica'
  nomeCampanha: string; // '' = todas
  empreendimentoId: string; // '' = todos
  dataInicio: Date | null;
  dataFim: Date | null;
}

const defaultFilters: LeadsFilters = {
  searchTerm: '',
  status: '',
  nomeCampanha: '',
  empreendimentoId: '',
  dataInicio: null,
  dataFim: null,
};

// Valores reais gravados em leads_reativacao.status_reativacao (checados
// direto no banco) — usar .in() com esses valores exatos é bem mais robusto
// que tentar casar case-insensitive via ilike/or no servidor.
const STATUS_VALUES: Record<string, string[]> = {
  respondido: ['Respondido'],
  ativado: ['Reativado', 'Interessado'],
  sem_interesse: ['Sem interesse'],
  resposta_automatica: ['Resposta automática', 'Resposta Automática'],
  erro: ['Erro', 'Erro no Disparo'],
  pendente: ['Pendente'],
  sem_resposta: ['Enviado'],
};

export const isSemInteresse = (status: string): boolean => (status || '').toLowerCase().trim() === 'sem interesse';
export const isErro = (status: string): boolean => ['erro', 'erro no disparo'].includes((status || '').toLowerCase().trim());
export const isRespostaAutomatica = (status: string): boolean => (status || '').toLowerCase().trim() === 'resposta automática';

const LEADS_SELECT = 'id, telefone, nome_lead, tipo_campanha, status_reativacao, empreendimento_id, data_envio, data_resposta, ultima_resposta_lead, nome_campanha, motivo_objecao, tipo_erro';

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

/** Aplica os filtros comuns (busca, campanha, empreendimento, período,
 * status do dropdown) a um query builder do Supabase — reaproveitado tanto
 * pela consulta paginada da tabela quanto pelas 3 contagens de KPI, que
 * precisam respeitar os mesmos filtros ativos. */
function applyFilters(query: any, filters: LeadsFilters, opts: { skipStatus?: boolean } = {}) {
  let q = query.not('nome_lead', 'is', null);

  const term = filters.searchTerm.trim();
  if (term) {
    // Vírgula/parênteses quebram a sintaxe do .or() do PostgREST — não são
    // caracteres esperados em nome/telefone, então é seguro só removê-los.
    const safe = term.replace(/[,()]/g, ' ').trim();
    if (safe) q = q.or(`nome_lead.ilike.%${safe}%,telefone.ilike.%${safe}%`);
  }

  if (!opts.skipStatus && filters.status && STATUS_VALUES[filters.status]) {
    q = q.in('status_reativacao', STATUS_VALUES[filters.status]);
  }
  if (filters.nomeCampanha) q = q.eq('nome_campanha', filters.nomeCampanha);
  if (filters.empreendimentoId) q = q.eq('empreendimento_id', filters.empreendimentoId);

  if (filters.dataInicio) {
    const start = new Date(filters.dataInicio);
    start.setHours(0, 0, 0, 0);
    q = q.gte('data_envio', start.toISOString());
  }
  if (filters.dataFim) {
    const end = new Date(filters.dataFim);
    end.setHours(23, 59, 59, 999);
    q = q.lte('data_envio', end.toISOString());
  }

  return q;
}

/** Interseção entre os valores de uma categoria de KPI (ex.: "Respondido")
 * e o filtro de status ativo no dropdown, se houver — evita depender de
 * empilhar dois `.in()` na mesma coluna e confiar que o PostgREST vai
 * combiná-los com AND; aqui a interseção já sai resolvida em JS. Um array
 * vazio significa "essa categoria não pode ocorrer com o filtro atual",
 * e a contagem correspondente é 0 sem precisar de uma query de rede. */
function effectiveStatusValues(category: string[], filters: LeadsFilters): string[] {
  if (!filters.status || !STATUS_VALUES[filters.status]) return category;
  const active = new Set(STATUS_VALUES[filters.status]);
  return category.filter((v) => active.has(v));
}

const zeroCount = Promise.resolve({ count: 0, error: null });

export const useLeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<LeadsFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<LeadsStats>({ total: 0, respondidos: 0, ativados: 0, nao_respondidos: 0, erros: 0 });
  const [empreendimentoOptions, setEmpreendimentoOptions] = useState<Array<{ id: string; nome: string }>>([]);

  // Busca livre dispara uma query por tecla digitada se não for debounced —
  // o filtro efetivamente usado na consulta só atualiza 300ms depois que o
  // usuário para de digitar; os demais filtros (selects/datas) já são
  // eventos discretos e disparam na hora.
  const [debouncedFilters, setDebouncedFilters] = useState<LeadsFilters>(defaultFilters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const setFilters = useCallback((f: LeadsFilters) => {
    setFiltersState(f);
    setPage(1);
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const countByCategory = (category: string[]) => {
        const values = effectiveStatusValues(category, debouncedFilters);
        if (values.length === 0) return zeroCount;
        return applyFilters(supabase.from('leads_reativacao').select('id', { count: 'exact', head: true }), debouncedFilters, { skipStatus: true })
          .in('status_reativacao', values);
      };

      const [pageResult, respondidosResult, ativadosResult, errosResult, empreendimentosResult] = await Promise.all([
        applyFilters(supabase.from('leads_reativacao').select(LEADS_SELECT, { count: 'exact' }), debouncedFilters)
          .order('data_envio', { ascending: false })
          .range(from, to),
        countByCategory(STATUS_VALUES.respondido),
        countByCategory(STATUS_VALUES.ativado),
        countByCategory(STATUS_VALUES.erro),
        supabase.from('empreendimentos').select('id, nome'),
      ]);

      if (pageResult.error) throw pageResult.error;

      const empMap: Record<string, string> = {};
      (empreendimentosResult.data || []).forEach((e: any) => {
        empMap[e.id] = e.nome;
      });
      setEmpreendimentoOptions((empreendimentosResult.data || []).map((e: any) => ({ id: e.id, nome: e.nome })));

      const leadsData: Lead[] = (pageResult.data || []).map((lead: any) => ({
        ...lead,
        empreendimento_nome: lead.empreendimento_id ? empMap[lead.empreendimento_id] || `#${lead.empreendimento_id}` : undefined,
        data_envio: lead.data_envio ? new Date(lead.data_envio) : new Date(),
        data_resposta: lead.data_resposta ? new Date(lead.data_resposta) : undefined,
      }));

      setLeads(leadsData);
      const total = pageResult.count ?? leadsData.length;
      setTotalCount(total);

      const respondidos = respondidosResult.count ?? 0;
      const ativados = ativadosResult.count ?? 0;
      const erros = errosResult.count ?? 0;
      setStats({
        total,
        respondidos,
        ativados,
        erros,
        nao_respondidos: Math.max(0, total - respondidos - ativados - erros),
      });
    } catch (err) {
      console.warn('⚠️ Erro ao buscar leads:', err);
      setLeads([]);
      setTotalCount(0);
      setStats({ total: 0, respondidos: 0, ativados: 0, nao_respondidos: 0, erros: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, page, pageSize]);

  // Realtime não deve reassinar o canal a cada mudança de filtro/página —
  // só precisa sempre chamar a versão mais atual de fetchLeads.
  const fetchLeadsRef = useRef(fetchLeads);
  useEffect(() => {
    fetchLeadsRef.current = fetchLeads;
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    let channel: any = null;
    try {
      channel = supabase
        .channel('leads-list-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads_reativacao' },
          () => fetchLeadsRef.current()
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Falha ao registrar realtime de leads:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal de leads:', err);
      }
    };
  }, []);

  const updateLeadClassification = useCallback(async (leadId: string, field: 'motivo_objecao' | 'tipo_erro', value: string) => {
    const previous = leads.find(l => l.id === leadId)?.[field] ?? null;
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, [field]: value || null } : l)));

    const { error } = await supabase
      .from('leads_reativacao')
      .update({ [field]: value || null })
      .eq('id', leadId);

    if (error) {
      console.warn(`⚠️ Erro ao salvar ${field}:`, error);
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, [field]: previous } : l)));
    }
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    leads,
    isLoading,
    filters,
    setFilters,
    stats,
    refetch: fetchLeads,
    empreendimentoOptions,
    updateLeadClassification,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalCount,
    totalPages,
  };
};
