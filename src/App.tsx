import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--bg-page)',
          color: 'var(--fg-primary)',
          gap: 16,
        }}
      >
        <style>{`
          .session-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid var(--paper-200);
            border-left-color: var(--navy-600);
            border-radius: 50%;
            animation: session-spin 0.8s linear infinite;
          }
          @keyframes session-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="session-spinner" />
        <span className="t-label">Sincronizando sessão…</span>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onAuthSuccess={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
  }

  return (
    <div className="App">
      <DashboardPage session={session} />
    </div>
  );
}

export default App;
