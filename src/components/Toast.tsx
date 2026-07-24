import React from 'react';
import { Icon } from './Icon';
import { ToastState } from '../hooks/useToast';

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span
        className="check"
        style={{ background: toast.type === 'ok' ? 'var(--green-500)' : 'var(--red-500)' }}
      >
        <Icon name={toast.type === 'ok' ? 'check' : 'alert-triangle'} size={11} style={{ color: '#fff' }} />
      </span>
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', display: 'inline-flex', opacity: 0.7, padding: 2 }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
};
