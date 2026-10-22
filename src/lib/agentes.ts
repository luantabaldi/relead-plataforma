export type TipoCampanha = 'reativacao' | 'prospeccao';
export type ModoAgente = 'conversa' | 'qualificacao';

export interface AgenteOption {
  slug: string;
  nome: string;
  descricao?: string | null;
  padrao?: boolean;
  /** Ausente em dados antigos: nesse caso vale a regra pelo slug (tipoCampanhaDoAgente). */
  tipo_campanha?: TipoCampanha | null;
  modo?: ModoAgente | null;
}

export interface Pergunta {
  id: string;
  pergunta: string;
  /** Respostas esperadas; o lead escolhe pelo número. Ausente = resposta livre. */
  opcoes?: string[];
  /** Nome curto da pergunta no resumo enviado ao CRM (ex.: "Renda familiar"). */
  rotulo?: string;
}

/** Linha completa da tabela `agentes`, como a tela de gerenciamento a edita. */
export interface Agente extends AgenteOption {
  id: string;
  ativo: boolean;
  padrao: boolean;
  modo: ModoAgente;
  tipo_campanha: TipoCampanha;
  perguntas: Pergunta[];
  min_perguntas: number | null;
  criterio_qualificacao: string | null;
  instrucoes: string | null;
}

/**
 * O workflow de atendimento (n8n) escolhe o agente de IA pelo tipo_campanha do
 * lead: 'prospeccao' vai para o Agente Prospecção; qualquer outro valor vai para
 * a Ana Paula. Agentes novos trazem o tipo na própria linha de `agentes`; só os
 * dados antigos (sem a coluna) caem na regra pelo slug.
 */
export function tipoCampanhaDoAgente(slug: string, agentes: AgenteOption[] = []): TipoCampanha {
  const doBanco = agentes.find((a) => a.slug === slug)?.tipo_campanha;
  if (doBanco) return doBanco;
  return slug === 'prospeccao' ? 'prospeccao' : 'reativacao';
}

/** Agente sugerido quando o operador troca o tipo da campanha. */
export function agentePadraoDoTipo(tipo: TipoCampanha, agentes: AgenteOption[]): string {
  const doTipo = agentes.filter((a) => tipoCampanhaDoAgente(a.slug, agentes) === tipo);
  const escolhido =
    doTipo.find((a) => a.padrao) ?? doTipo.find((a) => a.modo !== 'qualificacao') ?? doTipo[0];
  return escolhido?.slug ?? '';
}

/** "Qualificação — Minha Casa" → "qualificacao_minha_casa" */
export function slugDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Pergunta como o formulário edita: opções em um campo de texto, uma por linha. */
export interface PerguntaForm {
  pergunta: string;
  opcoes: string;
  rotulo?: string;
}

export interface AgenteForm {
  id?: string;
  slug: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  padrao: boolean;
  modo: ModoAgente;
  tipo_campanha: TipoCampanha;
  perguntas: PerguntaForm[];
  min_perguntas: number;
  criterio_qualificacao: string;
  instrucoes: string;
}

export const AGENTE_NOVO: AgenteForm = {
  slug: '',
  nome: '',
  descricao: '',
  ativo: false,
  padrao: false,
  modo: 'qualificacao',
  tipo_campanha: 'prospeccao',
  perguntas: [{ pergunta: '', opcoes: '' }],
  min_perguntas: 1,
  criterio_qualificacao: '',
  instrucoes: '',
};

export function agenteParaForm(a: Agente): AgenteForm {
  const perguntas = a.perguntas.map((p) => ({
    pergunta: p.pergunta,
    opcoes: (p.opcoes ?? []).join('\n'),
    rotulo: p.rotulo ?? '',
  }));
  return {
    id: a.id,
    slug: a.slug,
    nome: a.nome,
    descricao: a.descricao ?? '',
    ativo: a.ativo,
    padrao: a.padrao,
    modo: a.modo,
    tipo_campanha: a.tipo_campanha,
    perguntas: perguntas.length > 0 ? perguntas : [{ pergunta: '', opcoes: '' }],
    min_perguntas: a.min_perguntas ?? Math.max(perguntas.length, 1),
    criterio_qualificacao: a.criterio_qualificacao ?? '',
    instrucoes: a.instrucoes ?? '',
  };
}

/** Opções digitadas uma por linha → lista sem linhas vazias. */
export function linhasDeOpcoes(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Mensagem de erro para o operador, ou null se o agente pode ser salvo. */
export function validarAgente(form: AgenteForm, existentes: Pick<Agente, 'id' | 'slug'>[]): string | null {
  if (!form.nome.trim()) return 'Informe o nome do agente.';

  const slug = form.id ? form.slug : slugDoNome(form.nome);
  if (!slug) return 'O nome precisa ter letras ou números.';
  if (existentes.some((e) => e.slug === slug && e.id !== form.id)) {
    return 'Já existe um agente com esse nome.';
  }
  if (form.padrao && !form.ativo) return 'O agente padrão não pode ficar inativo.';

  if (form.modo === 'qualificacao') {
    const perguntas = form.perguntas;
    if (perguntas.length === 0 || perguntas.some((p) => !p.pergunta.trim())) {
      return 'Preencha todas as perguntas ou remova as vazias.';
    }
    const comUmaOpcao = perguntas.findIndex((p) => linhasDeOpcoes(p.opcoes).length === 1);
    if (comUmaOpcao >= 0) {
      return `A pergunta ${comUmaOpcao + 1} tem só uma opção: informe pelo menos duas, ou deixe o campo vazio para resposta livre.`;
    }
    if (!Number.isInteger(form.min_perguntas) || form.min_perguntas < 1 || form.min_perguntas > perguntas.length) {
      return `O mínimo de perguntas respondidas deve ficar entre 1 e ${perguntas.length}.`;
    }
    if (!form.criterio_qualificacao.trim()) {
      return 'Descreva o critério: quando o lead conta como qualificado e quando é desqualificado.';
    }
  }
  return null;
}

/** Campos gravados em `agentes`. Perguntas ganham ids estáveis pela posição. */
export function formParaLinha(form: AgenteForm) {
  const ehQualificacao = form.modo === 'qualificacao';
  const perguntas = ehQualificacao
    ? form.perguntas.map((p, i) => {
        const opcoes = linhasDeOpcoes(p.opcoes);
        const rotulo = (p.rotulo ?? '').trim();
        return {
          id: `p${i + 1}`,
          pergunta: p.pergunta.trim(),
          ...(opcoes.length > 0 ? { opcoes } : {}),
          ...(rotulo ? { rotulo } : {}),
        };
      })
    : [];
  return {
    slug: form.id ? form.slug : slugDoNome(form.nome),
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    ativo: form.ativo,
    modo: form.modo,
    tipo_campanha: form.tipo_campanha,
    perguntas,
    min_perguntas: ehQualificacao ? form.min_perguntas : null,
    criterio_qualificacao: ehQualificacao ? form.criterio_qualificacao.trim() || null : null,
    instrucoes: ehQualificacao ? form.instrucoes.trim() || null : null,
    updated_at: new Date().toISOString(),
  };
}
