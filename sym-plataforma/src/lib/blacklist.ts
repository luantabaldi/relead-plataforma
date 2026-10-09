import type { SupabaseClient } from '@supabase/supabase-js'

const CHUNK = 200

/** Dígitos do telefone, com DDI 55 quando vier só DDD+número (10–11 dígitos). */
export function normalizeTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits
}

/** Número sem o DDI 55, usado para comparar independente do prefixo. */
function nacional(tel: string): string {
  return tel.startsWith('55') && tel.length >= 12 ? tel.slice(2) : tel
}

/**
 * Retorna o conjunto (em formato nacional) dos telefones bloqueados entre os informados.
 * Lança erro se a consulta falhar: quem chama deve tratar como falha, nunca como "lista vazia".
 */
export async function findBlocked(
  supabase: SupabaseClient,
  telefones: string[]
): Promise<Set<string>> {
  const unicos = [...new Set(telefones.map((t) => nacional(normalizeTelefone(t))))]
  const blocked = new Set<string>()

  for (let i = 0; i < unicos.length; i += CHUNK) {
    const chunk = unicos.slice(i, i + CHUNK)
    const variantes = chunk.flatMap((n) => [n, `55${n}`])
    const { data, error } = await supabase
      .from('blacklist')
      .select('telefone')
      .in('telefone', variantes)
    if (error) throw new Error(`Falha ao consultar blacklist: ${error.message}`)
    for (const row of data ?? []) blocked.add(nacional(normalizeTelefone(row.telefone)))
  }
  return blocked
}

export function isBlockedIn(blocked: Set<string>, telefone: string): boolean {
  return blocked.has(nacional(normalizeTelefone(telefone)))
}
