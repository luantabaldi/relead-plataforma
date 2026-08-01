import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from './Icon';

interface Lead {
  nome: string;
  telefone: string;
}

interface DispatchFormProps {
  onSuccess?: () => void;
}

type Status = { type: 'ok' | 'err'; text: string } | null;

// Templates pré-cadastrados (depois virão do Supabase, via aba Gerenciar)
const TEMPLATES = [
  { id: 'lee_dama_tower', name: 'lee_dama_tower — Studios / apto 1 dorm' },
  { id: 'template-2', name: 'Reativação premium' },
  { id: 'template-3', name: 'Prospecção executiva' },
];

export const DispatchForm: React.FC<DispatchFormProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    campaignName: '',
    campaignType: 'prospeccao' as 'reativacao' | 'prospeccao',
    templateId: '',
    templateName: '',
    empreendimentoId: '',
    empreendimentoNome: '',
    observacao: '',
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingEmpreendimentos, setIsLoadingEmpreendimentos] = useState(true);

  const [templates, setTemplates] = useState<Array<{ id: string; nome: string; tipo?: string; status_meta?: string }>>([]);
  const [showReview, setShowReview] = useState(false);
  const [empreendimentosList, setEmpreendimentosList] = useState<Array<{ id: string; nome: string; descricao_ia: string; ativo: boolean }>>([]);
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState('');

  const [progress, setProgress] = useState({
    active: false,
    campaignName: '',
    total: 0,
    pending: 0,
    success: 0,
    error: 0,
    latestEvents: [] as Array<{ nome: string; status: string; timestamp: string }>,
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const { data, error } = await supabase
          .from('templates_wpp')
          .select('*')
          .order('nome', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setTemplates(data.map((t: any) => ({ id: t.id, nome: t.nome, tipo: t.tipo, status_meta: t.status_meta })));
        } else {
          setTemplates(TEMPLATES.map(t => ({ id: t.id, nome: t.name })));
        }
      } catch (err) {
        console.warn('⚠️ Erro ao carregar templates do Supabase, usando mocks:', err);
        setTemplates(TEMPLATES.map(t => ({ id: t.id, nome: t.name })));
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
          .eq('ativo', true)
          .order('nome', { ascending: true });

        if (error) throw error;
        setEmpreendimentosList(data || []);
      } catch (err) {
        console.warn('⚠️ Erro ao carregar empreendimentos do Supabase:', err);
      } finally {
        setIsLoadingEmpreendimentos(false);
      }
    };

    loadTemplates();
    loadEmpreendimentos();

    return () => {
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      } catch (err) {
        console.warn('⚠️ Falha ao remover canal realtime:', err);
      }
    };
  }, []);

  const handleEmpreendimentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmpreendimentoId(empId);
    if (empId) {
      const selected = empreendimentosList.find((emp) => emp.id === empId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          empreendimentoId: selected.id,
          empreendimentoNome: selected.nome,
          observacao: selected.descricao_ia || '',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        empreendimentoId: '',
        empreendimentoNome: '',
        observacao: '',
      }));
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length <= 1) {
          throw new Error('O arquivo CSV está vazio ou contém apenas o cabeçalho.');
        }

        const delimiter = lines[0].includes(';') ? ';' : ',';

        const parsedLeads: Lead[] = [];
        const skipped: number[] = [];

        lines.slice(1).forEach((line, idx) => {
          const parts = line.split(delimiter).map((s) => s.trim());
          const nome = parts[0] || '';
          const rawTelefone = parts[1] || '';
          let cleanedTelefone = rawTelefone.replace(/\D/g, ''); // limpa formatação (parênteses, traços, etc)
          if (cleanedTelefone && !cleanedTelefone.startsWith('55')) {
            if (cleanedTelefone.length === 11) {
              cleanedTelefone = '55' + cleanedTelefone;
            } else if (cleanedTelefone.length === 10) {
              cleanedTelefone = '55' + cleanedTelefone.slice(0, 2) + '9' + cleanedTelefone.slice(2);
            }
          }
          if (cleanedTelefone && cleanedTelefone.length >= 10) {
            parsedLeads.push({ nome, telefone: cleanedTelefone });
          } else {
            skipped.push(idx + 2); // +2: pula header (linha 1) e ajusta para 1-index
          }
        });

        setLeads(parsedLeads);

        if (skipped.length > 0) {
          const linhas = skipped.length > 10
            ? `${skipped.slice(0, 10).join(', ')}… (+${skipped.length - 10})`
            : skipped.join(', ');
          setStatus({
            type: skipped.length === lines.length - 1 ? 'err' : 'ok',
            text: `${parsedLeads.length} leads carregados. ${skipped.length} linha(s) ignorada(s) por telefone inválido: ${linhas}.`,
          });
        } else {
          setStatus({ type: 'ok', text: `${parsedLeads.length} leads carregados do CSV.` });
        }
      } catch (err) {
        setStatus({ type: 'err', text: `Erro ao processar CSV: ${err instanceof Error ? err.message : 'desconhecido'}` });
      }
    };
    reader.readAsText(file);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.campaignName.trim()) {
      setStatus({ type: 'err', text: 'Nome da campanha é obrigatório.' });
      return;
    }
    if (!formData.templateId) {
      setStatus({ type: 'err', text: 'Selecione um template de mensagem.' });
      return;
    }
    const selectedTemplate = templates.find((t) => t.id === formData.templateId);
    if (selectedTemplate && !isTemplateApproved(selectedTemplate)) {
      setStatus({ type: 'err', text: 'O template selecionado ainda não foi aprovado pela Meta. Escolha outro ou aguarde a aprovação.' });
      return;
    }
    if (leads.length === 0) {
      setStatus({ type: 'err', text: 'Carregue um CSV com leads (nome, telefone).' });
      return;
    }

    setShowReview(true);
  };

  const executeDispatch = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      if (!formData.campaignName.trim()) throw new Error('Nome da campanha é obrigatório.');
      if (!formData.templateId) throw new Error('Selecione um template de mensagem.');
      if (leads.length === 0) throw new Error('Carregue um CSV com leads (nome, telefone).');

      const selectedTemplate = templates.find((t) => t.id === formData.templateId);
      if (selectedTemplate && !isTemplateApproved(selectedTemplate)) {
        throw new Error('O template selecionado ainda não foi aprovado pela Meta.');
      }

      const leadsToInsert = leads.map((lead) => ({
        telefone: lead.telefone,
        nome_lead: lead.nome,
        tipo_campanha: formData.campaignType,
        status_reativacao: 'Pendente',
        data_envio: null,
        mensagem_enviada: selectedTemplate?.nome || '',
        nome_campanha: formData.campaignName,
        observacao_crm: formData.observacao,
        empreendimento_id: formData.empreendimentoId,
        empreendimento_nome: formData.empreendimentoNome,
        historico_mensagens: null, // inicia nulo, n8n preenche no disparo
      }));

      // Inserir no Supabase retornando representação com IDs gerados
      const { data: insertedData, error: insertError } = await supabase
        .from('leads_reativacao')
        .insert(leadsToInsert)
        .select('id, nome_lead, status_reativacao, telefone');

      if (insertError) throw new Error(insertError.message);

      // Cancelar qualquer canal de progresso ativo anterior
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao remover canal anterior:', err);
      }

      // Mapeamento dos IDs inseridos para verificação em tempo real
      const leadMap: Record<string, { nome: string; status: string }> = {};
      const ids = new Set<string>();

      if (insertedData) {
        insertedData.forEach((row) => {
          ids.add(row.id);
          leadMap[row.id] = { nome: row.nome_lead, status: row.status_reativacao };
        });
      }

      // Inicializa o estado de progresso visual
      setProgress({
        active: true,
        campaignName: formData.campaignName,
        total: leads.length,
        pending: leads.length,
        success: 0,
        error: 0,
        latestEvents: [],
      });

      // Configura a subscription do Supabase Realtime
      const channel = supabase
        .channel(`dispatch-progress-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leads_reativacao',
          },
          (payload) => {
            const newRow = payload.new;
            if (newRow && ids.has(newRow.id)) {
              const oldStatus = leadMap[newRow.id]?.status || 'Pendente';
              const newStatus = newRow.status_reativacao;
              leadMap[newRow.id].status = newStatus;

              setProgress((prev) => {
                let successInc = 0;
                let errorInc = 0;
                let pendingDec = 0;

                if (oldStatus === 'Pendente' && newStatus !== 'Pendente') {
                  pendingDec = 1;
                  if (newStatus === 'Enviado' || newStatus === 'Respondido' || newStatus === 'Interessado') {
                    successInc = 1;
                  } else {
                    errorInc = 1;
                  }
                }

                const newEvent = {
                  nome: newRow.nome_lead || 'Lead',
                  status: newStatus,
                  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                };

                const updatedEvents = [newEvent, ...prev.latestEvents].slice(0, 5);

                return {
                  ...prev,
                  pending: Math.max(0, prev.pending - pendingDec),
                  success: prev.success + successInc,
                  error: prev.error + errorInc,
                  latestEvents: updatedEvents,
                };
              });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      // Acionar o Webhook do n8n para rodar o workflow WK3 de disparo manual
      try {
        const webhookResponse = await fetch('https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'iniciar',
            nome_campanha: formData.campaignName,
            tipo_campanha: formData.campaignType,
            template_id: formData.templateId,
          }),
        });

        if (!webhookResponse.ok) {
          console.warn('⚠️ Webhook do n8n respondeu com status:', webhookResponse.status);
        }
      } catch (webhookErr) {
        console.error('⚠️ Falha ao acionar o webhook do n8n:', webhookErr);
      }

      setFormData({
        campaignName: '',
        campaignType: 'prospeccao',
        templateId: '',
        templateName: '',
        empreendimentoId: '',
        empreendimentoNome: '',
        observacao: '',
      });
      setLeads([]);
      setFileName('');
      setShowReview(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatus({ type: 'err', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const set = (patch: Partial<typeof formData>) => setFormData({ ...formData, ...patch });

  const isTemplateApproved = (t: { status_meta?: string }) => !t.status_meta || t.status_meta === 'APPROVED';
  const selectedTemplateForForm = templates.find((t) => t.id === formData.templateId);

  if (progress.active) {
    const pct = progress.total > 0 ? Math.round(((progress.total - progress.pending) / progress.total) * 100) : 0;
    const isFinished = progress.pending === 0;

    return (
      <div className="card" style={{ maxWidth: 680, padding: 28, gap: 24, animation: 'fadeIn 0.3s ease-out' }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-4px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-mono" style={{ color: 'var(--navy-700)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Campanha ativa
            </div>
            <div className="t-h2" style={{ marginTop: 4, fontWeight: 600 }}>{progress.campaignName}</div>
          </div>
          <span className={`chip ${isFinished ? 'success' : 'info'}`} style={{ padding: '6px 12px', display: 'inline-flex', gap: 6 }}>
            <span className="dot" style={{ background: isFinished ? 'var(--emerald-500)' : 'var(--navy-500)' }} />
            {isFinished ? 'Concluído' : 'Disparando'}
          </span>
        </div>

        {/* Barra de Progresso */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--ink-100)' }}>
            <span>Progresso do lote</span>
            <span className="t-mono" style={{ fontWeight: 600 }}>{pct}% ({progress.total - progress.pending} / {progress.total})</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'var(--paper-200)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--navy-500)',
                borderRadius: 99,
                transform: `scaleX(${pct / 100})`,
                transformOrigin: 'left',
                transition: 'transform 0.4s var(--ease-out)',
              }}
            />
          </div>
        </div>

        {/* Indicadores em Grid */}
        <div className="grid grid-cols-3 gap-4" style={{ marginTop: 8 }}>
          <div style={{ background: 'var(--paper-100)', padding: '16px 20px', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-200)', marginBottom: 4 }}>Pendentes</div>
            <div className="t-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-50)' }}>{progress.pending}</div>
          </div>
          <div style={{ background: 'var(--paper-100)', padding: '16px 20px', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-200)', marginBottom: 4 }}>Sucesso</div>
            <div className="t-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--emerald-500)' }}>{progress.success}</div>
          </div>
          <div style={{ background: 'var(--paper-100)', padding: '16px 20px', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-200)', marginBottom: 4 }}>Falhas</div>
            <div className="t-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--rose-500)' }}>{progress.error}</div>
          </div>
        </div>

        {/* Logs de Últimos Eventos */}
        {progress.latestEvents.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div className="t-label" style={{ marginBottom: 10 }}>Feed de Disparos em tempo real</div>
            <div
              className="thin-scroll"
              style={{
                background: 'var(--paper-100)', border: '1px solid var(--paper-200)',
                borderRadius: 14, padding: 14, maxHeight: 160, display: 'flex', flexDirection: 'column', gap: 8,
                overflowY: 'auto'
              }}
            >
              {progress.latestEvents.map((evt, idx) => {
                const isSuccess = evt.status === 'Enviado';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      fontSize: 12, paddingBottom: idx === progress.latestEvents.length - 1 ? 0 : 8,
                      borderBottom: idx === progress.latestEvents.length - 1 ? 'none' : '1px solid var(--paper-200)',
                      animation: 'slideIn 0.2s ease-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`dot ${isSuccess ? 'success' : 'err'}`} style={{ width: 6, height: 6 }} />
                      <span style={{ color: 'var(--ink-100)' }}>{evt.nome}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span
                        className={`chip ${isSuccess ? 'success' : 'danger'}`}
                        style={{ fontSize: 10, padding: '2px 6px', fontWeight: 600 }}
                      >
                        {evt.status}
                      </span>
                      <span className="t-mono" style={{ color: 'var(--ink-300)', fontSize: 11 }}>{evt.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ação de Conclusão */}
        {isFinished ? (
          <button
            type="button"
            onClick={() => {
              setProgress({
                active: false,
                campaignName: '',
                total: 0,
                pending: 0,
                success: 0,
                error: 0,
                latestEvents: [],
              });
              onSuccess?.();
            }}
            className="btn primary lg block"
            style={{ marginTop: 8 }}
          >
            <Icon name="check" size={16} />
            Novo disparo
          </button>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: 'var(--ink-200)', fontSize: 12, marginTop: 4 }}>
            <span className="spinner" />
            <span>O n8n está processando o lote e disparando…</span>
          </div>
        )}
      </div>
    );
  }

  if (showReview) {
    const reviewTemplate = templates.find((t) => t.id === formData.templateId);
    const approved = reviewTemplate ? isTemplateApproved(reviewTemplate) : false;

    return (
      <div className="card" style={{ maxWidth: 640, padding: 28, gap: 22 }}>
        <div className="label">
          <span>Revisar disparo</span>
          <span className="ic-circle"><Icon name="eye" size={16} /></span>
        </div>

        <p className="hint" style={{ margin: 0 }}>
          Confira os dados antes de enviar. Depois de confirmado, as mensagens começam a sair para os leads abaixo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ReviewRow label="Campanha" value={formData.campaignName} />
          <ReviewRow label="Tipo" value={formData.campaignType === 'reativacao' ? 'Reativação' : 'Prospecção'} />
          <ReviewRow
            label="Template"
            value={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {formData.templateName || '—'}
                <span className={`chip ${approved ? 'success' : 'danger'}`}>
                  <span className="dot" />
                  {approved ? 'Aprovado' : 'Não aprovado'}
                </span>
              </span>
            }
          />
          {formData.empreendimentoNome && (
            <ReviewRow label="Empreendimento" value={formData.empreendimentoNome} />
          )}
          <ReviewRow label="Destinatários" value={`${leads.length} leads`} />
        </div>

        {!approved && (
          <div className="banner err">
            <Icon name="alert-triangle" size={18} />
            Este template não está aprovado pela Meta. Corrija antes de continuar — enviar um template não aprovado pode banir o número de WhatsApp.
          </div>
        )}

        <div
          className="thin-scroll"
          style={{
            background: 'var(--paper-100)', border: '1px solid var(--paper-200)',
            borderRadius: 14, padding: 14, maxHeight: 180, overflowY: 'auto',
          }}
        >
          <div className="t-label" style={{ marginBottom: 10 }}>Primeiros destinatários</div>
          {leads.slice(0, 6).map((lead, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 12,
                padding: '6px 0', borderTop: i ? '1px solid var(--paper-200)' : 'none',
              }}
            >
              <span style={{ color: 'var(--ink-200)' }}>{lead.nome || '—'}</span>
              <span className="t-mono tnum" style={{ color: 'var(--ink-50)', fontSize: 12 }}>{lead.telefone}</span>
            </div>
          ))}
          {leads.length > 6 && (
            <div className="t-mono" style={{ color: 'var(--navy-700)', fontSize: 11, marginTop: 8 }}>
              + {leads.length - 6} adicionais
            </div>
          )}
        </div>

        {status && (
          <div className={`banner ${status.type === 'ok' ? 'ok' : 'err'}`}>
            <Icon name={status.type === 'ok' ? 'check-circle' : 'alert-triangle'} size={18} />
            {status.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => setShowReview(false)} disabled={isLoading}>
            <Icon name="chevron-left" size={16} /> Voltar e editar
          </button>
          <button
            type="button"
            className="btn primary"
            style={{ flex: 2 }}
            disabled={isLoading || !approved}
            onClick={executeDispatch}
          >
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span className="spinner" style={{ borderColor: 'rgba(255, 255, 255, 0.3)', borderLeftColor: '#fff', width: 14, height: 14, borderWidth: 2 }} />
                Disparando…
              </span>
            ) : (
              <>
                <Icon name="send" size={16} />
                Confirmar disparo para {leads.length} leads
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 28, gap: 20 }}>
      <div className="label">
        <span>Novo disparo</span>
        <span className="ic-circle"><Icon name="send" size={16} /></span>
      </div>

      <form onSubmit={handleReviewSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5" style={{ alignItems: 'start' }}>
        {/* ── Coluna 1: dados da campanha ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Nome + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="campaignNameInput">Nome da campanha *</label>
            <input
              id="campaignNameInput"
              name="campaignName"
              className="input"
              type="text"
              value={formData.campaignName}
              onChange={(e) => set({ campaignName: e.target.value })}
              placeholder="Junho 2026"
              autoComplete="off"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="campaignTypeSelect">Tipo de campanha *</label>
            <select
              id="campaignTypeSelect"
              name="campaignType"
              className="input"
              value={formData.campaignType}
              onChange={(e) => set({ campaignType: e.target.value as 'reativacao' | 'prospeccao', templateId: '', templateName: '' })}
              required
            >
              <option value="prospeccao">Prospecção</option>
              <option value="reativacao">Reativação</option>
            </select>
          </div>
        </div>

        {/* Template */}
        <div className="field">
          <label htmlFor="templateSelect">Template de mensagem *</label>
          <select
            id="templateSelect"
            name="templateId"
            className="input"
            value={formData.templateId}
            onChange={(e) => {
              const template = templates.find((t) => t.id === e.target.value);
              set({ templateId: e.target.value, templateName: template?.nome || '' });
            }}
            required
          >
            {isLoadingTemplates ? (
              <option value="">Carregando templates…</option>
            ) : templates.length === 0 ? (
              <option value="">Nenhum template cadastrado</option>
            ) : (
              <option value="">Selecione um template</option>
            )}
            {!isLoadingTemplates && templates
              .filter((t) => !t.tipo || t.tipo === formData.campaignType || t.tipo === 'nao_classificado')
              .map((t) => {
                const approved = isTemplateApproved(t);
                const unclassified = t.tipo === 'nao_classificado';
                let suffix = '';
                if (!approved) {
                  suffix = ` — ${t.status_meta === 'REJECTED' ? 'rejeitado pela Meta' : 'aguardando aprovação'}`;
                } else if (unclassified) {
                  suffix = ' — classifique o tipo em Gerenciar';
                }
                return (
                  <option key={t.id} value={t.id} disabled={!approved || unclassified}>
                    {t.nome}{suffix}
                  </option>
                );
              })}
          </select>
          {selectedTemplateForForm && !isTemplateApproved(selectedTemplateForForm) ? (
            <span className="hint" style={{ color: 'var(--red-500)' }}>
              Este template ainda não foi aprovado pela Meta e não pode ser usado em um disparo real.
            </span>
          ) : (
            <span className="hint">Templates novos sincronizados da Meta aparecem aqui após classificados na aba Gerenciar.</span>
          )}
        </div>

        {/* Seleção de Empreendimento Cadastrado */}
        <div className="field">
          <label htmlFor="empreendimentoSelect">Empreendimento Cadastrado</label>
          <select
            id="empreendimentoSelect"
            name="selectedEmpreendimentoId"
            className="input"
            value={selectedEmpreendimentoId}
            onChange={handleEmpreendimentoChange}
          >
            {isLoadingEmpreendimentos ? (
              <option value="">Carregando empreendimentos…</option>
            ) : empreendimentosList.length === 0 ? (
              <option value="">Nenhum empreendimento cadastrado</option>
            ) : (
              <option value="">-- Digitar Manualmente ou Escolher Empreendimento --</option>
            )}
            {!isLoadingEmpreendimentos && empreendimentosList.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome} (ID: {emp.id})
              </option>
            ))}
          </select>
          <span className="hint">Opcional. Selecione para preencher os dados do empreendimento e a observação para a IA automaticamente.</span>
        </div>

        {/* Empreendimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="field">
            <label htmlFor="empreendimentoIdInput">ID do empreendimento</label>
            <input
              id="empreendimentoIdInput"
              name="empreendimentoId"
              className="input tnum"
              type="text"
              value={formData.empreendimentoId}
              onChange={(e) => set({ empreendimentoId: e.target.value })}
              placeholder="152"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="empreendimentoNomeInput">Nome do empreendimento</label>
            <input
              id="empreendimentoNomeInput"
              name="empreendimentoNome"
              className="input"
              type="text"
              value={formData.empreendimentoNome}
              onChange={(e) => set({ empreendimentoNome: e.target.value })}
              placeholder="Lee Dama Tower"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Observação */}
        <div className="field">
          <label htmlFor="observacaoTextarea">Observação para a IA</label>
          <textarea
            id="observacaoTextarea"
            name="observacao"
            className="input"
            value={formData.observacao}
            onChange={(e) => set({ observacao: e.target.value })}
            placeholder="Studios e apto 1 dorm para moradia e investimento, 800 m do mar."
            rows={3}
          />
        </div>
        </div>

        {/* ── Coluna 2: leads & disparo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Upload CSV */}
        <div className="field">
          <label htmlFor="csvFileInput">Leads (CSV) *</label>
          <input
            id="csvFileInput"
            name="leadsCsv"
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            autoComplete="off"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn secondary"
            style={{ alignSelf: 'flex-start' }}
          >
            <Icon name="upload" size={16} />
            {fileName || 'Selecionar arquivo'}
          </button>
          <span className="hint">Colunas: nome, telefone. A primeira linha (cabeçalho) é ignorada.</span>

          {leads.length > 0 && (
            <div
              className="thin-scroll"
              style={{
                marginTop: 4, background: 'var(--paper-100)', border: '1px solid var(--paper-200)',
                borderRadius: 14, padding: 14, maxHeight: 180, overflowY: 'auto',
              }}
            >
              <div className="t-label" style={{ marginBottom: 10 }}>
                {leads.length} leads carregados
              </div>
              {leads.slice(0, 6).map((lead, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    padding: '6px 0', borderTop: i ? '1px solid var(--paper-200)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--ink-200)' }}>{lead.nome || '—'}</span>
                  <span className="t-mono tnum" style={{ color: 'var(--ink-50)', fontSize: 12 }}>{lead.telefone}</span>
                </div>
              ))}
              {leads.length > 6 && (
                <div className="t-mono" style={{ color: 'var(--navy-700)', fontSize: 11, marginTop: 8 }}>
                  + {leads.length - 6} adicionais
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        {status && (
          <div className={`banner ${status.type === 'ok' ? 'ok' : 'err'}`}>
            <Icon name={status.type === 'ok' ? 'check-circle' : 'alert-triangle'} size={18} />
            {status.text}
          </div>
        )}

        {/* CTA */}
        <button type="submit" disabled={leads.length === 0} className="btn primary lg block">
          <Icon name="eye" size={16} />
          {leads.length > 0 ? `Revisar disparo para ${leads.length} leads` : 'Revisar disparo'}
        </button>
        </div>
      </form>
    </div>
  );
};

const ReviewRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--paper-200)', paddingBottom: 10 }}>
    <span className="t-label">{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--ink-300)', fontSize: 13, textAlign: 'right' }}>{value}</span>
  </div>
);
