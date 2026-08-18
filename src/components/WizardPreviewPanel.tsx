import React from 'react';
import { Icon } from './Icon';

export interface Lead {
  nome: string;
  telefone: string;
}

export interface CsvStats {
  totalLines: number;
  validNumbers: number;
  duplicatesRemoved: number;
  invalidSkipped: number;
}

export interface CostEstimate {
  avgPerMsg: number;
  sampleSize: number;
}

interface WizardFormData {
  campaignName: string;
  campaignType: 'reativacao' | 'prospeccao';
  templateName: string;
  empreendimentoNome: string;
  observacao: string;
  imagemUrl: string;
}

interface TemplateForPreview {
  nome: string;
  componentes?: any[];
}

interface WizardPreviewPanelProps {
  step: number;
  formData: WizardFormData;
  selectedTemplate?: TemplateForPreview;
  leads: Lead[];
  csvStats: CsvStats | null;
  costEstimate: CostEstimate | null;
  isLoadingCostEstimate: boolean;
}

/**
 * Right-hand column of the campaign wizard's split-screen layout — swaps
 * its content by step so the operator sees a live consequence of what
 * they're filling in on the left, instead of an idle empty panel.
 */
export const WizardPreviewPanel: React.FC<WizardPreviewPanelProps> = ({
  step, formData, selectedTemplate, leads, csvStats, costEstimate, isLoadingCostEstimate,
}) => {
  return (
    <div style={{ position: 'sticky', top: 0 }}>
      {step === 1 && <SummaryPreview formData={formData} />}
      {step === 2 && <WhatsAppPreview formData={formData} selectedTemplate={selectedTemplate} />}
      {step === 3 && <LeadsStatusPreview csvStats={csvStats} leadsCount={leads.length} />}
      {step === 4 && (
        <FinancialPreview
          formData={formData}
          leadsCount={leads.length}
          costEstimate={costEstimate}
          isLoading={isLoadingCostEstimate}
        />
      )}
    </div>
  );
};

/* ── Passo 1 — Resumo da campanha ── */

const SummaryPreview: React.FC<{ formData: WizardFormData }> = ({ formData }) => (
  <div className="card" style={{ padding: 28, gap: 20 }}>
    <div className="label">
      <span>Resumo da campanha</span>
      <span className="ic-circle"><Icon name="file-text" size={16} /></span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PreviewRow icon="megaphone" label="Nome" value={formData.campaignName} placeholder="Ainda não definido" />
      <PreviewRow
        icon="send"
        label="Tipo"
        value={formData.campaignType === 'reativacao' ? 'Reativação' : 'Prospecção'}
      />
      <PreviewRow icon="building" label="Empreendimento" value={formData.empreendimentoNome} placeholder="Nenhum selecionado" />
    </div>
    {formData.observacao && (
      <div style={{ borderTop: '1px solid var(--paper-200)', paddingTop: 16 }}>
        <div className="t-label" style={{ marginBottom: 8 }}>Observação para a IA</div>
        <p style={{ fontSize: 13, color: 'var(--ink-200)', lineHeight: 1.5, margin: 0 }}>{formData.observacao}</p>
      </div>
    )}
  </div>
);

const PreviewRow: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string; placeholder?: string }> = ({ icon, label, value, placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <span className="ic-circle" style={{ flexShrink: 0 }}><Icon name={icon} size={15} /></span>
    <div style={{ minWidth: 0 }}>
      <div className="t-label">{label}</div>
      <div
        style={{
          fontSize: 14, fontWeight: 600, marginTop: 2,
          color: value ? 'var(--ink-300)' : 'var(--ink-50)',
          fontStyle: value ? 'normal' : 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {value || placeholder}
      </div>
    </div>
  </div>
);

/* ── Passo 2 — Mockup do WhatsApp ── */

function getTemplateParts(t?: TemplateForPreview) {
  const comps = t?.componentes || [];
  const header = comps.find((c: any) => c?.type === 'HEADER');
  const body = comps.find((c: any) => c?.type === 'BODY');
  const footer = comps.find((c: any) => c?.type === 'FOOTER');
  const buttonsComp = comps.find((c: any) => c?.type === 'BUTTONS');
  return {
    headerText: header?.format === 'TEXT' ? header.text : null,
    headerIsImage: header?.format === 'IMAGE',
    bodyText: body?.text as string | undefined,
    footerText: footer?.text as string | undefined,
    buttons: (buttonsComp?.buttons as Array<{ text: string }> | undefined) || [],
  };
}

/** Highlights {{1}}, {{2}}… placeholders inline instead of resolving them —
 * this app fills variables via AI at send time, not in the wizard. */
function renderBodyWithVariables(text: string) {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{\d+\}\}$/.test(part) ? (
      <span key={i} style={{ background: 'rgba(7, 94, 84, 0.14)', color: '#075E54', fontWeight: 700, padding: '0 3px', borderRadius: 4 }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const DoubleCheck: React.FC = () => (
  <svg width="15" height="10" viewBox="0 0 16 11" fill="none">
    <path d="M11.5 0.7 4.7 7.5 2 4.8" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 0.7 8.2 7.5" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WhatsAppPreview: React.FC<{ formData: WizardFormData; selectedTemplate?: TemplateForPreview }> = ({ formData, selectedTemplate }) => {
  const { headerText, headerIsImage, bodyText, footerText, buttons } = getTemplateParts(selectedTemplate);
  const hasBody = !!bodyText;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div className="t-label">Pré-visualização no WhatsApp</div>

      <div style={{ width: 300, borderRadius: 34, background: '#0B0B0B', padding: '16px 10px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ borderRadius: 22, overflow: 'hidden', background: '#E5DDD5', minHeight: 440, display: 'flex', flexDirection: 'column' }}>
          {/* Barra de topo, estilo WhatsApp */}
          <div style={{ background: '#075E54', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="building" size={16} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sym Imóveis</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>online</div>
            </div>
          </div>

          {/* Área de conversa */}
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {!selectedTemplate ? (
              <div style={{ textAlign: 'center', color: '#5B6A64', fontSize: 12, padding: '0 8px' }}>
                Selecione um template para ver a mensagem aqui.
              </div>
            ) : !hasBody ? (
              <div style={{ textAlign: 'center', color: '#5B6A64', fontSize: 12, padding: '0 8px' }}>
                Este template ainda não tem o corpo da mensagem sincronizado com a Meta — a pré-visualização aparece assim que ele sincronizar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    background: '#D9FDD3', borderRadius: '10px 10px 2px 10px', padding: 10,
                    maxWidth: '86%', boxShadow: '0 1px 1px rgba(0,0,0,0.12)',
                  }}
                >
                  {headerIsImage && (
                    formData.imagemUrl ? (
                      <img src={formData.imagemUrl} alt="Header do template" style={{ width: '100%', borderRadius: 8, marginBottom: 6, display: 'block', objectFit: 'cover', maxHeight: 140 }} />
                    ) : (
                      <div style={{ width: '100%', height: 110, background: '#C3C9C4', borderRadius: 8, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B6A64' }}>
                        <Icon name="upload" size={20} />
                      </div>
                    )
                  )}
                  {headerText && (
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#111B21' }}>{headerText}</div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: '#111B21', whiteSpace: 'pre-wrap' }}>
                    {renderBodyWithVariables(bodyText || '')}
                  </div>
                  {footerText && (
                    <div style={{ fontSize: 11, color: '#667781', marginTop: 6 }}>{footerText}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#667781' }}>agora</span>
                    <DoubleCheck />
                  </div>
                </div>

                {buttons.length > 0 && (
                  <div style={{ width: '86%', marginTop: 2, background: '#fff', borderRadius: '0 0 10px 10px', boxShadow: '0 1px 1px rgba(0,0,0,0.12)' }}>
                    {buttons.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '9px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#00A5F4',
                          borderTop: i > 0 ? '1px solid #F0F0F0' : 'none',
                        }}
                      >
                        {b.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Passo 3 — Status da base ── */

const LeadsStatusPreview: React.FC<{ csvStats: CsvStats | null; leadsCount: number }> = ({ csvStats, leadsCount }) => (
  <div className="card" style={{ padding: 28, gap: 20 }}>
    <div className="label">
      <span>Status da base</span>
      <span className="ic-circle"><Icon name="upload" size={16} /></span>
    </div>

    {!csvStats ? (
      <div className="empty">
        <span className="ic"><Icon name="file-text" size={22} /></span>
        <span className="t-mono" style={{ color: 'var(--ink-50)', fontSize: 12 }}>Nenhum arquivo carregado ainda</span>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CsvStatRow label="Linhas lidas" value={csvStats.totalLines} tone="neutral" />
        <CsvStatRow label="Números válidos" value={csvStats.validNumbers} tone="ok" />
        <CsvStatRow label="Duplicados removidos" value={csvStats.duplicatesRemoved} tone="warn" />
        {csvStats.invalidSkipped > 0 && (
          <CsvStatRow label="Inválidos ignorados" value={csvStats.invalidSkipped} tone="err" />
        )}
        <div style={{ borderTop: '1px solid var(--paper-200)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-300)' }}>Leads que receberão a mensagem</span>
          <span className="t-mono tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-600)' }}>{leadsCount}</span>
        </div>
      </div>
    )}
  </div>
);

const CsvStatRow: React.FC<{ label: string; value: number; tone: 'neutral' | 'ok' | 'warn' | 'err' }> = ({ label, value, tone }) => {
  const chipClass = tone === 'ok' ? 'success' : tone === 'warn' ? 'warning' : tone === 'err' ? 'danger' : 'neutral';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--ink-200)' }}>{label}</span>
      <span className={`chip ${chipClass}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
};

/* ── Passo 4 — Resumo financeiro e de impacto ── */

const FinancialPreview: React.FC<{
  formData: WizardFormData; leadsCount: number; costEstimate: CostEstimate | null; isLoading: boolean;
}> = ({ formData, leadsCount, costEstimate, isLoading }) => {
  const total = costEstimate ? costEstimate.avgPerMsg * leadsCount : null;

  return (
    <div className="card" style={{ padding: 28, gap: 20 }}>
      <div className="label">
        <span>Resumo financeiro</span>
        <span className="ic-circle"><Icon name="wallet" size={16} /></span>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div className="t-label">Custo estimado da campanha</div>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <span className="spinner" />
          </div>
        ) : total !== null ? (
          <>
            <div className="num tnum" style={{ fontSize: 36, marginTop: 6 }}>US$ {total.toFixed(2)}</div>
            <div className="t-mono" style={{ fontSize: 11, color: 'var(--ink-50)', marginTop: 6 }}>
              ~US$ {costEstimate!.avgPerMsg.toFixed(4)} por mensagem · baseado em {costEstimate!.sampleSize} disparo(s) anteriores deste template
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-50)', marginTop: 10, lineHeight: 1.5 }}>
            Sem histórico de custo para este template ainda — a estimativa aparece a partir do primeiro disparo.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniStat icon="user" label="Leads impactados" value={String(leadsCount)} />
        <MiniStat icon="megaphone" label="Tipo de campanha" value={formData.campaignType === 'reativacao' ? 'Reativação' : 'Prospecção'} />
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ background: 'var(--paper-50)', borderRadius: 12, padding: '14px 16px' }}>
    <span className="ic-circle" style={{ marginBottom: 8 }}><Icon name={icon} size={14} /></span>
    <div className="t-label" style={{ marginTop: 8 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-300)', marginTop: 2 }}>{value}</div>
  </div>
);
