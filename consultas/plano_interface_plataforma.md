# Plano de Implementação da Interface — Sym Imóveis
**Versão:** 1.0 | **Data:** 15/05/2026
**Base técnica:** Arquivo `Analise sistema` (auditoria de 14/05/2026)

---

## 1. Visão Geral e Princípios

A plataforma substituirá a dependência da Planilha Google (Google Sheets) por uma interface web
integrada ao Supabase e ao n8n. O desenvolvimento é paralelo à operação — a planilha continua
funcionando até a Fase 4, quando é desligada de forma controlada.

### 1.1. Pilares
- **Zero Downtime:** Cada fase é aditiva. Nenhuma etapa exige parar o sistema atual.
- **Fonte Única de Verdade:** O Supabase é o único banco. A interface só lê e escreve nele.
- **Ação Progressiva:** Começar por visualização (passivo), evoluir para ação (ativo).

### 1.2. Stack Tecnológica Recomendada
| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | SSR nativo + integração direta com Supabase Auth |
| **Backend / Banco** | Supabase (já existente) | Zero custo adicional, dados já lá |
| **Autenticação** | Supabase Auth | Controle de acesso por papel (gestor/corretor) |
| **Estilo** | Tailwind CSS | Velocidade de desenvolvimento |
| **Gráficos** | Recharts ou Chart.js | Leve, funciona bem com dados do Supabase |
| **Deploy** | Vercel | Free tier suficiente para o volume atual |

---

### 2. Mapa de Telas

### Módulo A — Dashboard de Campanhas (Leitura)
| Tela | Descrição |
| :--- | :--- |
| `A1` Visão Geral | KPIs de conversão e saúde dos disparos (Tempo Real) |
| `A2` Performance por Campanha | Comparativo de ROI entre diferentes ações/listas |

### Módulo B — Gestor de Leads (Leitura + Ação)
| Tela | Descrição |
| :--- | :--- |
| `B1` Central de Leads | Tabela com filtros avançados e busca por nome/telefone |
| `B2` Detalhe do Lead | Histórico de mensagens (Chat) e atalho para o CV CRM |

### Módulo C — Central de Disparo (Substituição da Planilha)
| Tela | Descrição |
| :--- | :--- |
| `C1` Nova Campanha | Upload de leads + Definição de Nome, Template, ID Empreendimento, Tipo e Imagem |
| `C2` Revisão de Leads | Lista de leads carregados para edição de observações individuais antes do disparo |
| `C3` Monitoramento | Acompanhamento do progresso do disparo em tempo real |

---

## 3. Fases de Implementação

### Fase 1 — Dashboard de Métricas (Leitura Pura)
**Prazo estimado:** 1 semana | **Risco para a operação: ZERO**

**O que construir:**
- Autenticação via Supabase Auth
- Tela `A1`: Cards de KPI (Volume, Resposta, Qualificação IA, Opt-out)
- Gráfico de pizza por `status_reativacao`

---

### Fase 2 — Agrupamento por Campanhas
**Prazo estimado:** 1 semana | **Risco para a operação: BAIXO**

**O que construir:**
- Adição da coluna `nome_campanha` no Supabase
- Ajuste nos workflows do n8n para aceitar e gravar esse campo
- Tela `A2`: Dashboard filtrável pelo nome da campanha

**Fonte de dados (queries já validadas no `Analise sistema` — Seção 9):**
```sql
-- Card 1: Volume
SELECT tipo_campanha, count(*) as total FROM leads_reativacao GROUP BY 1;

-- Card 2: Taxa de Resposta
SELECT (count(*) FILTER (WHERE status_reativacao IN ('Respondido','Reativado'))::float
        / count(*)) * 100 FROM leads_reativacao;

-- Card 3: Qualificação IA
SELECT (count(*) FILTER (WHERE interesse_detectado = true)::float / count(*)) * 100
FROM conversas_ia;

-- Card 4: Opt-out
SELECT (count(*) FILTER (WHERE status_conversa = 'sem_interesse')::float / count(*)) * 100
FROM conversas_ia;
```

**Database Views a criar no Supabase:**
```sql
CREATE VIEW view_dashboard_operacional AS
SELECT
  tipo_campanha,
  count(*) AS total_disparos,
  count(*) FILTER (WHERE status_reativacao = 'Enviado') AS enviados,
  count(*) FILTER (WHERE status_reativacao = 'Respondido') AS respondidos,
  count(*) FILTER (WHERE status_reativacao = 'Reativado') AS reativados,
  count(*) FILTER (WHERE status_reativacao = 'Erro no Disparo') AS erros,
  date_trunc('day', data_envio) AS dia
FROM leads_reativacao
GROUP BY 1, 6;
```

---

### Fase 2 — Gestão de Leads (Leitura + Filtros)
**Prazo estimado:** 1–2 semanas | **Risco para a operação: ZERO**

**O que construir:**
- Tela `B1`: Tabela paginada de leads com colunas: Nome, Telefone, Status, Campanha, Data Envio
  - Filtros: Status, Campanha, Interesse Detectado, Período
- Tela `B2`: Modal ou página de perfil do lead com:
  - Histórico de mensagens (`historico_mensagens` em JSONB → renderizado como chat)
  - Status atual e botão "Ver no CRM" (link para o CV CRM via `lead_id_cvcrm`)
- Tela `B3`: Lista simplificada de leads qualificados pela IA

**Nota técnica:** O campo `historico_mensagens` é JSONB e tem 100% de preenchimento
(confirmado na auditoria). A renderização como timeline de chat é direta.

---

### Fase 3 — Fluxo de Campanha Unificada
**Prazo estimado:** 2 semanas | **Risco para a operação: BAIXO**

**O que construir (Fluxo Operacional):**
1.  **Nomear Campanha:** Campo texto livre (ex: "Reativação Lote 05").
2.  **Entrada de Dados:** Upload de CSV ou seleção de base existente.
3.  **Configuração Global (Replica para todos os leads):**
    *   **Template:** Seleção do texto/template cadastrado.
    *   **ID Empreendimento:** Campo numérico livre (ID do CV CRM).
    *   **Tipo de Campanha:** Dropdown (Reativação, Prospecção, etc).
    *   **Link da Imagem:** Campo URL opcional.
4.  **Edição Individual:** Tabela simples para preencher a **Observação** de cada lead individualmente.
5.  **Botão "Iniciar Disparo"** → Envia o lote para o n8n.

**Integração n8n:** O botão chama o mesmo Webhook que a planilha usa hoje. Zero mudança no
workflow de disparo. A diferença é que os dados vêm do Supabase em vez do Sheets.

---

### Fase 4 — Configurações e Desligamento (Admin)
**Prazo estimado:** 1 semana | **Risco para a operação: CONTROLADO**

**O que construir:**
- Tela `D1`: Gestão de Templates (apenas visualização dos textos/nomes).
- Tela `D2`: Listagem das instâncias WhatsApp com status de saúde (via Evolution API).
- **Desligamento:** Remover os nós de escrita na Planilha dos workflows do n8n.

---

## 4. Estrutura de Banco de Dados Adicional

### 4.1. Ajuste na Tabela `leads_reativacao`
```sql
-- Adicionar o campo para agrupar as métricas por ação
ALTER TABLE public.leads_reativacao ADD COLUMN nome_campanha VARCHAR(100);
```

### 4.2. Fluxo de Dados Simplificado
1.  **Usuário** preenche o formulário na Plataforma (Formulário Amigável).
2.  **Plataforma** valida os dados e grava no Supabase com o `nome_campanha`.
3.  **n8n** detecta o novo registro e faz o disparo oficial.
4.  **Dashboard** atualiza automaticamente agrupando por essa nova campanha.

---

## 5. Arquitetura de Segurança (RLS)

Todas as tabelas novas e existentes devem ter **Row Level Security** habilitada no Supabase.

```sql
-- Exemplo: somente usuários autenticados veem os leads
ALTER TABLE public.leads_reativacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leads"
ON public.leads_reativacao FOR SELECT
TO authenticated USING (true);

-- Somente admins podem iniciar campanhas
CREATE POLICY "Admins can insert campaigns"
ON public.campanhas FOR INSERT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 6. Checklist de Desenvolvimento por Fase

### ✅ Pré-requisitos (Antes de Começar)
- [ ] Criar projeto no Vercel e conectar ao repositório
- [ ] Configurar variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `N8N_WEBHOOK_URL`
- [ ] Criar as 3 Database Views no Supabase (Seção 3, Fase 1)
- [ ] Criar tabelas `empreendimentos` e `instancias_wpp` (Seção 4)
- [ ] Cadastrar usuário admin no Supabase Auth

### 📋 Fase 1
- [ ] Página de login com Supabase Auth
- [ ] Layout base com sidebar de navegação
- [ ] Tela A1: 4 KPI cards + Gráfico de barras por campanha
- [ ] Tela A2: Filtro de período funcional
- [ ] Tela A3: Funil de conversão visual

### 📋 Fase 2
- [ ] Tela B1: Tabela com paginação e filtros
- [ ] Tela B2: Histórico de conversa renderizado como chat
- [ ] Tela B3: Lista de leads qualificados

### 📋 Fase 3
- [ ] Tela C1: Upload e validação de CSV
- [ ] Tela C2: Formulário de configuração de campanha
- [ ] Integração com Webhook do n8n
- [ ] Tela C3: Painel de monitoramento em tempo real (Supabase Realtime)

### 📋 Fase 4
- [ ] Telas D1–D4: CRUDs de configuração
- [ ] Validação de 2 semanas com Fase 3 em produção
- [ ] Remoção dos nós de Google Sheets nos workflows do n8n
- [ ] Arquivamento da planilha Google Sheets

---

## 7. Marcos de Entrega

| Marco | O que significa | Critério de Conclusão |
| :--- | :--- | :--- |
| **M1** | Dashboard no ar | KPIs acessíveis pelo gestor sem planilha |
| **M2** | Visibilidade total | Qualquer lead pode ser consultado na plataforma |
| **M3** | Primeiro disparo pela plataforma | Um disparo completo feito sem abrir a planilha |
| **M4** | Planilha desligada | 100% da operação via plataforma |
