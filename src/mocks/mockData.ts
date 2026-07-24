import { Message, Dispatch, ConversationData } from '../types';

export const mockDispatches: Dispatch[] = [
  {
    id: '1',
    telefone: '(41) 99999-1111',
    nome: 'João Silva',
    tipo_campanha: 'prospeccao',
    status: 'respondido',
    template_nome: 'template-1',
    timestamp_envio: new Date('2026-05-28T10:30:00'),
  },
  {
    id: '2',
    telefone: '(41) 98888-2222',
    nome: 'Maria Santos',
    tipo_campanha: 'reativacao',
    status: 'interessado',
    template_nome: 'template-2',
    timestamp_envio: new Date('2026-05-29T14:15:00'),
  },
  {
    id: '3',
    telefone: '(41) 97777-3333',
    nome: 'Pedro Oliveira',
    tipo_campanha: 'prospeccao',
    status: 'enviado',
    template_nome: 'template-1',
    timestamp_envio: new Date('2026-05-30T09:45:00'),
  },
  {
    id: '4',
    telefone: '(41) 96666-4444',
    nome: 'Ana Costa',
    tipo_campanha: 'prospeccao',
    status: 'pausado',
    template_nome: 'template-3',
    timestamp_envio: new Date('2026-05-31T11:20:00'),
  },
  {
    id: '5',
    telefone: '(41) 95555-5555',
    nome: 'Carlos Ferreira',
    tipo_campanha: 'reativacao',
    status: 'sem_interesse',
    template_nome: 'template-2',
    timestamp_envio: new Date('2026-06-01T08:00:00'),
  },
];

export const mockConversations: Message[] = [
  {
    id: '1-1',
    dispatch_id: '1',
    telefone: '(41) 99999-1111',
    texto: 'Olá João, tudo bem? Gostaria de saber sobre nossos imóveis em Curitiba.',
    sender: 'user',
    timestamp: new Date('2026-05-28T10:30:00'),
    tipo_campanha: 'prospeccao',
  },
  {
    id: '1-2',
    dispatch_id: '1',
    telefone: '(41) 99999-1111',
    texto: 'Oi! Tudo bem sim! Tenho muito interesse em imóveis.',
    sender: 'lead',
    timestamp: new Date('2026-05-28T10:35:00'),
    tipo_campanha: 'prospeccao',
  },
  {
    id: '1-3',
    dispatch_id: '1',
    telefone: '(41) 99999-1111',
    texto: 'Ótimo! Ana Paula vai te ajudar com mais informações sobre nossos imóveis.',
    sender: 'ia',
    timestamp: new Date('2026-05-28T10:36:00'),
    tipo_campanha: 'prospeccao',
  },
  {
    id: '2-1',
    dispatch_id: '2',
    telefone: '(41) 98888-2222',
    texto: 'Olá Maria, voltamos para oferecer as melhores oportunidades de imóveis.',
    sender: 'user',
    timestamp: new Date('2026-05-29T14:15:00'),
    tipo_campanha: 'reativacao',
  },
  {
    id: '2-2',
    dispatch_id: '2',
    telefone: '(41) 98888-2222',
    texto: 'Que legal! Gostaria de saber mais sobre os imóveis premium.',
    sender: 'lead',
    timestamp: new Date('2026-05-29T14:20:00'),
    tipo_campanha: 'reativacao',
  },
  {
    id: '3-1',
    dispatch_id: '3',
    telefone: '(41) 97777-3333',
    texto: 'Olá Pedro! Temos ótimas oportunidades para você.',
    sender: 'user',
    timestamp: new Date('2026-05-30T09:45:00'),
    tipo_campanha: 'prospeccao',
  },
];

export const mockConversationData: ConversationData = {
  bairro: 'Bigorrilho',
  valor_buscado: 'R$ 550.000',
  tipo_imovel: 'Apartamento',
};

export const mockConversationByDispatchId: { [key: string]: Message[] } = {
  '1': mockConversations.filter(m => m.dispatch_id === '1'),
  '2': mockConversations.filter(m => m.dispatch_id === '2'),
  '3': mockConversations.filter(m => m.dispatch_id === '3'),
};
