import { nomesDeCampanhasComStatus, resumirCampanha } from './resumoCampanhas';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { from: jest.fn() } }));

type Row = { id: number; nome_campanha: string; status_reativacao: string; tipo_campanha?: string };

/** Query builder em memória: aplica .eq/.in/.order/.range/.limit e entrega ao ser aguardado. */
function tabela(rows: Row[]) {
  return () => {
    let data = rows.slice();
    let head = false;
    let count: number | undefined;
    let range: [number, number] | null = null;
    let limit: number | null = null;
    let single = false;
    const b: any = {
      select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
        head = !!opts?.head;
        if (opts?.count) count = -1;
        return b;
      },
      eq: (col: keyof Row, v: unknown) => { data = data.filter((r) => r[col] === v); return b; },
      in: (col: keyof Row, vs: unknown[]) => { data = data.filter((r) => vs.includes(r[col])); return b; },
      order: () => b,
      range: (from: number, to: number) => { range = [from, to]; return b; },
      limit: (n: number) => { limit = n; return b; },
      maybeSingle: () => { single = true; return b; },
      then: (resolve: any, reject: any) => {
        let out: any = data;
        if (range) out = out.slice(range[0], range[1] + 1);
        if (limit !== null) out = out.slice(0, limit);
        const result: any = head
          ? { data: null, count: data.length, error: null }
          : { data: single ? (out[0] ?? null) : out, count: count !== undefined ? data.length : null, error: null };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return b;
  };
}

const monta = (n: number, nome: string, status: string, tipo = 'prospeccao', inicio = 1): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: inicio + i, nome_campanha: nome, status_reativacao: status, tipo_campanha: tipo }));

describe('resumirCampanha', () => {
  it('não conta pausados nem cancelados como enviados (o 511 do painel)', async () => {
    const rows = [
      ...monta(7, 'Convite', 'Enviado', 'prospeccao', 1),
      ...monta(480, 'Convite', 'Pausado', 'prospeccao', 100),
      ...monta(300, 'Convite', 'Pendente', 'prospeccao', 1000),
      ...monta(2, 'Convite', 'Erro no Disparo', 'prospeccao', 2000),
      ...monta(50, 'Convite', 'Cancelado', 'prospeccao', 3000),
      ...monta(9, 'Outra', 'Enviado', 'reativacao', 4000),
    ];
    (supabase.from as jest.Mock).mockImplementation(tabela(rows));

    const r = await resumirCampanha('Convite');

    expect(r.enviado).toBe(7);
    expect(r.pausado).toBe(480);
    expect(r.pendente).toBe(300);
    expect(r.erro).toBe(2);
    expect(r.cancelado).toBe(50);
    expect(r.total).toBe(7 + 480 + 300 + 2); // cancelados fora do total
    expect(r.tipo_campanha).toBe('prospeccao');
  });

  it('conta além de 1.000 linhas (consultas de contagem, não leitura em memória)', async () => {
    const rows = [...monta(1500, 'Grande', 'Pendente'), ...monta(900, 'Grande', 'Enviado', 'prospeccao', 5000)];
    (supabase.from as jest.Mock).mockImplementation(tabela(rows));

    const r = await resumirCampanha('Grande');

    expect(r.pendente).toBe(1500);
    expect(r.enviado).toBe(900);
    expect(r.total).toBe(2400);
  });
});

describe('nomesDeCampanhasComStatus', () => {
  it('encontra campanhas que ficam depois das primeiras 1.000 linhas', async () => {
    // 1.200 pendentes da campanha A vêm antes da única pendente da B: sem paginar, B some.
    const rows = [...monta(1200, 'A', 'Pendente'), ...monta(1, 'B', 'Pendente', 'reativacao', 5000)];
    (supabase.from as jest.Mock).mockImplementation(tabela(rows));

    const nomes = await nomesDeCampanhasComStatus('Pendente');

    expect(nomes.sort()).toEqual(['A', 'B']);
  });

  it('devolve vazio quando não há leads com o status', async () => {
    (supabase.from as jest.Mock).mockImplementation(tabela(monta(3, 'A', 'Enviado')));
    expect(await nomesDeCampanhasComStatus('Pausado')).toEqual([]);
  });
});
