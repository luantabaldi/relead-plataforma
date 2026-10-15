/**
 * Formata mensagens de template WABA para exibição legível na interface
 */
export function formatTemplateMessage(text: string, defaultLeadName?: string): string {
  if (!text || !text.startsWith('Template:')) return text;

  // Formato esperado: "Template: constant_txt | Param: Luan" ou "Template: constant_txt"
  const parts = text.split('|');
  const templatePart = parts[0].replace('Template:', '').trim();
  let paramVal = '';

  if (parts.length > 1) {
    const paramPart = parts[1].replace('Param:', '').trim();
    if (paramPart) {
      paramVal = paramPart;
    }
  }

  const name = paramVal || defaultLeadName || 'Cliente';

  switch (templatePart) {
    case 'constant_txt':
      return `Olá ${name}, tudo bem?\n\nTemos um pré-lançamento saindo agora no Alto da XV. Apartamentos com 3 dorms ou 3 suítes, a partir de 116m².\nInfraestrutura de lazer COMPLETA e garagem com depósito privativo.\n\nQuer mais informações?`;
    case 'constant_img':
      return `📸 [Imagem]\nOlá ${name}, tudo bem?\n\nTemos um pré-lançamento saindo agora no Alto da XV. Apartamentos com 3 dorms ou 3 suítes, a partir de 116m².\nInfraestrutura de lazer COMPLETA e garagem com depósito privativo.\n\nQuer mais informações?`;
    case 'lee_dama_tower':
      return `Olá ${name}, tudo bem?\n\nConhece o Lee Dama Tower? Temos studios e apartamentos de 1 dormitório no Alto da XV, com infraestrutura completa e excelente localização.\n\nQuer mais informações?`;
    case 'ativa_andersen_parcela':
      return `Olá ${name}, tudo bem?\n\nTemos excelentes condições para o residencial Andersen, com parcelas super atrativas e facilidade de pagamento.\n\nGostaria de receber mais informações?`;
    case 'ativa_andersen_parcela_img':
      return `📸 [Imagem]\nOlá ${name}, tudo bem?\n\nTemos excelentes condições para o residencial Andersen, com parcelas super atrativas e facilidade de pagamento.\n\nGostaria de receber mais informações?`;
    case 'nps_loockwood':
      return `Olá ${name}, tudo bem?\n\nSou a Ana Paula da Sym Imóveis. Gostaríamos de saber o que achou do atendimento sobre o Loockwood. Poderia nos responder com uma nota de 0 a 10 ou nos dizer se ainda busca imóvel?\n\nComo podemos te ajudar hoje?`;
    default:
      return text;
  }
}

/**
 * O corpo do template (como aprovado na Meta) tem variáveis — {{1}}, {{nome}}?
 * O workflow de disparo envia um parâmetro de corpo por template; mandar parâmetro a um
 * template sem variáveis (ou o inverso) é recusado pela Meta com o erro #132000.
 * Devolve null quando o corpo ainda não foi sincronizado e não dá para saber.
 */
export function corpoTemVariaveis(componentes: unknown): boolean | null {
  if (!Array.isArray(componentes)) return null;
  const body = componentes.find((c: any) => c?.type === 'BODY');
  if (!body || typeof body.text !== 'string') return null;
  return /\{\{[^{}]+\}\}/.test(body.text);
}
