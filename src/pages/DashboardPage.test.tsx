import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { supabase } from '../lib/supabase';

// Mock the useConversations hook
jest.mock('../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [],
    isLoading: false,
    error: null,
    handleAction: jest.fn(),
    refetch: jest.fn(),
    selectedDispatchId: '',
    setSelectedDispatchId: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('DashboardPage - Gerenciar CRUD', () => {
  const mockTemplates = [
    { id: '1', nome: 'lee_dama_tower', tipo: 'prospeccao', status_meta: 'APPROVED' },
    { id: '2', nome: 'promocao_estudios_sym', tipo: 'reativacao', status_meta: 'PENDING' },
  ];

  const mockEmpreendimentos = [
    { id: '152', nome: 'Lee Dama Tower', descricao_ia: 'Studios a 800m do mar', ativo: true },
    { id: '304', nome: 'Eco Fit Bigorrilho', descricao_ia: 'Próximo ao parque', ativo: false },
  ];

  const mockScheduledCampaigns = [
    {
      id: 'sc1',
      nome_campanha: 'Lançamento Jardim Botânico',
      data_agendamento: '2026-06-15T17:00:00.000Z',
      template_nome: 'lee_dama_tower',
      empreendimento_nome: 'Lee Dama Tower',
      quantidade_leads: 150,
      status: 'pendente',
      observacao: 'Foco em investidores de Curitiba.',
    },
  ];

  let mockSelectTemplates: any;
  let mockInsertTemplate: any;
  let mockUpdateTemplate: any;
  let mockDeleteTemplate: any;

  let mockSelectEmpreendimentos: any;
  let mockInsertEmpreendimento: any;
  let mockUpdateEmpreendimento: any;
  let mockDeleteEmpreendimento: any;
  let mockMaybeSingleEmpreendimento: any;

  let mockSelectScheduled: any;
  let mockCancelCampaign: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up template mocks
    mockSelectTemplates = jest.fn().mockResolvedValue({ data: mockTemplates, error: null });
    mockInsertTemplate = jest.fn().mockResolvedValue({ error: null });
    mockUpdateTemplate = jest.fn().mockResolvedValue({ error: null });
    mockDeleteTemplate = jest.fn().mockResolvedValue({ error: null });

    // Set up empreendimento mocks
    mockSelectEmpreendimentos = jest.fn().mockResolvedValue({ data: mockEmpreendimentos, error: null });
    mockInsertEmpreendimento = jest.fn().mockResolvedValue({ error: null });
    mockUpdateEmpreendimento = jest.fn().mockResolvedValue({ error: null });
    mockDeleteEmpreendimento = jest.fn().mockResolvedValue({ error: null });
    mockMaybeSingleEmpreendimento = jest.fn().mockResolvedValue({ data: null, error: null });

    // Set up scheduled campaign mocks
    mockSelectScheduled = jest.fn().mockResolvedValue({ data: mockScheduledCampaigns, error: null });
    mockCancelCampaign = jest.fn().mockResolvedValue({ error: null });

    const fromMock = (table: string) => {
      if (table === 'templates_wpp') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation((col, opts) => {
            return mockSelectTemplates();
          }),
          insert: jest.fn().mockImplementation((payload) => {
            return mockInsertTemplate(payload);
          }),
          update: jest.fn().mockImplementation((payload) => {
            return {
              eq: jest.fn().mockImplementation((col, val) => {
                return mockUpdateTemplate(payload, val);
              }),
            };
          }),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockImplementation((col, val) => {
            return mockDeleteTemplate(val);
          }),
        };
      }
      if (table === 'empreendimentos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation((col, opts) => {
            return mockSelectEmpreendimentos();
          }),
          eq: jest.fn().mockImplementation((col, val) => {
            return {
              maybeSingle: jest.fn().mockImplementation(() => {
                return mockMaybeSingleEmpreendimento(val);
              }),
            };
          }),
          insert: jest.fn().mockImplementation((payload) => {
            return mockInsertEmpreendimento(payload);
          }),
          update: jest.fn().mockImplementation((payload) => {
            return {
              eq: jest.fn().mockImplementation((col, val) => {
                return mockUpdateEmpreendimento(payload, val);
              }),
            };
          }),
          delete: jest.fn().mockReturnThis(),
        };
      }
      if (table === 'campanhas_agendadas') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockImplementation((col, opts) => {
            return mockSelectScheduled();
          }),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockImplementation((col, val) => {
            return mockCancelCampaign(val);
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    };

    (supabase.from as jest.Mock).mockImplementation(fromMock);
    
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
    // Mock window.alert
    window.alert = jest.fn();
  });

  describe('CRUD de Templates', () => {
    it('deve alternar para a aba gerenciar e listar templates do banco', async () => {
      render(<DashboardPage />);

      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      expect(screen.getByText('Templates · Empreendimentos · Campanhas agendadas')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('templates_wpp');
        expect(screen.getByText('lee_dama_tower')).toBeInTheDocument();
        expect(screen.getByText('promocao_estudios_sym')).toBeInTheDocument();
      });
    });

    it('deve validar o formato do nome (Meta Slug) apenas com minúsculas e sublinhados', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('lee_dama_tower')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo template'));

      const nameInput = screen.getByPlaceholderText('ex: lee_dama_tower');
      fireEvent.change(nameInput, { target: { value: 'Nome_Invalido' } });

      const saveBtn = screen.getByText('Salvar template');
      fireEvent.click(saveBtn);

      expect(await screen.findByText(/O nome do template WABA deve conter apenas letras minúsculas/)).toBeInTheDocument();
      expect(mockInsertTemplate).not.toHaveBeenCalled();
    });

    it('deve realizar INSERT com sucesso se o slug for válido', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('lee_dama_tower')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo template'));

      const nameInput = screen.getByPlaceholderText('ex: lee_dama_tower');
      fireEvent.change(nameInput, { target: { value: 'novo_template_waba' } });

      const saveBtn = screen.getByText('Salvar template');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      await waitFor(() => {
        expect(mockInsertTemplate).toHaveBeenCalledWith({
          nome: 'novo_template_waba',
          tipo: 'prospeccao',
          status_meta: 'APPROVED',
        });
      });
    });
  });

  describe('CRUD de Empreendimentos', () => {
    it('deve alternar para a sub-aba de empreendimentos e carregar dados', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      // Clicar na sub-aba "Empreendimentos"
      const empSubtab = screen.getByRole('button', { name: /^Empreendimentos$/ });
      await act(async () => {
        fireEvent.click(empSubtab);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('empreendimentos');
        expect(screen.getByText('Lee Dama Tower')).toBeInTheDocument();
        expect(screen.getByText('Eco Fit Bigorrilho')).toBeInTheDocument();
      });
    });

    it('deve abrir formulário de criação de empreendimento e cadastrar com sucesso', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      const empSubtab = screen.getByRole('button', { name: /^Empreendimentos$/ });
      await act(async () => {
        fireEvent.click(empSubtab);
      });

      const novoBtn = screen.getByRole('button', { name: /Novo empreendimento/ });
      fireEvent.click(novoBtn);

      expect(screen.getByText('Novo empreendimento')).toBeInTheDocument();

      const idInput = screen.getByPlaceholderText('ex: 152');
      const nomeInput = screen.getByPlaceholderText('Lee Dama Tower');
      const descInput = screen.getByPlaceholderText(/Ex: Studios e aptos/);

      fireEvent.change(idInput, { target: { value: '888' } });
      fireEvent.change(nomeInput, { target: { value: 'Ocean Towers' } });
      fireEvent.change(descInput, { target: { value: 'Frente mar, alto padrão' } });

      const saveBtn = screen.getByRole('button', { name: /Salvar empreendimento/ });
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      await waitFor(() => {
        expect(mockInsertEmpreendimento).toHaveBeenCalledWith({
          id: '888',
          nome: 'Ocean Towers',
          descricao_ia: 'Frente mar, alto padrão',
          ativo: true,
        });
      });
    });

    it('deve permitir abrir edição de um empreendimento e fazer UPDATE com sucesso', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      const empSubtab = screen.getByRole('button', { name: /^Empreendimentos$/ });
      await act(async () => {
        fireEvent.click(empSubtab);
      });

      await waitFor(() => {
        expect(screen.getByText('Lee Dama Tower')).toBeInTheDocument();
      });

      const editBtns = screen.getAllByTitle('Editar empreendimento');
      fireEvent.click(editBtns[0]);

      expect(screen.getByText('Editar empreendimento')).toBeInTheDocument();
      
      const nomeInput = screen.getByDisplayValue('Lee Dama Tower');
      fireEvent.change(nomeInput, { target: { value: 'Lee Dama Tower Edited' } });

      const saveBtn = screen.getByRole('button', { name: /Salvar empreendimento/ });
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      await waitFor(() => {
        expect(mockUpdateEmpreendimento).toHaveBeenCalledWith({
          nome: 'Lee Dama Tower Edited',
          descricao_ia: 'Studios a 800m do mar',
          ativo: true,
        }, '152');
      });
    });
  });

  describe('Campanhas agendadas', () => {
    it('deve alternar para a sub-aba de agendadas e listar as campanhas', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      // Clicar na sub-aba "Campanhas agendadas"
      const agendadasSubtab = screen.getByRole('button', { name: /^Campanhas agendadas$/ });
      await act(async () => {
        fireEvent.click(agendadasSubtab);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('campanhas_agendadas');
        expect(screen.getByText('Lançamento Jardim Botânico')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('deve abrir modal de detalhes ao clicar no botão visualizar', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      const agendadasSubtab = screen.getByRole('button', { name: /^Campanhas agendadas$/ });
      await act(async () => {
        fireEvent.click(agendadasSubtab);
      });

      await waitFor(() => {
        expect(screen.getByText('Lançamento Jardim Botânico')).toBeInTheDocument();
      });

      const viewBtn = screen.getByTitle('Visualizar detalhes');
      fireEvent.click(viewBtn);

      // Modal de detalhes deve estar visível
      expect(screen.getByText('Foco em investidores de Curitiba.')).toBeInTheDocument();
    });

    it('deve permitir cancelar campanha programada', async () => {
      render(<DashboardPage />);
      const gerenciarBtn = screen.getByRole('button', { name: /Gerenciar/ });
      await act(async () => {
        fireEvent.click(gerenciarBtn);
      });

      const agendadasSubtab = screen.getByRole('button', { name: /^Campanhas agendadas$/ });
      await act(async () => {
        fireEvent.click(agendadasSubtab);
      });

      await waitFor(() => {
        expect(screen.getByText('Lançamento Jardim Botânico')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByTitle('Cancelar agendamento');
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      const confirmBtn = await screen.findByRole('button', { name: 'Cancelar campanha' });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(mockCancelCampaign).toHaveBeenCalledWith('sc1');
      });
    });
  });

  describe('Aba Analisar - Métricas e Gráficos', () => {
    it('deve alternar para a aba Analisar e renderizar os cards de métricas e os 4 gráficos', async () => {
      render(<DashboardPage />);

      const analisarBtn = screen.getByRole('button', { name: /Analisar/ });
      await act(async () => {
        fireEvent.click(analisarBtn);
      });

      expect(screen.getByText('Leads disparados')).toBeInTheDocument();
      expect(screen.getAllByText('Responderam').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Interessados').length).toBeGreaterThan(0);
      expect(screen.getByText('Taxa de interessados')).toBeInTheDocument();

      expect(screen.getByText('Disparos por dia')).toBeInTheDocument();
      expect(screen.getByText('Taxa de resposta por campanha')).toBeInTheDocument();
      expect(screen.getByText('Funil de conversão')).toBeInTheDocument();
      expect(screen.getByText('Distribuição por status')).toBeInTheDocument();
    });

    it('deve permitir interagir com a barra de filtros na aba Analisar', async () => {
      render(<DashboardPage />);

      const analisarBtn = screen.getByRole('button', { name: /Analisar/ });
      await act(async () => {
        fireEvent.click(analisarBtn);
      });

      const selectCampaign = screen.getByRole('combobox');
      expect(selectCampaign).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.change(selectCampaign, { target: { value: 'reativacao' } });
      });

      expect(selectCampaign).toHaveValue('reativacao');
    });
  });
});
