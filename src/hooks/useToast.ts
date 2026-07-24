import { useCallback, useRef, useState } from 'react';

export interface ToastState {
  id: number;
  type: 'ok' | 'err';
  text: string;
}

/** Feedback não-bloqueante para substituir alert(). Some sozinho após 4s. */
export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const notify = useCallback((type: ToastState['type'], text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    setToast({ id, type, text });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, notify, dismiss };
};
