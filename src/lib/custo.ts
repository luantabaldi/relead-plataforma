export interface Tarifa {
  categoria: string;
  preco_usd: number;
}

export interface CustoPorTarifa {
  categoria: string;
  precoUnitarioUsd: number;
  totalUsd: number;
  leads: number;
}

/** Custo estimado do disparo: leads × tarifa da categoria do template (Meta, Brasil). */
export function estimarCustoPorTarifa(
  leads: number,
  categoriaTemplate: string | null | undefined,
  tarifas: Tarifa[]
): CustoPorTarifa | null {
  if (!categoriaTemplate || leads <= 0) return null;
  const categoria = categoriaTemplate.toLowerCase();
  const tarifa = tarifas.find((t) => t.categoria === categoria);
  if (!tarifa) return null;
  return {
    categoria,
    precoUnitarioUsd: tarifa.preco_usd,
    totalUsd: leads * tarifa.preco_usd,
    leads,
  };
}

export function formatBrl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatUsd(v: number, digits = 2): string {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
