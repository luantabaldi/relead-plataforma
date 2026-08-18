import { useState, useEffect, useCallback } from 'react';
import { TabType } from '../components/TopNav';

export type ManageSubTab = 'templates' | 'empreendimentos' | 'agendadas';
export type DashboardsSubTab = 'performance' | 'custos';
export type CampanhasSubTab = 'acompanhar' | 'historico' | 'nova';
export type ContatosSubTab = 'leads' | 'bloqueados';
export type SubTab = ManageSubTab | DashboardsSubTab | CampanhasSubTab | ContatosSubTab;

interface HashState {
  tab: TabType;
  subTab: SubTab;
}

const SUBTAB_CONFIG: Record<TabType, { values: readonly SubTab[]; default: SubTab }> = {
  dashboards: { values: ['performance', 'custos'], default: 'performance' },
  campanhas: { values: ['acompanhar', 'historico', 'nova'], default: 'acompanhar' },
  contatos: { values: ['leads', 'bloqueados'], default: 'leads' },
  gerenciar: { values: ['templates', 'empreendimentos', 'agendadas'], default: 'templates' },
};

// Compatibilidade com hashes do menu antigo (8 abas), para não quebrar
// bookmarks/links já compartilhados quando os agrupamos em 4 grupos.
const LEGACY_TAB_MAP: Record<string, { tab: TabType; sub: SubTab }> = {
  analisar: { tab: 'dashboards', sub: 'performance' },
  kpis: { tab: 'dashboards', sub: 'custos' },
  acompanhar: { tab: 'campanhas', sub: 'acompanhar' },
  disparar: { tab: 'campanhas', sub: 'nova' },
  logs: { tab: 'campanhas', sub: 'historico' },
  leads: { tab: 'contatos', sub: 'leads' },
  blacklist: { tab: 'contatos', sub: 'bloqueados' },
};

/**
 * Parses window.location.hash into a structured state.
 * Supported patterns:
 *   #/dashboards            → defaults to 'performance'
 *   #/dashboards/custos
 *   #/campanhas             → defaults to 'acompanhar'
 *   #/campanhas/historico
 *   #/campanhas/nova
 *   #/contatos              → defaults to 'leads'
 *   #/contatos/bloqueados
 *   #/gerenciar             → defaults to 'templates'
 *   #/gerenciar/empreendimentos
 *   #/gerenciar/agendadas
 * Old flat hashes (#/analisar, #/kpis, #/logs, #/acompanhar, #/disparar,
 * #/leads, #/blacklist) redirect to their new group/sub-tab equivalent.
 */
function parseHash(hash: string): HashState {
  const path = hash.replace(/^#\/?/, '').split('/');
  const rawTab = path[0];
  let rawSub: string | undefined = path[1];

  let tab: TabType;
  if (rawTab in SUBTAB_CONFIG) {
    tab = rawTab as TabType;
  } else if (LEGACY_TAB_MAP[rawTab]) {
    tab = LEGACY_TAB_MAP[rawTab].tab;
    rawSub = rawSub ?? LEGACY_TAB_MAP[rawTab].sub;
  } else {
    tab = 'dashboards';
  }

  const config = SUBTAB_CONFIG[tab];
  const subTab: SubTab = config.values.includes(rawSub as SubTab) ? (rawSub as SubTab) : config.default;

  return { tab, subTab };
}

function buildHash(tab: TabType, subTab?: SubTab): string {
  const config = SUBTAB_CONFIG[tab];
  return `#/${tab}/${subTab ?? config.default}`;
}

export function useHash() {
  const [state, setState] = useState<HashState>(() =>
    parseHash(window.location.hash || '#/dashboards')
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

  const navigate = useCallback((tab: TabType, subTab?: SubTab) => {
    const hash = buildHash(tab, subTab);
    window.location.hash = hash;
    // Dispatch event manually to support JSDOM in test environments
    window.dispatchEvent(new Event('hashchange'));
  }, []);

  return {
    tab: state.tab,
    subTab: state.subTab,
    navigate,
  };
}
