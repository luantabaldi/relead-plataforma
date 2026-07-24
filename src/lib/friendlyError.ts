/**
 * Traduz erros técnicos (Supabase/Postgres/fetch) para mensagens que um
 * operador não-técnico entende, mantendo o erro cru só no console.
 */
export function friendlyError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const msg = raw.toLowerCase();

  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('session')) {
    return 'Sua sessão expirou. Atualize a página e faça login novamente.';
  }
  if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('unique constraint')) {
    return 'Já existe um registro com esses dados.';
  }
  if (msg.includes('foreign key') || msg.includes('violates')) {
    return 'Não foi possível concluir: esse registro está vinculado a outro dado do sistema.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('permission denied') || msg.includes('row-level security') || msg.includes('rls')) {
    return 'Você não tem permissão para fazer essa ação.';
  }
  if (msg.includes('timeout')) {
    return 'O servidor demorou demais para responder. Tente novamente.';
  }

  return fallback;
}
