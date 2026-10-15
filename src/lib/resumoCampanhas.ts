import { supabase } from './supabase';

export interface ResumoCampanha {
  nome_campanha: string;
  tipo_campanha: string;
  /** Leads da campanha, sem contar os cancelados. */
  total: number;
  pendente: number;
  /** Já processados com sucesso: o que não é pendente, erro, pausado nem cancelado. */
  enviado: number;
  erro: number;
  pausado: number;
  cancelado: number;
}

const STATUS_ERRO = ['Erro no Disparo', 'Erro'];
const PAGE_SIZE = 1000; // limite de linhas por resposta do PostgREST
const MAX_PAGES = 30; // trava de segurança (30 mil linhas)

/**
 * Nomes das campanhas que têm ao menos um lead com o status informado.
 * Pagina em blocos de 1.000: sem isso, uma campanha com mais de 1.000 leads
 * "esconde" as demais, porque a resposta é cortada no limite do PostgREST.
 */
export async function nomesDeCampanhasComStatus(status: string): Promise<string[]> {
  const nomes = new Set<string>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from('leads_reativacao')
      .select('nome_campanha')
      .eq('status_reativacao', status)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data || [];
    rows.forEach((r: any) => r.nome_campanha && nomes.add(r.nome_campanha));
    if (rows.length < PAGE_SIZE) break;
  }
  return Array.from(nomes);
}

async function contar(nome: string, status?: string[]): Promise<number> {
  let query = supabase
    .from('leads_reativacao')
    .select('id', { count: 'exact', head: true })
    .eq('nome_campanha', nome);
  if (status) query = query.in('status_reativacao', status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Contagem por status feita no banco (consultas de contagem), não em memória:
 * não sofre com o limite de 1.000 linhas e não confunde pausado/cancelado com enviado.
 */
export async function resumirCampanha(nome: string): Promise<ResumoCampanha> {
  const [totalBruto, pendente, erro, pausado, cancelado, tipoRes] = await Promise.all([
    contar(nome),
    contar(nome, ['Pendente']),
    contar(nome, STATUS_ERRO),
    contar(nome, ['Pausado']),
    contar(nome, ['Cancelado']),
    supabase.from('leads_reativacao').select('tipo_campanha').eq('nome_campanha', nome).limit(1).maybeSingle(),
  ]);

  const total = Math.max(0, totalBruto - cancelado);
  return {
    nome_campanha: nome,
    tipo_campanha: (tipoRes as any)?.data?.tipo_campanha || 'prospeccao',
    total,
    pendente,
    erro,
    pausado,
    cancelado,
    enviado: Math.max(0, total - pendente - erro - pausado),
  };
}
