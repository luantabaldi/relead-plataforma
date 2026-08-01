import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DispatchForm } from './DispatchForm';
import { supabase } from '../lib/supabase';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('DispatchForm - Templates & Empreendimentos Dropdown', () => {
  const mockDbTemplates = [
    { id: 't1', nome: 'prosp_template_1', tipo: 'prospeccao', status_meta: 'APPROVED' },
    { id: 't2', nome: 'reat_template_1', tipo: 'reativacao', status_meta: 'APPROVED' },
    { id: 't3', nome: 'novo_template_meta', tipo: 'nao_classificado', status_meta: 'APPROVED' },
  ];

  const mockDbEmpreendimentos = [
    { id: '152', nome: 'Lee Dama Tower', descricao_ia: 'Estúdios pertinho da praia', ativo: true },
    { id: '304', nome: 'Eco Fit Bigorrilho', descricao_ia: 'Focado em sustentabilidade', ativo: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    const fromMock = (table: string) => {
      if (table === 'templates_wpp') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation((col, opts) => {
            return Promise.resolve({ data: mockDbTemplates, error: null });
          }),
        };
      }
      if (table === 'empreendimentos') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation((col, opts) => {
            return Promise.resolve({ data: mockDbEmpreendimentos, error: null });
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    };

    (supabase.from as jest.Mock).mockImplementation(fromMock);
  });

  it('deve carregar templates e filtrar pelo tipo de campanha selecionado', async () => {
    render(<DispatchForm />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('templates_wpp');
    });

    const selects = screen.getAllByRole('combobox');
    const campaignTypeSelect = selects[0];
    const templateSelect = selects[1];
    
    // Verificamos as opções listadas no dropdown de templates
    const options = within(templateSelect).getAllByRole('option');
    expect(options.length).toBe(3); // "Selecione um template", "prosp_template_1", "novo_template_meta" (não classificado)
    expect(options[1].textContent).toBe('prosp_template_1');
    expect(options[2].textContent).toBe('novo_template_meta — classifique o tipo em Gerenciar');
    expect((options[2] as HTMLOptionElement).disabled).toBe(true);

    // Mudar tipo de campanha para Reativação
    fireEvent.change(campaignTypeSelect, { target: { value: 'reativacao' } });

    // Agora o select de templates deve ser filtrado para mostrar apenas templates de reativação
    // + o não classificado, que aparece sempre (desabilitado) até ser classificado na aba Gerenciar
    const updatedOptions = within(templateSelect).getAllByRole('option');
    expect(updatedOptions.length).toBe(3); // "Selecione um template", "reat_template_1", "novo_template_meta"
    expect(updatedOptions[1].textContent).toBe('reat_template_1');
    expect(updatedOptions[2].textContent).toBe('novo_template_meta — classifique o tipo em Gerenciar');
  });

  it('deve carregar empreendimentos ativos e preencher campos automaticamente ao selecionar', async () => {
    render(<DispatchForm />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('empreendimentos');
    });

    const selects = screen.getAllByRole('combobox');
    const empreendimentoSelect = selects[2]; // Terceiro select é o de Empreendimento Cadastrado

    const options = within(empreendimentoSelect).getAllByRole('option');
    expect(options.length).toBe(3); // Cabeçalho + 2 empreendimentos
    expect(options[1].textContent).toContain('Lee Dama Tower');

    // Pegar inputs manuais de ID, Nome e Observação
    const idInput = screen.getByPlaceholderText('152') as HTMLInputElement;
    const nomeInput = screen.getByPlaceholderText('Lee Dama Tower') as HTMLInputElement;
    const obsTextarea = screen.getByPlaceholderText(/Studios e apto 1 dorm para moradia/) as HTMLTextAreaElement;

    // Inicialmente devem estar vazios
    expect(idInput.value).toBe('');
    expect(nomeInput.value).toBe('');
    expect(obsTextarea.value).toBe('');

    // Selecionar o empreendimento Lee Dama Tower (ID: 152)
    fireEvent.change(empreendimentoSelect, { target: { value: '152' } });

    // Inputs manuais devem ser auto-preenchidos
    expect(idInput.value).toBe('152');
    expect(nomeInput.value).toBe('Lee Dama Tower');
    expect(obsTextarea.value).toBe('Estúdios pertinho da praia');
  });
});
