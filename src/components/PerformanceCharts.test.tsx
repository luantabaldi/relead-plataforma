import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { niceScale, CampanhasTable, StatusDonutChart } from './PerformanceCharts';

const conv = (nome: string, status: string) => ({
  dispatch: { tipo_campanha: 'prospeccao', status, timestamp_envio: new Date(), nome_campanha: nome },
});

describe('niceScale', () => {
  it('usa passos redondos', () => {
    expect(niceScale(799).ticks).toEqual([0, 200, 400, 600, 800]);
    expect(niceScale(0).ticks[0]).toBe(0);
    expect(niceScale(7).max).toBeGreaterThanOrEqual(7);
  });
});

describe('CampanhasTable', () => {
  it('agrupa por campanha, calcula a taxa e ordena ao clicar', () => {
    const data = [
      conv('A', 'enviado'), conv('A', 'respondido'),
      conv('B', 'interessado'), conv('B', 'interessado'), conv('B', 'enviado'),
      conv('C', 'enviado'),
    ];
    render(<CampanhasTable conversations={data} />);
    const rows = () => screen.getAllByRole('row').slice(1).map((r) => r.textContent || '');
    expect(rows()[0]).toContain('B'); // mais disparados primeiro
    expect(rows()[0]).toContain('67%');
    fireEvent.click(screen.getByRole('button', { name: /Campanha/ }));
    expect(rows()[0]).toContain('A');
  });
});

describe('StatusDonutChart', () => {
  it('mostra quantidade e percentual por status', () => {
    render(<StatusDonutChart conversations={[conv('A', 'enviado'), conv('A', 'interessado'), conv('A', 'interessado'), conv('A', 'erro')]} />);
    expect(screen.getByText('Interessado')).toBeTruthy();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
  });
});
