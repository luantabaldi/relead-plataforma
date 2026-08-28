# Acesso de Corretores e Gestores — Plano de Implementação

> Estado: **desenho aprovado, implementação não iniciada.**
> Autor do desenho: sessão Claude Code em 2026-08-28.
> Objetivo: dar login individual a corretores e gestores, com escopo de dados por papel.

---

## 1. Decisões tomadas

| Tema | Decisão |
|---|---|
| **Escopo** | Corretor vê **só os leads dele**. Gestor vê **só a equipe dele**. Admin vê tudo. |
| **Login** | **Convite por e-mail** (`auth.admin.inviteUserByEmail`) + o corretor define a própria senha. |
| **Provisionamento** | **Automático**: todo corretor `ativo` no CV vira acesso (sync n8n nightly + Edge Function). |

---

## 2. Estado atual do sistema (levantado nesta sessão)

- **Auth**: Supabase Auth (e-mail+senha), 100% client-side (CRA, sem backend no repo).
- **Projeto Supabase**: `reqlxhvjrqqfksrxifwl`.
- **Contas hoje**: 3 (`demo@relead.com`, `luan.tabaldi@symimoveis.com.br`, `teste@symimoveis.com.br`). Só a do Luan foi usada.
- **Papéis/perfis**: não existem.
- **`leads_reativacao.corretor_id_cvcrm`**: coluna existe, **NULL em 100% das 3.879 linhas**. ⚠️ bloqueador do escopo.
- **`conversas_ia`**: não tem coluna de corretor.
- **RLS**: ligado, mas políticas `qual: true` para `anon` **e** `authenticated` em `leads_reativacao` e `conversas_ia` → **a anon key (pública, está no bundle) lê e escreve tudo**. `meta_tarifas` está sem RLS.
- **CV CRM**: `https://integracao.cvcrm.com.br/api/v1`, auth por `email` + `token` na query.
  - `GET /comercial/leads` retorna `id`, `idcorretor`, `corretor` (nome), `idsituacao`, etc.
  - `PUT /comercial/leads/{idlead}` — aceita `idcorretor`.
  - `POST /relacionamento/atendimentos/cadastrar` — usa `idcorretor`.

---

## 3. Arquitetura

### 3.1 Tabelas novas (`migrations/acesso_corretores_gestores.sql`)

```
usuarios_cv            -- espelho do CV, upsert pelo n8n
  cvcrm_id text pk           -- idcorretor
  nome, email (unique), telefone
  papel  'corretor'|'gestor'|'admin'
  gestor_cvcrm_id text  -> usuarios_cv(cvcrm_id)   -- hierarquia da equipe
  ativo boolean
  sincronizado_em

perfis                 -- liga login <-> corretor
  id uuid pk -> auth.users(id)
  cvcrm_id -> usuarios_cv
  papel, ativo
```

### 3.2 Trigger + funções

- `on_auth_user_created` → cria `perfis` casando `auth.users.email` com `usuarios_cv.email`.
- `current_papel()`, `current_cvcrm_id()` → lêem `perfis` do `auth.uid()`.
- `escopo_cvcrm_ids()` → gestor: equipe + ele; corretor: só ele; admin: vazio (política trata à parte).

### 3.3 RLS (na migration)

| Tabela | admin | gestor | corretor | anon |
|---|---|---|---|---|
| `leads_reativacao` (select/update) | tudo | `corretor_id_cvcrm ∈ equipe` | `corretor_id_cvcrm = ele` | **sem acesso** |
| `conversas_ia` (select/update) | tudo | idem (nova coluna `corretor_id_cvcrm`) | idem | **sem acesso** |
| `usuarios_cv` | tudo | tudo | só a própria linha | sem acesso |
| `perfis` | tudo | própria | própria | sem acesso |
| `meta_tarifas` | leitura logado | — | — | sem acesso |

INSERT/DELETE de `leads_reativacao`/`conversas_ia` ficam **sem policy** → só `service_role`. **O n8n precisa migrar da anon key para a service_role key.**

### 3.4 Provisionamento (`supabase/functions/provisionar-acessos/`)

1. n8n (nightly): `GET /comercial/corretores` no CV → upsert `usuarios_cv` (marca `ativo=false` quem sumiu).
2. Edge Function `provisionar-acessos` (logo após, via pg_cron): novos → `inviteUserByEmail`; inativos → `ban_duration`.
3. Corretor clica no convite → `/definir-senha` no painel → `supabase.auth.updateUser({ password })`.

### 3.5 Frontend (a fazer)

- Nova rota/tela `/definir-senha` (fluxo de invite/recovery) + "esqueci a senha".
- Context de auth: após login, carregar `perfis` → `papel`.
- `DashboardPage`: esconder abas **Disparar**, **Performance/custos**, **Templates** quando `papel === 'corretor'`. Gestor mantém performance (da equipe).
- Hooks (`useLeadsList`, `useConversations`, `useDispatchesList`, …): **não mudam** — o RLS filtra.
- `src/lib/supabase.ts`: nada muda no client (continua anon key + sessão). Só garantir que erros de RLS (0 linhas) tenham UX decente.

---

## 4. Bloqueadores / pendências com o cliente

1. **Backfill `corretor_id_cvcrm`** (script `scripts/backfill-corretor-id.mjs`, pronto p/ rodar):
   - precisa de `CVCRM_EMAIL` + `CVCRM_TOKEN` válidos e da `SB_SERVICE_ROLE_KEY`.
   - além do backfill histórico, o **WK0 (distribuição de leads)** no n8n tem que passar a gravar `idcorretor` em todo lead novo.
2. **Hierarquia de equipe** — confirmar o retorno de `GET /comercial/corretores` do CVCRM:
   - traz `idgestor` / `gerente` / `equipe`? Se **sim**, o n8n preenche `usuarios_cv.gestor_cvcrm_id` direto.
   - se **não**, precisamos de uma tela de admin (ou planilha) para mapear corretor→gestor à mão.
   - **AÇÃO: enviar um JSON de exemplo desse endpoint, ou o email+token de teste.**
3. **SMTP no Supabase** — o convite manda e-mail. O SMTP default do Supabase limita ~2–4/hora e não serve p/ produção.
   - **AÇÃO: definir provedor (Resend / SES / SendGrid) e configurar em Auth → SMTP.**
4. **`papel` de cada pessoa** — como o CV distingue corretor de gestor de admin? (campo `cargo`/`tipo`?) Define o `check` de `usuarios_cv.papel`.

---

## 5. Ordem de execução sugerida

- [ ] **F0** — cliente responde pendências §4.2, §4.3, §4.4 e fornece token CV.
- [ ] **F1 — Supabase** (independe do CV): revisar e aplicar `migrations/acesso_corretores_gestores.sql`.
      Criar 1 conta admin manual (`luan.tabaldi`) e conferir que ele continua vendo tudo.
- [ ] **F2 — n8n**: workflow "Sync Corretores CV → usuarios_cv". Migrar escritas de `leads_reativacao`/`conversas_ia` para a **service_role key**.
- [ ] **F3 — Backfill**: rodar `scripts/backfill-corretor-id.mjs --dry-run`, conferir taxa de match, rodar de verdade. Depois o UPDATE de `conversas_ia` (migration §5).
- [ ] **F4 — Edge Function**: `supabase functions deploy provisionar-acessos`; secrets; agendar via pg_cron após o sync.
- [ ] **F5 — Frontend**: tela `/definir-senha`, context de papel, esconder abas por papel.
- [ ] **F6 — Teste E2E**: convidar 1 corretor real + 1 gestor; validar que cada um vê só o que deve; validar que admin vê tudo; validar que a anon key não lê mais nada.

---

## 6. Arquivos entregues nesta sessão

| Arquivo | O quê |
|---|---|
| `migrations/acesso_corretores_gestores.sql` | schema + trigger + funções + RLS + fecha anon/meta_tarifas |
| `supabase/functions/provisionar-acessos/index.ts` | Edge Function de provisionamento (convite/ban) |
| `scripts/backfill-corretor-id.mjs` | backfill de `corretor_id_cvcrm` a partir do CV CRM |
| `docs/acesso-corretores-gestores/PLANO.md` | este documento |

> Nenhum desses arquivos foi aplicado/deployado. São ponto de partida para revisão.
