# reLead Hub — Melhorias a Implementar

> Backlog priorizado de evolução. Contexto e dicionário de campos em **[DOCUMENTACAO.md](DOCUMENTACAO.md)**.
> Convenção: 🔴 crítico · 🟠 alto · 🟡 médio · 🟢 baixo. Cada item traz **objetivo**, **onde mexer** e **critério de pronto**.

---

## P0 — Fundação e segurança

### 🔴 M1. Remover segredos hard-coded e rotacionar chaves
- **Problema:** chaves em texto puro no repositório — Supabase `anon key` e o par CV CRM `email`/`token`
  (`caaf90738a...`), `x-api-key` da Evolution (`keySYMIMOVEIS2026`) e a API key do Gemini estão dentro de
  `Salva Lead — 1. Prospecção Ativa.json` e dos guias.
- **Onde mexer:** mover tudo para **n8n Credentials** e `.env.local`; trocar valores literais por
  referências de credencial nos nós HTTP. Confirmar que `.env.local` está no `.gitignore`.
- **Pronto quando:** nenhum segredo aparece em arquivo versionado e as chaves antigas foram rotacionadas.

### 🔴 M2. Ativar RLS no Supabase
- **Problema:** frontend e n8n usam a `anon key`; sem Row Level Security as tabelas ficam abertas.
- **Onde mexer:** políticas RLS em `leads_reativacao` e `conversas_ia`; idealmente `service_role` só no n8n
  (server-side) e políticas restritas para o frontend.
- **Pronto quando:** leitura/escrita exigem política explícita e o app continua funcionando.

### 🟠 M3. Exportar WK2 e WK3 para o repositório
- **Problema:** só o WK1 está em disco; WK2 (Atendimento IA) e WK3 (Disparo Manual) existem apenas no n8n.
- **Onde mexer:** exportar os JSONs de `n8n.srv1214309.hstgr.cloud` e salvá-los ao lado do WK1.
- **Pronto quando:** os 3 workflows estão versionados e importáveis.

---

## P1 — Fim do Google Sheets (a meta do produto)

> Mapa completo dos eventos que ainda escrevem na planilha. O **WK1 já é o padrão correto**
> (`HTTP Request → POST /rest/v1/leads_reativacao`); basta replicá-lo.

### 🔴 M4. Migrar S1 — escrita de status do WK3 (Sheets → Supabase)
- **Hoje:** nó *Atualizar Status na Planilha* marca `status` (`Enviado`/`Erro`) e `data_envio` na aba "Leads".
- **Migrar para:** `PATCH /rest/v1/leads_reativacao?id=eq.<id>` com `{ status_reativacao, data_envio }`.
- **Onde mexer:** WK3, substituir o nó Google Sheets de update por `HTTP Request`.
- **Pronto quando:** o status do disparo manual atualiza em `leads_reativacao`, refletindo na aba Acompanhar em tempo real.

### 🔴 M5. Migrar S2 — origem dos leads do WK3 (aba "Leads" → Supabase)
- **Hoje:** WK3 lê os leads pendentes da planilha (nó *Ler Planilha Leads*); o cadastro é manual na aba.
- **Migrar para:** o operador cadastra pelo **DispatchForm** (que já insere em `leads_reativacao`) e o WK3
  passa a ler `GET /rest/v1/leads_reativacao?status_reativacao=eq.Pendente`.
- **Onde mexer:** [src/components/DispatchForm.tsx](src/components/DispatchForm.tsx) (gravar `status='Pendente'`)
  e WK3 (trocar leitura do Sheets por HTTP GET; loop por status Pendente).
- **Pronto quando:** um disparo manual nasce no app, sem nenhuma linha de planilha.

### 🔴 M6. Migrar S3 — interessados do WK2 (aba "Interessados" → Supabase)
- **Hoje:** WK2 grava o lead interessado na aba "Interessados".
- **Migrar para:** `POST /rest/v1/conversas_ia` (`interesse_detectado=true`, `resumo_interesse`,
  `imovel_interesse`, `status_conversa`, `lead_id_cvcrm`, `registrado_crm`) **e** `PATCH leads_reativacao`
  (`status_reativacao`, `data_resposta`, `ultima_resposta_lead`, `classificacao_ia`, append em `historico_mensagens`).
- **Onde mexer:** WK2 (nó Google Sheets → HTTP Request).
- **Pronto quando:** interessados aparecem na aba Acompanhar/Analisar sem passar pela planilha.

### 🟡 M7. Desativar a planilha e remover o template
- Depois de M4–M6 validados: desligar os nós Sheets, arquivar a planilha e remover
  `TEMPLATE_PLANILHA_DISPARO.md`.

---

## P2 — Completar a plataforma (abas Gerenciar e Analisar)

### 🟠 M8. Aba Gerenciar — Templates no Supabase
- **Hoje:** [src/components/DispatchForm.tsx](src/components/DispatchForm.tsx) usa um array `TEMPLATES` fixo.
- **Fazer:** tabela `templates_mensagens` (`id, nome, conteudo, tipo_campanha, status, criado_em`) + CRUD na
  aba Gerenciar; o dropdown do disparo passa a ler do Supabase.
- **Pronto quando:** criar/editar template pela UI e usá-lo no disparo, sem código.

### 🟠 M9. Aba Gerenciar — Empreendimentos no Supabase
- **Fazer:** tabela `empreendimentos` (`id, nome, descricao, tipo, localizacao, status`) + CRUD; o disparo
  seleciona o empreendimento de um dropdown (substitui os campos livres atuais de ID/Nome).
- **Pronto quando:** empreendimentos cadastrados alimentam o contexto da IA.

### 🟡 M10. Campanhas agendadas
- **Fazer:** tabela `campanhas_agendadas` + opção "agendar" no DispatchForm + um scheduler (cron no n8n)
  que lê agendamentos pendentes e dispara na hora marcada.
- **Pronto quando:** é possível agendar um disparo e ele sai automaticamente.

### 🟡 M11. Aba Analisar — gráficos reais
- **Hoje:** [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) calcula 4 KPIs e mostra placeholder.
- **Fazer:** gráficos (envios/dia, evolução de respostas, interesse vs. sem interesse, Reativação vs.
  Prospecção) e exportação CSV. Usar uma lib leve de chart respeitando o Dash (uma cor navy + neutros).
- **Pronto quando:** os gráficos refletem `leads_reativacao`/`conversas_ia` em tempo real.

### 🟢 M12. Ações em massa na aba Acompanhar
- Selecionar vários leads e reenviar / marcar interessado / exportar em lote.

---

## P3 — Qualidade e robustez

### 🟠 M13. Tirar a trava de teste do WK1
- O nó *Extrair JS Leads* tem `slice(0,1)` (processa só 1 lead) e o guia cita `MODO_TESTE`. Antes de produção,
  liberar o lote real com salvaguardas de volume.

### 🟡 M14. Limpar warnings de ESLint nos hooks
- `react-hooks/exhaustive-deps` em `useConversationThread`/`useDispatchesList` e variáveis não usadas em
  `useConversations`/`useUpdateDispatchStatus`. Corrigir deps ou memorizar funções com `useCallback`.

### 🟡 M15. Idempotência e deduplicação de disparo
- Garantir que o mesmo lead não seja disparado duas vezes (constraint única por `telefone`+campanha ou checagem
  de `status` antes do envio) — hoje o controle era o campo `status` da planilha.

### 🟢 M16. Realtime de ponta a ponta no Acompanhar
- Confirmar que [src/hooks/useRealtimeConversations.ts](src/hooks/useRealtimeConversations.ts) reflete as
  escritas do n8n (após M4–M6) sem refresh manual.

### 🟢 M17. Migração Evolution → Meta Cloud API (futuro)
- Avaliada em `consultas/migracao_meta_api.md`: trocar envio por templates oficiais da Meta para reduzir risco
  de bloqueio. Mantém o restante do fluxo.

---

## Sequência sugerida
1. **M1, M2** (segurança) e **M3** (exportar workflows) — base.
2. **M4 → M5 → M6** (fim do Sheets) — entrega o objetivo central do produto.
3. **M8, M9** (Gerenciar) — tira os dados fixos do código.
4. **M11, M10, M12** (Analisar/agendamento/massa) — valor incremental.
5. **M13–M17** — robustez contínua.
