import React, { useState } from 'react';
import { useAgentes } from '../hooks/useAgentes';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { Toast } from './Toast';
import { Icon } from './Icon';
import { friendlyError } from '../lib/friendlyError';
import { AGENTE_NOVO, Agente, AgenteForm, PerguntaForm, TipoCampanha, agenteParaForm, validarAgente } from '../lib/agentes';

const th: React.CSSProperties = { padding: '14px 20px', fontWeight: 600, color: 'var(--ink-100)' };
const td: React.CSSProperties = { padding: '14px 20px', color: 'var(--ink-100)', verticalAlign: 'top' };

export const AgentesTab: React.FC = () => {
  const { agentes, isLoading, error, salvar, alternarAtivo } = useAgentes();
  const { toast, notify, dismiss } = useToast();
  const [confirm, confirmDialog] = useConfirm();

  const [form, setForm] = useState<AgenteForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ehQualificacao = form?.modo === 'qualificacao';
  const editando = !!form?.id;

  const atualizar = (parcial: Partial<AgenteForm>) => setForm((f) => (f ? { ...f, ...parcial } : f));

  const alterarPergunta = (i: number, parcial: Partial<PerguntaForm>) =>
    atualizar({ perguntas: form!.perguntas.map((p, idx) => (idx === i ? { ...p, ...parcial } : p)) });

  const moverPergunta = (i: number, delta: -1 | 1) => {
    const destino = i + delta;
    if (!form || destino < 0 || destino >= form.perguntas.length) return;
    const perguntas = [...form.perguntas];
    [perguntas[i], perguntas[destino]] = [perguntas[destino], perguntas[i]];
    atualizar({ perguntas });
  };

  const removerPergunta = (i: number) => {
    if (!form || form.perguntas.length <= 1) return;
    const perguntas = form.perguntas.filter((_, idx) => idx !== i);
    atualizar({ perguntas, min_perguntas: Math.min(form.min_perguntas, perguntas.length) });
  };

  const adicionarPergunta = () => atualizar({ perguntas: [...form!.perguntas, { pergunta: '', opcoes: '' }] });

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const problema = validarAgente(form, agentes);
    if (problema) {
      notify('err', problema);
      return;
    }
    try {
      setIsSaving(true);
      await salvar(form);
      notify('ok', editando ? 'Agente atualizado' : 'Agente criado');
      setForm(null);
    } catch (err) {
      console.error('Erro ao salvar agente:', err);
      notify('err', friendlyError(err, 'Não foi possível salvar o agente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAlternar = async (agente: Agente) => {
    if (agente.padrao && agente.ativo) {
      notify('err', 'O agente padrão não pode ser desativado.');
      return;
    }
    if (agente.ativo) {
      const ok = await confirm({
        title: `Desativar "${agente.nome}"?`,
        message: 'Ele deixa de aparecer na escolha do agente nos novos disparos. Leads que já estão em conversa não são afetados.',
        confirmLabel: 'Desativar',
        tone: 'danger',
      });
      if (!ok) return;
    }
    try {
      await alternarAtivo(agente);
      notify('ok', agente.ativo ? 'Agente desativado' : 'Agente ativado');
    } catch (err) {
      console.error('Erro ao alterar agente:', err);
      notify('err', friendlyError(err, 'Não foi possível alterar o agente'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="t-h2" style={{ margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="cpu" size={20} /> Agentes de IA
          </h3>
          <p className="t-caption" style={{ margin: '4px 0 0', color: 'var(--ink-200)' }}>
            Cada disparo usa um agente. Os de qualificação fazem as perguntas abaixo e só então enviam o lead ao CRM.
          </p>
        </div>
        {!form && (
          <button type="button" className="btn primary" onClick={() => setForm({ ...AGENTE_NOVO })}>
            <Icon name="plus" size={14} /> Novo agente de qualificação
          </button>
        )}
      </div>

      {form && (
        <div className="card" style={{ padding: 24 }}>
          <h4 className="t-serif" style={{ fontSize: 18, margin: 0, color: 'var(--navy-700)' }}>
            {editando ? `Editar ${form.nome || 'agente'}` : 'Novo agente de qualificação'}
          </h4>

          <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label htmlFor="agenteNome">Nome *</label>
                <input
                  id="agenteNome"
                  className="input"
                  placeholder="ex: Qualificação — Minha Casa Minha Vida"
                  value={form.nome}
                  onChange={(e) => atualizar({ nome: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="agenteDescricao">Descrição</label>
                <input
                  id="agenteDescricao"
                  className="input"
                  placeholder="Para que serve este agente"
                  value={form.descricao}
                  onChange={(e) => atualizar({ descricao: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>

            {ehQualificacao && (
              <div className="field" style={{ maxWidth: 360 }}>
                <label htmlFor="agenteTipo">Tipo de campanha</label>
                <select
                  id="agenteTipo"
                  className="input"
                  value={form.tipo_campanha}
                  onChange={(e) => atualizar({ tipo_campanha: e.target.value as TipoCampanha })}
                >
                  <option value="prospeccao">Prospecção (leads novos)</option>
                  <option value="reativacao">Reativação (leads antigos)</option>
                </select>
                <span className="t-caption">Define o tipo registrado nos leads dos disparos feitos com este agente.</span>
              </div>
            )}

            {!ehQualificacao && (
              <p className="t-caption" style={{ margin: 0, color: 'var(--ink-200)' }}>
                Este agente conversa pelo prompt configurado no n8n. Aqui você só altera nome, descrição e se está ativo.
              </p>
            )}

            {ehQualificacao && (
              <>
                <div className="field">
                  <label>Perguntas de qualificação *</label>
                  <span className="t-caption">
                    O agente faz uma por mensagem, nesta ordem. Se a pergunta tiver opções, o lead responde pelo número.
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                    {form.perguntas.map((p, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="t-caption" style={{ width: 20, textAlign: 'right' }}>{i + 1}.</span>
                          <input
                            className="input"
                            aria-label={`Pergunta ${i + 1}`}
                            placeholder="ex: Você possui FGTS que pretende utilizar na compra?"
                            value={p.pergunta}
                            onChange={(e) => alterarPergunta(i, { pergunta: e.target.value })}
                            style={{ flex: 1 }}
                          />
                          <button type="button" className="btn ghost" aria-label={`Subir pergunta ${i + 1}`}
                            onClick={() => moverPergunta(i, -1)} disabled={i === 0} style={{ padding: 6, minWidth: 'auto' }}>
                            <Icon name="chevron-up" size={14} />
                          </button>
                          <button type="button" className="btn ghost" aria-label={`Descer pergunta ${i + 1}`}
                            onClick={() => moverPergunta(i, 1)} disabled={i === form.perguntas.length - 1} style={{ padding: 6, minWidth: 'auto' }}>
                            <Icon name="chevron-down" size={14} />
                          </button>
                          <button type="button" className="btn ghost" aria-label={`Remover pergunta ${i + 1}`}
                            onClick={() => removerPergunta(i)} disabled={form.perguntas.length <= 1} style={{ padding: 6, minWidth: 'auto' }}>
                            <Icon name="trash" size={14} style={{ color: 'var(--rose-500)' }} />
                          </button>
                        </div>
                        <input
                          className="input"
                          aria-label={`Rótulo da pergunta ${i + 1}`}
                          placeholder="Rótulo curto no CRM (ex.: Renda familiar)"
                          value={p.rotulo ?? ''}
                          onChange={(e) => alterarPergunta(i, { rotulo: e.target.value })}
                          style={{ marginLeft: 28, width: 'calc(100% - 28px)' }}
                        />
                        <textarea
                          className="input"
                          aria-label={`Opções da pergunta ${i + 1}`}
                          rows={Math.max(2, Math.min(6, p.opcoes.split('\n').length))}
                          placeholder={'Opções de resposta, uma por linha (deixe vazio para resposta livre)\nex:\nSim\nNão\nTenho, mas não sei quanto'}
                          value={p.opcoes}
                          onChange={(e) => alterarPergunta(i, { opcoes: e.target.value })}
                          style={{ marginLeft: 28, width: 'calc(100% - 28px)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn secondary" onClick={adicionarPergunta} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                    <Icon name="plus" size={14} /> Adicionar pergunta
                  </button>
                </div>

                <div className="field" style={{ maxWidth: 280 }}>
                  <label htmlFor="agenteMin">Mínimo de perguntas respondidas *</label>
                  <input
                    id="agenteMin"
                    type="number"
                    className="input"
                    min={1}
                    max={form.perguntas.length}
                    value={form.min_perguntas}
                    onChange={(e) => atualizar({ min_perguntas: Number(e.target.value) })}
                  />
                  <span className="t-caption">O lead só vai para o CRM depois de responder pelo menos esse número.</span>
                </div>

                <div className="field">
                  <label htmlFor="agenteCriterio">Critério: quando o lead é qualificado ou desqualificado *</label>
                  <textarea
                    id="agenteCriterio"
                    className="input"
                    rows={3}
                    placeholder="ex: Qualificado se tem renda dentro do programa e prazo de até 12 meses. Desqualificado se já possui imóvel ou não tem interesse."
                    value={form.criterio_qualificacao}
                    onChange={(e) => atualizar({ criterio_qualificacao: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agenteInstrucoes">Instruções de tom e limites (opcional)</label>
                  <textarea
                    id="agenteInstrucoes"
                    className="input"
                    rows={3}
                    placeholder="ex: Linguagem simples. Nunca prometa aprovação de financiamento."
                    value={form.instrucoes}
                    onChange={(e) => atualizar({ instrucoes: e.target.value })}
                  />
                </div>
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => atualizar({ ativo: e.target.checked })}
              />
              <span>Ativo (aparece na escolha do agente no disparo)</span>
            </label>

            <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
              <button type="submit" className="btn primary" disabled={isSaving}>
                <Icon name="check" size={14} /> {isSaving ? 'Salvando…' : 'Salvar agente'}
              </button>
              <button type="button" className="btn secondary" onClick={() => setForm(null)} disabled={isSaving}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>Carregando agentes…</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--rose-500)' }}>Não foi possível carregar os agentes.</div>
        ) : agentes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-200)' }}>Nenhum agente cadastrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--paper-100)', borderBottom: '1px solid var(--paper-200)' }}>
                <th style={th}>Agente</th>
                <th style={{ ...th, width: 140 }}>Tipo</th>
                <th style={{ ...th, width: 150 }}>Perguntas</th>
                <th style={{ ...th, width: 100 }}>Status</th>
                <th style={{ ...th, width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agentes.map((a, idx) => (
                <tr key={a.id} style={{ borderBottom: idx === agentes.length - 1 ? 'none' : '1px solid var(--paper-200)' }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-50)' }}>{a.nome}</div>
                    {a.descricao && <div className="t-caption" style={{ color: 'var(--ink-200)' }}>{a.descricao}</div>}
                  </td>
                  <td style={td}>{a.modo === 'qualificacao' ? 'Qualificação' : 'Conversa'}</td>
                  <td style={td}>
                    {a.modo === 'qualificacao'
                      ? `${a.perguntas.length} (mín. ${a.min_perguntas ?? a.perguntas.length})`
                      : <span style={{ color: 'var(--ink-300)' }}>—</span>}
                  </td>
                  <td style={td}>{a.ativo ? 'Ativo' : <span style={{ color: 'var(--ink-300)' }}>Inativo</span>}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="btn ghost" style={{ padding: 6, minWidth: 'auto' }}
                        title="Editar" aria-label={`Editar ${a.nome}`} onClick={() => setForm(agenteParaForm(a))}>
                        <Icon name="pencil" size={14} />
                      </button>
                      <button type="button" className="btn ghost" style={{ padding: 6, minWidth: 'auto' }}
                        title={a.ativo ? 'Desativar' : 'Ativar'} aria-label={`${a.ativo ? 'Desativar' : 'Ativar'} ${a.nome}`}
                        onClick={() => handleAlternar(a)}>
                        <Icon name={a.ativo ? 'pause' : 'play'} size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast toast={toast} onDismiss={dismiss} />
      {confirmDialog}
    </div>
  );
};
