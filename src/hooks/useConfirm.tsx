import React, { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

/**
 * Confirmação imperativa (await confirm({...})) para substituir window.confirm
 * por um modal do próprio sistema, com Esc e foco geridos.
 * Uso: const [confirm, confirmDialog] = useConfirm(); ...renderizar {confirmDialog} uma vez na árvore.
 */
export const useConfirm = (): [(opts: ConfirmOptions) => Promise<boolean>, React.ReactElement] => {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setState(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setState(null);
  }, []);

  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title ?? ''}
      message={state?.message ?? ''}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      tone={state?.tone}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return [confirm, dialog];
};
