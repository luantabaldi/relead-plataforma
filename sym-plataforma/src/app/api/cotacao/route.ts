import { NextResponse } from 'next/server'

const TTL_MS = 60 * 60 * 1000
let cache: { usdBrl: number; atualizadoEm: string; at: number } | null = null

/** Cotação USD→BRL para exibir o custo estimado em reais. Cache de 1h em memória. */
export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ usd_brl: cache.usdBrl, atualizado_em: cache.atualizadoEm, fonte: 'cache' })
  }

  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const json = await res.json()
      const bid = parseFloat(json?.USDBRL?.bid)
      if (Number.isFinite(bid) && bid > 0) {
        cache = { usdBrl: bid, atualizadoEm: new Date().toISOString(), at: Date.now() }
        return NextResponse.json({ usd_brl: bid, atualizado_em: cache.atualizadoEm, fonte: 'awesomeapi' })
      }
    }
  } catch {
    // cai no fallback abaixo
  }

  const fallback = parseFloat(process.env.USD_BRL_FALLBACK ?? '')
  if (Number.isFinite(fallback) && fallback > 0) {
    return NextResponse.json({ usd_brl: fallback, atualizado_em: null, fonte: 'fallback' })
  }
  return NextResponse.json({ usd_brl: null, atualizado_em: null, fonte: 'indisponivel' })
}
