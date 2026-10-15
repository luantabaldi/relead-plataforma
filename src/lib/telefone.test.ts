import { chaveTelefone, normalizeTelefone } from './telefone';

describe('normalizeTelefone', () => {
  it('mantém só dígitos e acrescenta 55 quando vem apenas DDD + número', () => {
    expect(normalizeTelefone('(48) 99999-9999')).toBe('5548999999999');
    expect(normalizeTelefone('48 3333-4444')).toBe('554833334444');
  });

  it('não duplica o 55', () => {
    expect(normalizeTelefone('+55 48 99999-9999')).toBe('5548999999999');
  });
});

describe('chaveTelefone', () => {
  it('trata com e sem 55, com e sem máscara, como o mesmo telefone', () => {
    const chave = chaveTelefone('5548999999999');
    expect(chaveTelefone('48999999999')).toBe(chave);
    expect(chaveTelefone('(48) 99999-9999')).toBe(chave);
    expect(chaveTelefone('+55 48 99999-9999')).toBe(chave);
  });

  it('ignora o 9º dígito', () => {
    expect(chaveTelefone('554899999999')).toBe(chaveTelefone('5548999999999'));
  });

  it('diferencia telefones de fato diferentes', () => {
    expect(chaveTelefone('5548999999999')).not.toBe(chaveTelefone('5548988887777'));
    expect(chaveTelefone('5548999999999')).not.toBe(chaveTelefone('5511999999999'));
  });
});
