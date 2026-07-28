import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MetaKpisPeriod {
  dataInicio: Date;
  dataFim: Date;
}

export interface NumeroSaude {
  quality_rating: string | null;
  messaging_limit_tier: string | null;
  status: string | null;
  numero_display: string | null;
  atualizado_em: string | null;
}

export interface TemplateKpi {
  id: string;
  nome: string;
  status_meta: string;
  categoria: string | null;
  quality_score: string | null;
  tipo: string;
  ultima_sincronizacao: string | null;
  disparosNoPeriodo: number;
  respondidos: number;
  reativados: number;
  custoEstimadoUsd: number;
}

export interface CustoPorDia {
  data: string;
  custo_usd: number;
}

interface UseMetaKpisState {
  numero: NumeroSaude | null;
  templates: TemplateKpi[];
  custoTotalUsd: number;
  custoPorDia: CustoPorDia[];
  totalRespondidos: number;
  totalReativados: number;
  custoPorResposta: number;
  custoPorReativacao: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Leads cujo status representa alguma resposta do lead (positiva ou negativa) — mesma definição usada em CampaignBarChart/FunnelChart. */
const isRespondido = (status: string | null): boolean =>
  ['Respondido', 'Reativado', 'Sem interesse'].includes((status || '').trim());

const isReativado = (status: string | null): boolean =>
  (status || '').trim() === 'Reativado';

export const useMetaKpis = (period: MetaKpisPeriod): UseMetaKpisState => {
  const [numero, setNumero] = useState<NumeroSaude | null>(null);
  const [templates, setTemplates] = useState<TemplateKpi[]>([]);
  const [custoTotalUsd, setCustoTotalUsd] = useState(0);
  const [custoPorDia, setCustoPorDia] = useState<CustoPorDia[]>([]);
  const [totalRespondidos, setTotalRespondidos] = useState(0);
  const [totalReativados, setTotalReativados] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dataInicioStr = period.dataInicio.toISOString().split('T')[0];
      const dataFimStr = period.dataFim.toISOString().split('T')[0];
      const dataInicioIso = period.dataInicio.toISOString();
      const dataFimIso = period.dataFim.toISOString();

      const [numeroResult, templatesResult, custosResult, disparosResult] = await Promise.all([
        supabase.from('numeros_whatsapp_status').select('*').limit(1).maybeSingle(),
        supabase.from('templates_wpp').select('*').order('nome', { ascending: true }),
        supabase
          .from('custos_conversas_meta')
          .select('*')
          .gte('data', dataInicioStr)
          .lte('data', dataFimStr),
        supabase
          .from('v_disparos_custo')
          .select('*')
          .gte('data_envio', dataInicioIso)
          .lte('data_envio', dataFimIso),
      ]);

      if (numeroResult.error) throw numeroResult.error;
      if (templatesResult.error) throw templatesResult.error;
      if (custosResult.error) throw custosResult.error;
      if (disparosResult.error) throw disparosResult.error;

      setNumero(numeroResult.data || null);

      const custos = custosResult.data || [];
      const totalUsd = custos.reduce((sum: number, c: any) => sum + Number(c.custo_usd || 0), 0);
      setCustoTotalUsd(totalUsd);

      const porDiaMap: Record<string, number> = {};
      custos.forEach((c: any) => {
        const dia = c.data;
        porDiaMap[dia] = (porDiaMap[dia] || 0) + Number(c.custo_usd || 0);
      });
      setCustoPorDia(
        Object.entries(porDiaMap)
          .map(([data, custo_usd]) => ({ data, custo_usd }))
          .sort((a, b) => a.data.localeCompare(b.data))
      );

      const disparos = disparosResult.data || [];
      const respondidos = disparos.filter((d: any) => isRespondido(d.status_reativacao)).length;
      const reativados = disparos.filter((d: any) => isReativado(d.status_reativacao)).length;
      setTotalRespondidos(respondidos);
      setTotalReativados(reativados);

      const templateStatsMap: Record<string, { disparos: number; respondidos: number; reativados: number; custo: number }> = {};
      disparos.forEach((d: any) => {
        if (!d.template_nome) return;
        if (!templateStatsMap[d.template_nome]) {
          templateStatsMap[d.template_nome] = { disparos: 0, respondidos: 0, reativados: 0, custo: 0 };
        }
        const stat = templateStatsMap[d.template_nome];
        stat.disparos += 1;
        if (isRespondido(d.status_reativacao)) stat.respondidos += 1;
        if (isReativado(d.status_reativacao)) stat.reativados += 1;
        stat.custo += Number(d.custo_estimado_usd || 0);
      });

      const templatesData: TemplateKpi[] = (templatesResult.data || []).map((t: any) => {
        const stat = templateStatsMap[t.nome] || { disparos: 0, respondidos: 0, reativados: 0, custo: 0 };
        return {
          id: t.id,
          nome: t.nome,
          status_meta: t.status_meta,
          categoria: t.categoria,
          quality_score: t.quality_score,
          tipo: t.tipo,
          ultima_sincronizacao: t.ultima_sincronizacao,
          disparosNoPeriodo: stat.disparos,
          respondidos: stat.respondidos,
          reativados: stat.reativados,
          custoEstimadoUsd: stat.custo,
        };
      });
      setTemplates(templatesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar KPIs';
      console.warn('⚠️ Erro ao buscar KPIs da Meta:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [period.dataInicio, period.dataFim]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const custoPorResposta = totalRespondidos > 0 ? custoTotalUsd / totalRespondidos : 0;
  const custoPorReativacao = totalReativados > 0 ? custoTotalUsd / totalReativados : 0;

  return {
    numero,
    templates,
    custoTotalUsd,
    custoPorDia,
    totalRespondidos,
    totalReativados,
    custoPorResposta,
    custoPorReativacao,
    isLoading,
    error,
    refetch: fetchKpis,
  };
};
