/**
 * Endereços dos workflows do n8n usados pelo app.
 *
 * ATENÇÃO — não troque por variáveis de ambiente opcionais: o CRA embute TODAS as
 * variáveis REACT_APP_* no JavaScript público quando o código referencia uma variável que
 * não existe no build (ou usa `process.env[chave]`). Foi assim que a chave do CRM foi parar
 * no bundle. Só referencie `process.env.REACT_APP_X` para variáveis que estão sempre
 * definidas na Vercel (Supabase e o webhook de reenvio, já em uso).
 *
 * Disparo: "reLead — 3. Disparo (20s)". O workflow anterior (40 s entre envios) continua no
 * n8n em /webhook/disparo-manual-planilha e serve de reserva: para voltar a ele, troque o
 * caminho abaixo.
 */
const N8N = 'https://n8n.srv1214309.hstgr.cloud/webhook';

export const WEBHOOK_DISPARO_PADRAO = `${N8N}/disparo-manual-planilha-v2`;

/** Sincronização com a Meta: workflow "Meta Ads — 2b" (templates, status do número e custos). */
export const WEBHOOK_SYNC_META = `${N8N}/sync-meta-a346d79419ae8172b2a338027030e90b`;

/** Hoje há um único workflow de disparo; o parâmetro fica para quando houver um por número. */
export function webhookDisparoDoNumero(_phoneNumberId?: string | null): string {
  return WEBHOOK_DISPARO_PADRAO;
}
