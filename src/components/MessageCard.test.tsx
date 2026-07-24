import { render, screen } from '@testing-library/react';
import { MessageCard } from './MessageCard';
import { Message } from '../types';

describe('MessageCard', () => {
  const mockMessage: Message = {
    id: '1',
    dispatch_id: 'dispatch-1',
    telefone: '(41) 99999-9999',
    texto: 'Olá, tudo bem?',
    sender: 'user',
    timestamp: new Date('2026-06-01T14:30:00'),
    tipo_campanha: 'prospeccao',
  };

  it('deve renderizar mensagem do usuário', () => {
    render(<MessageCard message={mockMessage} />);

    expect(screen.getByText('Olá, tudo bem?')).toBeInTheDocument();
    expect(screen.getByText(/Você/)).toBeInTheDocument();
  });

  it('deve renderizar mensagem do lead', () => {
    const leadMessage: Message = {
      ...mockMessage,
      sender: 'lead',
      texto: 'Oi! Estou bem sim.',
    };

    render(<MessageCard message={leadMessage} />);

    expect(screen.getByText('Oi! Estou bem sim.')).toBeInTheDocument();
    expect(screen.getByText(/Lead/)).toBeInTheDocument();
  });

  it('deve renderizar mensagem da IA', () => {
    const iaMessage: Message = {
      ...mockMessage,
      sender: 'ia',
      texto: 'Ana Paula respondeu automaticamente.',
    };

    const { container } = render(<MessageCard message={iaMessage} />);

    expect(screen.getByText('Ana Paula respondeu automaticamente.')).toBeInTheDocument();
    expect(container.textContent).toContain('Ana Paula · IA');
  });

  it('deve exibir timestamp formatado', () => {
    render(<MessageCard message={mockMessage} />);

    expect(screen.getByText(/14:30/)).toBeInTheDocument();
  });

  it('deve ter cores diferentes por tipo de remetente', () => {
    const { container: userContainer } = render(<MessageCard message={mockMessage} />);
    const userBubble = userContainer.querySelector('.bubble.out');

    expect(userBubble).not.toBeNull();

    const { unmount } = render(<MessageCard message={mockMessage} />);
    unmount();

    const leadMessage: Message = { ...mockMessage, sender: 'lead' };
    const { container: leadContainer } = render(<MessageCard message={leadMessage} />);
    const leadBubble = leadContainer.querySelector('.bubble.in');

    expect(leadBubble).not.toBeNull();
  });
});

