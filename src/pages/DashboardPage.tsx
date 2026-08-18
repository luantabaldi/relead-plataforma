import React, { useState, useMemo, useEffect } from 'react';
import { Dashboard } from '../components/Dashboard';
import { DispatchForm } from '../components/DispatchForm';
import { TopNav, TabType } from '../components/TopNav';
import { Topbar } from '../components/Topbar';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { ActiveDispatchesModal } from '../components/ActiveDispatchesModal';
import { CampaignLogsTab } from '../components/CampaignLogsTab';
import { LeadsTab } from '../components/LeadsTab';
import { BlacklistTab } from '../components/BlacklistTab';
import { useConversations } from '../hooks/useConversations';
import { useHash } from '../hooks/useHash';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useActiveDispatches } from '../hooks/useActiveDispatches';
import { usePausedDispatches } from '../hooks/usePausedDispatches';
import { useMetaKpis, NumeroSaude, CustoPorDia, TemplateKpi } from '../hooks/useMetaKpis';
import { useGeminiKpis, CustoGeminiPorCampanha } from '../hooks/useGeminiKpis';
import { friendlyError } from '../lib/friendlyError';
import { FilterOptions, CampaignType } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardPageProps {
  session?: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ session }) => {
  // ── Hash-based routing (no external router needed) ──────────────────
  const { tab: currentTab, manageSubTab: activeManageTab, navigate } = useHash();

  const setCurrentTab = (t: TabType) => navigate(t);

  const [filters, setFilters] = useState<FilterOptions>({
    campanhas: [],
    statuses: [],
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataFim: new Date(),
    busca: '',
  });

  const [periodOption, setPeriodOption] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // Período próprio da aba KPIs — deliberadamente separado de `filters`/`periodOption`
  // acima, pois aquele state alimenta `useConversations` (aba Acompanhar); reaproveitá-lo
  // aqui faria trocar o período dos KPIs re-disparar fetch de conversas.
  const [kpiPeriodOption, setKpiPeriodOption] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [kpiPeriod, setKpiPeriod] = useState({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dataFim: new Date(),
  });
  const {
    numero: numeroSaude, templates: templatesKpi, custoTotalUsd, custoPorDia,
    totalRespondidos: kpiTotalRespondidos, totalReativados: kpiTotalReativados,
    custoPorResposta, custoPorReativacao, isLoading: isLoadingKpis,
  } = useMetaKpis(kpiPeriod);

  const {
    custoTotalUsd: custoGeminiTotalUsd, tokensTotal: geminiTokensTotal, totalChamadas: geminiTotalChamadas,
    custoPorDia: custoGeminiPorDia, custoPorCampanha: custoGeminiPorCampanha, isLoading: isLoadingGeminiKpis,
  } = useGeminiKpis(kpiPeriod);

  const {
    conversations, isLoading, handleAction, refetch, selectedDispatchId, setSelectedDispatchId,
    pendingAction, toast: acompanharToast, dismissToast: dismissAcompanharToast, confirmDialog: acompanharConfirmDialog,
  } = useConversations(filters);

  // Toast + confirmação próprios do Gerenciar (CRUD de templates/empreendimentos/agendadas)
  const { toast: gerenciarToast, notify, dismiss: dismissGerenciarToast } = useToast();
  const [confirmGerenciar, gerenciarConfirmDialog] = useConfirm();

  // Disparos em andamento — campanhas com leads "Pendente" em leads_reativacao
  const { campaigns: activeCampaigns } = useActiveDispatches();
  // Disparos pausados — campanhas paradas manualmente (leads "Pausado", sem "Pendente")
  const { campaigns: pausedCampaigns } = usePausedDispatches();
  const [showActiveDispatches, setShowActiveDispatches] = useState(false);
  const activePendingTotal = activeCampaigns.reduce((sum, c) => sum + c.pendente, 0);

  // WABA Templates states
  const [templates, setTemplates] = useState<Array<{ id: string; nome: string; tipo: string; status_meta: string; tem_variaveis?: boolean; categoria?: string; quality_score?: string; ultima_sincronizacao?: string }>>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id?: string; nome: string; tipo: string; status_meta: string; tem_variaveis?: boolean } | null>(null);

  // Empreendimentos states
  const [empreendimentos, setEmpreendimentos] = useState<Array<{ id: string; nome: string; descricao_ia: string; ativo: boolean }>>([]);
  const [isLoadingEmpreendimentos, setIsLoadingEmpreendimentos] = useState(false);
  const [editingEmpreendimento, setEditingEmpreendimento] = useState<{ id?: string; originalId?: string; nome: string; descricao_ia: string; ativo: boolean } | null>(null);


  const [scheduledCampaigns, setScheduledCampaigns] = useState<Array<{
    id: string;
    nome_campanha: string;
    data_agendamento: string;
    template_nome: string;
    empreendimento_nome: string;
    quantidade_leads: number;
    status: string;
    observacao?: string;
  }>>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string;
    nome_campanha: string;
    data_agendamento: string;
    template_nome: string;
    empreendimento_nome: string;
    quantidade_leads: number;
    status: string;
    observacao?: string;
    created_at?: string;
  } | null>(null);
  const campaignModalCloseRef = React.useRef<HTMLButtonElement>(null);
  const campaignModalPrevFocusRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedCampaign) return;
    campaignModalPrevFocusRef.current = document.activeElement as HTMLElement;
    campaignModalCloseRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedCampaign(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      campaignModalPrevFocusRef.current?.focus?.();
    };
  }, [selectedCampaign]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from('templates_wpp')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadEmpreendimentos = async () => {
    try {
      setIsLoadingEmpreendimentos(true);
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      setEmpreendimentos(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar empreendimentos:', err);
    } finally {
      setIsLoadingEmpreendimentos(false);
    }
  };

  const loadScheduledCampaigns = async () => {
    try {
      setIsLoadingScheduled(true);
      const { data, error } = await supabase
        .from('campanhas_agendadas')
        .select('*')
        .order('data_agendamento', { ascending: true });
      if (error) throw error;
      setScheduledCampaigns(data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar campanhas agendadas:', err);
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const handleCancelCampaign = async (id: string) => {
    const ok = await confirmGerenciar({
      title: 'Cancelar campanha agendada?',
      message: 'O disparo programado não será enviado. Essa ação não pode ser desfeita.',
      confirmLabel: 'Cancelar campanha',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('campanhas_agendadas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }

      notify('ok', 'Campanha agendada cancelada.');
      loadScheduledCampaigns();
    } catch (err) {
      console.error('❌ Erro ao cancelar campanha agendada:', err);
      notify('err', friendlyError(err, 'Não foi possível cancelar a campanha.'));
    }
  };

  useEffect(() => {
    if (currentTab === 'gerenciar') {
      loadTemplates();
      loadEmpreendimentos();
      loadScheduledCampaigns();
    } else if (currentTab === 'analisar') {
      refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.id) return;

    try {
      // Apenas 'tipo' e 'tem_variaveis' são editáveis à mão — nome/status_meta
      // vêm da sincronização automática com a Meta e não devem ser digitados.
      const { error } = await supabase
        .from('templates_wpp')
        .update({
          tipo: editingTemplate.tipo,
          tem_variaveis: editingTemplate.tem_variaveis !== false,
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      notify('ok', 'Template atualizado.');
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      console.error('❌ Erro ao salvar template:', err);
      notify('err', friendlyError(err, 'Não foi possível salvar o template.'));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const ok = await confirmGerenciar({
      title: 'Deletar template?',
      message: 'O template deixará de aparecer para seleção em novos disparos. Essa ação não pode ser desfeita.',
      confirmLabel: 'Deletar template',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('templates_wpp')
        .delete()
        .eq('id', id);

      if (error) throw error;
      notify('ok', 'Template deletado.');
      loadTemplates();
    } catch (err) {
      console.error('❌ Erro ao deletar template:', err);
      notify('err', friendlyError(err, 'Não foi possível deletar o template.'));
    }
  };

  const handleStopCampaign = async (campaignName: string) => {
    try {
      const { error } = await supabase
        .from('leads_reativacao')
        .update({ status_reativacao: 'Pausado' })
        .eq('nome_campanha', campaignName)
        .eq('status_reativacao', 'Pendente');

      if (error) throw error;
      notify('ok', `Disparo da campanha "${campaignName}" interrompido.`);
    } catch (err: any) {
      console.error('❌ Erro ao interromper disparo:', err);
      notify('err', 'Erro ao interromper disparo: ' + err.message);
    }
  };

  const handleResumeCampaign = async (campaignName: string, tipoCampanha: string) => {
    try {
      // O n8n usa "template_id" (nome ou UUID) para buscar em templates_wpp
      // se o template tem variáveis — sem isso ele assume "tem_variaveis: true"
      // e manda um parâmetro que a Meta rejeita para templates sem variável.
      // O nome do template já está salvo em cada lead desde o disparo original,
      // mas esse mesmo campo é sobrescrito pelo n8n com o texto do erro/envio
      // assim que o lead é processado — só quem nunca foi tocado (data_envio
      // ainda nulo) garante o nome de template original e não um valor sujo.
      const { data: sampleLead } = await supabase
        .from('leads_reativacao')
        .select('mensagem_enviada')
        .eq('nome_campanha', campaignName)
        .eq('status_reativacao', 'Pausado')
        .is('data_envio', null)
        .limit(1)
        .maybeSingle();

      const { error } = await supabase
        .from('leads_reativacao')
        .update({ status_reativacao: 'Pendente' })
        .eq('nome_campanha', campaignName)
        .eq('status_reativacao', 'Pausado');

      if (error) throw error;

      // Re-aciona o mesmo webhook do disparo manual para o n8n voltar a
      // processar os leads que acabaram de virar "Pendente" novamente.
      try {
        const webhookResponse = await fetch('https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'retomar',
            nome_campanha: campaignName,
            tipo_campanha: tipoCampanha,
            template_id: sampleLead?.mensagem_enviada || '',
          }),
        });

        if (!webhookResponse.ok) {
          console.warn('⚠️ Webhook do n8n respondeu com status:', webhookResponse.status);
        }
      } catch (webhookErr) {
        console.error('⚠️ Falha ao acionar o webhook do n8n na retomada:', webhookErr);
      }

      notify('ok', `Disparo da campanha "${campaignName}" retomado.`);
    } catch (err: any) {
      console.error('❌ Erro ao retomar disparo:', err);
      notify('err', 'Erro ao retomar disparo: ' + err.message);
    }
  };

  const handleSaveEmpreendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpreendimento) return;

    try {
      const empId = editingEmpreendimento.id?.trim();
      const empNome = editingEmpreendimento.nome.trim();

      if (!empId) {
        notify('err', 'ID do empreendimento (Código CRM) é obrigatório.');
        return;
      }
      if (!empNome) {
        notify('err', 'Nome do empreendimento é obrigatório.');
        return;
      }

      const payload = {
        nome: empNome,
        descricao_ia: editingEmpreendimento.descricao_ia || '',
        ativo: editingEmpreendimento.ativo,
      };

      if (editingEmpreendimento.originalId) {
        // UPDATE
        const { error } = await supabase
          .from('empreendimentos')
          .update(payload)
          .eq('id', editingEmpreendimento.originalId);

        if (error) throw error;
      } else {
        // INSERT
        // First check if ID already exists
        const { data: existing } = await supabase
          .from('empreendimentos')
          .select('id')
          .eq('id', empId)
          .maybeSingle();

        if (existing) {
          notify('err', `Já existe um empreendimento cadastrado com o ID ${empId}.`);
          return;
        }

        const { error } = await supabase
          .from('empreendimentos')
          .insert({
            id: empId,
            ...payload
          });

        if (error) throw error;
      }

      notify('ok', editingEmpreendimento.originalId ? 'Empreendimento atualizado.' : 'Empreendimento criado.');
      setEditingEmpreendimento(null);
      loadEmpreendimentos();
    } catch (err) {
      console.error('❌ Erro ao salvar empreendimento:', err);
      notify('err', friendlyError(err, 'Não foi possível salvar o empreendimento.'));
    }
  };

  const handleDeleteEmpreendimento = async (id: string) => {
    const ok = await confirmGerenciar({
      title: 'Deletar empreendimento?',
      message: 'O empreendimento deixará de alimentar o contexto da IA em novos disparos. Essa ação não pode ser desfeita.',
      confirmLabel: 'Deletar empreendimento',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('empreendimentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      notify('ok', 'Empreendimento deletado.');
      loadEmpreendimentos();
    } catch (err) {
      console.error('❌ Erro ao deletar empreendimento:', err);
      notify('err', friendlyError(err, 'Não foi possível deletar o empreendimento.'));
    }
  };

  // Live metrics for the Analisar preview — computed from real conversations.
  const metrics = useMemo(() => {
    const total = conversations.length;
    const respondidos = conversations.filter((c) =>
      ['respondido', 'interessado', 'sem_interesse'].includes(c.dispatch.status)
    ).length;
    const interessados = conversations.filter((c) => c.dispatch.status === 'interessado').length;
    const taxaResp = total ? Math.round((respondidos / total) * 100) : 0;
    const taxaInt = respondidos ? Math.round((interessados / respondidos) * 100) : 0;
    const taxaIntDisparos = total ? Math.round((interessados / total) * 100) : 0;
    return { total, respondidos, interessados, taxaResp, taxaInt, taxaIntDisparos };
  }, [conversations]);

  return (
    <div className="dash-app">
      <div className="app-header">
        <TopNav active={currentTab} manageSubTab={activeManageTab} onChange={(t, sub) => navigate(t, sub)} />
        <Topbar syncing={isLoading} session={session} />
      </div>

      <div className="dash-main">
        {/* ── Acompanhar — full-height master/detail ── */}
        {currentTab === 'acompanhar' && (
          <Dashboard
            conversations={conversations}
            isLoading={isLoading}
            onAction={handleAction}
            pendingAction={pendingAction}
            selectedDispatchId={selectedDispatchId}
            onSelectConversation={setSelectedDispatchId}
          />
        )}

        {/* ── Disparar ── */}
        {currentTab === 'disparar' && (
          <div className="page thin-scroll">
            <div className="page-hero">
              <div>
                <h2>Disparar <em>campanha</em></h2>
              </div>
            </div>
            <DispatchForm onSuccess={() => { refetch(); navigate('acompanhar'); }} />
          </div>
        )}

        {/* ── Gerenciar ── */}
        {currentTab === 'gerenciar' && (
          <div className="page thin-scroll">
            <div className="page-hero">
              <div>
                <h2>Gerenciar <em>dados</em></h2>
                <p className="t-caption" style={{ marginTop: 4 }}>Templates · Empreendimentos · Campanhas agendadas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ManageCard
                icon="file-text"
                label="Templates"
                title="Mensagens reutilizáveis"
                desc="Crie e edite os modelos de mensagem usados em cada disparo."
                cta="Criar template"
                onClick={() => {
                  navigate('gerenciar', 'templates');
                  setEditingTemplate({ nome: '', tipo: 'prospeccao', status_meta: 'APPROVED', tem_variaveis: true });
                }}
              />
              <ManageCard
                icon="building"
                label="Empreendimentos"
                title="Imóveis & lançamentos"
                desc="Cadastre os empreendimentos que alimentam o contexto da IA."
                cta="Criar empreendimento"
                onClick={() => {
                  navigate('gerenciar', 'empreendimentos');
                  setEditingEmpreendimento({ id: '', nome: '', descricao_ia: '', ativo: true });
                }}
              />
              <ManageCard
                icon="calendar"
                label="Agendadas"
                title="Disparos programados"
                desc="Veja e gerencie campanhas agendadas para envio automático."
                cta="Ver agendadas"
                onClick={() => navigate('gerenciar', 'agendadas')}
              />
            </div>

            {/* Seletor de Sub-abas — sincronizado com hash */}
            <div style={{ marginTop: 24, display: 'flex', borderBottom: '1px solid var(--paper-200)', gap: 20 }}>
              <button
                type="button"
                onClick={() => navigate('gerenciar', 'templates')}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: activeManageTab === 'templates' ? '2px solid var(--navy-500)' : '2px solid transparent',
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  color: activeManageTab === 'templates' ? 'var(--navy-700)' : 'var(--ink-300)',
                  transition: 'all 0.2s ease',
                }}
              >
                Templates de WhatsApp
              </button>
              <button
                type="button"
                onClick={() => navigate('gerenciar', 'empreendimentos')}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: activeManageTab === 'empreendimentos' ? '2px solid var(--navy-500)' : '2px solid transparent',
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  color: activeManageTab === 'empreendimentos' ? 'var(--navy-700)' : 'var(--ink-300)',
                  transition: 'all 0.2s ease',
                }}
              >
                Empreendimentos
              </button>
              <button
                type="button"
                onClick={() => navigate('gerenciar', 'agendadas')}
                style={{
                  background: 'none', border: 'none',
                  borderBottom: activeManageTab === 'agendadas' ? '2px solid var(--navy-500)' : '2px solid transparent',
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  color: activeManageTab === 'agendadas' ? 'var(--navy-700)' : 'var(--ink-300)',
                  transition: 'all 0.2s ease',
                }}
              >
                Campanhas agendadas
              </button>
            </div>

            {/* Painel Templates */}
            {activeManageTab === 'templates' && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="t-h2" style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="file-text" size={20} /> Templates cadastrados
                  </h3>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                    Sincronizado automaticamente com a Meta
                  </span>
                </div>

                {/* Formulário de Edição — nome/status_meta vêm da Meta e são somente leitura */}
                {editingTemplate && (
                  <div className="card" style={{ padding: 24, gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
                    <style>{`
                      @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    <h4 className="t-serif" style={{ fontSize: 18, margin: 0, color: 'var(--navy-700)' }}>
                      Editar template WABA
                    </h4>

                    <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="field">
                          <label>Nome (Meta Slug)</label>
                          <div
                            className="input"
                            style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-50)', background: 'var(--paper-100)', cursor: 'not-allowed', fontFamily: 'var(--font-mono)' }}
                            title="Vem da sincronização com a Meta — não pode ser editado"
                          >
                            {editingTemplate.nome}
                          </div>
                        </div>

                        <div className="field">
                          <label htmlFor="templateTipoSelect">Tipo de campanha *</label>
                          <select
                            id="templateTipoSelect"
                            name="tipo"
                            className="input"
                            value={editingTemplate.tipo}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, tipo: e.target.value })}
                            required
                          >
                            <option value="prospeccao">Prospecção</option>
                            <option value="reativacao">Reativação</option>
                          </select>
                        </div>

                        <div className="field">
                          <label>Status de homologação</label>
                          <div
                            className="input"
                            style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-50)', background: 'var(--paper-100)', cursor: 'not-allowed' }}
                            title="Vem da sincronização com a Meta — não pode ser editado"
                          >
                            {editingTemplate.status_meta === 'APPROVED'
                              ? 'Aprovado (APPROVED)'
                              : editingTemplate.status_meta === 'PENDING'
                              ? 'Pendente (PENDING)'
                              : editingTemplate.status_meta === 'REJECTED'
                              ? 'Rejeitado (REJECTED)'
                              : editingTemplate.status_meta}
                          </div>
                        </div>

                        <div className="field">
                          <label htmlFor="templateVariablesSelect">Possui variáveis? *</label>
                          <select
                            id="templateVariablesSelect"
                            name="tem_variaveis"
                            className="input"
                            value={editingTemplate.tem_variaveis !== false ? 'true' : 'false'}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, tem_variaveis: e.target.value === 'true' })}
                            required
                          >
                            <option value="true">Sim (possui variáveis)</option>
                            <option value="false">Não (texto estático)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', marginTop: 8 }}>
                        <button type="submit" className="btn primary">
                          <Icon name="check" size={14} /> Salvar template
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(null)}
                          className="btn secondary"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tabela de Listagem de Templates */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {isLoadingTemplates ? (
                    <div style={{ padding: 20 }}>
                      <style>{`
                        @keyframes skeleton-pulse {
                          0%, 100% { opacity: 0.6; }
                          50% { opacity: 0.35; }
                        }
                        .skeleton-pulse {
                          animation: skeleton-pulse 1.5s infinite ease-in-out;
                        }
                        .skeleton-line {
                          background: var(--paper-200);
                          border-radius: 4px;
                        }
                      `}</style>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <tbody>
                          {[1, 2, 3, 4].map((i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--paper-200)', height: 50 }}>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '30%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '25%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 120 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: 12 }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : templates.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
                      Nenhum template sincronizado ainda. Templates aparecem aqui automaticamente após a
                      sincronização diária com a Meta Graph API.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Nome do template</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Categoria (Meta)</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Tipo de campanha</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Status de homologação</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Quality score</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Última sincronização</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 120 }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map((t, idx) => (
                          <tr
                            key={t.id}
                            style={{
                              borderBottom: idx === templates.length - 1 ? 'none' : '1px solid var(--paper-200)',
                              background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                            }}
                          >
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                              {t.nome}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                                {t.categoria || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              {t.tipo === 'nao_classificado' ? (
                                <span
                                  className="chip warning"
                                  style={{ fontSize: 11 }}
                                  title="Não classificado — não aparece no select de disparo até que 'Tipo de campanha' seja definido"
                                >
                                  Não classificado
                                </span>
                              ) : (
                                <span className={`chip ${t.tipo === 'reativacao' ? 'success' : 'info'}`} style={{ fontSize: 11 }}>
                                  {t.tipo === 'reativacao' ? 'Reativação' : 'Prospecção'}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span
                                className={`chip ${
                                  t.status_meta === 'APPROVED'
                                    ? 'success'
                                    : t.status_meta === 'PENDING' || t.status_meta === 'em_revisao'
                                    ? 'warning'
                                    : 'danger'
                                }`}
                                style={{ fontSize: 11 }}
                              >
                                {t.status_meta === 'APPROVED'
                                  ? 'Aprovado'
                                  : t.status_meta === 'PENDING'
                                  ? 'Pendente'
                                  : t.status_meta === 'REJECTED'
                                  ? 'Rejeitado'
                                  : 'Em Revisão'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                                {t.quality_score && t.quality_score !== 'UNKNOWN' ? t.quality_score : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className="t-mono tnum" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                                {t.ultima_sincronizacao
                                  ? new Date(t.ultima_sincronizacao).toLocaleDateString('pt-BR')
                                  : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingTemplate(t)}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Editar template"
                                  aria-label="Editar template"
                                >
                                  <Icon name="pencil" size={14} style={{ color: 'var(--navy-600)' }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplate(t.id)}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Deletar template"
                                  aria-label="Deletar template"
                                >
                                  <Icon name="trash" size={14} style={{ color: 'var(--rose-500)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Painel Empreendimentos */}
            {activeManageTab === 'empreendimentos' && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="t-h2" style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="building" size={20} /> Empreendimentos cadastrados
                  </h3>
                  {!editingEmpreendimento && (
                    <button
                      type="button"
                      onClick={() => setEditingEmpreendimento({ id: '', nome: '', descricao_ia: '', ativo: true })}
                      className="btn primary"
                    >
                      <Icon name="plus" size={14} /> Novo empreendimento
                    </button>
                  )}
                </div>

                {/* Formulário de Empreendimento (Novo / Editar) */}
                {editingEmpreendimento && (
                  <div className="card" style={{ padding: 24, gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
                    <h4 className="t-serif" style={{ fontSize: 18, margin: 0, color: 'var(--navy-700)' }}>
                      {editingEmpreendimento.originalId ? 'Editar empreendimento' : 'Novo empreendimento'}
                    </h4>

                    <form onSubmit={handleSaveEmpreendimento} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="field">
                          <label htmlFor="empreendimentoCodeInput">Código CRM / ID *</label>
                          <input
                            id="empreendimentoCodeInput"
                            name="id"
                            type="text"
                            className="input"
                            placeholder="ex: 152"
                            value={editingEmpreendimento.id}
                            onChange={(e) => setEditingEmpreendimento({ ...editingEmpreendimento, id: e.target.value })}
                            disabled={!!editingEmpreendimento.originalId}
                            autoComplete="off"
                            required
                          />
                          {!editingEmpreendimento.originalId && (
                            <span className="t-caption">ID do CRM — imutável após criação</span>
                          )}
                        </div>

                        <div className="field">
                          <label htmlFor="empreendimentoNameEditInput">Nome do empreendimento *</label>
                          <input
                            id="empreendimentoNameEditInput"
                            name="nome"
                            type="text"
                            className="input"
                            placeholder="Lee Dama Tower"
                            value={editingEmpreendimento.nome}
                            onChange={(e) => setEditingEmpreendimento({ ...editingEmpreendimento, nome: e.target.value })}
                            autoComplete="off"
                            required
                          />
                        </div>

                        <div className="field">
                          <label htmlFor="empreendimentoActiveSelect">Status *</label>
                          <select
                            id="empreendimentoActiveSelect"
                            name="ativo"
                            className="input"
                            value={editingEmpreendimento.ativo ? 'true' : 'false'}
                            onChange={(e) => setEditingEmpreendimento({ ...editingEmpreendimento, ativo: e.target.value === 'true' })}
                            required
                          >
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                          </select>
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="empreendimentoDescTextarea">Observação para a IA</label>
                        <textarea
                          id="empreendimentoDescTextarea"
                          name="descricao_ia"
                          className="input"
                          placeholder="Ex: Studios e aptos de 1 dorm. A 800m do mar…"
                          value={editingEmpreendimento.descricao_ia}
                          onChange={(e) => setEditingEmpreendimento({ ...editingEmpreendimento, descricao_ia: e.target.value })}
                          rows={3}
                        />
                        <span className="t-caption">Preenchida automaticamente na tela Disparar</span>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', marginTop: 8 }}>
                        <button type="submit" className="btn primary">
                          <Icon name="check" size={14} /> Salvar empreendimento
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEmpreendimento(null)}
                          className="btn secondary"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tabela de Listagem de Empreendimentos */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {isLoadingEmpreendimentos ? (
                    <div style={{ padding: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <tbody>
                          {[1, 2, 3, 4].map((i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--paper-200)', height: 50 }}>
                              <td style={{ padding: '14px 20px', width: 120 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 100 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 120 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: 12 }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : empreendimentos.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
                      <div style={{ marginBottom: 12 }}>Nenhum empreendimento cadastrado no Supabase.</div>
                      <button
                        type="button"
                        onClick={() => setEditingEmpreendimento({ id: '', nome: '', descricao_ia: '', ativo: true })}
                        className="btn secondary"
                        style={{ margin: '0 auto' }}
                      >
                        <Icon name="plus" size={14} /> Cadastrar primeiro empreendimento
                      </button>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 120 }}>Código CRM</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Nome do empreendimento</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Descrição / Observação IA</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 100 }}>Status</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 120 }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empreendimentos.map((e, idx) => (
                          <tr
                            key={e.id}
                            style={{
                              borderBottom: idx === empreendimentos.length - 1 ? 'none' : '1px solid var(--paper-200)',
                              background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                            }}
                          >
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                              {e.id}
                            </td>
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-50)' }}>
                              {e.nome}
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--ink-200)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.descricao_ia || <em style={{ color: 'var(--ink-300)' }}>Sem descrição</em>}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className={`chip ${e.ativo ? 'success' : 'danger'}`} style={{ fontSize: 11 }}>
                                {e.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmpreendimento({ id: e.id, originalId: e.id, nome: e.nome, descricao_ia: e.descricao_ia || '', ativo: e.ativo })}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Editar empreendimento"
                                  aria-label="Editar empreendimento"
                                >
                                  <Icon name="pencil" size={14} style={{ color: 'var(--navy-600)' }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmpreendimento(e.id)}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Deletar empreendimento"
                                  aria-label="Deletar empreendimento"
                                >
                                  <Icon name="trash" size={14} style={{ color: 'var(--rose-500)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Painel Agendadas */}
            {activeManageTab === 'agendadas' && (
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="t-h2" style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="calendar" size={20} /> Campanhas agendadas
                  </h3>
                </div>

                {/* Modal de Detalhes da Campanha Agendada */}
                {selectedCampaign && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(15, 23, 42, 0.4)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1000,
                      animation: 'fadeIn 0.2s ease-out',
                    }}
                    onClick={() => setSelectedCampaign(null)}
                  >
                    <div
                      className="card"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="campaign-modal-title"
                      style={{
                        width: '100%',
                        maxWidth: 540,
                        padding: 28,
                        gap: 20,
                        animation: 'slideUp 0.3s var(--ease-out)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <style>{`
                        @keyframes slideUp {
                          from { transform: translateY(12px); opacity: 0; }
                          to { transform: translateY(0); opacity: 1; }
                        }
                      `}</style>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="chip info" style={{ fontSize: 11 }}>Campanha programada</span>
                          <h4 id="campaign-modal-title" className="t-serif" style={{ fontSize: 22, marginTop: 6, marginBottom: 0, color: 'var(--navy-700)' }}>
                            {selectedCampaign.nome_campanha}
                          </h4>
                        </div>
                        <button
                          type="button"
                          ref={campaignModalCloseRef}
                          onClick={() => setSelectedCampaign(null)}
                          className="btn ghost"
                          aria-label="Fechar"
                          style={{ minWidth: 'auto', padding: 6 }}
                        >
                          <Icon name="x" size={20} style={{ color: 'var(--ink-300)' }} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--paper-200)', paddingBottom: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', fontWeight: 600 }}><Icon name="clock" size={12} /> Envio programado</div>
                            <div className="t-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-50)', marginTop: 2 }}>
                              {selectedCampaign.data_agendamento ? (() => {
                                try {
                                  const d = new Date(selectedCampaign.data_agendamento);
                                  return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  });
                                } catch (e) {
                                  return 'Data inválida';
                                }
                              })() : '—'}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', fontWeight: 600 }}><Icon name="user" size={12} /> Lote de leads</div>
                            <div className="t-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy-500)', marginTop: 2 }}>
                              {selectedCampaign.quantidade_leads} contatos
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid var(--paper-200)', paddingBottom: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', fontWeight: 600 }}><Icon name="message-circle" size={12} /> Template WABA</div>
                            <div className="t-mono" style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 2 }}>
                              {selectedCampaign.template_nome || '—'}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', fontWeight: 600 }}><Icon name="building" size={12} /> Empreendimento</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-50)', marginTop: 2 }}>
                              {selectedCampaign.empreendimento_nome || '—'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-300)', textTransform: 'uppercase', fontWeight: 600 }}><Icon name="file-text" size={12} /> Observação para a IA</div>
                          <div style={{
                            fontSize: 13,
                            color: 'var(--ink-100)',
                            lineHeight: 1.5,
                            marginTop: 4,
                            padding: 12,
                            background: 'var(--paper-100)',
                            borderRadius: 8,
                            border: '1px solid var(--paper-200)'
                          }}>
                            {selectedCampaign.observacao || <em style={{ color: 'var(--ink-300)' }}>Sem observações adicionais.</em>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            handleCancelCampaign(selectedCampaign.id);
                          }}
                          className="btn danger"
                        >
                          <Icon name="trash" size={14} /> Cancelar agendamento
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(null)}
                          className="btn secondary"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabela de Campanhas agendadas */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {isLoadingScheduled ? (
                    <div style={{ padding: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <tbody>
                          {[1, 2, 3, 4].map((i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--paper-200)', height: 50 }}>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 180 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '40%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '45%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 110 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '30%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 100 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '50%', height: 12 }} />
                              </td>
                              <td style={{ padding: '14px 20px', width: 120 }}>
                                <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: 12 }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : scheduledCampaigns.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                      <Icon name="calendar" size={20} style={{ color: 'var(--fg-muted)', marginBottom: 8 }} />
                      <p className="t-caption" style={{ margin: 0 }}>Nenhuma campanha agendada</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Nome da Campanha</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 180 }}>Envio Programado</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>WABA Template</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Empreendimento</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 110 }}>Leads</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 100 }}>Status</th>
                          <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)', width: 120 }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledCampaigns.map((c, idx) => (
                          <tr
                            key={c.id}
                            style={{
                              borderBottom: idx === scheduledCampaigns.length - 1 ? 'none' : '1px solid var(--paper-200)',
                              background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                            }}
                          >
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--ink-50)' }}>
                              {c.nome_campanha}
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--ink-50)', fontWeight: 500 }}>
                              {c.data_agendamento ? (() => {
                                try {
                                  const d = new Date(c.data_agendamento);
                                  return isNaN(d.getTime()) ? 'Data inválida' : d.toLocaleString('pt-BR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  });
                                } catch (e) {
                                  return 'Data inválida';
                                }
                              })() : '—'}
                            </td>
                            <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', color: 'var(--ink-200)' }}>
                              {c.template_nome || '—'}
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--ink-200)' }}>
                              {c.empreendimento_nome || '—'}
                            </td>
                            <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--navy-600)' }} className="tnum">
                              {c.quantidade_leads}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span className={`chip ${c.status === 'pendente' ? 'warning' : c.status === 'enviada' ? 'success' : 'danger'}`} style={{ fontSize: 11 }}>
                                {c.status === 'pendente' ? 'Pendente' : c.status === 'enviada' ? 'Enviada' : 'Cancelada'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCampaign(c)}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Visualizar detalhes"
                                  aria-label="Visualizar detalhes"
                                >
                                  <Icon name="eye" size={14} style={{ color: 'var(--navy-600)' }} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelCampaign(c.id)}
                                  className="btn ghost"
                                  style={{ padding: 6, minWidth: 'auto' }}
                                  title="Cancelar agendamento"
                                  aria-label="Cancelar agendamento"
                                >
                                  <Icon name="x-circle" size={14} style={{ color: 'var(--rose-500)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Analisar ── */}
        {currentTab === 'analisar' && (
          <div className="page thin-scroll">
            <div className="page-hero">
              <div>
                <h2>Analisar <em>desempenho</em></h2>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveDispatches(true)}
                className={`btn ${activeCampaigns.length > 0 || pausedCampaigns.length > 0 ? 'secondary' : 'ghost'}`}
              >
                {activeCampaigns.length > 0 ? (
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                ) : pausedCampaigns.length > 0 ? (
                  <Icon name="pause" size={14} />
                ) : (
                  <Icon name="send" size={14} />
                )}
                {activeCampaigns.length > 0
                  ? `${activeCampaigns.length} disparo${activeCampaigns.length > 1 ? 's' : ''} em andamento — ${activePendingTotal} pendentes`
                  : pausedCampaigns.length > 0
                  ? `${pausedCampaigns.length} disparo${pausedCampaigns.length > 1 ? 's' : ''} pausado${pausedCampaigns.length > 1 ? 's' : ''}`
                  : 'Nenhum disparo em andamento'}
              </button>
            </div>

            {/* Painel de Filtros Inline */}
            <div className="card" style={{ padding: 18, borderRadius: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name="filter" size={16} style={{ color: 'var(--navy-600)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy-700)' }}>Filtrar Desempenho:</span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Filtro por Campanha */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>Campanha:</span>
                    <select
                      className="input"
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, height: 'auto', width: 'auto', minWidth: 120 }}
                      value={filters.campanhas[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters({ ...filters, campanhas: val ? [val as CampaignType] : [] });
                      }}
                    >
                      <option value="">Todas</option>
                      <option value="prospeccao">Prospecção</option>
                      <option value="reativacao">Reativação</option>
                    </select>
                  </div>

                  {/* Seletor de Período (Segmented Control) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--paper-100)', padding: 4, borderRadius: 10 }}>
                    {([
                      { id: '7d', label: '7 dias', days: 7 },
                      { id: '30d', label: '30 dias', days: 30 },
                      { id: '90d', label: '90 dias', days: 90 },
                      { id: 'custom', label: 'Customizado', days: 0 }
                    ] as const).map((opt) => {
                      const active = periodOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setPeriodOption(opt.id);
                            if (opt.days > 0) {
                              setFilters({
                                ...filters,
                                dataInicio: new Date(Date.now() - opt.days * 24 * 60 * 60 * 1000),
                                dataFim: new Date(),
                              });
                            }
                          }}
                          className="t-mono"
                          style={{
                            background: active ? '#fff' : 'none',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: active ? 600 : 500,
                            color: active ? 'var(--navy-700)' : 'var(--ink-50)',
                            cursor: 'pointer',
                            boxShadow: active ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Data picker Customizado (slide-in / reativo) */}
                  {periodOption === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="customDateStartInput" className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)', cursor: 'pointer' }}>De:</label>
                        <input
                          id="customDateStartInput"
                          name="dataInicio"
                          type="date"
                          className="input tnum"
                          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, height: 'auto', width: 'auto' }}
                          value={filters.dataInicio.toISOString().split('T')[0]}
                          onChange={(e) => {
                            if (e.target.value) {
                              setFilters({ ...filters, dataInicio: new Date(e.target.value + 'T00:00:00') });
                            }
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="customDateEndInput" className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)', cursor: 'pointer' }}>Até:</label>
                        <input
                          id="customDateEndInput"
                          name="dataFim"
                          type="date"
                          className="input tnum"
                          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, height: 'auto', width: 'auto' }}
                          value={filters.dataFim.toISOString().split('T')[0]}
                          onChange={(e) => {
                            if (e.target.value) {
                              setFilters({ ...filters, dataFim: new Date(e.target.value + 'T23:59:59') });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
                <style>{`
                  @keyframes skeleton-pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.35; }
                  }
                  .skeleton-pulse {
                    animation: skeleton-pulse 1.5s infinite ease-in-out;
                    background: var(--paper-100);
                  }
                  .skeleton-line {
                    background: var(--paper-200);
                    border-radius: 4px;
                  }
                  .skeleton-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid var(--paper-300);
                    border-left-color: var(--navy-500);
                    border-radius: 50%;
                    animation: spinner 0.8s linear infinite;
                  }
                `}</style>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card skeleton-pulse" style={{ height: 110, padding: 20 }}>
                      <div className="skeleton-line" style={{ width: '60%', height: 12, marginBottom: 12 }} />
                      <div className="skeleton-line" style={{ width: '40%', height: 28 }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card skeleton-pulse" style={{ height: 260, justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="skeleton-spinner" />
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-100)', marginTop: 12 }}>
                        Sincronizando com o Supabase…
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Resumo de Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <StatCard label="Leads disparados" value={metrics.total} icon="megaphone" tone="white" />
                  <StatCard label="Responderam" value={metrics.respondidos} icon="message-circle"
                    note={`${metrics.taxaResp}% de resposta`} tone="soft" />
                  <StatCard label="Interessados" value={metrics.interessados} icon="thumbs-up"
                    note={`${metrics.taxaInt}% dos que responderam`} tone="dark" />
                  <StatCard label="Taxa de interessados" value={`${metrics.taxaIntDisparos}%`} icon="trending-up"
                    note="dos leads disparados" tone="green" />
                </div>

                {conversations.length === 0 && (
                  <div className="card" style={{ padding: '16px 24px', borderRadius: 16, alignItems: 'center', marginBottom: 24, display: 'flex', flexDirection: 'row', gap: 14, background: 'var(--navy-50)', border: '1px solid var(--navy-100)' }}>
                    <Icon name="bar-chart-2" size={18} style={{ color: 'var(--navy-500)', flexShrink: 0 }} />
                    <span className="t-caption" style={{ flex: 1 }}>Sem disparos no período selecionado</span>
                    <button onClick={() => setCurrentTab('disparar')} className="btn primary" style={{ flexShrink: 0, padding: '8px 14px' }}>
                      <Icon name="send" size={13} /> Disparar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: 24 }}>
                  <LineChart conversations={conversations} dataInicio={filters.dataInicio} dataFim={filters.dataFim} />
                  <CampaignBarChart conversations={conversations} />
                  <FunnelChart conversations={conversations} />
                  <DonutChart conversations={conversations} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── KPIs (saúde, templates, custo) ── */}
        {currentTab === 'kpis' && (
          <div className="page thin-scroll">
            <div className="page-hero">
              <div>
                <h2>KPIs <em>de saúde, templates e custo</em></h2>
              </div>
            </div>

            {/* Painel de Filtro de Período */}
            <div className="card" style={{ padding: 18, borderRadius: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name="filter" size={16} style={{ color: 'var(--navy-600)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy-700)' }}>Período do custo:</span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--paper-100)', padding: 4, borderRadius: 10 }}>
                    {([
                      { id: '7d', label: '7 dias', days: 7 },
                      { id: '30d', label: '30 dias', days: 30 },
                      { id: '90d', label: '90 dias', days: 90 },
                      { id: 'custom', label: 'Customizado', days: 0 },
                    ] as const).map((opt) => {
                      const active = kpiPeriodOption === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setKpiPeriodOption(opt.id);
                            if (opt.days > 0) {
                              setKpiPeriod({
                                dataInicio: new Date(Date.now() - opt.days * 24 * 60 * 60 * 1000),
                                dataFim: new Date(),
                              });
                            }
                          }}
                          className="t-mono"
                          style={{
                            background: active ? '#fff' : 'none',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: active ? 600 : 500,
                            color: active ? 'var(--navy-700)' : 'var(--ink-50)',
                            cursor: 'pointer',
                            boxShadow: active ? '0 1px 4px rgba(15, 23, 42, 0.08)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {kpiPeriodOption === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="kpiDateStartInput" className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)', cursor: 'pointer' }}>De:</label>
                        <input
                          id="kpiDateStartInput"
                          type="date"
                          className="input tnum"
                          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, height: 'auto', width: 'auto' }}
                          value={kpiPeriod.dataInicio.toISOString().split('T')[0]}
                          onChange={(e) => {
                            if (e.target.value) {
                              setKpiPeriod({ ...kpiPeriod, dataInicio: new Date(e.target.value + 'T00:00:00') });
                            }
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label htmlFor="kpiDateEndInput" className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)', cursor: 'pointer' }}>Até:</label>
                        <input
                          id="kpiDateEndInput"
                          type="date"
                          className="input tnum"
                          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, height: 'auto', width: 'auto' }}
                          value={kpiPeriod.dataFim.toISOString().split('T')[0]}
                          onChange={(e) => {
                            if (e.target.value) {
                              setKpiPeriod({ ...kpiPeriod, dataFim: new Date(e.target.value + 'T23:59:59') });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isLoadingKpis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
                <style>{`
                  @keyframes skeleton-pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.35; }
                  }
                  .skeleton-pulse {
                    animation: skeleton-pulse 1.5s infinite ease-in-out;
                    background: var(--paper-100);
                  }
                  .skeleton-line {
                    background: var(--paper-200);
                    border-radius: 4px;
                  }
                `}</style>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card skeleton-pulse" style={{ height: 110, padding: 20 }}>
                      <div className="skeleton-line" style={{ width: '60%', height: 12, marginBottom: 12 }} />
                      <div className="skeleton-line" style={{ width: '40%', height: 28 }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Saúde do número + Custo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <NumeroSaudeCard numero={numeroSaude} />
                  <StatCard
                    label="Custo total do período"
                    value={`US$ ${custoTotalUsd.toFixed(2)}`}
                    icon="wallet"
                    tone="dark"
                  />
                  <StatCard
                    label="Custo por resposta"
                    value={kpiTotalRespondidos > 0 ? `US$ ${custoPorResposta.toFixed(3)}` : '—'}
                    icon="message-circle"
                    note={`${kpiTotalRespondidos} respostas no período`}
                    tone="soft"
                  />
                  <StatCard
                    label="Custo por reativação"
                    value={kpiTotalReativados > 0 ? `US$ ${custoPorReativacao.toFixed(3)}` : '—'}
                    icon="thumbs-up"
                    note={`${kpiTotalReativados} interessados no período`}
                    tone="green"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: 24 }}>
                  <CustoPorDiaChart custoPorDia={custoPorDia} />
                  <CustoPorTemplateChart templates={templatesKpi} />
                </div>

                {/* Tabela de templates aprovados vinculada ao uso real no disparo */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--paper-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="t-serif" style={{ fontSize: 16, margin: 0, color: 'var(--navy-700)' }}>
                      Templates aprovados
                    </h4>
                    <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                      {templatesKpi.length} templates
                    </span>
                  </div>
                  {templatesKpi.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
                      Nenhum template sincronizado ainda.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Nome</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Categoria</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Status</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Tipo de campanha</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)', textAlign: 'right' }}>Disparos no período</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)', textAlign: 'right' }}>Respondidos</th>
                          <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)', textAlign: 'right' }}>Custo estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templatesKpi.map((t, idx) => (
                          <tr
                            key={t.id}
                            style={{
                              borderBottom: idx === templatesKpi.length - 1 ? 'none' : '1px solid var(--paper-200)',
                              background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                            }}
                          >
                            <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                              {t.nome}
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>{t.categoria || '—'}</span>
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              <span
                                className={`chip ${t.status_meta === 'APPROVED' ? 'success' : t.status_meta === 'PENDING' || t.status_meta === 'em_revisao' ? 'warning' : 'danger'}`}
                                style={{ fontSize: 11 }}
                              >
                                {t.status_meta === 'APPROVED' ? 'Aprovado' : t.status_meta}
                              </span>
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              {t.tipo === 'nao_classificado' ? (
                                <span className="chip warning" style={{ fontSize: 11 }} title="Não aparece no select de disparo até ser classificado em Gerenciar → Templates">
                                  Não classificado
                                </span>
                              ) : (
                                <span className={`chip ${t.tipo === 'reativacao' ? 'success' : 'info'}`} style={{ fontSize: 11 }}>
                                  {t.tipo === 'reativacao' ? 'Reativação' : 'Prospecção'}
                                </span>
                              )}
                            </td>
                            <td className="tnum" style={{ padding: '12px 20px', textAlign: 'right' }}>{t.disparosNoPeriodo}</td>
                            <td className="tnum" style={{ padding: '12px 20px', textAlign: 'right' }}>{t.respondidos}</td>
                            <td className="tnum" style={{ padding: '12px 20px', textAlign: 'right' }}>
                              {t.disparosNoPeriodo > 0 ? (
                                <span title="Estimado: volume de disparos × tarifa da categoria — não é o valor exato do webhook da Meta">
                                  ~US$ {t.custoEstimadoUsd.toFixed(2)}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Custo do Gemini (IA) — sincronizado periodicamente do histórico de execuções do n8n */}
                <div style={{ marginTop: 32, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="sparkles" size={18} style={{ color: 'var(--navy-600)' }} />
                  <h3 className="t-h2" style={{ margin: 0, fontSize: 18 }}>Custo da IA <em>(Gemini)</em></h3>
                </div>

                {isLoadingGeminiKpis ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card skeleton-pulse" style={{ height: 110, padding: 20 }}>
                        <div className="skeleton-line" style={{ width: '60%', height: 12, marginBottom: 12 }} />
                        <div className="skeleton-line" style={{ width: '40%', height: 28 }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <StatCard
                        label="Custo total do Gemini"
                        value={`US$ ${custoGeminiTotalUsd.toFixed(4)}`}
                        icon="wallet"
                        note="Custo real, por tokens usados"
                        tone="dark"
                      />
                      <StatCard
                        label="Tokens consumidos"
                        value={geminiTokensTotal.toLocaleString('pt-BR')}
                        icon="cpu"
                        note={`${geminiTotalChamadas} chamadas no período`}
                        tone="soft"
                      />
                      <StatCard
                        label="Custo por chamada"
                        value={geminiTotalChamadas > 0 ? `US$ ${(custoGeminiTotalUsd / geminiTotalChamadas).toFixed(5)}` : '—'}
                        icon="message-circle"
                        tone="green"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: 20 }}>
                      <CustoPorDiaChart custoPorDia={custoGeminiPorDia} />

                      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--paper-200)' }}>
                          <h4 className="t-serif" style={{ fontSize: 16, margin: 0, color: 'var(--navy-700)' }}>
                            Custo por campanha
                          </h4>
                        </div>
                        {custoGeminiPorCampanha.length === 0 ? (
                          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>
                            Nenhuma chamada do Gemini registrada no período.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)' }}>Campanha</th>
                                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)', textAlign: 'right' }}>Chamadas</th>
                                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-100)', textAlign: 'right' }}>Custo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {custoGeminiPorCampanha.map((c: CustoGeminiPorCampanha, idx: number) => (
                                <tr
                                  key={c.nomeCampanha}
                                  style={{
                                    borderBottom: idx === custoGeminiPorCampanha.length - 1 ? 'none' : '1px solid var(--paper-200)',
                                    background: idx % 2 === 0 ? 'var(--paper-0)' : 'var(--paper-50)',
                                  }}
                                >
                                  <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--ink-50)' }}>{c.nomeCampanha}</td>
                                  <td className="tnum" style={{ padding: '12px 20px', textAlign: 'right' }}>{c.chamadas}</td>
                                  <td className="tnum" style={{ padding: '12px 20px', textAlign: 'right' }}>US$ {c.custoUsd.toFixed(4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Histórico de Campanhas ── */}
        {currentTab === 'logs' && (
          <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div className="page-hero">
              <div>
                <h2>Histórico <em>de campanhas</em></h2>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CampaignLogsTab visible={true} />
            </div>
          </div>
        )}

        {/* ── Base de Leads ── */}
        {currentTab === 'leads' && (
          <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <LeadsTab />
          </div>
        )}

        {currentTab === 'blacklist' && (
          <div className="page thin-scroll">
            <div className="page-hero">
              <div>
                <h2>Bloqueados <em>e do not call</em></h2>
                <p className="t-caption" style={{ marginTop: 4 }}>Gerencie leads que solicitaram para não receber mensagens</p>
              </div>
            </div>
            <BlacklistTab />
          </div>
        )}
      </div>

      <Toast toast={acompanharToast} onDismiss={dismissAcompanharToast} />
      <Toast toast={gerenciarToast} onDismiss={dismissGerenciarToast} />
      {acompanharConfirmDialog}
      {gerenciarConfirmDialog}
      <ActiveDispatchesModal
        open={showActiveDispatches}
        campaigns={activeCampaigns}
        pausedCampaigns={pausedCampaigns}
        onClose={() => setShowActiveDispatches(false)}
        onStopCampaign={handleStopCampaign}
        onResumeCampaign={handleResumeCampaign}
      />
    </div>
  );
};

/* ── Local presentational helpers ── */

const ManageCard: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string; title: string; desc: string; cta: string;
  onClick?: () => void;
}> = ({ icon, label, title, desc, cta, onClick }) => (
  <div className="card">
    <div className="label">
      <span>{label}</span>
      <span className="ic-circle"><Icon name={icon} size={16} /></span>
    </div>
    <h3 className="t-serif" style={{ fontSize: 22, margin: '2px 0' }}>{title}</h3>
    <p className="t-mono" style={{ fontSize: 12, color: 'var(--ink-50)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
    <button type="button" onClick={onClick} className="btn secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
      <Icon name="plus" size={14} /> {cta}
    </button>
  </div>
);

const StatCard: React.FC<{
  label: string; value: React.ReactNode; icon: React.ComponentProps<typeof Icon>['name'];
  note?: string; tone?: 'white' | 'soft' | 'dark' | 'green';
}> = ({ label, value, icon, note, tone = 'white' }) => (
  <div className={'card' + (tone === 'dark' ? ' accent' : tone === 'soft' ? ' soft' : tone === 'green' ? ' green-border' : '')}>
    <div className="label">
      <span>{label}</span>
      <span className="ic-circle"><Icon name={icon} size={16} /></span>
    </div>
    <div className="num tnum">{value}</div>
    {note && (
      <div className="delta">
        <span className={tone === 'dark' ? '' : 'muted'}>{note}</span>
      </div>
    )}
  </div>
);

/* ── Chart Components ── */

interface ChartProps {
  conversations: Array<{
    dispatch: {
      id: string;
      nome: string;
      telefone: string;
      tipo_campanha: string;
      status: string;
      timestamp_envio: Date;
    };
  }>;
  dataInicio: Date;
  dataFim: Date;
}

const LineChart: React.FC<ChartProps> = ({ conversations, dataInicio, dataFim }) => {
  const dates: string[] = [];
  const currentDate = new Date(dataInicio);
  const endDate = new Date(dataFim);
  currentDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const counts: Record<string, number> = {};
  dates.forEach((d) => {
    counts[d] = 0;
  });

  conversations.forEach((c) => {
    try {
      const day = c.dispatch.timestamp_envio.toISOString().split('T')[0];
      if (counts[day] !== undefined) {
        counts[day]++;
      }
    } catch (e) {}
  });

  const dataPoints = Object.entries(counts);
  const maxVal = Math.max(...Object.values(counts), 4);

  const width = 500;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = dataPoints.map(([date, val], idx) => {
    const x = paddingLeft + (dataPoints.length > 1 ? (idx / (dataPoints.length - 1)) * chartWidth : chartWidth / 2);
    const y = height - paddingBottom - (val / maxVal) * chartHeight;
    return { x, y, val, date };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
    : '';

  const labelInterval = Math.max(1, Math.floor(dataPoints.length / 5));
  const [hoveredPoint, setHoveredPoint] = useState<typeof points[0] | null>(null);

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, position: 'relative' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 16px 0', color: 'var(--navy-700)' }}>
        Disparos por dia
      </h4>

      <div style={{ position: 'relative', width: '100%', height: height }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--navy-500)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--navy-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - paddingBottom - ratio * chartHeight;
            const gridVal = Math.round(ratio * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--paper-200)"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  className="t-mono"
                  fontSize="9"
                  fill="var(--ink-50)"
                  textAnchor="end"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--navy-500)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, idx) => {
            if (idx % labelInterval !== 0 && idx !== points.length - 1) return null;
            const parts = p.date.split('-');
            const labelStr = `${parts[2]}/${parts[1]}`;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - 10}
                className="t-mono"
                fontSize="9"
                fill="var(--ink-50)"
                textAnchor="middle"
              >
                {labelStr}
              </text>
            );
          })}

          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.date === p.date ? 5 : 3.5}
                fill={hoveredPoint?.date === p.date ? "var(--navy-700)" : "var(--navy-500)"}
                stroke="#fff"
                strokeWidth="1.5"
                style={{ transition: 'all 0.1s ease', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 32}%`,
              transform: 'translateX(-50%)',
              background: 'var(--navy-700)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              zIndex: 5,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {new Date(hoveredPoint.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}: {hoveredPoint.val} envios
          </div>
        )}
      </div>
    </div>
  );
};

const CampaignBarChart: React.FC<{ conversations: any[] }> = ({ conversations }) => {
  const prospeccao = conversations.filter((c) => c.dispatch.tipo_campanha === 'prospeccao');
  const reativacao = conversations.filter((c) => c.dispatch.tipo_campanha === 'reativacao');

  const getMetrics = (list: any[]) => {
    const total = list.length;
    const resp = list.filter((c) =>
      ['respondido', 'interessado', 'sem_interesse'].includes(c.dispatch.status)
    ).length;
    const rate = total ? Math.round((resp / total) * 100) : 0;
    return { total, resp, rate };
  };

  const pMet = getMetrics(prospeccao);
  const rMet = getMetrics(reativacao);

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 20px 0', color: 'var(--navy-700)' }}>
        Taxa de resposta por campanha
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, justifyContent: 'center' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-300)' }}>Prospecção</span>
            <span className="t-mono" style={{ fontSize: 12, color: 'var(--ink-50)' }}>
              {pMet.rate}% <span style={{ fontSize: 10, color: 'var(--ink-100)' }}>({pMet.resp}/{pMet.total})</span>
            </span>
          </div>
          <div style={{ height: 14, background: 'var(--paper-100)', borderRadius: 7, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '100%',
                background: 'var(--navy-500)',
                borderRadius: 7,
                transform: `scaleX(${pMet.rate / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.5s var(--ease-out)',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-300)' }}>Reativação</span>
            <span className="t-mono" style={{ fontSize: 12, color: 'var(--ink-50)' }}>
              {rMet.rate}% <span style={{ fontSize: 10, color: 'var(--ink-100)' }}>({rMet.resp}/{rMet.total})</span>
            </span>
          </div>
          <div style={{ height: 14, background: 'var(--paper-100)', borderRadius: 7, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '100%',
                background: 'var(--green-500)',
                borderRadius: 7,
                transform: `scaleX(${rMet.rate / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.5s var(--ease-out)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FunnelChart: React.FC<{ conversations: any[] }> = ({ conversations }) => {
  const disparados = conversations.length;
  const responderam = conversations.filter((c) =>
    ['respondido', 'interessado', 'sem_interesse'].includes(c.dispatch.status)
  ).length;
  const interessados = conversations.filter((c) => c.dispatch.status === 'interessado').length;

  const respPercent = disparados ? Math.round((responderam / disparados) * 100) : 0;
  const intPercent = disparados ? Math.round((interessados / disparados) * 100) : 0;
  const relIntPercent = responderam ? Math.round((interessados / responderam) * 100) : 0;

  const steps = [
    { label: 'Disparados', count: disparados, percent: 100, color: 'var(--navy-600)' },
    { label: 'Responderam', count: responderam, percent: respPercent, color: 'var(--navy-400)', subtitle: `${respPercent}% dos disparados` },
    { label: 'Interessados', count: interessados, percent: intPercent, color: 'var(--green-500)', subtitle: `${relIntPercent}% dos que responderam` },
  ];

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 16px 0', color: 'var(--navy-700)' }}>
        Funil de conversão
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8, flex: 1, justifyContent: 'center' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                width: `${Math.max(35, step.percent)}%`,
                padding: '10px 16px',
                background: step.color,
                color: '#fff',
                borderRadius: 10,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                transition: 'all 0.5s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 12 }}>{step.label}</span>
              <span className="t-mono" style={{ fontSize: 12, fontWeight: 700 }}>
                {step.count} <span style={{ fontSize: 9, opacity: 0.8 }}>({step.percent}%)</span>
              </span>
            </div>
            {step.subtitle && (
              <div className="t-mono" style={{ fontSize: 10, color: 'var(--ink-50)', marginTop: 2, textAlign: 'center' }}>
                {step.subtitle}
              </div>
            )}
            {idx < steps.length - 1 && (
              <div style={{ height: 16, width: 2, background: 'var(--paper-200)', margin: '4px 0' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart: React.FC<{ conversations: any[] }> = ({ conversations }) => {
  const counts: Record<string, number> = {
    interessado: 0,
    respondido: 0,
    sem_interesse: 0,
    enviado: 0,
    pausado: 0,
    erro: 0,
  };

  conversations.forEach((c) => {
    const status = c.dispatch.status;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const colors: Record<string, string> = {
    enviado: 'var(--navy-600)',
    respondido: 'var(--ink-50)',
    interessado: 'var(--green-500)',
    sem_interesse: 'var(--red-500)',
    pausado: 'var(--amber-500)',
    erro: '#991B1B',
  };

  const labels: Record<string, string> = {
    enviado: 'Enviado',
    respondido: 'Respondido',
    interessado: 'Interessado',
    sem_interesse: 'Sem interesse',
    pausado: 'Pausado',
    erro: 'Erro',
  };

  let cumulativePercent = 0;
  const slices = Object.entries(counts)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => {
      const percent = total ? (val / total) * 100 : 0;
      const strokeDashoffset = -cumulativePercent;
      cumulativePercent += percent;
      return {
        key,
        val,
        percent,
        strokeDasharray: `${percent} ${100 - percent}`,
        strokeDashoffset,
        color: colors[key],
        label: labels[key],
      };
    });

  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 16px 0', color: 'var(--navy-700)' }}>
        Distribuição por status
      </h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg viewBox="0 0 42 42" width="100%" height="100%">
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--paper-100)" strokeWidth="4.5" />
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredSlice === slice.key ? 6 : 4.5}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredSlice(slice.key)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
          </svg>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div className="t-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-700)' }}>
              {total}
            </div>
            <div style={{ fontSize: 8, color: 'var(--ink-50)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Leads
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
          {Object.entries(counts).map(([key, val]) => {
            const percent = total ? Math.round((val / total) * 100) : 0;
            if (val === 0) return null;
            const isHovered = hoveredSlice === key;
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: hoveredSlice && !isHovered ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredSlice(key)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[key] }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-200)', flex: 1 }}>{labels[key]}</span>
                <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                  {val} <span style={{ fontSize: 9 }}>({percent}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NumeroSaudeCard: React.FC<{ numero: NumeroSaude | null }> = ({ numero }) => {
  if (!numero) {
    return (
      <div className="card">
        <div className="label">
          <span>Saúde do número</span>
          <span className="ic-circle"><Icon name="phone" size={16} /></span>
        </div>
        <div className="num" style={{ fontSize: 15, color: 'var(--ink-50)' }}>Não sincronizado</div>
      </div>
    );
  }

  const rating = (numero.quality_rating || '').toUpperCase();
  const chip = rating === 'GREEN' ? 'ok' : rating === 'YELLOW' ? 'warn' : rating === 'RED' ? 'err' : 'neutral';
  const label = rating === 'GREEN' ? 'Boa' : rating === 'YELLOW' ? 'Atenção' : rating === 'RED' ? 'Crítica' : 'Desconhecida';

  return (
    <div className="card">
      <div className="label">
        <span>Saúde do número</span>
        <span className="ic-circle"><Icon name="phone" size={16} /></span>
      </div>
      <div className="num" style={{ fontSize: 20 }}>
        <span className={`chip ${chip}`}><span className="dot" />{label}</span>
      </div>
      <div className="delta">
        <span className="muted">
          {numero.messaging_limit_tier || 'sem limite informado'} · {numero.status || '—'}
        </span>
      </div>
    </div>
  );
};

const CustoPorDiaChart: React.FC<{ custoPorDia: CustoPorDia[] }> = ({ custoPorDia }) => {
  const width = 500;
  const height = 200;
  const paddingLeft = 48;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...custoPorDia.map((d) => d.custo_usd), 0.1);

  const points = custoPorDia.map((d, idx) => {
    const x = paddingLeft + (custoPorDia.length > 1 ? (idx / (custoPorDia.length - 1)) * chartWidth : chartWidth / 2);
    const y = height - paddingBottom - (d.custo_usd / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  const [hoveredPoint, setHoveredPoint] = useState<typeof points[0] | null>(null);

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, position: 'relative' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 16px 0', color: 'var(--navy-700)' }}>
        Custo por dia (US$)
      </h4>

      {custoPorDia.length === 0 ? (
        <div className="empty" style={{ height: 180 }}>
          <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>Sem custos registrados no período</span>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGradient-custo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--navy-500)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--navy-500)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = height - paddingBottom - ratio * chartHeight;
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--paper-200)" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 4} className="t-mono" fontSize="9" fill="var(--ink-50)" textAnchor="end">
                    {(ratio * maxVal).toFixed(2)}
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#areaGradient-custo)" />}
            {linePath && <path d={linePath} fill="none" stroke="var(--navy-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

            {points.map((p, idx) => {
              const parts = p.data.split('-');
              const labelStr = `${parts[2]}/${parts[1]}`;
              return (
                <text key={idx} x={p.x} y={height - 10} className="t-mono" fontSize="9" fill="var(--ink-50)" textAnchor="middle">
                  {labelStr}
                </text>
              );
            })}

            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x} cy={p.y}
                  r={hoveredPoint?.data === p.data ? 5 : 3.5}
                  fill={hoveredPoint?.data === p.data ? 'var(--navy-700)' : 'var(--navy-500)'}
                  stroke="#fff" strokeWidth="1.5"
                  style={{ transition: 'all 0.1s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <circle cx={p.x} cy={p.y} r="12" fill="transparent" style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)} />
              </g>
            ))}
          </svg>

          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 32}%`,
                transform: 'translateX(-50%)',
                background: 'var(--navy-700)', color: '#fff', padding: '4px 8px', borderRadius: 6,
                fontSize: 10, fontWeight: 600, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                zIndex: 5, pointerEvents: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)',
              }}
            >
              {new Date(hoveredPoint.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}: US$ {hoveredPoint.custo_usd.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CustoPorTemplateChart: React.FC<{ templates: TemplateKpi[] }> = ({ templates }) => {
  const withDispatches = templates.filter((t) => t.disparosNoPeriodo > 0).sort((a, b) => b.custoEstimadoUsd - a.custoEstimadoUsd);
  const maxVal = Math.max(...withDispatches.map((t) => t.custoEstimadoUsd), 0.1);

  return (
    <div className="card" style={{ padding: 20, flex: 1, minWidth: 280, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      <h4 className="t-serif" style={{ fontSize: 16, margin: '0 0 4px 0', color: 'var(--navy-700)' }}>
        Custo por template
      </h4>
      <span className="t-mono" style={{ fontSize: 10, color: 'var(--ink-50)', marginBottom: 16 }}>
        Estimado — volume de disparos × tarifa da categoria
      </span>

      {withDispatches.length === 0 ? (
        <div className="empty" style={{ flex: 1 }}>
          <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>Sem disparos no período</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
          {withDispatches.slice(0, 6).map((t) => {
            const pct = Math.max(6, (t.custoEstimadoUsd / maxVal) * 100);
            return (
              <div key={t.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-300)', fontFamily: 'var(--font-mono)' }}>{t.nome}</span>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)' }}>
                    US$ {t.custoEstimadoUsd.toFixed(2)} <span style={{ fontSize: 9 }}>({t.disparosNoPeriodo} disparos)</span>
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--paper-100)', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%', width: '100%', background: 'var(--navy-500)', borderRadius: 5,
                      transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.5s var(--ease-out)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
