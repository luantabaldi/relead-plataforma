# Prompts de Construção — Plataforma Sym Imóveis
**Versão:** 3.0 | **Data:** 15/05/2026
**Baseado em:** Plano de Implementação v1.0 + atualizações de simplificação do fluxo de campanha

---

## Como usar este arquivo

- Cada bloco é um prompt independente para o Claude Code.
- O cabeçalho de cada prompt indica o **Modelo** e as **Skills** a ativar.
- Para ativar uma skill no Claude Code, a primeira linha do prompt já instrui o Claude com
  `Use the [nome] skill` — basta colar o bloco inteiro sem modificar.
- Aguarde a conclusão e valide cada prompt antes de avançar para o próximo.
- Os prompts assumem que você está na raiz do projeto Next.js.

> **Regra de ouro:** Nenhum prompt toca no n8n, nos workflows ativos ou no Google Sheets.
> A operação continua rodando em paralelo durante toda a construção.

---

## Skills — Instalação e Ordem de Uso

Instale todas antes de começar. A ordem importa: execute o **Prompt 0-A** logo após o
Prompt 0, porque a skill `supabase-sym` que ele cria é referenciada por todos os prompts seguintes.

| # | Skill | Onde instalar | Quando é usada |
|---|-------|--------------|----------------|
| 1 | **skill-creator** | Painel de skills do Claude Code | Prompt 0-A — para criar a supabase-sym |
| 2 | **supabase-sym** | Gerada pelo Prompt 0-A | Prompts 1 a 13 — contexto do banco |
| 3 | **frontend-design** | Painel de skills do Claude Code | Prompts 1, 3, 4, 5, 6, 7, 8, 9, 10 |
| 4 | **web-artifacts-builder** | Painel de skills do Claude Code | Prompts 7 e 8 — fluxo multi-etapa |
| 5 | **humanizer** | Já disponível (pasta user) | Prompt 13 — revisão de textos de UI |
| 6 | **xlsx** | Já disponível | Opcional — só se precisar exportar Excel |

---

## Mapa de Fases, Modelos e Skills

| # | Fase | Modelo | Skills ativas | Risco |
|---|------|--------|--------------|-------|
| 0 | Scaffolding do projeto | Sonnet | — | Zero |
| 0-A | Criar skill supabase-sym | Sonnet | skill-creator | Zero |
| 1 | Auth + Layout base | Sonnet | supabase-sym, frontend-design | Zero |
| 2 | Database Views + ALTER TABLE | Opus | supabase-sym | Zero |
| 3 | Dashboard KPIs (Tela A1) | Sonnet | supabase-sym, frontend-design | Zero |
| 4 | Dashboard Campanhas (Tela A2) | Sonnet | supabase-sym, frontend-design | Zero |
| 5 | Central de Leads (Tela B1) | Sonnet | supabase-sym, frontend-design | Zero |
| 6 | Detalhe do Lead (Tela B2) | Sonnet | supabase-sym, frontend-design | Zero |
| 7 | Campanha: Etapas 1, 2 e 3 | Sonnet | supabase-sym, frontend-design, web-artifacts-builder | Zero |
| 8 | Campanha: Etapa 4 + Disparo | Sonnet | supabase-sym, frontend-design, web-artifacts-builder | Zero |
| 9 | Monitoramento RT (Tela C3) | Sonnet | supabase-sym, frontend-design | Zero |
| 10 | Configurações Admin (D1 e D2) | Sonnet | supabase-sym, frontend-design | Zero |
| 11 | Segurança RLS | Opus | supabase-sym | Zero |
| 12 | BI / Looker Studio | Opus | supabase-sym | Zero |
| 13 | Revisão Final e Deploy | Opus | supabase-sym, humanizer | Controlado |

---

---

## PROMPT 0 — Scaffolding do Projeto
**Modelo: Sonnet**
**Skills: nenhuma** (projeto ainda não existe)
**Pré-requisito:** Node 18+, conta Vercel, projeto Supabase já existente.

```
Crie um projeto Next.js 14 com App Router para a plataforma interna da Sym Imóveis.

Stack obrigatória:
- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- @supabase/supabase-js e @supabase/ssr (autenticação server-side)
- Recharts (gráficos)
- shadcn/ui (componentes base)
- papaparse (leitura de CSV no browser)
- sonner (toasts de feedback)

Execute os seguintes passos:

1. Inicialize o projeto:
npx create-next-app@latest sym-plataforma --typescript --tailwind --app --src-dir --import-alias "@/*"

2. Instale as dependências:
npm install @supabase/supabase-js @supabase/ssr recharts lucide-react papaparse sonner
npm install -D @types/papaparse
npx shadcn@latest init

3. Crie o arquivo .env.local na raiz com estas variáveis (deixe os valores em branco para eu preencher):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
N8N_WEBHOOK_DISPARO=
NEXT_PUBLIC_CVCRM_BASE_URL=
EVOLUTION_API_URL=

4. Crie .env.example com as mesmas variáveis e adicione .env.local ao .gitignore.

5. Crie a estrutura de pastas dentro de src/app/:
- (auth)/login/page.tsx
- (dashboard)/layout.tsx
- (dashboard)/page.tsx
- (dashboard)/campanhas/page.tsx
- (dashboard)/leads/page.tsx
- (dashboard)/leads/[id]/page.tsx
- (dashboard)/disparo/page.tsx
- (dashboard)/disparo/monitoramento/page.tsx
- (dashboard)/configuracoes/page.tsx

6. Crie src/lib/supabase/client.ts e src/lib/supabase/server.ts com os helpers padrão do @supabase/ssr.

7. Crie src/types/database.ts com as interfaces TypeScript abaixo:

interface LeadReativacao {
  id: string
  lead_id_cvcrm: string
  telefone: string
  nome_lead: string
  status_reativacao: 'Enviado' | 'Respondido' | 'Reativado' | 'Erro no Disparo' | 'Pausado (Horário Excedido)'
  data_envio: string
  data_resposta: string | null
  mensagem_enviada: string
  ultima_resposta_lead: string | null
  historico_mensagens: object
  tipo_campanha: 'reativacao' | 'prospeccao'
  nome_campanha: string | null
}

interface ConversaIA {
  id: string
  telefone: string
  status_conversa: 'ativa' | 'interesse_confirmado' | 'sem_interesse'
  interesse_detectado: boolean
  resumo_interesse: string | null
  imovel_interesse: string | null
}

interface LeadDoCsv {
  nome: string
  telefone: string
  observacao: string
}

interface PayloadDisparo {
  nome_campanha: string
  template_nome: string
  id_empreendimento: string
  tipo_campanha: string
  link_imagem: string | null
  leads: LeadDoCsv[]
}

8. Confirme que npm run dev sobe sem erros.

Não faça nenhuma alteração no n8n, Google Sheets ou em qualquer workflow existente.
```

---

## PROMPT 0-A — Criar a Skill supabase-sym
**Modelo: Sonnet**
**Skills: skill-creator** ← ative esta skill antes de colar o prompt
**Pré-requisito:** Prompt 0 concluído. Execute dentro da pasta sym-plataforma.

> Este é o único prompt que usa a skill-creator. Ele gera a skill `supabase-sym`
> que será referenciada com `Use the supabase-sym skill` em todos os prompts seguintes.
> Após rodar, confirme que o arquivo da skill foi criado antes de avançar.

```
Use the skill-creator skill to create a new skill called "supabase-sym".

This skill should teach Claude the Supabase schema, query patterns and business rules
for the Sym Imóveis platform so I don't need to repeat this context in every prompt.

The skill should document:

SCHEMA DAS TABELAS

Table: leads_reativacao (READ ONLY from the interface — never call insert/update here)
- id: uuid PK
- lead_id_cvcrm: varchar — reference ID in CV CRM
- telefone: varchar — format 55XXXXXXXXXXX
- nome_lead: varchar
- status_reativacao: 'Enviado' | 'Respondido' | 'Reativado' | 'Erro no Disparo' | 'Pausado (Horário Excedido)'
- data_envio: timestamp
- data_resposta: timestamp nullable
- mensagem_enviada: text
- ultima_resposta_lead: text nullable
- historico_mensagens: jsonb — full conversation log, 100% filled
- tipo_campanha: 'reativacao' | 'prospeccao'
- nome_campanha: varchar(100) nullable — added via ALTER TABLE in Prompt 2

Table: conversas_ia (READ ONLY from the interface — never call insert/update here)
- id: uuid PK
- telefone: varchar unique — join key with leads_reativacao
- status_conversa: 'ativa' | 'interesse_confirmado' | 'sem_interesse'
- interesse_detectado: boolean
- resumo_interesse: text nullable — currently 91.6% null
- imovel_interesse: varchar nullable — currently 100% null

Table: templates_wpp (interface can insert/update — admins only)
- id: uuid PK
- nome: varchar(100)
- tipo: varchar(50)
- status_meta: 'Aprovado' | 'em_revisao' | 'Rejeitado'

Table: instancias_wpp (interface can insert/update — admins only)
- id: uuid PK
- numero: varchar(20)
- setor: varchar(50)
- status: 'Conectado' | 'Desconectado' | 'desconhecido'

VIEWS DISPONÍVEIS (somente leitura — criadas no Prompt 2)
- view_kpis_gerais — single row with all KPI metrics
- view_funil_conversao — 4 rows for the conversion funnel
- view_dashboard_campanhas — grouped by nome_campanha and tipo_campanha
- view_disparos_por_dia — grouped by day

PADRÕES DE QUERY
- Use server-side Supabase client (src/lib/supabase/server.ts) in Server Components
- Use client-side Supabase client (src/lib/supabase/client.ts) only in Client Components
- Always add .limit() or .range() — never fetch an entire table without pagination
- leads_reativacao filters: .eq() for status, .ilike() for name/phone, .gte()/.lte() for dates
- Join between leads_reativacao and conversas_ia is by telefone field (not a FK — do two separate queries)

REGRAS DE NEGÓCIO INVIOLÁVEIS
- Never call .insert() or .update() on leads_reativacao or conversas_ia
- Never call the n8n MCP or modify any n8n workflow
- Never write directly to Supabase from the campaign dispatch — always go through POST /api/disparo
- The /api/disparo route only forwards the payload to the n8n webhook — it does not write to Supabase
- id_empreendimento is a free text field typed once per campaign — there is no empreendimentos table
- The n8n nodes wk3-update-sheet and salvar-interessados must remain active until Phase 4 validation
```

---

## PROMPT 1 — Autenticação e Layout Base
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 0-A concluído.

```
Use the supabase-sym skill and the frontend-design skill.

No projeto sym-plataforma, implemente a autenticação via Supabase Auth e o layout base.

PARTE 1 — Página de Login (src/app/(auth)/login/page.tsx)

- Formulário com campos de email e senha
- Botão "Entrar" que chama supabase.auth.signInWithPassword()
- Em caso de erro: mensagem "Email ou senha inválidos"
- Em caso de sucesso: redireciona para /
- Visual: fundo escuro (#0f1117), logo "Sym Imóveis" centralizado, card com borda sutil
- Sem opção de cadastro (acesso controlado pelo admin)

PARTE 2 — Middleware de Proteção (src/middleware.ts)

- Redireciona para /login se o usuário não estiver autenticado
- Permite acesso livre apenas a /login
- Usa @supabase/ssr para verificar a sessão server-side

PARTE 3 — Layout do Dashboard (src/app/(dashboard)/layout.tsx)

Sidebar fixa (200px) com:
- Seção "Dashboard": links para / e /campanhas
- Seção "Leads": link para /leads
- Seção "Operação": links para /disparo e /configuracoes
- Rodapé: avatar com iniciais do usuário + botão de logout (supabase.auth.signOut())
- Link ativo destacado com borda esquerda na cor #1D9E75

Topbar com:
- Título derivado da rota atual
- Indicador de última atualização

PARTE 4 — Componentes reutilizáveis (src/components/)

StatusPill.tsx:
  Props: status (string), variant ('lead' | 'campanha' | 'template' | 'instancia')
  Para variant='lead':
    - 'Enviado' → azul
    - 'Respondido' → verde claro
    - 'Reativado' → verde escuro
    - 'Erro no Disparo' → vermelho
    - 'Pausado (Horário Excedido)' → amarelo
  Para variant='campanha': 'Em andamento' → verde, 'Concluída' → cinza
  Para variant='template': 'Aprovado' → verde, 'Em revisão' → amarelo, 'Rejeitado' → vermelho
  Para variant='instancia': 'Conectado' → verde, 'Desconectado' → vermelho

KpiCard.tsx:
  Props: label (string), value (string), icon (LucideIcon), delta? (string), deltaType? ('up'|'down')

LoadingSpinner.tsx: spinner simples centralizado

Paleta de cores como variáveis CSS em globals.css:
--color-green-primary: #1D9E75
--color-green-light: #E1F5EE
--color-green-dark: #0F6E56
--color-bg-primary: #0f1117
--color-bg-secondary: #161b22
--color-bg-card: #1c2128
--color-border: rgba(255,255,255,0.08)
--color-text-primary: #e6edf3
--color-text-secondary: #8b949e

Não altere o n8n ou workflows existentes.
```

---

## PROMPT 2 — Ajuste de Schema e Database Views
**Modelo: Opus**
**Skills: supabase-sym**
**Pré-requisito:** Acesso ao editor SQL do Supabase.
**⚠️ O ALTER TABLE adiciona coluna nullable — não remove nada. Execute manualmente.**

```
Use the supabase-sym skill.

Preciso executar ajustes no Supabase para a plataforma Sym Imóveis. Revise e retorne os SQLs
finais comentados para eu executar manualmente no editor SQL do Supabase.

PASSO 1 — Adicionar coluna nome_campanha

ALTER TABLE public.leads_reativacao
ADD COLUMN IF NOT EXISTS nome_campanha VARCHAR(100);

Confirme que o IF NOT EXISTS protege contra execuções repetidas.

PASSO 2 — Criar as 4 Database Views de leitura

VIEW 1 — view_kpis_gerais
Retorna uma única linha com:
- total_disparos: count(*) de leads_reativacao
- taxa_resposta: % de status IN ('Respondido','Reativado') sobre o total (float, 1 casa decimal)
- taxa_qualificacao_ia: % de interesse_detectado=true em conversas_ia (float, 1 casa decimal)
- taxa_optout: % de status_conversa='sem_interesse' em conversas_ia (float, 1 casa decimal)
- total_reativados: count(*) WHERE status_reativacao='Reativado'
- total_erros: count(*) WHERE status_reativacao='Erro no Disparo'

VIEW 2 — view_funil_conversao
Retorna 4 linhas (funil):
- etapa TEXT: 'Disparados', 'Respondidos', 'Qualificados IA', 'Reativados'
- quantidade INT
- percentual_sobre_total FLOAT (sempre relativo ao total de disparados)

VIEW 3 — view_dashboard_campanhas
Agrupado por nome_campanha e tipo_campanha:
- nome_campanha, tipo_campanha
- total_disparos, enviados, respondidos, reativados, erros
- taxa_conversao (reativados/total*100, float)
- primeiro_envio (MIN data_envio), ultimo_envio (MAX data_envio)

VIEW 4 — view_disparos_por_dia
Agrupado por date_trunc('day', data_envio):
- dia DATE, total, respondidos, reativados, erros

Observações:
- Divisões devem usar NULLIF para evitar divisão por zero
- Todas são CREATE OR REPLACE VIEW — não alteram nenhuma tabela
- Retorne os SQLs prontos para execução com comentários em cada campo calculado
```

---

## PROMPT 3 — Tela A1: Dashboard de KPIs
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompts 1 e 2 concluídos. Views criadas no Supabase.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente a tela principal do dashboard (src/app/(dashboard)/page.tsx).

Dados: views view_kpis_gerais, view_funil_conversao e view_disparos_por_dia.
Use Server Components para a busca. Envolva cada seção em <Suspense> com fallback de loading.

SEÇÃO 1 — KPI Cards (componente KpiCard)
Grid de 4 colunas:
1. "Volume disparado" → total_disparos | ícone Send
2. "Taxa de resposta" → taxa_resposta formatado como "XX,X%" | ícone MessageSquare
3. "Qualificação IA" → taxa_qualificacao_ia formatado como "XX,X%" | ícone Bot
4. "Opt-out" → taxa_optout formatado como "XX,X%" | ícone Ban

SEÇÃO 2 — Gráfico de Barras (Client Component)
Arquivo: src/components/charts/DisparosPorDiaChart.tsx
- BarChart do Recharts, ResponsiveContainer 100% x 200px
- Dados: view_disparos_por_dia dos últimos 30 dias
- Eixo X: dia formatado "DD/MM", Eixo Y: quantidade
- Barra: total em #1D9E75
- Tooltip: Total / Respondidos / Reativados

SEÇÃO 3 — Funil de Conversão (Client Component)
Arquivo: src/components/charts/FunilConversao.tsx
- 4 barras horizontais lidas de view_funil_conversao
- Largura proporcional ao percentual_sobre_total
- Label à esquerda, número à direita
- Cores: Disparados=#378ADD | Respondidos=#1D9E75 | Qualificados=#639922 | Reativados=#BA7517

SEÇÃO 4 — Tabela de Performance por Tipo
view_dashboard_campanhas agrupado por tipo_campanha.
Colunas: Tipo | Disparos | Respondidos | Reativados | Conversão

Layout: KPIs no topo, gráfico + funil lado a lado, tabela embaixo.
Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 4 — Tela A2: Dashboard de Campanhas
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 3 concluído.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente a tela de campanhas (src/app/(dashboard)/campanhas/page.tsx).

Fonte: view_dashboard_campanhas.

FILTRO DE PERÍODO (Client Component com URL searchParams)
- Chips: "Últimos 7 dias" | "Últimos 30 dias" | "Este mês" | "Mês anterior"
- Passado como ?periodo=7d na URL
- Query filtra por ultimo_envio dentro do período

CARDS DE RESUMO DO PERÍODO (acima da tabela)
3 cards:
- Total de campanhas no período
- Melhor conversão (nome_campanha + taxa_conversao formatada)
- Total de leads reativados no período

TABELA PRINCIPAL
Colunas: Nome da campanha | Tipo | Disparos | Respondidos | Reativados | Conversão | Primeiro envio | Último envio | Status

Status calculado no frontend:
- "Em andamento" se ultimo_envio >= hoje - 2 dias → StatusPill variant='campanha'
- "Concluída" caso contrário

Ordenação client-side ao clicar em Disparos e Conversão.
Exibir "Nenhuma campanha no período" quando não houver dados.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 5 — Tela B1: Central de Leads
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 4 concluído.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente a Central de Leads (src/app/(dashboard)/leads/page.tsx).

Fonte: leads_reativacao + conversas_ia (duas queries separadas pelo telefone).

FILTROS (Client Component com URL searchParams)
- Status: chips — Todos | Enviado | Respondido | Reativado | Erro | Pausado
- Tipo de campanha: dropdown com valores distintos de tipo_campanha
- Nome da campanha: dropdown com valores distintos de nome_campanha
- Interesse IA: toggle "Apenas qualificados"
- Período: inputs date início e fim sobre data_envio
- Busca textual: input com debounce 400ms, filtra nome_lead ILIKE ou telefone ILIKE

TABELA PAGINADA
- 20 por página, data_envio DESC
- Colunas: Nome | Telefone | Status | Campanha | Data envio | Interesse IA | Ações
- Interesse IA: ✓ verde se true, traço cinza se false/null
- Ações: botão "Ver" → /leads/[id]
- Paginação: Anterior / Próxima + "Mostrando X–Y de Z"

QUERY
- .eq(), .ilike(), .gte(), .lte() para filtros
- .range(from, to) para paginação
- .order('data_envio', { ascending: false })

EXPORTAÇÃO
Botão "Exportar CSV" que baixa todos os registros filtrados (sem limite de paginação)
como .csv via Blob nativo do browser.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 6 — Tela B2: Detalhe do Lead
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 5 concluído.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente a página de detalhe do lead (src/app/(dashboard)/leads/[id]/page.tsx).

BUSCA (Server Component)
Promise.all com duas queries paralelas:
1. leads_reativacao WHERE id = params.id
2. conversas_ia WHERE telefone = lead.telefone

LAYOUT — Duas colunas (60/40)

COLUNA ESQUERDA
Card "Dados do lead":
- Nome, telefone, datas formatadas (dd/MM/yyyy HH:mm)
- StatusPill do status_reativacao
- Tipo e nome da campanha
- Template enviado (mensagem_enviada)
- Botão "Ver no CV CRM" → ${NEXT_PUBLIC_CVCRM_BASE_URL}/${lead.lead_id_cvcrm}
  (nova aba, só exibe se lead_id_cvcrm não for nulo)

Card "Análise da IA" (só se houver registro em conversas_ia):
- Badge: "Interesse confirmado" (verde) | "Sem interesse" (vermelho) | "Em análise" (cinza)
- resumo_interesse como parágrafo
- imovel_interesse em destaque se preenchido

COLUNA DIREITA — Histórico de conversa
historico_mensagens é JSONB. Tratar dois formatos:
  Formato A: [{ role: 'bot'|'user', message: string, timestamp?: string }]
  Formato B: array de strings alternadas (bot, user, bot, user...)

Renderizar como thread de chat:
- Bot: alinhado à esquerda, fundo var(--color-bg-card)
- Lead: alinhado à direita, fundo #1D9E75
- Timestamp em 10px cinza abaixo de cada mensagem
- max-height: 500px, overflow-y: auto
- Se null ou vazio: "Conversa não iniciada"

Botão "← Voltar para leads" no topo.
Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 7 — Fluxo de Campanha: Etapas 1, 2 e 3
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design, web-artifacts-builder**
**Pré-requisito:** Prompt 6 concluído.

```
Use the supabase-sym skill, the frontend-design skill and the web-artifacts-builder skill.

Implemente as primeiras 3 etapas do fluxo de Nova Campanha (src/app/(dashboard)/disparo/page.tsx).

Formulário multi-etapa com estado gerenciado via useState em um Client Component.

INDICADOR DE PROGRESSO no topo:
Etapa 1: Nome → Etapa 2: Leads → Etapa 3: Configuração → Etapa 4: Observações → Disparar
(círculos numerados com linha conectora, etapa atual destacada em #1D9E75)

────────────────────────────────────────────
ETAPA 1 — Nomear a Campanha
────────────────────────────────────────────
- Input de texto obrigatório, label "Nome da campanha"
- Placeholder: "ex: reativacao_loockwood_maio26"
- Instrução: "Use letras minúsculas e underscores. Este nome aparecerá nos relatórios."
- Botão "Próximo" habilita somente se campo não estiver vazio

────────────────────────────────────────────
ETAPA 2 — Carregar Leads (CSV)
────────────────────────────────────────────
Zona de upload (drag-and-drop + clique), aceita apenas .csv.
Leitura com papaparse (header: true, skipEmptyLines: true).

Validações:
- Colunas obrigatórias: nome, telefone
- Telefone válido: 10 a 13 dígitos numéricos após remover +, -, espaços
- Preview com os primeiros 5 registros
- Contador: "X leads carregados · Y com erro de formato"
- Linhas com erro em vermelho com descrição do problema
- Leads com erro são removidos automaticamente — não bloqueiam o avanço

Botão "Próximo" habilita somente se houver ao menos 1 lead válido.

────────────────────────────────────────────
ETAPA 3 — Configuração Global da Campanha
────────────────────────────────────────────
Campos aplicados a TODOS os leads do lote.
NÃO há tabela de empreendimentos — o usuário digita o ID diretamente.

- Template: select da tabela templates_wpp WHERE status_meta='Aprovado'
  Se tabela vazia ou inexistente: input de texto livre com label "Nome do template"
- ID do Empreendimento: input de texto livre obrigatório
  Label: "ID do Empreendimento (CV CRM)"
  Instrução: "Este ID será enviado para todos os leads desta campanha."
- Tipo de Campanha: select fixo ["reativacao", "prospeccao"]
- Link da Imagem: input URL opcional
  Instrução: "Deixe em branco se não houver imagem."

Card de resumo ao final da Etapa 3:
Nome da campanha | Total de leads | Template | ID Empreendimento | Tipo

Botão "Próximo" habilita somente se Template, ID Empreendimento e Tipo estiverem preenchidos.

Estado completo (nome, leads[], template, id_empreendimento, tipo_campanha, link_imagem)
mantido no useState durante toda a navegação entre etapas.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 8 — Fluxo de Campanha: Etapa 4 + Disparo
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design, web-artifacts-builder**
**Pré-requisito:** Prompt 7 concluído.

```
Use the supabase-sym skill, the frontend-design skill and the web-artifacts-builder skill.

Implemente a Etapa 4 do fluxo de campanha e o botão de disparo.
Continue no arquivo src/app/(dashboard)/disparo/page.tsx, adicionando ao estado existente.

────────────────────────────────────────────
ETAPA 4 — Edição Individual de Observações
────────────────────────────────────────────
Tabela editável com todos os leads válidos da Etapa 2.

Colunas: # | Nome (somente leitura) | Telefone (somente leitura) | Observação (input editável)

- Input de observação: placeholder "Observação para este lead..."
- Cada input atualiza o array de leads no useState
- Observação é opcional — deixar em branco é válido
- Contador: "X leads prontos para disparo"
- max-height: 400px com scroll interno se mais de 10 leads

Card de resumo final acima do botão:
Nome da campanha | Total de leads | Template | ID Empreendimento | Tipo | Link da imagem

Checkbox obrigatório:
"Confirmo que revisei os leads e as configurações acima e desejo iniciar o disparo."

────────────────────────────────────────────
BOTÃO "INICIAR DISPARO"
────────────────────────────────────────────
Habilitado somente se: checkbox marcado + ao menos 1 lead na lista.

POST para a rota interna /api/disparo com body (tipo PayloadDisparo):
{
  "nome_campanha": "string",
  "template_nome": "string",
  "id_empreendimento": "string",
  "tipo_campanha": "string",
  "link_imagem": "string | null",
  "leads": [{ "nome": "string", "telefone": "string", "observacao": "string" }]
}

Durante POST: spinner + "Enviando..."
Após sucesso: redirecionar para /disparo/monitoramento?campanha=[nome_campanha]
Após erro: toast de erro (sonner) sem perder os dados do formulário

────────────────────────────────────────────
ROTA DE API INTERNA (src/app/api/disparo/route.ts)
────────────────────────────────────────────
POST handler server-side:
1. Recebe o PayloadDisparo
2. Valida que nome_campanha, template_nome, id_empreendimento, tipo_campanha e leads[]
   não estão vazios
3. POST para process.env.N8N_WEBHOOK_DISPARO com o payload completo
4. Retorna { success: true } se n8n responder 200
5. Retorna { success: false, error: "..." } em caso de falha

REGRA CRÍTICA: a rota /api/disparo NÃO grava no Supabase.
O n8n já cuida disso — não duplique a lógica.
A rota apenas repassa o payload para o webhook existente.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 9 — Tela C3: Monitoramento em Tempo Real
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 8 concluído.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente o monitoramento em tempo real (src/app/(dashboard)/disparo/monitoramento/page.tsx).

Usa Supabase Realtime para escutar leads_reativacao.
NÃO altera tabelas. NÃO chama o n8n. Apenas escuta eventos.

COMPONENTE (Client Component obrigatório)

Estado inicial ao montar:
- Buscar últimos 50 registros de leads_reativacao por data_envio DESC
- Filtrar pelo nome_campanha recebido via searchParam ?campanha=...

Subscription Realtime:
- Canal 'leads_reativacao', eventos INSERT e UPDATE
- Filtrar nome_campanha = campanha atual
- INSERT: adicionar no topo (máximo 100 itens)
- UPDATE: atualizar item por id

CARDS DE STATUS (derivados da lista local, atualizam em tempo real)
4 counters: Enviados (azul) | Respondidos (verde claro) | Reativados (verde escuro) | Erros (vermelho)

BARRA DE PROGRESSO
Total disparados / Total de leads da campanha
Formatado: "32 de 100 (32%)"

FEED DE EVENTOS
Lista rolável, mais recentes no topo, máximo 100 itens:
- Bolinha colorida + nome do lead + status + horário relativo ("agora", "há 3s", "há 1min")
- Novo item: fade-in via CSS transition
- Linha de erro: fundo levemente avermelhado

INDICADOR DE CONEXÃO (topo direito)
- "● Conectado" verde quando ativo
- "○ Reconectando..." amarelo com reconexão automática

BOTÃO PAUSAR / RETOMAR
Pausa inserção visual sem desconectar o realtime.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 10 — Telas D1 e D2: Configurações Admin
**Modelo: Sonnet**
**Skills: supabase-sym, frontend-design**
**Pré-requisito:** Prompt 9 concluído.

```
Use the supabase-sym skill and the frontend-design skill.

Implemente a área de configurações (src/app/(dashboard)/configuracoes/page.tsx).
2 abas: Templates | Instâncias WhatsApp
Controle de aba ativa via useState (sem roteamento).

────────────────────────────────────────────
ABA 1 — Templates (Tela D1)
────────────────────────────────────────────
Se a tabela templates_wpp não existir, criar antes:
CREATE TABLE IF NOT EXISTS public.templates_wpp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome varchar(100) NOT NULL,
  tipo varchar(50),
  status_meta varchar(30) DEFAULT 'em_revisao'
);

Tabela: Nome | Tipo | Status Meta | Ações
StatusPill variant='template' para status_meta.

Botão "Novo template": modal com campos Nome e Tipo (select: Reativação / Prospecção)
Botão "Editar" por linha: mesmo modal preenchido
Botão "Sincronizar" por linha: toast informativo:
  "Verifique o status deste template diretamente no painel Meta Business."

Operações: .insert() e .update() em templates_wpp.
Feedback com sonner após cada operação.

────────────────────────────────────────────
ABA 2 — Instâncias WhatsApp (Tela D2)
────────────────────────────────────────────
Se a tabela instancias_wpp não existir, criar antes:
CREATE TABLE IF NOT EXISTS public.instancias_wpp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero varchar(20),
  setor varchar(50),
  status varchar(20) DEFAULT 'desconhecido'
);

Tabela: Número | Setor | Status | Ações
StatusPill variant='instancia' para status.

Botão "Atualizar status" por linha:
- Se EVOLUTION_API_URL configurada: GET à Evolution API, atualiza campo status
- Se não: toast "Integração Evolution API não configurada. Atualize o status manualmente."

Botão "Nova instância": modal com Número e Setor (select: Planta / Pronto para morar / Locação)
Botão "Editar" por linha: mesmo modal preenchido

Operações: .insert() e .update() em instancias_wpp.
Feedback com sonner após cada operação.

Não altere o n8n ou qualquer workflow.
```

---

## PROMPT 11 — Segurança: Row Level Security
**Modelo: Opus**
**Skills: supabase-sym**
**Pré-requisito:** Todos os prompts anteriores concluídos.
**⚠️ Execute manualmente no editor SQL do Supabase. Revise antes de aplicar.**

```
Use the supabase-sym skill.

Preciso implementar Row Level Security (RLS) no Supabase para a plataforma Sym Imóveis.

Contexto crítico:
- O n8n usa Service Role Key — bypassa RLS por padrão. NÃO interfira nisso.
- A interface usa Anon Key com usuários autenticados via Supabase Auth.
- Perfis: "admin" (leitura + escrita em tudo) e "gestor" (somente leitura em leads).
- Perfis definidos via user_metadata.role no Supabase Auth.

Para cada tabela abaixo, gere o SQL completo:

1. public.leads_reativacao — somente leitura para autenticados
2. public.conversas_ia — somente leitura para autenticados
3. public.templates_wpp — SELECT para todos, INSERT/UPDATE para admins, DELETE desabilitado
4. public.instancias_wpp — SELECT para todos, INSERT/UPDATE para admins

Para cada tabela:
- ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
- CREATE POLICY para cada operação
- Verificar admin via: auth.jwt() ->> 'user_metadata' -> 'role' = 'admin'

Também gere:
- Função SQL get_user_role() que retorna o role do usuário atual
- Instrução para promover o primeiro admin:
  UPDATE auth.users SET raw_user_meta_data = '{"role":"admin"}' WHERE email = '...'

Organize por tabela com comentários.
Valide que nenhuma policy afeta operações do service_role (n8n).
```

---

## PROMPT 12 — BI: Views para Looker Studio
**Modelo: Opus**
**Skills: supabase-sym**
**Pré-requisito:** Prompt 11 concluído.
**⚠️ Apenas CREATE OR REPLACE VIEW — não altera nenhuma tabela.**

```
Use the supabase-sym skill.

Preciso configurar a camada de BI da plataforma Sym Imóveis para Looker Studio (gratuito).

Views já existentes (Prompt 2):
view_kpis_gerais, view_funil_conversao, view_dashboard_campanhas, view_disparos_por_dia

PARTE 1 — Novas views para BI

VIEW: view_bi_leads_qualificados
JOIN entre leads_reativacao e conversas_ia pelo telefone.
Somente interesse_detectado = true.
Campos: nome_lead, telefone, tipo_campanha, nome_campanha, data_envio, data_resposta,
        status_reativacao, resumo_interesse, imovel_interesse
Uso: tabela de "Leads Quentes" para o gestor comercial.

VIEW: view_bi_performance_mensal
Agrupado por date_trunc('month', data_envio) e tipo_campanha.
Campos: mes, tipo_campanha, total, respondidos, reativados, taxa_conversao
Uso: gráfico de tendência mensal para a diretoria.

VIEW: view_bi_optout_analise
conversas_ia WHERE status_conversa='sem_interesse' JOIN leads_reativacao por telefone.
Campos: nome_lead, telefone, nome_campanha, data_envio, data_resposta, ultima_resposta_lead
Uso: análise de churn e revisão de copy.

PARTE 2 — Instruções de conexão Looker Studio

Passo a passo para:
1. Obter credenciais PostgreSQL do Supabase (host, porta 5432, database, usuário, senha)
2. Configurar conector PostgreSQL nativo do Looker Studio
3. Adicionar cada view como fonte de dados separada
4. Configurar métricas calculadas: taxa de conversão e comparativo período anterior

PARTE 3 — Estrutura do relatório (3 páginas)
- Página 1 "Visão Executiva": KPIs + funil + tendência mensal
- Página 2 "Campanhas": tabela detalhada + comparativo entre campanhas
- Página 3 "Leads Quentes": tabela filtrável por campanha e período

Retorne SQLs e passo a passo em formato estruturado.
Não crie, altere ou exclua nenhuma tabela.
```

---

## PROMPT 13 — Revisão Final e Deploy
**Modelo: Opus**
**Skills: supabase-sym, humanizer**
**Pré-requisito:** Todos os prompts anteriores concluídos e testados localmente.

```
Use the supabase-sym skill and the humanizer skill.

Faça a revisão final e prepare o deploy da plataforma Sym Imóveis no Vercel.

PARTE 1 — Auditoria de código

Verifique:

Segurança:
- Nenhuma chave de API hardcoded
- N8N_WEBHOOK_DISPARO é server-side apenas (sem NEXT_PUBLIC_)
- Rota /api/disparo valida payload antes de repassar ao n8n
- Middleware protege todas as rotas exceto /login

Performance:
- Server Components em páginas sem interatividade
- Suspense com fallback nas queries do Supabase
- Nenhuma query sem .limit() ou .range()
- Paginação correta na Central de Leads

Tratamento de erros:
- try/catch em todas as chamadas ao Supabase
- error.tsx nas rotas críticas
- Mensagens de erro em português, sem stack trace exposto
- Toast de feedback em todas as operações de escrita

TypeScript:
- Sem `any` explícito
- Tipos do database.ts usados consistentemente
- PayloadDisparo validado antes do POST

Textos de UI:
- Use a humanizer skill para revisar todos os labels, mensagens de erro e toasts
  que estejam em inglês ou com linguagem genérica, reescrevendo em português natural

Liste problemas com arquivo e linha, classificados por:
- CRÍTICO: quebra a operação ou expõe dados
- ATENÇÃO: degradação de experiência
- SUGESTÃO: melhoria futura

PARTE 2 — Variáveis de ambiente para produção

Para cada variável: nome, se é NEXT_PUBLIC_ ou server-side, onde obter, se é obrigatória.

PARTE 3 — Deploy no Vercel

1. Criar projeto no Vercel conectado ao repositório
2. Configurar variáveis de ambiente no painel Vercel
3. Adicionar URL do Vercel nas "Allowed URLs" do Supabase Auth
4. Verificar logs do primeiro deploy
5. Testar login e rota /api/disparo em produção

PARTE 4 — Checklist de validação pós-deploy (15 itens)

Cubra: autenticação, dashboard, filtros de leads, detalhe de conversa,
fluxo completo de campanha (etapas 1 a 4), botão de disparo,
monitoramento realtime, configurações de templates e instâncias.

⚠️ Confirmação obrigatória antes do go-live:
Verificar que os nós wk3-update-sheet e salvar-interessados do n8n ainda estão ativos.
O Google Sheets deve continuar sendo atualizado normalmente durante as primeiras 2 semanas.
NÃO remova esses nós antes da validação da Fase 4.
```

---

## Referência Rápida

### Variáveis de ambiente

| Variável | Tipo | Descrição | Obrigatória |
|----------|------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Chave anon do Supabase | Sim |
| `N8N_WEBHOOK_DISPARO` | Server-side | URL do webhook do n8n | Sim |
| `NEXT_PUBLIC_CVCRM_BASE_URL` | Pública | URL base do CV CRM para links | Sim |
| `EVOLUTION_API_URL` | Server-side | URL da Evolution API | Opcional |

### O que o n8n continua fazendo (não toque)

| Nó | Função |
|----|--------|
| `wk3-supa-insert` | Insere leads em leads_reativacao |
| `wk3-update-sheet` | Atualiza Google Sheets — **manter até Fase 4** |
| `update-lead-status` | Atualiza status para Respondido |
| `marcar-reativado` | Atualiza status para Reativado |
| `atualizar-supa` | Salva resumo da IA em conversas_ia |
| `registrar-crm` | Envia lead qualificado ao CV CRM |
| `salvar-interessados` | Log no Sheets — **manter até Fase 4** |

### Regra de escrita da interface

| Tabela | Interface lê? | Interface escreve? |
|--------|--------------|-------------------|
| `leads_reativacao` | ✅ Sim | ❌ Nunca |
| `conversas_ia` | ✅ Sim | ❌ Nunca |
| `templates_wpp` | ✅ Sim | ✅ Sim (admin) |
| `instancias_wpp` | ✅ Sim | ✅ Sim (admin) |
