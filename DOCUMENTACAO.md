# reLead Hub — Documentação do Projeto

> **Cliente:** Sym Imóveis (Curitiba/PR)
> **O que é:** plataforma web única para disparar campanhas de WhatsApp, acompanhar respostas
> e qualificar leads com IA — substituindo o trio **Google Sheets + Postman + planilhas manuais**.
> Este documento é a fonte única de verdade: objetivo, arquitetura, onde cada coisa acontece,
> os apontamentos (endpoints/integrações) e o dicionário de campos. Para o backlog de evolução,
> ver **[MELHORIAS.md](MELHORIAS.md)**.

---

## 1. Objetivo

Reativar e prospectar leads imobiliários automaticamente:

1. **Disparar** mensagens de WhatsApp (em massa ou agendadas) com texto gerado por IA.
2. **Atender** as respostas com a IA "Ana Paula", que classifica o interesse do lead.
3. **Acompanhar** tudo em tempo real numa interface única.
4. **Sincronizar** leads qualificados de volta ao CV CRM.

O norte do produto: **nada gerenciado em planilha — tudo na plataforma.** Hoje essa migração está
parcial (ver seção 6 e MELHORIAS.md).

---

## 2. Stack e onde cada coisa roda

| Camada | Tecnologia | Onde fica | Papel |
|---|---|---|---|
| **Frontend** | React 18 + TypeScript + Tailwind (Create React App) | `src/` | Interface (4 abas) |
| **Design** | Dash Design System | `Dash Design System/`, `src/styles/dash.css` | Identidade visual (navy + cool-gray) |
| **Banco / Realtime** | Supabase (PostgreSQL) | `reqlxhvjrqqfksrxifwl.supabase.co` | Persistência + subscriptions |
| **Automação** | n8n | `n8n.srv1214309.hstgr.cloud` | 3 workflows de disparo/atendimento |
| **IA (geração + classificação)** | Google Gemini 1.5 Flash | API Google | Cria mensagem e classifica resposta |
| **Envio WhatsApp** | Evolution API | `72.60.244.51:8080` (instância `sym-imoveis`) | Entrega das mensagens |
| **CRM** | CV CRM | `sym.cvcrm.com.br/api/v1` | Fonte de leads + registro de atendimentos |
| **Planilha (legado)** | Google Sheets | doc `1j9u6hyY65ttSJ3HpUI8y90SHaw2hVoWmv4FBtVwu3nE` | Disparo manual e lista de interessados (em migração) |

> ⚠️ As pastas `platform/` e `sym-plataforma/` na raiz são **projetos Next.js separados**, não fazem
> parte do reLead Hub (CRA).

---

## 3. Arquitetura do fluxo (visão macro)

```
                          ┌─────────────────────────────┐
                          │   FRONTEND (React, src/)    │
   Operador ───────────▶  │  Disparar / Acompanhar /     │ ◀── Supabase Realtime
                          │  Analisar / Gerenciar        │
                          └──────────────┬──────────────┘
                                         │ insert / read
                                         ▼
   CV CRM ──leads──▶  n8n (3 workflows) ─────────▶  SUPABASE  ◀── lê o Frontend
        ▲                   │  │                    (leads_reativacao,
        │ registra          │  └── Gemini (texto)    conversas_ia)
        │ atendimento       ▼
        └───────────  Evolution API ──▶ WhatsApp do lead ──resposta──▶ n8n (Atendimento IA)
```

---

## 4. Frontend — onde cada coisa é feita (`src/`)

### Páginas e shell
| Arquivo | Responsabilidade |
|---|---|
| [src/App.tsx](src/App.tsx) | Raiz; renderiza `DashboardPage`. |
| [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) | Shell Dash (sidebar 264px + topbar 80px) e roteamento entre as 4 abas. Calcula métricas da aba Analisar. |
| [src/components/Sidebar.tsx](src/components/Sidebar.tsx) | Navegação lateral (Acompanhar, Disparar, Analisar, Gerenciar). |
| [src/components/Topbar.tsx](src/components/Topbar.tsx) | Breadcrumb, status de sincronização, perfil. |

### Componentes de funcionalidade
| Arquivo | Aba | O que faz |
|---|---|---|
| [src/components/DispatchForm.tsx](src/components/DispatchForm.tsx) | Disparar | Form de campanha: template, empreendimento, upload CSV (nome, telefone), observação p/ IA → **insere em `leads_reativacao`**. |
| [src/components/Dashboard.tsx](src/components/Dashboard.tsx) | Acompanhar | Master-detail: lista de conversas + thread selecionada. |
| [src/components/FilterBar.tsx](src/components/FilterBar.tsx) | Acompanhar | Busca + filtros (campanha, status, período). |
| [src/components/ConversationThread.tsx](src/components/ConversationThread.tsx) | Acompanhar | Histórico de mensagens, dados extraídos, classificação da IA, ações rápidas. |
| [src/components/MessageCard.tsx](src/components/MessageCard.tsx) | Acompanhar | Bolha de mensagem (out = nós/IA, in = lead). |
| [src/components/statusMeta.ts](src/components/statusMeta.ts) | — | Fonte única de status → rótulo/cor/ícone; iniciais e tom de avatar. |
| [src/components/Icon.tsx](src/components/Icon.tsx) | — | Ícones Lucide (stroke 1.5), substituem todos os emojis. |

### Hooks (lógica de dados — Supabase)
| Hook | Função |
|---|---|
| [src/hooks/useConversations.ts](src/hooks/useConversations.ts) | Agregador usado pela página: lista + ações + refetch. |
| [src/hooks/useDispatchesList.ts](src/hooks/useDispatchesList.ts) | Lê `leads_reativacao` com filtros (com fallback para mock). |
| [src/hooks/useConversationThread.ts](src/hooks/useConversationThread.ts) | Lê `leads_reativacao` + `conversas_ia` e extrai o histórico do JSONB. |
| [src/hooks/useRealtimeConversations.ts](src/hooks/useRealtimeConversations.ts) | Subscriptions em tempo real (novos envios/respostas). |
| [src/hooks/useUpdateDispatchStatus.ts](src/hooks/useUpdateDispatchStatus.ts) | Atualiza status e sincroniza com o CV CRM. |

### Infra de código
| Arquivo | Função |
|---|---|
| [src/lib/supabase.ts](src/lib/supabase.ts) | Cliente Supabase (lê de `.env.local`). |
| [src/types.ts](src/types.ts) | Interfaces TypeScript (ver seção 7). |
| [src/mocks/mockData.ts](src/mocks/mockData.ts) | Dados mock para rodar offline. |
| [src/styles/dash.css](src/styles/dash.css) | Tokens + classes do Dash Design System. |

---

## 5. n8n — os 3 workflows de disparo

| # | Workflow | Gatilho | Persistência | Em disco? |
|---|---|---|---|---|
| **WK1** | `Salva Lead — 1. Prospecção Ativa` | Cron diário (`0 12 * * *`) | **Supabase `leads_reativacao`** ✅ | Sim: [Salva Lead — 1. Prospecção Ativa.json](Salva%20Lead%20—%201.%20Prospecção%20Ativa.json) |
| **WK2** | `Salva Lead — 2. Atendimento IA` | Webhook (resposta do lead) | **Supabase `conversas_ia`** (via RPC `upsert_conversa_ia`) + CV CRM ✅ | Não (só no n8n) |
| **WK3** | `Salva Lead — 3. Disparo Manual Planilha` | Webhook `/webhook/disparo-manual-planilha` | Google Sheets (leitura) + **Supabase `leads_reativacao`** (escrita/PATCH) ✅ | Não (só no n8n) |

### WK1 — Prospecção Ativa (cadeia de nós, confirmada no JSON)
1. **Schedule** diário → 2. **Buscar Descartados (situação 3)** + **Buscar Vencidos (situação 14)** no CV CRM →
3. **Juntar Consultas** → **Extrair JS Leads** (trava `slice(0,1)` para teste) → **Processar Leads** (loop) →
4. **Preparar Prompt IA + Supabase** → **Gemini: Gerar Mensagem** → **Extrair Mensagem + Payload** →
5. **Supabase: Inserir Log** (`POST /rest/v1/leads_reativacao`) → **Humanizar Envio (Delay 2 min)** →
6. **Enviar WhatsApp (Evolution)** → **CRM: Registrar Interação** (`/relacionamento/atendimentos/cadastrar`).

> Este é o **padrão de referência** utilizado para migrar WK2/WK3: usa `HTTP Request` apontando para a REST do Supabase.

### WK2 — Atendimento IA
A IA "Ana Paula" recebe a resposta do lead. Se **"Quero saber mais!"** → qualifica e reativa no CV CRM
("Em Atendimento"); se **"Não tenho interesse"** → encerra e mantém descartado. Grava o lead interessado
diretamente na tabela **`conversas_ia`** no Supabase (usando a RPC `upsert_conversa_ia` no nó *Salvar Interessados Supabase*). *(Detalhe operacional em [Guia de Disparo.md](Guia%20de%20Disparo.md) §3.)*

### WK3 — Disparo Manual via Planilha
Lê a aba "Leads" da planilha legado (nó *Ler Planilha Leads*), envia via Evolution, insere o registro inicial no Supabase (nó *Salvar no Supabase* com `Prefer: return=representation`) e atualiza o status de envio final diretamente na tabela **`leads_reativacao`** do Supabase via PATCH utilizando o ID retornado (nó *Atualizar Status no Supabase*). *(Estrutura da planilha em [TEMPLATE_PLANILHA_DISPARO.md](TEMPLATE_PLANILHA_DISPARO.md).)*

**Modo de segurança — templates sem variável (self-healing):** o nó *Preparar Payload WhatsApp* consulta
`templates_wpp.tem_variaveis` para decidir se inclui o parâmetro `{{1}}` no `components` do template. Como esse
campo pode estar errado ou ausente para um template novo, existe uma segunda camada de proteção que dispensa
qualquer cadastro manual (nem na aba Gerenciar, nem no n8n):
1. **Erro de Parametro na Variavel?** (IF, após *Enviar Template WhatsApp*) — detecta, por palavras-chave no
   erro retornado (`parâmetro`, `parameter`, `component`, `132000`, `does not match`), se o envio falhou por
   incompatibilidade entre o template aprovado na Meta e o `components` enviado.
2. **Alternar Variavel e Preparar Reenvio** → **Reenviar Template WhatsApp (Ajustado)** — inverte a hipótese
   (remove o parâmetro se foi enviado, ou adiciona se não foi) e tenta de novo, uma única vez.
3. **Consolidar Resultado do Envio** — normaliza o resultado (da tentativa original ou do reenvio) em
   `statusFinal`/`mensagemFinal`/`historico`.
4. **Corrigir Cadastro do Template?** → **Corrigir Tem Variaveis no Supabase** — se o reenvio ajustado deu
   certo, faz `PATCH templates_wpp?nome=eq.<template>` corrigindo `tem_variaveis` sozinho, para que os próximos
   disparos desse template já saiam corretos de primeira.

Ou seja: um template novo sem variável (ex.: `ilunia`) pode ser cadastrado com o padrão (`tem_variaveis: true`)
e o próprio disparo se autocorrige no primeiro envio, sem exigir edição no n8n nem lembrança manual na hora do
cadastro.

---

## 6. Apontamentos (endpoints, webhooks e IDs)

| Recurso | Endereço / Identificador | Usado por |
|---|---|---|
| Supabase REST | `https://reqlxhvjrqqfksrxifwl.supabase.co/rest/v1/<tabela>` | Frontend, WK1 |
| Supabase (env) | `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` em `.env.local` | Frontend |
| n8n (host) | `https://n8n.srv1214309.hstgr.cloud` | Todos os workflows |
| Webhook disparo manual | `POST /webhook/disparo-manual-planilha` | WK3 |
| CV CRM — leads | `GET https://sym.cvcrm.com.br/api/v1/comercial/leads?idsituacao=3|14&ativo=true&...` | WK1 |
| CV CRM — atendimento | `POST https://sym.cvcrm.com.br/api/v1/relacionamento/atendimentos/cadastrar` | WK1, WK2 |
| Evolution API | `POST http://72.60.244.51:8080/message/sendText/sym-imoveis` (header `x-api-key`) | WK1, WK3 |
| Gemini | `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` | WK1, WK2 |
| Google Sheets | doc `1j9u6hyY65ttSJ3HpUI8y90SHaw2hVoWmv4FBtVwu3nE` (abas "Leads" e "Interessados") | WK2, WK3 |

> 🔐 **Segurança:** o JSON do WK1 e os guias contêm chaves/tokens em texto puro (Supabase, CV CRM,
> Evolution, Gemini). Tratado como item prioritário em [MELHORIAS.md](MELHORIAS.md).

---

## 7. Dicionário de campos

### Tabela `leads_reativacao` (registro de cada disparo)
| Campo | Tipo | O que é |
|---|---|---|
| `id` | uuid | Chave primária. |
| `telefone` | varchar | Contato do lead (com/sem DDI; o sistema normaliza). |
| `nome_lead` | varchar | Nome do lead. |
| `tipo_campanha` | text | `'reativacao'` ou `'prospeccao'`. |
| `status_reativacao` | varchar | `Enviado`, `Respondido`, `Interessado`, `Sem interesse`, `Pausado`, `Erro`, `Pendente`. |
| `data_envio` | timestamp | Quando a mensagem saiu. |
| `data_resposta` | timestamp | Quando o lead respondeu. |
| `mensagem_enviada` | text | Texto/template efetivamente enviado. |
| `ultima_resposta_lead` | text | Última resposta recebida. |
| `classificacao_ia` | varchar | Classificação dada pela IA. |
| `lead_id_cvcrm` | varchar | ID do lead no CV CRM. |
| `corretor_id_cvcrm` | varchar | ID do corretor responsável no CRM. |
| `historico_mensagens` | jsonb | Array de mensagens (ver formato abaixo). |
| `nome_campanha` | varchar | Nome dado à campanha no disparo. |
| `observacao_crm` | text | Observação/contexto passado para a IA. |

**Formato de `historico_mensagens` (JSONB):**
```json
[{ "remetente": "IA|user|lead", "texto": "…", "timestamp": "ISO-8601", "tipo_campanha": "…" }]
```

### Tabela `conversas_ia` (conversa + classificação de interesse)
| Campo | Tipo | O que é |
|---|---|---|
| `id` | uuid | Chave primária. |
| `telefone` | varchar | Contato. |
| `lead_id_cvcrm` | varchar | ID do lead no CRM. |
| `nome_lead` | varchar | Nome do lead. |
| `status_conversa` | varchar | `ativa` ou `finalizada`. |
| `interesse_detectado` | boolean | Se a IA detectou interesse. |
| `resumo_interesse` | text | Resumo do que o lead procura. |
| `imovel_interesse` | varchar | Imóvel/empreendimento de interesse. |
| `registrado_crm` | boolean | Se já foi sincronizado ao CRM. |
| `crm_registro_id` | varchar | ID do registro criado no CRM. |
| `created_at` | timestamptz | Criação. |
| `updated_at` | timestamptz | Última atualização. |

### Planilha de disparo manual — aba "Leads" (legado, WK3)
| Col. | Nome | Obrigatório | → Supabase (`leads_reativacao`) |
|---|---|---|---|
| A | `nome` | Sim | `nome_lead` |
| B | `telefone` | Sim | `telefone` |
| C | `status` | Sim (`Pendente`/`Enviado`/`Erro`) | `status_reativacao` |
| D | `data_envio` | Não (auto) | `data_envio` |
| E | `id_crm` | Não | `lead_id_cvcrm` |
| F | `observacao` | Não | `observacao_crm` |
| G | `row_number` | Sim (ponteiro da linha) | — (substituído pelo `id` uuid) |

### Tipos TypeScript (frontend) — [src/types.ts](src/types.ts)
| Tipo | Mapeia de | Campos principais |
|---|---|---|
| `Dispatch` | `leads_reativacao` | `id, telefone, nome, tipo_campanha, status, timestamp_envio, timestamp_resposta` |
| `Message` | item de `historico_mensagens` | `id, texto, sender ('user'\|'lead'\|'ia'), timestamp` |
| `ConversationThread` | join | `dispatch, messages[], extracted_data, ai_classification` |
| `AIClassification` | `conversas_ia` | `interesse, confianca, motivo` |
| `FilterOptions` | — (UI) | `campanhas[], statuses[], dataInicio, dataFim, busca` |

---

## 8. Como rodar

```bash
npm install          # primeira vez
npm start            # dev em http://localhost:3000
npm run build        # build de produção em build/
npm test             # testes (Jest + RTL); E2E: npx cypress run
```
Variáveis em `.env.local`: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` (+ n8n/CRM quando aplicável).
Sem conexão, o frontend cai automaticamente para os dados de `src/mocks/mockData.ts`.

---

## 9. Documentos relacionados (mantidos)
- **[MELHORIAS.md](MELHORIAS.md)** — backlog priorizado de evolução.
- **[Guia de Disparo.md](Guia%20de%20Disparo.md)** — runbook operacional dos 3 disparos.
- **[TEMPLATE_PLANILHA_DISPARO.md](TEMPLATE_PLANILHA_DISPARO.md)** — estrutura da planilha (enquanto WK3 existir).
- **[Guia de Implementação_ Agente de Reativação de Leads com N8N, IA e CV CRM.md](Guia%20de%20Implementação_%20Agente%20de%20Reativação%20de%20Leads%20com%20N8N,%20IA%20e%20CV%20CRM.md)** — racional de arquitetura do agente.
- **`Salva Lead — 1. Prospecção Ativa.json`** — workflow WK1 (importável no n8n).
