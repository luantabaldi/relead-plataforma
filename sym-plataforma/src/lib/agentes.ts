/**
 * O workflow de atendimento (n8n) escolhe o agente de IA pelo tipo_campanha do lead:
 * 'prospeccao' vai para o Agente Prospecção; qualquer outro valor vai para a Ana Paula.
 * Ao criar um agente novo, ele precisa de um ramo no workflow e de uma entrada aqui.
 */
export function tipoCampanhaDoAgente(slug: string): 'prospeccao' | 'reativacao' {
  return slug === 'prospeccao' ? 'prospeccao' : 'reativacao'
}
