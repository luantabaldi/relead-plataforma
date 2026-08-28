-- =============================================================================
-- Acesso de Corretores e Gestores — schema + RLS
-- =============================================================================
-- Decisões (ver docs/acesso-corretores-gestores/PLANO.md):
--   * Corretor enxerga apenas os leads onde é o responsável (corretor_id_cvcrm).
--   * Gestor enxerga os leads da própria equipe (corretores com gestor_cvcrm_id = ele).
--   * Admin enxerga tudo.
--   * Entrada por convite de e-mail + senha própria (auth.admin.inviteUserByEmail).
--   * Todo corretor ATIVO no CV vira acesso automaticamente (sync n8n + Edge Function).
--
-- PRÉ-REQUISITO em produção: leads_reativacao.corretor_id_cvcrm está 100% NULL hoje.
-- Enquanto o WK0 (distribuição) não gravar o idcorretor e o backfill não rodar,
-- as políticas de corretor/gestor retornam 0 linhas. Ver BACKFILL_CORRETOR_ID.md.
--
-- Rode com:  supabase db push   (ou cole no SQL editor do projeto reqlxhvjrqqfksrxifwl)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Espelho dos corretores/gestores do CV CRM (populado pelo n8n, nightly)
-- -----------------------------------------------------------------------------
create table if not exists public.usuarios_cv (
  cvcrm_id         text primary key,                 -- idcorretor no CV CRM
  nome             text not null,
  email            text not null unique,
  telefone         text,
  papel            text not null default 'corretor'
                     check (papel in ('corretor', 'gestor', 'admin')),
  gestor_cvcrm_id  text references public.usuarios_cv(cvcrm_id) on delete set null,
  ativo            boolean not null default true,
  sincronizado_em  timestamptz not null default now()
);

comment on table public.usuarios_cv is
  'Espelho dos corretores/gestores do CV CRM. Fonte de verdade: GET /comercial/corretores. Upsert por cvcrm_id via n8n.';
comment on column public.usuarios_cv.gestor_cvcrm_id is
  'cvcrm_id do gestor responsável por este corretor. Define a equipe para as políticas de RLS do gestor.';

create index if not exists idx_usuarios_cv_gestor on public.usuarios_cv(gestor_cvcrm_id);
create index if not exists idx_usuarios_cv_email  on public.usuarios_cv(lower(email));

-- -----------------------------------------------------------------------------
-- 2. Perfil: liga a conta de login (auth.users) ao corretor do CV
-- -----------------------------------------------------------------------------
create table if not exists public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  cvcrm_id   text references public.usuarios_cv(cvcrm_id) on delete set null,
  papel      text not null default 'corretor'
               check (papel in ('corretor', 'gestor', 'admin')),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

comment on table public.perfis is
  'Perfil da conta de login. Criado automaticamente pelo trigger on_auth_user_created casando o e-mail com usuarios_cv.';

create index if not exists idx_perfis_cvcrm on public.perfis(cvcrm_id);

-- -----------------------------------------------------------------------------
-- 3. Trigger: ao criar usuário no auth, cria o perfil casando por e-mail
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cv public.usuarios_cv%rowtype;
begin
  select * into v_cv
  from public.usuarios_cv
  where lower(email) = lower(new.email)
  limit 1;

  insert into public.perfis (id, cvcrm_id, papel, ativo)
  values (
    new.id,
    v_cv.cvcrm_id,
    coalesce(v_cv.papel, (new.raw_user_meta_data ->> 'papel'), 'corretor'),
    coalesce(v_cv.ativo, true)
  )
  on conflict (id) do update
    set cvcrm_id = excluded.cvcrm_id,
        papel    = excluded.papel,
        ativo    = excluded.ativo;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 4. Funções auxiliares para as políticas (stable, security definer)
-- -----------------------------------------------------------------------------
create or replace function public.current_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where id = auth.uid() and ativo;
$$;

create or replace function public.current_cvcrm_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select cvcrm_id from public.perfis where id = auth.uid() and ativo;
$$;

-- Conjunto de cvcrm_id que o usuário logado pode enxergar:
--   admin  -> NULL  (as políticas tratam admin à parte, sem filtro)
--   gestor -> a própria equipe + ele mesmo
--   corretor -> só ele mesmo
create or replace function public.escopo_cvcrm_ids()
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_papel text := public.current_papel();
  v_id    text := public.current_cvcrm_id();
begin
  if v_papel = 'gestor' then
    return query
      select cvcrm_id from public.usuarios_cv where gestor_cvcrm_id = v_id
      union
      select v_id;
  elsif v_papel = 'corretor' then
    return query select v_id;
  end if;
  -- admin / sem perfil: retorna vazio (política de admin não usa esta função)
  return;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. conversas_ia precisa do corretor para ser filtrável
-- -----------------------------------------------------------------------------
alter table public.conversas_ia
  add column if not exists corretor_id_cvcrm text;

comment on column public.conversas_ia.corretor_id_cvcrm is
  'Preenchido pelo n8n (WK2) e por backfill via telefone a partir de leads_reativacao.';

-- Backfill inicial por telefone (rode manualmente após revisar):
-- update public.conversas_ia c
--    set corretor_id_cvcrm = l.corretor_id_cvcrm
--   from public.leads_reativacao l
--  where l.telefone = c.telefone
--    and c.corretor_id_cvcrm is null
--    and l.corretor_id_cvcrm is not null;

-- -----------------------------------------------------------------------------
-- 6. RLS — usuarios_cv / perfis (leitura para usuários logados, escrita só service_role)
-- -----------------------------------------------------------------------------
alter table public.usuarios_cv enable row level security;
alter table public.perfis      enable row level security;

drop policy if exists "usuarios_cv: logado lê" on public.usuarios_cv;
create policy "usuarios_cv: logado lê"
  on public.usuarios_cv for select
  to authenticated
  using (
    public.current_papel() in ('admin', 'gestor')
    or cvcrm_id = public.current_cvcrm_id()
  );

drop policy if exists "perfis: dono lê" on public.perfis;
create policy "perfis: dono lê"
  on public.perfis for select
  to authenticated
  using (id = auth.uid() or public.current_papel() = 'admin');

-- (sem policy de INSERT/UPDATE/DELETE => apenas service_role escreve)

-- -----------------------------------------------------------------------------
-- 7. RLS — leads_reativacao: remove acesso aberto e aplica escopo por papel
-- -----------------------------------------------------------------------------
alter table public.leads_reativacao enable row level security;

-- 7a. DERRUBA as políticas atuais (anon + authenticated com USING true = tudo exposto)
drop policy if exists "Allow anonymous select on leads_reativacao"    on public.leads_reativacao;
drop policy if exists "Allow anonymous insert on leads_reativacao"    on public.leads_reativacao;
drop policy if exists "Allow anonymous update on leads_reativacao"    on public.leads_reativacao;
drop policy if exists "Allow anonymous delete on leads_reativacao"    on public.leads_reativacao;
drop policy if exists "Allow authenticated select on leads_reativacao" on public.leads_reativacao;
drop policy if exists "Allow authenticated insert on leads_reativacao" on public.leads_reativacao;
drop policy if exists "Allow authenticated update on leads_reativacao" on public.leads_reativacao;
drop policy if exists "Allow authenticated delete on leads_reativacao" on public.leads_reativacao;

-- 7b. Novo acesso por papel (SELECT + UPDATE de status pelo painel).
--     INSERT/DELETE ficam só para service_role (n8n) — sem policy.
drop policy if exists "leads: escopo por papel (select)" on public.leads_reativacao;
create policy "leads: escopo por papel (select)"
  on public.leads_reativacao for select
  to authenticated
  using (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  );

drop policy if exists "leads: escopo por papel (update)" on public.leads_reativacao;
create policy "leads: escopo por papel (update)"
  on public.leads_reativacao for update
  to authenticated
  using (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  )
  with check (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  );

-- -----------------------------------------------------------------------------
-- 8. RLS — conversas_ia: mesmo escopo
-- -----------------------------------------------------------------------------
alter table public.conversas_ia enable row level security;

drop policy if exists "Allow anonymous select on conversas_ia"     on public.conversas_ia;
drop policy if exists "Allow anonymous insert on conversas_ia"     on public.conversas_ia;
drop policy if exists "Allow anonymous update on conversas_ia"     on public.conversas_ia;
drop policy if exists "Allow anonymous delete on conversas_ia"     on public.conversas_ia;
drop policy if exists "Allow authenticated select on conversas_ia" on public.conversas_ia;
drop policy if exists "Allow authenticated insert on conversas_ia" on public.conversas_ia;
drop policy if exists "Allow authenticated update on conversas_ia" on public.conversas_ia;
drop policy if exists "Allow authenticated delete on conversas_ia" on public.conversas_ia;

drop policy if exists "conversas: escopo por papel (select)" on public.conversas_ia;
create policy "conversas: escopo por papel (select)"
  on public.conversas_ia for select
  to authenticated
  using (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  );

drop policy if exists "conversas: escopo por papel (update)" on public.conversas_ia;
create policy "conversas: escopo por papel (update)"
  on public.conversas_ia for update
  to authenticated
  using (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  )
  with check (
    public.current_papel() = 'admin'
    or corretor_id_cvcrm in (select public.escopo_cvcrm_ids())
  );

-- -----------------------------------------------------------------------------
-- 9. Fecha a tabela sem RLS apontada pelo advisor
-- -----------------------------------------------------------------------------
alter table public.meta_tarifas enable row level security;

drop policy if exists "meta_tarifas: logado lê" on public.meta_tarifas;
create policy "meta_tarifas: logado lê"
  on public.meta_tarifas for select
  to authenticated
  using (true);

-- =============================================================================
-- ATENÇÃO — tabelas ainda abertas ao papel anon (qual: true), avaliar caso a caso:
--   campanhas_agendadas, custos_conversas_meta, custos_gemini_ia,
--   empreendimentos, numeros_whatsapp_status, templates_wpp
-- O n8n deve passar a usar a SERVICE_ROLE key (ignora RLS) em vez da anon key
-- antes de restringirmos essas. Ver PLANO.md §"Fechar buracos".
-- =============================================================================

commit;
