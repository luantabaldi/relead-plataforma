import { estimarCustoPorTarifa, formatBrl, formatUsd } from './custo';
import { agentePadraoDoTipo, tipoCampanhaDoAgente } from './agentes';

const tarifas = [
  { categoria: 'marketing', preco_usd: 0.0625 },
  { categoria: 'utility', preco_usd: 0.0068 },
];

describe('estimarCustoPorTarifa', () => {
  it('multiplica leads pela tarifa da categoria (sem diferenciar maiúsculas)', () => {
    const c = estimarCustoPorTarifa(1000, 'MARKETING', tarifas)!;
    expect(c.totalUsd).toBeCloseTo(62.5, 6);
    expect(c.precoUnitarioUsd).toBe(0.0625);
    expect(c.categoria).toBe('marketing');
  });

  it('devolve null sem categoria, sem leads ou sem tarifa', () => {
    expect(estimarCustoPorTarifa(1000, null, tarifas)).toBeNull();
    expect(estimarCustoPorTarifa(0, 'MARKETING', tarifas)).toBeNull();
    expect(estimarCustoPorTarifa(10, 'AUTHENTICATION', tarifas)).toBeNull();
  });
});

describe('formatação', () => {
  it('formata real e dólar', () => {
    expect(formatBrl(343.75).replace(/\s/g, ' ')).toBe('R$ 343,75');
    expect(formatUsd(62.5)).toBe('$62.50');
    expect(formatUsd(0.0625, 4)).toBe('$0.0625');
  });
});

describe('agentes', () => {
  const agentes = [
    { slug: 'ana_paula', nome: 'Ana Paula', padrao: true },
    { slug: 'prospeccao', nome: 'Prospecção' },
  ];

  it('o agente de prospecção gera campanha de prospecção; os demais, reativação', () => {
    expect(tipoCampanhaDoAgente('prospeccao')).toBe('prospeccao');
    expect(tipoCampanhaDoAgente('ana_paula')).toBe('reativacao');
    expect(tipoCampanhaDoAgente('qualquer_outro')).toBe('reativacao');
  });

  it('sugere o agente padrão do tipo', () => {
    expect(agentePadraoDoTipo('reativacao', agentes)).toBe('ana_paula');
    expect(agentePadraoDoTipo('prospeccao', agentes)).toBe('prospeccao');
    expect(agentePadraoDoTipo('prospeccao', [])).toBe('');
  });
});
