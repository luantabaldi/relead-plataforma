/**
 * Telefones chegam em formatos diferentes (CSV, blacklist digitada à mão, n8n que
 * mexe no 9º dígito). Para comparar, usamos uma chave estável: DDD + últimos 8
 * dígitos — ignora o 55 e o 9º dígito.
 */

/** Só os dígitos, com DDI 55 quando vier apenas DDD + número (10 ou 11 dígitos). */
export function normalizeTelefone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

/** Chave de comparação: DDD + últimos 8 dígitos do número nacional. */
export function chaveTelefone(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  return d.length >= 10 ? d.slice(0, 2) + d.slice(-8) : d;
}
