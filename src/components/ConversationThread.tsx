import React, { useState, useRef, useEffect } from 'react';
import { ConversationThread as ConversationThreadType } from '../types';
import { MessageCard } from './MessageCard';
import { Icon } from './Icon';
import { statusMeta, CAMPAIGN_LABEL, avatarTone, initials } from './statusMeta';

interface ConversationThreadProps {
  conversation: ConversationThreadType;
  onAction: (action: string) => void;
  pendingAction?: string | null;
}

const NEAR_BOTTOM_THRESHOLD = 150;

export const ConversationThread: React.FC<ConversationThreadProps> = ({ conversation, onAction, pendingAction = null }) => {
  const [expandedData, setExpandedData] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const meta = statusMeta(conversation.dispatch.status);
  const { extracted_data, ai_classification, dispatch, messages } = conversation;
  const interesse = ai_classification.interesse;
  const hasExtracted = extracted_data.bairro || extracted_data.valor_buscado || extracted_data.tipo_imovel;

  // Abre a conversa já rolada para a última mensagem, como no WhatsApp — o
  // histórico fica disponível subindo o scroll, não escondido lá embaixo.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dispatch.id]);

  // Novas mensagens (realtime) só puxam o scroll se o operador já estiver
  // perto do fim; se ele subiu pra ler histórico, não o interrompe.
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < NEAR_BOTTOM_THRESHOLD) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div className="card" style={{ height: '100%', padding: 0, gap: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--paper-200)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
            <span className={`lead-av ${avatarTone(dispatch.nome)}`} style={{ width: 44, height: 44, borderRadius: 13, fontSize: 15 }}>
              {initials(dispatch.nome)}
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 className="t-serif" style={{ fontSize: 26, margin: 0, lineHeight: 1.1 }}>{dispatch.nome}</h2>
              <div className="t-mono tnum" style={{ fontSize: 12, color: 'var(--ink-50)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="phone" size={13} /> {dispatch.telefone}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="t-label" style={{ marginBottom: 6 }}>Enviado</div>
            <div className="t-mono tnum" style={{ fontSize: 12, color: 'var(--ink-200)' }}>
              {dispatch.timestamp_envio ? (() => {
                try {
                  const d = new Date(dispatch.timestamp_envio);
                  return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleDateString('pt-BR');
                } catch (e) {
                  return 'Data inválida';
                }
              })() : 'Não enviado'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <span className={`chip ${meta.chip}`}><span className="dot" />{meta.label}</span>
          <span className="chip neutral"><span className="dot" />{CAMPAIGN_LABEL[dispatch.tipo_campanha] ?? dispatch.tipo_campanha}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto thin-scroll" style={{ minHeight: 0, padding: '20px 24px', background: 'var(--paper-50)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length > 0 ? (
          messages.map((message) => <MessageCard key={message.id} message={message} />)
        ) : (
          <div className="empty">
            <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>Nenhuma mensagem nesta conversa</span>
          </div>
        )}
      </div>

      {/* Extracted data */}
      {hasExtracted && (
        <div style={{ borderTop: '1px solid var(--paper-200)' }}>
          <button
            type="button"
            onClick={() => setExpandedData(!expandedData)}
            className="nav-item"
            style={{ width: '100%', borderRadius: 0, padding: '14px 24px', justifyContent: 'space-between' }}
            aria-expanded={expandedData}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Icon name="list" size={16} /> Dados extraídos
            </span>
            <Icon name={expandedData ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>
          {expandedData && (
            <div className="grid grid-cols-3 gap-3" style={{ padding: '0 24px 18px' }}>
              {extracted_data.bairro && <DataPill label="Bairro" value={extracted_data.bairro} />}
              {extracted_data.valor_buscado && <DataPill label="Valor" value={extracted_data.valor_buscado} />}
              {extracted_data.tipo_imovel && <DataPill label="Tipo" value={extracted_data.tipo_imovel} />}
            </div>
          )}
        </div>
      )}

      {/* AI classification */}
      <div style={{ borderTop: '1px solid var(--paper-200)', padding: '16px 24px', background: interesse ? 'var(--green-50)' : 'var(--red-50)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: interesse ? 'var(--green-500)' : 'var(--red-500)', color: '#fff', flexShrink: 0,
          }}>
            <Icon name={interesse ? 'thumbs-up' : 'thumbs-down'} size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-label" style={{ color: interesse ? '#1F5C3C' : '#7A1F18' }}>Classificação da IA</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: interesse ? '#1F5C3C' : '#7A1F18' }}>
                {interesse ? 'Interessado' : 'Sem interesse'}
              </span>
              <span className="t-mono tnum" style={{ fontSize: 12, color: interesse ? '#1F5C3C' : '#7A1F18', opacity: 0.8 }}>
                {ai_classification.confianca}% confiança
              </span>
            </div>
            {ai_classification.motivo && (
              <p style={{ fontSize: 12, color: 'var(--ink-100)', margin: '6px 0 0', lineHeight: 1.5 }}>{ai_classification.motivo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ borderTop: '1px solid var(--paper-200)', padding: '14px 24px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onAction('reenviar')} disabled={!!pendingAction} className="btn secondary" style={{ padding: '9px 14px' }}>
          {pendingAction === 'reenviar' ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Icon name="refresh" size={14} />} Reenviar
        </button>
        <button type="button" onClick={() => onAction('marcar-interessado')} disabled={!!pendingAction} className="btn secondary" style={{ padding: '9px 14px' }}>
          {pendingAction === 'marcar-interessado' ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Icon name="thumbs-up" size={14} />} Interessado
        </button>
        <button type="button" onClick={() => onAction('marcar-sem-interesse')} disabled={!!pendingAction} className="btn secondary" style={{ padding: '9px 14px' }}>
          {pendingAction === 'marcar-sem-interesse' ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Icon name="thumbs-down" size={14} />} Sem interesse
        </button>
        <button type="button" onClick={() => onAction('copiar-crm')} disabled={!!pendingAction} className="btn dark" style={{ padding: '9px 14px', marginLeft: 'auto' }}>
          {pendingAction === 'copiar-crm' ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Icon name="copy" size={14} />} Copiar p/ CRM
        </button>
      </div>
    </div>
  );
};

const DataPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ background: 'var(--paper-100)', border: '1px solid var(--paper-200)', borderRadius: 12, padding: '10px 12px' }}>
    <div className="t-label" style={{ marginBottom: 5 }}>{label}</div>
    <div style={{ fontWeight: 600, color: 'var(--ink-300)', fontSize: 13 }}>{value}</div>
  </div>
);
