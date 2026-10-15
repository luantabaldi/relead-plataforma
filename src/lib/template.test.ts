import { corpoTemVariaveis } from './template';

describe('corpoTemVariaveis', () => {
  it('detecta variáveis numéricas e nomeadas no corpo', () => {
    expect(corpoTemVariaveis([{ type: 'BODY', text: 'Olá {{1}}, tudo bem?' }])).toBe(true);
    expect(corpoTemVariaveis([{ type: 'BODY', text: 'Olá {{nome}}!' }])).toBe(true);
  });

  it('corpo sem variáveis (caso do convite_villa_img)', () => {
    const componentes = [
      { type: 'HEADER', format: 'IMAGE' },
      { type: 'BODY', text: 'Olá! Tudo bem? Estou te convidando para um brunch de lançamento.' },
      { type: 'BUTTONS', buttons: [{ text: 'Gostaria de saber mais', type: 'QUICK_REPLY' }] },
    ];
    expect(corpoTemVariaveis(componentes)).toBe(false);
  });

  it('variável só no cabeçalho não conta como variável do corpo', () => {
    const componentes = [
      { type: 'HEADER', format: 'TEXT', text: 'Oi {{1}}' },
      { type: 'BODY', text: 'Sem variáveis' },
    ];
    expect(corpoTemVariaveis(componentes)).toBe(false);
  });

  it('devolve null quando o corpo não foi sincronizado', () => {
    expect(corpoTemVariaveis(null)).toBeNull();
    expect(corpoTemVariaveis([])).toBeNull();
    expect(corpoTemVariaveis([{ type: 'HEADER', format: 'IMAGE' }])).toBeNull();
    expect(corpoTemVariaveis('texto')).toBeNull();
  });
});
