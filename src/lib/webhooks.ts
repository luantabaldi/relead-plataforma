/**
 * Webhook do workflow de disparo do n8n ("reLead — 3. Disparo (20s)").
 *
 * Cada número pode ter o próprio workflow (a instância de envio fica no workflow).
 * Convenção: REACT_APP_N8N_WEBHOOK_DISPARO_<phone_number_id>; sem ela, usa o padrão.
 * O CRA embute as REACT_APP_* no build, então a variável precisa existir na Vercel antes do deploy.
 *
 * O workflow anterior (40 s entre envios) continua no n8n em /webhook/disparo-manual-planilha
 * e serve de reserva: para voltar a ele, basta trocar o caminho padrão abaixo.
 */
export const WEBHOOK_DISPARO_PADRAO =
  'https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha-v2';

export function webhookDisparoDoNumero(phoneNumberId?: string | null): string {
  if (!phoneNumberId) return WEBHOOK_DISPARO_PADRAO;
  const env = process.env as Record<string, string | undefined>;
  return env[`REACT_APP_N8N_WEBHOOK_DISPARO_${phoneNumberId}`] || WEBHOOK_DISPARO_PADRAO;
}
