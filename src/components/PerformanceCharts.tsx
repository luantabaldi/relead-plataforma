import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * Gráficos da aba Performance (SVG próprio, sem biblioteca — mesmas classes e paleta do
 * restante do app). Cada dado é um "disparo" já deduplicado por telefone.
 */

export interface PerformanceDispatch {
  tipo_campanha: string;
  status: string;
  timestamp_envio: Date;
  nome_campanha?: string;
  motivo_objecao?: string;
  tipo_erro?: string;
}

export interface PerformanceConversation {
  dispatch: PerformanceDispatch;
}

/** Status que contam como "respondeu" (inclui quem demonstrou ou não interesse). */
const RESPONDERAM = ['respondido', 'interessado', 'sem_interesse'];

const fmt = (n: number) => n.toLocaleString('pt-BR');
const pct = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : 0);

/* ── utilitários ─────────────────────────────────────────────────────────── */

/**
 * Escala "redonda" para o eixo Y: passos de 1, 2, 5 ou 10 × potência de 10.
 * Ex.: máximo 799 → 0, 200, 400, 600, 800 (e não 0, 200, 400, 599, 799).
 */
export function niceScale(maxValue: number, targetTicks = 4): { step: number; max: number; ticks: number[] } {
  const max = Math.max(1, Math.ceil(maxValue));
  const rawStep = max / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = Math.max(1, nice * magnitude);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { step, max: top, ticks };
}

/** Chave yyyy-mm-dd no fuso local (toISOString usa UTC e empurra envios da noite para o dia seguinte). */
export function dayKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Largura real do contêiner (o SVG ocupa o cartão e as fontes mantêm o tamanho). */
export function useElementWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = Math.round(el.clientWidth);
      if (w > 0) setWidth(Math.max(280, w));
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

const cardStyle: React.CSSProperties = { padding: '16px 20px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' };
const titleStyle: React.CSSProperties = { fontSize: 16, margin: 0, color: 'var(--navy-700)' };

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ flex: 1, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-100)', fontSize: 13 }}>
    {children}
  </div>
);

/* ── 1. Disparos por dia (barras) ────────────────────────────────────────── */

interface DisparosPorDiaProps {
  conversations: PerformanceConversation[];
  dataInicio: Date;
  dataFim: Date;
}

export const DisparosPorDiaChart: React.FC<DisparosPorDiaProps> = ({ conversations, dataInicio, dataFim }) => {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>(640);
  const [modo, setModo] = useState<'todos' | 'ativos'>('todos');
  const [hover, setHover] = useState<number | null>(null);

  const dias = useMemo(() => {
    const contagem = new Map<string, number>();
    const chaves: string[] = [];
    const cur = new Date(dataInicio);
    cur.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(0, 0, 0, 0);
    while (cur <= fim && chaves.length < 400) {
      const k = dayKey(cur);
      chaves.push(k);
      contagem.set(k, 0);
      cur.setDate(cur.getDate() + 1);
    }
    conversations.forEach((c) => {
      const t = c.dispatch.timestamp_envio;
      if (!(t instanceof Date) || isNaN(t.getTime())) return;
      const k = dayKey(t);
      if (contagem.has(k)) contagem.set(k, (contagem.get(k) as number) + 1);
    });
    return chaves.map((k) => ({ key: k, valor: contagem.get(k) as number }));
  }, [conversations, dataInicio, dataFim]);

  const ativos = dias.filter((d) => d.valor > 0);
  const total = ativos.reduce((s, d) => s + d.valor, 0);
  const pico = ativos.reduce<{ key: string; valor: number } | null>((m, d) => (!m || d.valor > m.valor ? d : m), null);
  // Em períodos longos com poucos dias de disparo, o eixo "todos os dias" fica quase vazio:
  // o modo "só dias com disparo" junta as barras (e avisa quantos dias foram omitidos).
  const podeAlternar = dias.length > 7 && ativos.length > 0 && ativos.length < dias.length;
  const compacto = modo === 'ativos' && podeAlternar;
  const serie = compacto ? ativos : dias;

  const { max: topo, ticks } = niceScale(Math.max(1, ...serie.map((d) => d.valor)));

  const height = 170;
  const padL = 40;
  const padR = 8;
  const padT = 16;
  const padB = 24;
  const chartW = Math.max(60, width - padL - padR);
  const chartH = height - padT - padB;
  const baseY = height - padB;
  const slot = chartW / Math.max(1, serie.length);
  const barW = Math.max(3, Math.min(compacto ? 44 : 30, slot * 0.62));
  const maxLabels = Math.max(3, Math.floor(chartW / 56));
  const labelEvery = Math.max(1, Math.ceil(serie.length / maxLabels));

  const labelData = (key: string) => {
    const [, m, d] = key.split('-');
    return `${d}/${m}`;
  };

  return (
    <div className="card" style={{ ...cardStyle, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h4 className="t-serif" style={titleStyle}>Disparos por dia</h4>
          {total > 0 && (
            <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
              {fmt(total)} envios em {ativos.length} dia{ativos.length !== 1 ? 's' : ''} com disparo
              {pico ? ` · pico de ${fmt(pico.valor)} em ${labelData(pico.key)}` : ''}
            </span>
          )}
        </div>

        {podeAlternar && (
          <div role="group" aria-label="Dias exibidos" style={{ display: 'inline-flex', background: 'var(--paper-100)', borderRadius: 8, padding: 2, gap: 2 }}>
            {([['todos', 'Todos os dias'], ['ativos', 'Só dias com disparo']] as const).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={modo === valor}
                onClick={() => setModo(valor)}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600,
                  background: modo === valor ? 'var(--paper-0, #fff)' : 'transparent',
                  color: modo === valor ? 'var(--navy-700)' : 'var(--ink-100)',
                  boxShadow: modo === valor ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {total === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : (
        <>
          <div ref={wrapRef} style={{ position: 'relative', width: '100%', height }}>
            <svg width={width} height={height} role="img" aria-label="Disparos por dia" style={{ display: 'block', overflow: 'visible' }}>
              {ticks.map((t) => {
                const y = baseY - (t / topo) * chartH;
                return (
                  <g key={t}>
                    <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="var(--paper-200)" strokeDasharray={t === 0 ? undefined : '3 3'} />
                    <text x={padL - 8} y={y + 3} textAnchor="end" className="t-mono" fontSize="9" fill="var(--ink-50)">
                      {fmt(t)}
                    </text>
                  </g>
                );
              })}

              {serie.map((d, i) => {
                const x = padL + slot * i + (slot - barW) / 2;
                const h = d.valor > 0 ? Math.max(2, (d.valor / topo) * chartH) : 0;
                const destaque = hover === i;
                const mostraValor = d.valor > 0 && (barW >= 16 || (pico && d.key === pico.key) || destaque);
                const mostraData = i % labelEvery === 0 || i === serie.length - 1;
                return (
                  <g key={d.key}>
                    {d.valor > 0 ? (
                      <rect
                        x={x}
                        y={baseY - h}
                        width={barW}
                        height={h}
                        rx={Math.min(4, barW / 2)}
                        fill="var(--chart-line)"
                        opacity={hover === null || destaque ? 1 : 0.55}
                      />
                    ) : (
                      // dia sem disparo: marca fina na linha de base, em vez de um buraco no gráfico
                      <rect x={x} y={baseY - 2} width={barW} height={2} rx={1} fill="var(--paper-200)" />
                    )}
                    {mostraValor && (
                      <text x={x + barW / 2} y={baseY - h - 4} textAnchor="middle" className="t-mono" fontSize="9" fill="var(--ink-200)">
                        {fmt(d.valor)}
                      </text>
                    )}
                    {mostraData && (
                      <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="t-mono" fontSize="9" fill="var(--ink-50)">
                        {labelData(d.key)}
                      </text>
                    )}
                    {/* área de passagem do mouse: a faixa inteira do dia */}
                    <rect
                      x={padL + slot * i}
                      y={padT}
                      width={slot}
                      height={chartH}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <title>{`${labelData(d.key)}: ${fmt(d.valor)} envio${d.valor !== 1 ? 's' : ''}`}</title>
                    </rect>
                  </g>
                );
              })}
            </svg>

            {hover !== null && serie[hover] && (
              <div
                style={{
                  position: 'absolute',
                  left: Math.min(Math.max(padL + slot * hover + slot / 2, 50), width - 50),
                  top: 0,
                  transform: 'translateX(-50%)',
                  background: 'var(--chart-line)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                {labelData(serie[hover].key)}: {fmt(serie[hover].valor)} envio{serie[hover].valor !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {compacto && (
            <div className="t-caption" style={{ marginTop: 4 }}>
              {dias.length - ativos.length} dia{dias.length - ativos.length !== 1 ? 's' : ''} sem disparo omitido{dias.length - ativos.length !== 1 ? 's' : ''} neste modo.
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── 2. Distribuição por status (anel + legenda) ─────────────────────────── */

const STATUS_ORDEM = ['enviado', 'respondido', 'interessado', 'sem_interesse', 'pausado', 'erro'] as const;

const STATUS_ROTULO: Record<string, string> = {
  enviado: 'Enviado (aguardando)',
  respondido: 'Respondido',
  interessado: 'Interessado',
  sem_interesse: 'Sem interesse',
  pausado: 'Pausado',
  erro: 'Erro',
};

const STATUS_COR: Record<string, string> = {
  enviado: 'var(--chart-status-enviado)',
  respondido: 'var(--chart-status-respondido)',
  interessado: 'var(--chart-status-interessado)',
  sem_interesse: 'var(--chart-status-sem-interesse)',
  pausado: 'var(--chart-status-pausado)',
  erro: 'var(--chart-status-erro)',
};

export const StatusDonutChart: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const [hover, setHover] = useState<string | null>(null);

  const counts: Record<string, number> = {};
  STATUS_ORDEM.forEach((s) => (counts[s] = 0));
  conversations.forEach((c) => {
    if (counts[c.dispatch.status] !== undefined) counts[c.dispatch.status]++;
  });

  const total = STATUS_ORDEM.reduce((s, k) => s + counts[k], 0);
  const respondentes = RESPONDERAM.reduce((s, k) => s + counts[k], 0);
  const segmentos = STATUS_ORDEM.filter((k) => counts[k] > 0);

  // O anel usa pathLength=100: cada fatia é um traço "pct de 100" deslocado pelo acumulado.
  let acumulado = 0;
  const arcos = segmentos.map((k) => {
    const parte = (counts[k] / total) * 100;
    const arco = { key: k, parte, inicio: acumulado };
    acumulado += parte;
    return arco;
  });

  const ativo = hover && counts[hover] !== undefined ? hover : null;

  return (
    <div className="card" style={cardStyle}>
      <h4 className="t-serif" style={{ ...titleStyle, marginBottom: 12 }}>Distribuição por status</h4>

      {total === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
            <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Distribuição por status">
              <circle cx="70" cy="70" r="52" fill="none" stroke="var(--paper-100)" strokeWidth="20" />
              {arcos.map((a) => (
                <circle
                  key={a.key}
                  cx="70"
                  cy="70"
                  r="52"
                  fill="none"
                  stroke={STATUS_COR[a.key]}
                  strokeWidth={ativo === a.key ? 24 : 20}
                  pathLength={100}
                  strokeDasharray={`${Math.max(0, a.parte - (arcos.length > 1 ? 0.6 : 0))} ${100 - Math.max(0, a.parte - (arcos.length > 1 ? 0.6 : 0))}`}
                  strokeDashoffset={-a.inicio}
                  transform="rotate(-90 70 70)"
                  opacity={ativo === null || ativo === a.key ? 1 : 0.35}
                  style={{ transition: 'stroke-width 0.15s ease, opacity 0.15s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHover(a.key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{`${STATUS_ROTULO[a.key]}: ${fmt(counts[a.key])} (${pct(counts[a.key], total)}%)`}</title>
                </circle>
              ))}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span className="t-mono tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-300)' }}>
                {fmt(ativo ? counts[ativo] : total)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--ink-50)', textAlign: 'center', maxWidth: 84, lineHeight: 1.2 }}>
                {ativo ? `${STATUS_ROTULO[ativo]} · ${pct(counts[ativo], total)}%` : 'disparos'}
              </span>
            </div>
          </div>

          <table style={{ flex: 1, minWidth: 220, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'var(--ink-50)', textAlign: 'right' }}>
                <th scope="col" style={{ textAlign: 'left', fontWeight: 500, fontSize: 10, paddingBottom: 6 }}>Status</th>
                <th scope="col" style={{ fontWeight: 500, fontSize: 10, paddingBottom: 6 }}>Qtd</th>
                <th scope="col" style={{ fontWeight: 500, fontSize: 10, paddingBottom: 6 }} title="Percentual sobre todos os disparos">% total</th>
                <th scope="col" style={{ fontWeight: 500, fontSize: 10, paddingBottom: 6 }} title="Percentual sobre quem respondeu">% resp.</th>
              </tr>
            </thead>
            <tbody>
              {segmentos.map((k) => {
                const respondeu = RESPONDERAM.includes(k);
                return (
                  <tr
                    key={k}
                    onMouseEnter={() => setHover(k)}
                    onMouseLeave={() => setHover(null)}
                    style={{ background: ativo === k ? 'var(--paper-50)' : 'transparent', cursor: 'default' }}
                  >
                    <td style={{ padding: '5px 0', textAlign: 'left', color: 'var(--ink-200)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_COR[k], marginRight: 8 }} />
                      {STATUS_ROTULO[k]}
                    </td>
                    <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-200)' }}>{fmt(counts[k])}</td>
                    <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-50)' }}>{pct(counts[k], total)}%</td>
                    <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-50)' }}>
                      {respondeu ? `${pct(counts[k], respondentes)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── 3. Funil de conversão (etapas, conversão e perda) ───────────────────── */

export const FunnelConversaoChart: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const disparados = conversations.length;
  const responderam = conversations.filter((c) => RESPONDERAM.includes(c.dispatch.status)).length;
  const interessados = conversations.filter((c) => c.dispatch.status === 'interessado').length;

  // Cada etapa mostra o que o anel de status não mostra: a conversão sobre a etapa anterior e
  // quanto se perdeu no caminho. Largura proporcional ao total disparado (piso para não sumir).
  const etapas = [
    { label: 'Disparados', count: disparados, anterior: null as number | null, cor: 'var(--chart-funnel-1)' },
    { label: 'Responderam', count: responderam, anterior: disparados, cor: 'var(--chart-funnel-2)' },
    { label: 'Interessados', count: interessados, anterior: responderam, cor: 'var(--chart-funnel-3)' },
  ];

  return (
    <div className="card" style={cardStyle}>
      <h4 className="t-serif" style={{ ...titleStyle, marginBottom: 12 }}>Funil de conversão</h4>

      {disparados === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {etapas.map((e) => {
            const largura = Math.max(3, pct(e.count, disparados));
            const conv = e.anterior === null ? null : pct(e.count, e.anterior);
            const perda = e.anterior === null ? null : e.anterior - e.count;
            return (
              <div key={e.label}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-300)' }}>
                    {e.label} <span className="t-mono tnum" style={{ fontWeight: 700, color: 'var(--ink-200)' }}>{fmt(e.count)}</span>
                  </span>
                  <span className="t-mono" style={{ fontSize: 10, color: 'var(--ink-50)' }}>
                    {conv === null
                      ? '100%'
                      : `${conv}% da etapa anterior · −${fmt(perda as number)}`}
                  </span>
                </div>
                <div style={{ height: 16, background: 'var(--paper-100)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${largura}%`, height: '100%', background: e.cor, borderRadius: 8, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── 4. Taxa de resposta por campanha (tabela ordenável) ─────────────────── */

type ColunaCampanha = 'campanha' | 'disparados' | 'respostas' | 'interessados' | 'taxa';

interface LinhaCampanha {
  campanha: string;
  tipo: string;
  disparados: number;
  respostas: number;
  interessados: number;
  taxa: number;
}

const TIPO_ROTULO: Record<string, string> = { prospeccao: 'Prospecção', reativacao: 'Reativação' };

export const CampanhasTable: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const [ordem, setOrdem] = useState<{ col: ColunaCampanha; dir: 'asc' | 'desc' }>({ col: 'disparados', dir: 'desc' });

  const linhas = useMemo(() => {
    const mapa = new Map<string, LinhaCampanha>();
    conversations.forEach((c) => {
      const nome = (c.dispatch.nome_campanha || '').trim() || '(sem nome)';
      if (!mapa.has(nome)) {
        mapa.set(nome, { campanha: nome, tipo: c.dispatch.tipo_campanha, disparados: 0, respostas: 0, interessados: 0, taxa: 0 });
      }
      const l = mapa.get(nome) as LinhaCampanha;
      l.disparados++;
      if (RESPONDERAM.includes(c.dispatch.status)) l.respostas++;
      if (c.dispatch.status === 'interessado') l.interessados++;
    });
    const lista = Array.from(mapa.values());
    lista.forEach((l) => (l.taxa = l.disparados ? (l.respostas / l.disparados) * 100 : 0));
    return lista;
  }, [conversations]);

  const ordenadas = useMemo(() => {
    const f = ordem.dir === 'asc' ? 1 : -1;
    return [...linhas].sort((a, b) => {
      if (ordem.col === 'campanha') return f * a.campanha.localeCompare(b.campanha, 'pt-BR');
      const diff = (a[ordem.col] as number) - (b[ordem.col] as number);
      return diff !== 0 ? f * diff : a.campanha.localeCompare(b.campanha, 'pt-BR');
    });
  }, [linhas, ordem]);

  const alternar = (col: ColunaCampanha) =>
    setOrdem((o) => (o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: col === 'campanha' ? 'asc' : 'desc' }));

  const colunas: Array<{ col: ColunaCampanha; rotulo: string; alinhar: 'left' | 'right' }> = [
    { col: 'campanha', rotulo: 'Campanha', alinhar: 'left' },
    { col: 'disparados', rotulo: 'Disparados', alinhar: 'right' },
    { col: 'respostas', rotulo: 'Respostas', alinhar: 'right' },
    { col: 'interessados', rotulo: 'Interessados', alinhar: 'right' },
    { col: 'taxa', rotulo: 'Taxa (%)', alinhar: 'right' },
  ];

  return (
    <div className="card" style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <h4 className="t-serif" style={titleStyle}>Taxa de resposta por campanha</h4>
        {linhas.length > 0 && (
          <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
            {linhas.length} campanha{linhas.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {linhas.length === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : (
        // Altura limitada com cabeçalho fixo: continua legível com dezenas de campanhas.
        <div className="thin-scroll" style={{ maxHeight: 240, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {colunas.map((c) => {
                  const ativa = ordem.col === c.col;
                  return (
                    <th
                      key={c.col}
                      scope="col"
                      aria-sort={ativa ? (ordem.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      style={{
                        position: 'sticky', top: 0, background: 'var(--paper-0, #fff)', zIndex: 1,
                        textAlign: c.alinhar, padding: '0 0 6px', fontWeight: 600, fontSize: 10,
                        borderBottom: '1px solid var(--paper-200)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => alternar(c.col)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit',
                          color: ativa ? 'var(--navy-700)' : 'var(--ink-50)',
                        }}
                      >
                        {c.rotulo}
                        <span aria-hidden="true">{ativa ? (ordem.dir === 'asc' ? ' ↑' : ' ↓') : ''}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((l) => (
                <tr key={l.campanha} style={{ borderBottom: '1px solid var(--paper-100)' }}>
                  <td style={{ padding: '7px 8px 7px 0', maxWidth: 200 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.campanha}>
                      {l.campanha}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-50)' }}>{TIPO_ROTULO[l.tipo] ?? l.tipo}</div>
                  </td>
                  <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-200)' }}>{fmt(l.disparados)}</td>
                  <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-200)' }}>{fmt(l.respostas)}</td>
                  <td className="t-mono tnum" style={{ textAlign: 'right', color: 'var(--ink-200)' }}>{fmt(l.interessados)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: 36, height: 6, background: 'var(--paper-100)', borderRadius: 3, verticalAlign: 'middle', marginRight: 6, overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${Math.min(100, l.taxa)}%`, background: 'var(--chart-line)' }} />
                    </span>
                    <span className="t-mono tnum" style={{ color: 'var(--ink-200)', fontWeight: 600 }}>{Math.round(l.taxa)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── 5. Leads desqualificados + taxa de opt-out ──────────────────────────── */

const ehOptOut = (d: PerformanceDispatch) => /opt|remo[cç]/i.test(d.motivo_objecao || '');

export const DesqualificadosChart: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const total = conversations.length;
  const grupos = new Map<string, { label: string; count: number; cor: string }>();
  const soma = (k: string, label: string, cor: string) => {
    const g = grupos.get(k) || { label, count: 0, cor };
    g.count++;
    grupos.set(k, g);
  };

  conversations.forEach(({ dispatch: d }) => {
    if (ehOptOut(d)) soma('optout', 'Pediu para parar (opt-out)', 'var(--chart-status-erro)');
    else if (d.status === 'sem_interesse') soma('sem', 'Sem interesse', 'var(--chart-status-sem-interesse)');
    else if (d.status === 'erro') soma(`erro:${d.tipo_erro || ''}`, d.tipo_erro || 'Erro no disparo', 'var(--chart-status-pausado)');
  });

  const linhas = Array.from(grupos.values()).sort((a, b) => b.count - a.count);
  const desq = linhas.reduce((s, l) => s + l.count, 0);

  return (
    <div className="card" style={cardStyle}>
      <h4 className="t-serif" style={{ ...titleStyle, marginBottom: 12 }}>Leads desqualificados</h4>
      {total === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : linhas.length === 0 ? (
        <EmptyState>Nenhum lead desqualificado no período</EmptyState>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {linhas.map((l) => (
              <div key={l.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink-300)' }}>{l.label}</span>
                  <span className="t-mono tnum" style={{ color: 'var(--ink-200)' }}>
                    {fmt(l.count)} <span style={{ color: 'var(--ink-50)' }}>· {pct(l.count, desq)}%</span>
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--paper-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(2, pct(l.count, desq))}%`, height: '100%', background: l.cor }} />
                </div>
              </div>
            ))}
          </div>
          <p className="t-caption" style={{ margin: '12px 0 0' }}>
            {fmt(desq)} de {fmt(total)} disparos ({pct(desq, total)}%). Número inexistente e caixa postal/secretária
            ainda não são registrados separadamente — entram em "Erro no disparo".
          </p>
        </>
      )}
    </div>
  );
};

export const OptOutRateCard: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const total = conversations.length;
  const optouts = conversations.filter((c) => ehOptOut(c.dispatch)).length;
  const taxa = total ? (optouts / total) * 100 : 0;

  return (
    <div className="card" style={cardStyle}>
      <h4 className="t-serif" style={{ ...titleStyle, marginBottom: 12 }}>Taxa de opt-out</h4>
      {total === 0 ? (
        <EmptyState>Sem disparos no período selecionado</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="t-mono tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink-300)', lineHeight: 1 }}>
            {taxa.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
          <span className="t-caption">
            {fmt(optouts)} pedido{optouts !== 1 ? 's' : ''} de descadastro em {fmt(total)} disparos
          </span>
          <span className="t-caption" style={{ color: taxa > 2 ? 'var(--chart-status-erro)' : 'var(--ink-50)' }}>
            {taxa > 2 ? 'Acima de 2%: revise a mensagem e a segmentação.' : 'Dentro do patamar saudável (até 2%).'}
          </span>
        </div>
      )}
    </div>
  );
};

/* ── 6. Melhor dia e horário (heatmap de taxa de resposta) ───────────────── */

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const AMOSTRA_MINIMA = 5;
const hh = (h: number) => `${String(h).padStart(2, '0')}h`;

export const HeatmapChart: React.FC<{ conversations: PerformanceConversation[] }> = ({ conversations }) => {
  const [hover, setHover] = useState<{ dia: number; hora: number } | null>(null);

  const { celulas, horas, melhor, maxTaxa } = useMemo(() => {
    const c = new Map<string, { n: number; r: number }>();
    let hMin = 23;
    let hMax = 0;
    conversations.forEach(({ dispatch: d }) => {
      const t = d.timestamp_envio;
      if (!(t instanceof Date) || isNaN(t.getTime())) return;
      if (d.status === 'pausado' || d.status === 'erro') return; // nunca chegaram ao lead
      const k = `${t.getDay()}-${t.getHours()}`;
      const cell = c.get(k) || { n: 0, r: 0 };
      cell.n++;
      if (RESPONDERAM.includes(d.status)) cell.r++;
      c.set(k, cell);
      hMin = Math.min(hMin, t.getHours());
      hMax = Math.max(hMax, t.getHours());
    });
    let best: { dia: number; hora: number; taxa: number; n: number } | null = null;
    let max = 0;
    c.forEach((v, k) => {
      const [dia, hora] = k.split('-').map(Number);
      const taxa = v.r / v.n;
      if (v.n >= AMOSTRA_MINIMA) {
        max = Math.max(max, taxa);
        if (!best || taxa > best.taxa) best = { dia, hora, taxa, n: v.n };
      }
    });
    const hs: number[] = [];
    if (c.size > 0) for (let h = hMin; h <= hMax; h++) hs.push(h);
    return { celulas: c, horas: hs, melhor: best as { dia: number; hora: number; taxa: number; n: number } | null, maxTaxa: max };
  }, [conversations]);

  const ativa = hover ? celulas.get(`${hover.dia}-${hover.hora}`) : null;

  return (
    <div className="card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h4 className="t-serif" style={titleStyle}>Melhor dia e horário para disparar</h4>
        <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
          {hover
            ? `${DIAS_SEMANA[hover.dia]} ${hh(hover.hora)}: ${ativa ? `${fmt(ativa.n)} envios · ${pct(ativa.r, ativa.n)}% responderam` : 'sem envios'}`
            : melhor
              ? `Melhor: ${DIAS_SEMANA[melhor.dia]} às ${hh(melhor.hora)} · ${Math.round(melhor.taxa * 100)}% (${fmt(melhor.n)} envios)`
              : `Células com menos de ${AMOSTRA_MINIMA} envios ficam apagadas`}
        </span>
      </div>

      {horas.length === 0 ? (
        <EmptyState>Sem disparos entregues no período selecionado</EmptyState>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, width: '100%', fontSize: 10 }}>
            <thead>
              <tr>
                <th />
                {horas.map((h) => (
                  <th key={h} className="t-mono" style={{ fontWeight: 500, color: 'var(--ink-50)' }}>{hh(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((nome, dia) => (
                <tr key={nome}>
                  <th scope="row" className="t-mono" style={{ fontWeight: 500, color: 'var(--ink-50)', textAlign: 'left', paddingRight: 6 }}>{nome}</th>
                  {horas.map((h) => {
                    const cell = celulas.get(`${dia}-${h}`);
                    const valida = !!cell && cell.n >= AMOSTRA_MINIMA;
                    const taxa = cell ? cell.r / cell.n : 0;
                    const intensidade = valida && maxTaxa > 0 ? taxa / maxTaxa : 0;
                    return (
                      <td
                        key={h}
                        title={cell ? `${nome} ${hh(h)}: ${cell.n} envios, ${pct(cell.r, cell.n)}% responderam${valida ? '' : ' (amostra pequena)'}` : `${nome} ${hh(h)}: sem envios`}
                        onMouseEnter={() => setHover({ dia, hora: h })}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          height: 22, minWidth: 22, borderRadius: 4, textAlign: 'center',
                          background: !cell
                            ? 'var(--paper-100)'
                            : valida
                              ? `color-mix(in srgb, var(--chart-funnel-3) ${Math.round(20 + intensidade * 80)}%, var(--paper-100))`
                              : 'var(--paper-200)',
                          color: intensidade > 0.6 ? '#fff' : 'var(--ink-200)',
                          opacity: cell && !valida ? 0.6 : 1,
                        }}
                      >
                        {valida ? `${Math.round(taxa * 100)}` : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="t-caption" style={{ margin: '8px 0 0' }}>
        Taxa de resposta (%) por dia da semana e hora do envio · só envios entregues · cor mais forte = melhor resposta.
      </p>
    </div>
  );
};
