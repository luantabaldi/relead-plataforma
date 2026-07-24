import React, { useState, useEffect } from 'react';
import { Icon, IconName } from './Icon';
import { ManageSubTab } from '../hooks/useHash';

export type TabType = 'gerenciar' | 'disparar' | 'acompanhar' | 'analisar';

interface NavEntry {
  id: TabType;
  label: string;
  icon: IconName;
  section: 'operacao' | 'config';
}

const ITEMS: NavEntry[] = [
  { id: 'acompanhar', label: 'Acompanhar', icon: 'inbox', section: 'operacao' },
  { id: 'disparar', label: 'Disparar', icon: 'send', section: 'operacao' },
  { id: 'analisar', label: 'Analisar', icon: 'bar-chart', section: 'operacao' },
  { id: 'gerenciar', label: 'Gerenciar', icon: 'settings', section: 'config' },
];

const MANAGE_SUBS: { id: ManageSubTab; label: string; icon: IconName }[] = [
  { id: 'templates',       label: 'Templates',   icon: 'file-text' },
  { id: 'empreendimentos', label: 'Empreendimentos', icon: 'building' },
  { id: 'agendadas',       label: 'Agendadas',   icon: 'calendar' },
];

interface SidebarProps {
  active: TabType;
  manageSubTab?: ManageSubTab;
  onChange: (tab: TabType, sub?: ManageSubTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, manageSubTab, onChange }) => {
  const operacao = ITEMS.filter((i) => i.section === 'operacao');
  const config   = ITEMS.filter((i) => i.section === 'config');

  // Accordion for Gerenciar: auto-open when that tab is active
  const [manageOpen, setManageOpen] = useState(active === 'gerenciar');
  useEffect(() => {
    if (active === 'gerenciar') setManageOpen(true);
  }, [active]);

  const renderItem = (it: NavEntry) => {
    const isActive = active === it.id;
    const isGerenciar = it.id === 'gerenciar';

    if (isGerenciar) {
      return (
        <div key={it.id} className="nav-group">
          {/* Parent row */}
          <button
            type="button"
            className={'nav-item' + (isActive ? ' active' : '')}
            onClick={() => {
              // Toggle accordion; if clicking while not active, also navigate
              if (!isActive) {
                onChange('gerenciar', manageSubTab ?? 'templates');
              } else {
                setManageOpen((o) => !o);
              }
            }}
            aria-expanded={manageOpen}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon name={it.icon} size={18} />
            <span style={{ flex: 1 }}>{it.label}</span>
            <Icon
              name={manageOpen ? 'chevron-up' : 'chevron-down'}
              size={13}
              style={{
                transition: 'transform 0.2s ease',
                color: 'var(--ink-200)',
              }}
            />
            {isActive && <span className="nav-dot" />}
          </button>

          {/* Submenu */}
          {manageOpen && (
            <div className="nav-sub" role="group" aria-label="Submenu Gerenciar">
              {MANAGE_SUBS.map((sub) => {
                const subActive = isActive && manageSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={'nav-sub-item' + (subActive ? ' active' : '')}
                    onClick={() => onChange('gerenciar', sub.id)}
                    aria-current={subActive ? 'page' : undefined}
                  >
                    <Icon name={sub.icon} size={14} style={{ opacity: 0.7 }} />
                    <span>{sub.label}</span>
                    {subActive && <span className="nav-dot" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={it.id}
        type="button"
        className={'nav-item' + (isActive ? ' active' : '')}
        onClick={() => onChange(it.id)}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon name={it.icon} size={18} />
        <span>{it.label}</span>
        {isActive && <span className="nav-dot" />}
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="mark">
          <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
            <path d="M40 16 L24 48" stroke="#F7F8FA" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </span>
        <span className="wm">reLead<em>.</em></span>
      </div>

      <div className="eyebrow">Operação</div>
      {operacao.map(renderItem)}

      <div className="eyebrow">Configuração</div>
      {config.map(renderItem)}
    </aside>
  );
};

export default Sidebar;
