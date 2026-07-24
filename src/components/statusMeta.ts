import { IconName } from './Icon';

export type ChipVariant = 'ok' | 'warn' | 'err' | 'info' | 'neutral';

export interface StatusMeta {
  label: string;
  chip: ChipVariant;
  icon: IconName;
}

/** Single source of truth for how each message status is presented. */
export const STATUS_META: Record<string, StatusMeta> = {
  enviado:      { label: 'Enviado',       chip: 'info',    icon: 'send' },
  respondido:   { label: 'Respondido',    chip: 'neutral', icon: 'message-circle' },
  interessado:  { label: 'Interessado',   chip: 'ok',      icon: 'thumbs-up' },
  sem_interesse:{ label: 'Sem interesse', chip: 'err',     icon: 'thumbs-down' },
  pausado:      { label: 'Pausado',       chip: 'warn',    icon: 'pause' },
  erro:         { label: 'Erro',          chip: 'err',     icon: 'alert-triangle' },
  pendente:     { label: 'Pendente',      chip: 'neutral', icon: 'clock' },
};

export const statusMeta = (status: string): StatusMeta =>
  STATUS_META[status] ?? STATUS_META.pendente;

export const CAMPAIGN_LABEL: Record<string, string> = {
  reativacao: 'Reativação',
  prospeccao: 'Prospecção',
};

/** Deterministic avatar tone (a–d) from a name, for lead initials. */
export function avatarTone(seed: string): 'a' | 'b' | 'c' | 'd' {
  const tones = ['a', 'b', 'c', 'd'] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[h % 4];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
