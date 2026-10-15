export interface AgenteOption {
  slug: string;
  nome: string;
  descricao?: string | null;
  padrao?: boolean;
}

export type TipoCampanha = 'reativacao' | 'prospeccao';

/**
 * O workflow de atendimento (n8n) escolhe o agente de IA pelo tipo_campanha do
 * lead: 'prospeccao' vai para o Agente Prospecção; qualquer outro valor vai para
 * a Ana Paula. Ao criar um agente novo, ele precisa de um ramo no workflow e de
 * uma entrada aqui.
 */
export function tipoCampanhaDoAgente(slug: string): TipoCampanha {
  return slug === 'prospeccao' ? 'prospeccao' : 'reativacao';
}

/** Agente sugerido quando o operador troca o tipo da campanha. */
export function agentePadraoDoTipo(tipo: TipoCampanha, agentes: AgenteOption[]): string {
  const doTipo = agentes.filter((a) => tipoCampanhaDoAgente(a.slug) === tipo);
  return (doTipo.find((a) => a.padrao) ?? doTipo[0])?.slug ?? '';
}
