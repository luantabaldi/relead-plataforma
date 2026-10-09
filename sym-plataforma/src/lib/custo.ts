export interface Tarifa {
  categoria: string
  preco_usd: number
}

export interface CustoEstimado {
  categoria: string
  precoUnitarioUsd: number
  totalUsd: number
  /** null quando a cotação do dólar está indisponível */
  totalBrl: number | null
  leads: number
}

/** Calcula o custo estimado de um disparo: leads × tarifa da categoria do template. */
export function estimarCusto(
  leads: number,
  categoriaTemplate: string | null | undefined,
  tarifas: Tarifa[],
  usdBrl: number | null
): CustoEstimado | null {
  if (!categoriaTemplate || leads <= 0) return null
  const categoria = categoriaTemplate.toLowerCase()
  const tarifa = tarifas.find((t) => t.categoria === categoria)
  if (!tarifa) return null
  const totalUsd = leads * tarifa.preco_usd
  return {
    categoria,
    precoUnitarioUsd: tarifa.preco_usd,
    totalUsd,
    totalBrl: usdBrl ? totalUsd * usdBrl : null,
    leads,
  }
}

export function formatBrl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatUsd(v: number, digits = 2): string {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
