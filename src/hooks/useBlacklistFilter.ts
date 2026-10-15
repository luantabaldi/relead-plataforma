import { useEffect, useState } from 'react';
import { useBlacklist } from './useBlacklist';
import { chaveTelefone } from '../lib/telefone';

export const useBlacklistFilter = () => {
  const { entries: blacklistEntries, isLoading } = useBlacklist();
  const [blockedTelefones, setBlockedTelefones] = useState<Set<string>>(new Set());

  // O conjunto guarda a chave do telefone (DDD + últimos 8 dígitos), não o texto digitado.
  useEffect(() => {
    const blocked = new Set(blacklistEntries.map(e => chaveTelefone(e.telefone)));
    setBlockedTelefones(blocked);
  }, [blacklistEntries]);

  const filterLeads = <T extends { telefone: string }>(leads: T[]): { filtered: T[]; blockedCount: number } => {
    const filtered = leads.filter(lead => !blockedTelefones.has(chaveTelefone(lead.telefone)));
    const blockedCount = leads.length - filtered.length;
    return { filtered, blockedCount };
  };

  const isBlocked = (telefone: string): boolean => blockedTelefones.has(chaveTelefone(telefone));

  return {
    filterLeads,
    isBlocked,
    blockedTelefones,
    isLoading,
  };
};
