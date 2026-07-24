import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/Icon';

interface LoginPageProps {
  onAuthSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onAuthSuccess?.();
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-page)',
      }}
    >
      <style>{`
        @keyframes login-card-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: login-card-in var(--dur-slow) var(--ease-out); }
        .login-card .input:focus { border-color: var(--navy-600); box-shadow: 0 0 0 3px rgba(23, 30, 69, 0.18); }
      `}</style>

      <div
        className="login-card card"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 36,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--navy-600)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(23, 30, 69, 0.25)',
              marginBottom: 16,
            }}
          >
            <svg fill="none" height="20" viewBox="0 0 64 64" width="20">
              <path d="M40 16 L24 48" stroke="#fff" strokeLinecap="round" strokeWidth="7" />
            </svg>
          </div>
          <h1 className="t-serif" style={{ fontSize: 28, margin: 0 }}>
            reLead<span style={{ color: 'var(--navy-600)' }}>.</span>
          </h1>
          <p className="t-label" style={{ marginTop: 8 }}>
            Autenticação da plataforma
          </p>
        </div>

        {errorMsg && (
          <div className="banner err" style={{ marginTop: 8 }}>
            <Icon name="alert-triangle" size={16} />
            <span style={{ flex: 1 }}>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <div className="field">
            <label htmlFor="emailInput">E-mail corporativo</label>
            <input
              id="emailInput"
              name="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@symimoveis.com.br"
              autoComplete="username"
              spellCheck={false}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="passwordInput">Senha de acesso</label>
            <input
              id="passwordInput"
              name="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn primary lg block"
            disabled={isLoading}
            style={{ marginTop: 8 }}
          >
            {isLoading ? 'Entrando…' : 'Acessar o painel'}
          </button>
        </form>
      </div>
    </div>
  );
};
