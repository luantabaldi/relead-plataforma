import React from 'react';
import { Icon, IconName } from './Icon';
import { ManageSubTab } from '../hooks/useHash';

export type TabType = 'gerenciar' | 'disparar' | 'acompanhar' | 'analisar' | 'logs' | 'leads';

interface NavEntry {
  id: TabType;
  label: string;
  icon: IconName;
  section: 'operacao' | 'config';
}

const ITEMS: NavEntry[] = [
  { id: 'analisar', label: 'Analisar', icon: 'bar-chart', section: 'operacao' },
  { id: 'logs', label: 'Histórico', icon: 'clock', section: 'operacao' },
  { id: 'leads', label: 'Leads', icon: 'user', section: 'operacao' },
  { id: 'acompanhar', label: 'Acompanhar', icon: 'inbox', section: 'operacao' },
  { id: 'disparar', label: 'Disparar', icon: 'send', section: 'operacao' },
  { id: 'gerenciar', label: 'Gerenciar', icon: 'settings', section: 'config' },
];

interface TopNavProps {
  active: TabType;
  manageSubTab?: ManageSubTab;
  onChange: (tab: TabType, sub?: ManageSubTab) => void;
}

// The Gerenciar page owns its own sub-tab selector (Templates /
// Empreendimentos / Agendadas), so the top nav keeps a single flat level —
// no dropdown to duplicate that navigation.
export const TopNav: React.FC<TopNavProps> = ({ active, manageSubTab, onChange }) => {
  const operacao = ITEMS.filter((i) => i.section === 'operacao');
  const config   = ITEMS.filter((i) => i.section === 'config');

  const renderItem = (it: NavEntry) => {
    const isActive = active === it.id;
    return (
      <button
        key={it.id}
        type="button"
        className={'nav-item' + (isActive ? ' active' : '')}
        onClick={() => onChange(it.id, it.id === 'gerenciar' ? (manageSubTab ?? 'templates') : undefined)}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon name={it.icon} size={17} />
        <span>{it.label}</span>
      </button>
    );
  };

  return (
    <header className="topnav">
      <div className="brand-lockup">
        <span className="mark">
          <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
            <path d="M40 16 L24 48" stroke="#F7F8FA" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </span>
        <span className="wm">reLead<em>.</em></span>
      </div>

      <nav className="topnav-items">
        {operacao.map(renderItem)}
        <span className="topnav-divider" />
        {config.map(renderItem)}
      </nav>
    </header>
  );
};

export default TopNav;
