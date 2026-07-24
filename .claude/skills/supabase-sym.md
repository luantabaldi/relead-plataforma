---
name: supabase-sym
description: Supabase schema, query patterns, and inviolable business rules for the Sym Imóveis platform. Use this skill whenever working on ANY feature, query, Server Component, Client Component, or API route that touches the Sym Imóveis database — including leads_reativacao, conversas_ia, templates_wpp, instancias_wpp, the dashboard views, or the /api/disparo dispatch flow. Always consult this skill before writing any Supabase query, RLS policy, or business logic for this project. Do not guess table structure or business rules — load this skill.
---

# Supabase Sym — Schema & Business Rules

## Supabase Clients

| Context | Import |
|---------|--------|
| Server Components / Route Handlers | `import { createClient } from '@/lib/supabase/server'` then `const supabase = await createClient()` |
| Client Components (`'use client'`) | `import { createClient } from '@/lib/supabase/client'` then `const supabase = createClient()` |

Never import the server client from a Client Component and vice versa.

---

## Tables

### `leads_reativacao` — READ ONLY from the interface

> The interface must **never** call `.insert()` or `.update()` on this table. It is written exclusively by n8n automations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `lead_id_cvcrm` | varchar | Reference ID in CV CRM |
| `telefone` | varchar | Format: `55XXXXXXXXXXX` (country code + DDD + number) |
| `nome_lead` | varchar | |
| `status_reativacao` | varchar | `'Enviado'` \| `'Respondido'` \| `'Reativado'` \| `'Erro no Disparo'` \| `'Pausado (Horário Excedido)'` |
| `data_envio` | timestamp | |
| `data_resposta` | timestamp | Nullable |
| `mensagem_enviada` | text | |
| `ultima_resposta_lead` | text | Nullable |
| `historico_mensagens` | jsonb | Full conversation log — 100% filled, never null |
| `tipo_campanha` | varchar | `'reativacao'` \| `'prospeccao'` |
| `nome_campanha` | varchar(100) | Nullable — added via `ALTER TABLE` |

### `conversas_ia` — READ ONLY from the interface

> The interface must **never** call `.insert()` or `.update()` on this table. It is written exclusively by n8n automations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `telefone` | varchar UNIQUE | **Join key** with `leads_reativacao` — not a FK |
| `status_conversa` | varchar | `'ativa'` \| `'interesse_confirmado'` \| `'sem_interesse'` |
| `interesse_detectado` | boolean | |
| `resumo_interesse` | text | Nullable — ~91.6% null currently |
| `imovel_interesse` | varchar | Nullable — ~100% null currently |

### `templates_wpp` — admins can insert/update

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `nome` | varchar(100) | |
| `tipo` | varchar(50) | |
| `status_meta` | varchar | `'Aprovado'` \| `'em_revisao'` \| `'Rejeitado'` |

### `instancias_wpp` — admins can insert/update

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `numero` | varchar(20) | |
| `setor` | varchar(50) | |
| `status` | varchar | `'Conectado'` \| `'Desconectado'` \| `'desconhecido'` |

---

## Available Views (read-only)

These views were created in migration Prompt 2. Always query them instead of manually aggregating tables.

| View | Shape | Use for |
|------|-------|---------|
| `view_kpis_gerais` | 1 row | Dashboard KPI cards |
| `view_funil_conversao` | 4 rows | Conversion funnel chart |
| `view_dashboard_campanhas` | grouped by `nome_campanha` + `tipo_campanha` | Campaign performance table |
| `view_disparos_por_dia` | grouped by day | Daily dispatch timeline chart |

Query example:
```ts
const { data } = await supabase.from('view_kpis_gerais').select('*').single()
```

---

## Query Patterns

### Pagination — always required
Never fetch an entire table without limiting results:
```ts
// Preferred — cursor-based
const { data } = await supabase
  .from('leads_reativacao')
  .select('*')
  .range(0, 49)   // 50 rows per page

// Also acceptable
  .limit(50)
```

### Filtering `leads_reativacao`
```ts
// By status
.eq('status_reativacao', 'Enviado')

// By name or phone (case-insensitive partial match)
.ilike('nome_lead', `%${query}%`)
.ilike('telefone', `%${query}%`)

// By date range
.gte('data_envio', startDate)
.lte('data_envio', endDate)

// By campaign type
.eq('tipo_campanha', 'reativacao')

// By campaign name
.eq('nome_campanha', campaignName)
```

### Joining `leads_reativacao` with `conversas_ia`
There is **no foreign key** between these tables. Join is by `telefone`. Always do two separate queries:

```ts
// 1. Fetch lead
const { data: lead } = await supabase
  .from('leads_reativacao')
  .select('*')
  .eq('id', leadId)
  .single()

// 2. Fetch conversation by phone
const { data: conversa } = await supabase
  .from('conversas_ia')
  .select('*')
  .eq('telefone', lead.telefone)
  .maybeSingle()
```

Never try to use `.select('*, conversas_ia(*)')` — there is no FK relationship.

---

## Inviolable Business Rules

These rules must never be broken regardless of what the user asks:

1. **Never `.insert()` or `.update()` on `leads_reativacao` or `conversas_ia`** — these tables are owned by n8n. Any write attempt will corrupt automation state.

2. **Never call the n8n MCP or modify any n8n workflow** — the n8n nodes `wk3-update-sheet` and `salvar-interessados` must remain active until Phase 4 validation.

3. **Campaign dispatch always goes through `POST /api/disparo`** — never write directly to Supabase from dispatch logic. The `/api/disparo` route only forwards the `PayloadDisparo` payload to the n8n webhook; it does not write to Supabase itself.

4. **`id_empreendimento` is free text** — it is typed once per campaign. There is no `empreendimentos` table. Do not create one or suggest joining by it.

---

## Payload Type for Campaign Dispatch

```ts
// src/types/database.ts
interface PayloadDisparo {
  nome_campanha: string
  template_nome: string
  id_empreendimento: string  // free text — no FK
  tipo_campanha: string
  link_imagem: string | null
  leads: LeadDoCsv[]
}

interface LeadDoCsv {
  nome: string
  telefone: string  // format: 55XXXXXXXXXXX
  observacao: string
}
```

The `/api/disparo` route receives this payload from the frontend and forwards it as-is to `N8N_WEBHOOK_DISPARO` (env var). It does not validate lead uniqueness or write anything to Supabase.
