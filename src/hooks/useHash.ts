import { useState, useEffect, useCallback } from 'react';
import { TabType } from '../components/TopNav';

export type ManageSubTab = 'templates' | 'empreendimentos' | 'agendadas';

interface HashState {
  tab: TabType;
  manageSubTab: ManageSubTab;
}

/**
 * Parses window.location.hash into a structured state.
 * Supported patterns:
 *   #/acompanhar
 *   #/disparar
 *   #/analisar
 *   #/gerenciar            → defaults to 'templates'
 *   #/gerenciar/templates
 *   #/gerenciar/empreendimentos
 *   #/gerenciar/agendadas
 */
function parseHash(hash: string): HashState {
  const path = hash.replace(/^#\/?/, '').split('/');
  const rawTab = path[0] as TabType;
  const validTabs: TabType[] = ['acompanhar', 'disparar', 'analisar', 'logs', 'leads', 'gerenciar'];
  const tab: TabType = validTabs.includes(rawTab) ? rawTab : 'analisar';

  const validSubTabs: ManageSubTab[] = ['templates', 'empreendimentos', 'agendadas'];
  const rawSub = path[1] as ManageSubTab;
  const manageSubTab: ManageSubTab = validSubTabs.includes(rawSub) ? rawSub : 'templates';

  return { tab, manageSubTab };
}

function buildHash(tab: TabType, manageSubTab?: ManageSubTab): string {
  if (tab === 'gerenciar' && manageSubTab) {
    return `#/${tab}/${manageSubTab}`;
  }
  return `#/${tab}`;
}

export function useHash() {
  const [state, setState] = useState<HashState>(() =>
    parseHash(window.location.hash || '#/analisar')
  );

  // Keep state in sync with external hash changes (back/forward, direct URL edits)
  useEffect(() => {
    const onHashChange = () => {
      setState(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    // Initialise from current hash on mount
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((tab: TabType, manageSubTab?: ManageSubTab) => {
    const hash = buildHash(tab, tab === 'gerenciar' ? (manageSubTab ?? 'templates') : undefined);
    window.location.hash = hash;
    // Dispatch event manually to support JSDOM in test environments
    window.dispatchEvent(new Event('hashchange'));
  }, []);

  return {
    tab: state.tab,
    manageSubTab: state.manageSubTab,
    navigate,
  };
}
