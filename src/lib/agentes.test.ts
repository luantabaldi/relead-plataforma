import {
  AGENTE_NOVO,
  AgenteForm,
  agenteParaForm,
  agentePadraoDoTipo,
  formParaLinha,
  slugDoNome,
  tipoCampanhaDoAgente,
  validarAgente,
} from './agentes';

const valido: AgenteForm = {
  ...AGENTE_NOVO,
  nome: 'Qualificação — Minha Casa',
  perguntas: [
    { pergunta: 'Qual a renda familiar?', opcoes: 'Até R$ 4 mil\nAcima de R$ 4 mil' },
    { pergunta: 'Tem FGTS?', opcoes: '' },
  ],
  min_perguntas: 2,
  criterio_qualificacao: 'Qualificado se a renda estiver dentro do programa.',
};

describe('slugDoNome', () => {
  it('remove acentos e símbolos', () => {
    expect(slugDoNome('Qualificação — Minha Casa Minha Vida')).toBe('qualificacao_minha_casa_minha_vida');
  });
  it('devolve vazio quando não há letras nem números', () => {
    expect(slugDoNome('—')).toBe('');
  });
});

describe('tipoCampanhaDoAgente / agentePadraoDoTipo com agentes novos', () => {
  const agentes = [
    { slug: 'ana_paula', nome: 'Ana Paula', padrao: true, tipo_campanha: 'reativacao' as const, modo: 'conversa' as const },
    { slug: 'prospeccao', nome: 'Prospecção', tipo_campanha: 'prospeccao' as const, modo: 'conversa' as const },
    { slug: 'qualificacao_mcmv', nome: 'Qualificação MCMV', tipo_campanha: 'prospeccao' as const, modo: 'qualificacao' as const },
  ];

  it('usa o tipo gravado no agente', () => {
    expect(tipoCampanhaDoAgente('qualificacao_mcmv', agentes)).toBe('prospeccao');
  });
  it('sem a coluna, mantém a regra antiga pelo slug', () => {
    expect(tipoCampanhaDoAgente('qualquer', [{ slug: 'qualquer', nome: 'X' }])).toBe('reativacao');
    expect(tipoCampanhaDoAgente('prospeccao')).toBe('prospeccao');
  });
  it('não sugere agente de qualificação como padrão do tipo', () => {
    expect(agentePadraoDoTipo('prospeccao', [agentes[2], agentes[1]])).toBe('prospeccao');
  });
});

describe('validarAgente', () => {
  it('aceita um agente de qualificação completo', () => {
    expect(validarAgente(valido, [])).toBeNull();
  });
  it('exige nome', () => {
    expect(validarAgente({ ...valido, nome: ' ' }, [])).toMatch(/nome/i);
  });
  it('recusa nome que gera slug repetido', () => {
    expect(validarAgente(valido, [{ id: 'x', slug: 'qualificacao_minha_casa' }])).toMatch(/já existe/i);
  });
  it('permite salvar o próprio agente na edição', () => {
    const edicao = { ...valido, id: 'x', slug: 'qualificacao_minha_casa' };
    expect(validarAgente(edicao, [{ id: 'x', slug: 'qualificacao_minha_casa' }])).toBeNull();
  });
  it('recusa pergunta vazia', () => {
    expect(validarAgente({ ...valido, perguntas: [{ pergunta: 'ok', opcoes: '' }, { pergunta: '  ', opcoes: '' }] }, [])).toMatch(/perguntas/i);
  });
  it('recusa pergunta com uma única opção', () => {
    const perguntas = [{ pergunta: 'Tem FGTS?', opcoes: 'Sim' }, valido.perguntas[1]];
    expect(validarAgente({ ...valido, perguntas }, [])).toMatch(/pergunta 1.*só uma opção/i);
  });
  it('ignora linhas vazias ao contar as opções', () => {
    const perguntas = [{ pergunta: 'Tem FGTS?', opcoes: 'Sim\n\n  \nNão' }, valido.perguntas[1]];
    expect(validarAgente({ ...valido, perguntas }, [])).toBeNull();
  });
  it('recusa mínimo maior que o número de perguntas', () => {
    expect(validarAgente({ ...valido, min_perguntas: 3 }, [])).toMatch(/entre 1 e 2/);
  });
  it('exige o critério de qualificação', () => {
    expect(validarAgente({ ...valido, criterio_qualificacao: '' }, [])).toMatch(/critério/i);
  });
  it('não deixa o agente padrão ficar inativo', () => {
    expect(validarAgente({ ...valido, padrao: true, ativo: false }, [])).toMatch(/padrão/i);
  });
  it('agente de conversa não exige perguntas', () => {
    const conversa = { ...AGENTE_NOVO, nome: 'Ana', modo: 'conversa' as const, perguntas: [], min_perguntas: 0, ativo: true };
    expect(validarAgente(conversa, [])).toBeNull();
  });
});

describe('formParaLinha', () => {
  it('gera slug, ids de pergunta e apara os textos', () => {
    const linha = formParaLinha({
      ...valido,
      perguntas: [{ pergunta: ' A? ', opcoes: ' Sim \n\nNão ' }, { pergunta: 'B?', opcoes: '' }],
    });
    expect(linha.slug).toBe('qualificacao_minha_casa');
    expect(linha.perguntas).toEqual([
      { id: 'p1', pergunta: 'A?', opcoes: ['Sim', 'Não'] },
      { id: 'p2', pergunta: 'B?' },
    ]);
  });
  it('grava o rótulo da pergunta só quando preenchido', () => {
    const linha = formParaLinha({
      ...valido,
      perguntas: [{ pergunta: 'A?', opcoes: '', rotulo: ' Renda ' }, { pergunta: 'B?', opcoes: '', rotulo: '  ' }],
    });
    expect(linha.perguntas).toEqual([
      { id: 'p1', pergunta: 'A?', rotulo: 'Renda' },
      { id: 'p2', pergunta: 'B?' },
    ]);
  });
  it('lê de volta as opções gravadas, uma por linha', () => {
    const form = agenteParaForm({
      id: 'x', slug: 's', nome: 'N', descricao: null, ativo: true, padrao: false, modo: 'qualificacao',
      tipo_campanha: 'reativacao', min_perguntas: 1, criterio_qualificacao: 'c', instrucoes: null,
      perguntas: [{ id: 'p1', pergunta: 'A?', opcoes: ['Sim', 'Não'] }, { id: 'p2', pergunta: 'B?' }],
    });
    expect(form.perguntas).toEqual([
      { pergunta: 'A?', opcoes: 'Sim\nNão', rotulo: '' },
      { pergunta: 'B?', opcoes: '', rotulo: '' },
    ]);
  });
  it('mantém o slug existente na edição', () => {
    expect(formParaLinha({ ...valido, id: 'x', slug: 'antigo', nome: 'Novo nome' }).slug).toBe('antigo');
  });
  it('agente de conversa não grava campos de qualificação', () => {
    const linha = formParaLinha({ ...valido, modo: 'conversa' });
    expect(linha.perguntas).toEqual([]);
    expect(linha.min_perguntas).toBeNull();
    expect(linha.criterio_qualificacao).toBeNull();
  });
});
