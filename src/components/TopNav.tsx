import React from 'react';
import { Icon, IconName } from './Icon';
import { SubTab } from '../hooks/useHash';

export type TabType = 'dashboards' | 'campanhas' | 'contatos' | 'gerenciar';

interface NavEntry {
  id: TabType;
  label: string;
  icon: IconName;
  section: 'operacao' | 'config';
}

const ITEMS: NavEntry[] = [
  { id: 'dashboards', label: 'Dashboards', icon: 'bar-chart', section: 'operacao' },
  { id: 'campanhas', label: 'Campanhas', icon: 'megaphone', section: 'operacao' },
  { id: 'contatos', label: 'Contatos', icon: 'user', section: 'operacao' },
  { id: 'gerenciar', label: 'Gerenciar', icon: 'settings', section: 'config' },
];

interface TopNavProps {
  active: TabType;
  subTab?: SubTab;
  onChange: (tab: TabType, sub?: SubTab) => void;
}

// Dashboards, Campanhas e Contatos possuem seu próprio seletor de sub-abas
// dentro da página (mesmo padrão que Gerenciar já usava), então o top nav
// mantém um único nível flat — sem dropdown pra duplicar essa navegação.
export const TopNav: React.FC<TopNavProps> = ({ active, subTab, onChange }) => {
  const operacao = ITEMS.filter((i) => i.section === 'operacao');
  const config   = ITEMS.filter((i) => i.section === 'config');

  const renderItem = (it: NavEntry) => {
    const isActive = active === it.id;
    return (
      <button
        key={it.id}
        type="button"
        className={'nav-item' + (isActive ? ' active' : '')}
        onClick={() => onChange(it.id, isActive ? subTab : undefined)}
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
