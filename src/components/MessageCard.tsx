import React from 'react';
import { Message, SenderType } from '../types';

interface MessageCardProps {
  message: Message;
}

const senderLabel = (sender: SenderType): string => {
  switch (sender) {
    case 'user': return 'Você';
    case 'ia': return 'Ana Paula · IA';
    case 'lead': return 'Lead';
    default: return '';
  }
};

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  // Lead replies arrive on the left; our side (user/IA) sits on the right.
  const isIncoming = message.sender === 'lead';

  return (
    <div
      className="message"
      style={{ display: 'flex', justifyContent: isIncoming ? 'flex-start' : 'flex-end' }}
    >
      <div className={`bubble ${isIncoming ? 'in' : 'out'}`}>
        <span style={{ whiteSpace: 'pre-wrap' }}>{message.texto}</span>
        <div className="meta">
          {senderLabel(message.sender)} ·{' '}
          {message.timestamp ? (() => {
            try {
              const d = new Date(message.timestamp);
              return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
              return '—';
            }
          })() : '—'}
        </div>
      </div>
    </div>
  );
};
