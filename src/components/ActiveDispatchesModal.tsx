import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { ActiveCampaign } from '../hooks/useActiveDispatches';
import { PausedCampaign } from '../hooks/usePausedDispatches';
import { CAMPAIGN_LABEL } from './statusMeta';

interface ActiveDispatchesModalProps {
  open: boolean;
  campaigns: ActiveCampaign[];
  pausedCampaigns?: PausedCampaign[];
  onClose: () => void;
  onStopCampaign?: (campaignName: string) => Promise<void>;
  onResumeCampaign?: (campaignName: string, tipoCampanha: string) => Promise<void>;
}

export const ActiveDispatchesModal: React.FC<ActiveDispatchesModalProps> = ({
  open,
  campaigns,
  pausedCampaigns = [],
  onClose,
  onStopCampaign,
  onResumeCampaign,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement;
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      prevFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div
        className="modal thin-scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-dispatches-title"
        style={{ width: 560, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 id="active-dispatches-title" className="t-serif" style={{ fontSize: 22, margin: 0 }}>
            Disparos em andamento
          </h3>
          <button type="button" ref={closeBtnRef} onClick={onClose} className="btn ghost" aria-label="Fechar" style={{ minWidth: 'auto', padding: 6 }}>
            <Icon name="x" size={20} style={{ color: 'var(--ink-300)' }} />
          </button>
        </div>

        {campaigns.length === 0 && pausedCampaigns.length === 0 ? (
          <div className="empty" style={{ padding: '40px 0' }}>
            <span className="ic"><Icon name="check-circle" size={24} /></span>
            <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>
              Nenhum disparo em andamento agora.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {campaigns.map((c) => {
              const done = c.enviado + c.erro;
              const pct = c.total > 0 ? Math.round((done / c.total) * 100) : 0;
              return (
                <div key={c.nome_campanha} style={{ border: '1px solid var(--paper-200)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-300)' }}>{c.nome_campanha}</span>
                      <span className="chip neutral"><span className="dot" />{CAMPAIGN_LABEL[c.tipo_campanha] ?? c.tipo_campanha}</span>
                    </div>
                    {onStopCampaign && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Deseja realmente parar o disparo da campanha "${c.nome_campanha}"?`)) {
                            await onStopCampaign(c.nome_campanha);
                          }
                        }}
                        className="btn secondary"
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          height: 'auto',
                          minWidth: 'auto',
                          color: 'var(--red-500)',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        }}
                      >
                        <Icon name="pause" size={12} /> Parar
                      </button>
                    )}
                  </div>

                  <div className="progress">
                    <span style={{ width: '100%', transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.5s var(--ease-out)' }} />
                  </div>

                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-100)' }}>
                      <span className="dot success" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                      {c.enviado} enviados
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-100)' }}>
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />
                      {c.pendente} pendentes
                    </span>
                    {c.erro > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red-500)' }}>
                        <span className="dot err" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                        {c.erro} erros
                      </span>
                    )}
                    <span className="t-mono tnum" style={{ marginLeft: 'auto', color: 'var(--ink-50)' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pausedCampaigns.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 className="t-mono" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--ink-50)', margin: '0 0 12px' }}>
              Disparos pausados
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pausedCampaigns.map((c) => (
                <div key={c.nome_campanha} style={{ border: '1px solid var(--paper-200)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-300)' }}>{c.nome_campanha}</span>
                      <span className="chip neutral"><span className="dot" />{CAMPAIGN_LABEL[c.tipo_campanha] ?? c.tipo_campanha}</span>
                    </div>
                    {onResumeCampaign && (
                      <button
                        type="button"
                        onClick={() => onResumeCampaign(c.nome_campanha, c.tipo_campanha)}
                        className="btn secondary"
                        style={{ padding: '4px 8px', fontSize: 11, height: 'auto', minWidth: 'auto' }}
                      >
                        <Icon name="play" size={12} /> Retomar
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-100)' }}>
                      <span className="dot success" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                      {c.enviado} enviados
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-100)' }}>
                      <Icon name="pause" size={12} style={{ color: 'var(--ink-50)' }} />
                      {c.pausado} pausados
                    </span>
                    {c.erro > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red-500)' }}>
                        <span className="dot err" style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                        {c.erro} erros
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
