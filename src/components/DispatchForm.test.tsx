import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DispatchForm } from './DispatchForm';
import { supabase } from '../lib/supabase';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

/** Query builder encadeável e "await-ável": qualquer .select/.eq/.order/.in devolve ele mesmo. */
const chain = (result: { data: any; error: any }) => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    in: () => builder,
    limit: () => builder,
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
};

describe('DispatchForm', () => {
  const dbTemplates = [
    { id: 't1', nome: 'prosp_template_1', tipo: 'prospeccao', status_meta: 'APPROVED', categoria: 'MARKETING' },
    { id: 't2', nome: 'reat_template_1', tipo: 'reativacao', status_meta: 'APPROVED', categoria: 'MARKETING' },
    { id: 't3', nome: 'novo_template_meta', tipo: 'nao_classificado', status_meta: 'APPROVED', categoria: 'MARKETING' },
    { id: 't4', nome: 'prosp_pendente', tipo: 'prospeccao', status_meta: 'PENDING', categoria: 'MARKETING' },
    { id: 't5', nome: 'prosp_rejeitado', tipo: 'prospeccao', status_meta: 'REJECTED', categoria: 'MARKETING' },
  ];

  const dbEmpreendimentos = [
    { id: '152', nome: 'Lee Dama Tower', descricao_ia: 'Estúdios pertinho da praia', ativo: true },
    { id: '304', nome: 'Eco Fit Bigorrilho', descricao_ia: 'Focado em sustentabilidade', ativo: true },
  ];

  const dbNumeros = [
    { phone_number_id: '111', numero_display: '+55 41 8432-1397', apelido: null, quality_rating: 'GREEN' },
  ];

  const dbAgentes = [
    { slug: 'ana_paula', nome: 'Ana Paula', descricao: 'Reativação', padrao: true },
    { slug: 'prospeccao', nome: 'Prospecção', descricao: 'Prospecção ativa', padrao: false },
  ];

  let dbBlacklist: Array<{ id: string; telefone: string; nome?: string; motivo: string; data_bloqueio: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    dbBlacklist = [];

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      switch (table) {
        case 'templates_wpp': return chain({ data: dbTemplates, error: null });
        case 'empreendimentos': return chain({ data: dbEmpreendimentos, error: null });
        case 'numeros_whatsapp_status': return chain({ data: dbNumeros, error: null });
        case 'agentes': return chain({ data: dbAgentes, error: null });
        case 'meta_tarifas': return chain({ data: [{ categoria: 'marketing', preco_usd: 0.0625 }], error: null });
        case 'blacklist': return chain({ data: dbBlacklist, error: null });
        case 'v_disparos_custo': return chain({ data: [], error: null });
        default: return chain({ data: [], error: null });
      }
    });
  });

  const preencherPasso1 = async (nome = 'Campanha teste') => {
    const nomeInput = await screen.findByLabelText(/Nome da campanha/);
    fireEvent.change(nomeInput, { target: { value: nome } });
    // Espera os números/agentes carregarem (com uma única opção, o número já vem selecionado)
    await waitFor(() => {
      expect((screen.getByLabelText(/Número do disparo/) as HTMLSelectElement).value).toBe('111');
    });
  };

  const abrirListaDeTemplates = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    const trigger = await screen.findByRole('button', { name: /Selecione um template|Carregando templates/ });
    fireEvent.click(trigger);
    return screen.findByRole('listbox');
  };

  it('lista só templates aprovados do tipo da campanha, sem pendentes nem rejeitados', async () => {
    render(<DispatchForm />);
    await preencherPasso1();
    const listbox = await abrirListaDeTemplates();

    const options = within(listbox).getAllByRole('option');
    const nomes = options.map((o) => o.textContent);

    // Tipo padrão: prospecção → aprovado do tipo + o não classificado (desabilitado)
    expect(nomes.some((n) => n?.includes('prosp_template_1'))).toBe(true);
    expect(nomes.some((n) => n?.includes('novo_template_meta'))).toBe(true);
    expect(nomes.some((n) => n?.includes('prosp_pendente'))).toBe(false);
    expect(nomes.some((n) => n?.includes('prosp_rejeitado'))).toBe(false);
    expect(nomes.some((n) => n?.includes('reat_template_1'))).toBe(false);

    const naoClassificado = options.find((o) => o.textContent?.includes('novo_template_meta')) as HTMLButtonElement;
    expect(naoClassificado.disabled).toBe(true);
  });

  it('carrega empreendimentos ativos e preenche os campos ao selecionar', async () => {
    render(<DispatchForm />);

    const select = (await screen.findByLabelText('Empreendimento cadastrado')) as HTMLSelectElement;
    await waitFor(() => expect(within(select).getAllByRole('option').length).toBe(3)); // cabeçalho + 2

    const idInput = screen.getByPlaceholderText('152') as HTMLInputElement;
    const nomeInput = screen.getByPlaceholderText('Lee Dama Tower') as HTMLInputElement;
    const obsTextarea = screen.getByPlaceholderText(/Studios e apto 1 dorm para moradia/) as HTMLTextAreaElement;
    expect(idInput.value).toBe('');

    fireEvent.change(select, { target: { value: '152' } });

    expect(idInput.value).toBe('152');
    expect(nomeInput.value).toBe('Lee Dama Tower');
    expect(obsTextarea.value).toBe('Estúdios pertinho da praia');
  });

  it('oferece número e agente, e o agente define o tipo da campanha', async () => {
    render(<DispatchForm />);
    await preencherPasso1();

    const numero = screen.getByLabelText(/Número do disparo/) as HTMLSelectElement;
    expect(within(numero).getAllByRole('option').some((o) => o.textContent?.includes('+55 41 8432-1397'))).toBe(true);

    const agente = screen.getByLabelText(/Agente de mensagem/) as HTMLSelectElement;
    const tipo = screen.getByLabelText(/Tipo de campanha/) as HTMLSelectElement;

    // Tipo padrão é Prospecção → agente sugerido é o de Prospecção
    expect(agente.value).toBe('prospeccao');
    expect(tipo.value).toBe('prospeccao');

    fireEvent.change(agente, { target: { value: 'ana_paula' } });
    expect(tipo.value).toBe('reativacao');

    fireEvent.change(tipo, { target: { value: 'prospeccao' } });
    expect(agente.value).toBe('prospeccao');
  });

  it('não deixa avançar sem número e sem agente', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) =>
      table === 'numeros_whatsapp_status' ? chain({ data: [], error: null }) : chain({ data: [], error: null })
    );
    render(<DispatchForm />);

    const nomeInput = await screen.findByLabelText(/Nome da campanha/);
    fireEvent.change(nomeInput, { target: { value: 'Campanha teste' } });
    await waitFor(() =>
      expect(within(screen.getByLabelText(/Número do disparo/)).getAllByRole('option')[0].textContent).toMatch(/Nenhum número/)
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(await screen.findByText('Selecione o número do disparo.')).toBeTruthy();
  });

  it('remove do CSV os leads da blacklist, mesmo em formato diferente', async () => {
    dbBlacklist = [
      // salvo com 55 e com o 9º dígito; o CSV traz sem 55 e com máscara
      { id: 'b1', telefone: '5548999990001', nome: 'Bloqueado', motivo: 'Pediu para sair', data_bloqueio: '2026-10-01T00:00:00Z' },
    ];
    render(<DispatchForm />);
    await preencherPasso1();

    // Passo 2: escolhe o template aprovado
    const listbox = await abrirListaDeTemplates();
    fireEvent.click(within(listbox).getByRole('option', { name: /prosp_template_1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));

    // Passo 3: CSV com um lead bloqueado e um liberado
    const csv = 'nome,telefone\nBloqueado,(48) 99999-0001\nLiberado,48 99999-0002\n';
    const file = new File([csv], 'leads.csv', { type: 'text/csv' });
    const input = (await screen.findByLabelText(/Leads \(CSV\)/)) as HTMLInputElement;
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('blacklist'));
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/1 leads válidos carregados\./)).toBeTruthy();
    expect(screen.getByText(/1 na blacklist removido\(s\)/)).toBeTruthy();
  });
});
