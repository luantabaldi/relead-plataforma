import { WEBHOOK_DISPARO_PADRAO, webhookDisparoDoNumero } from './webhooks';

describe('webhookDisparoDoNumero', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('usa o workflow de 20 s por padrão', () => {
    expect(WEBHOOK_DISPARO_PADRAO).toMatch(/disparo-manual-planilha-v2$/);
    expect(webhookDisparoDoNumero('1057312227463254')).toBe(WEBHOOK_DISPARO_PADRAO);
    expect(webhookDisparoDoNumero(null)).toBe(WEBHOOK_DISPARO_PADRAO);
    expect(webhookDisparoDoNumero(undefined)).toBe(WEBHOOK_DISPARO_PADRAO);
  });

  it('respeita um webhook específico configurado para o número', () => {
    process.env.REACT_APP_N8N_WEBHOOK_DISPARO_999 = 'https://exemplo/webhook/numero-999';
    expect(webhookDisparoDoNumero('999')).toBe('https://exemplo/webhook/numero-999');
    expect(webhookDisparoDoNumero('111')).toBe(WEBHOOK_DISPARO_PADRAO);
  });
});
