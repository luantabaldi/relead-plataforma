import React from 'react';
import { Icon } from './Icon';
import { supabase } from '../lib/supabase';
import { useConfirm } from '../hooks/useConfirm';

interface TopbarProps {
  syncing?: boolean;
  actions?: React.ReactNode;
  session?: any;
}

export const Topbar: React.FC<TopbarProps> = ({ syncing = false, actions, session }) => {
  const user = session?.user;
  const rawName = user?.user_metadata?.name || user?.email || 'Sym Imóveis';
  const getInitials = (n: string) => {
    const cleanName = n.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return cleanName.slice(0, 2).toUpperCase();
  };
  const userInitials = getInitials(rawName);
  const [confirm, confirmDialog] = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sair da plataforma?',
      message: 'Você precisará entrar novamente com seu e-mail e senha.',
      confirmLabel: 'Sair',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('❌ Erro ao desconectar:', err);
    }
  };

  return (
    <header className="topbar">
      {actions}

      <div className="profile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="av" style={{ background: 'var(--navy-500)', color: '#fff' }}>{userInitials}</span>
        <span>
          <span className="nm" style={{ display: 'block', fontWeight: 600 }}>{rawName}</span>
          <span className="rl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: syncing ? 'var(--amber-500)' : '#16A34A',
              }}
            />
            {syncing ? 'Sincronizando' : 'Conectado'}
          </span>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="icon-btn"
          title="Sair da conta"
          aria-label="Sair da conta"
          style={{
            marginLeft: 12,
            padding: 6,
            background: 'none',
            border: 'none',
            color: 'var(--ink-50)',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background 0.2s ease, color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-100)'; e.currentTarget.style.color = 'var(--ink-300)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-50)'; }}
        >
          <Icon name="log-out" size={17} />
        </button>
      </div>
      {confirmDialog}
    </header>
  );
};

export default Topbar;
