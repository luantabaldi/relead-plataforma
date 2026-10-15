import { WEBHOOK_DISPARO_PADRAO, WEBHOOK_SYNC_META, webhookDisparoDoNumero } from './webhooks';

describe('webhooks do n8n', () => {
  it('o disparo usa o workflow de 20 s', () => {
    expect(WEBHOOK_DISPARO_PADRAO).toMatch(/\/webhook\/disparo-manual-planilha-v2$/);
    expect(webhookDisparoDoNumero('1057312227463254')).toBe(WEBHOOK_DISPARO_PADRAO);
    expect(webhookDisparoDoNumero(null)).toBe(WEBHOOK_DISPARO_PADRAO);
  });

  it('a sincronização aponta para o workflow 2b', () => {
    expect(WEBHOOK_SYNC_META).toMatch(/\/webhook\/sync-meta-[a-f0-9]{32}$/);
  });
});
