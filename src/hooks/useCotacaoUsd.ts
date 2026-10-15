import { useEffect, useState } from 'react';

const CACHE_KEY = 'relead:cotacao-usd-brl';
const TTL_MS = 60 * 60 * 1000;

function readCache(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { v, at } = JSON.parse(raw);
    return typeof v === 'number' && Date.now() - at < TTL_MS ? v : null;
  } catch {
    return null;
  }
}

function fallbackFromEnv(): number | null {
  const v = parseFloat(process.env.REACT_APP_USD_BRL_FALLBACK || '');
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Cotação USD→BRL para mostrar o custo estimado em reais. Cache de 1h na sessão.
 * Se a API de câmbio cair, usa REACT_APP_USD_BRL_FALLBACK; sem ela, devolve null
 * e a tela mostra só o valor em dólar.
 */
export const useCotacaoUsd = (): number | null => {
  const [usdBrl, setUsdBrl] = useState<number | null>(() => readCache());

  useEffect(() => {
    if (usdBrl !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const bid = parseFloat(json?.USDBRL?.bid);
        if (!Number.isFinite(bid) || bid <= 0) throw new Error('cotação inválida');
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ v: bid, at: Date.now() }));
        } catch {
          /* sessionStorage indisponível: segue sem cache */
        }
        if (!cancelled) setUsdBrl(bid);
      } catch {
        if (!cancelled) setUsdBrl(fallbackFromEnv());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [usdBrl]);

  return usdBrl;
};
