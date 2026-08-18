import { useEffect, useState } from 'react';
import { useBlacklist } from './useBlacklist';

export const useBlacklistFilter = () => {
  const { entries: blacklistEntries, isLoading } = useBlacklist();
  const [blockedTelefones, setBlockedTelefones] = useState<Set<string>>(new Set());

  useEffect(() => {
    const blocked = new Set(blacklistEntries.map(e => e.telefone));
    setBlockedTelefones(blocked);
  }, [blacklistEntries]);

  const filterLeads = <T extends { telefone: string }>(leads: T[]): { filtered: T[]; blockedCount: number } => {
    const filtered = leads.filter(lead => !blockedTelefones.has(lead.telefone));
    const blockedCount = leads.length - filtered.length;
    return { filtered, blockedCount };
  };

  const isBlocked = (telefone: string): boolean => blockedTelefones.has(telefone);

  return {
    filterLeads,
    isBlocked,
    blockedTelefones,
    isLoading,
  };
};
