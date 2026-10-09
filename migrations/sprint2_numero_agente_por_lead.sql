-- Sprint 2 (APLICADA em 2026-10-09 no projeto re-lead): número e agente por campanha.
-- Tudo aditivo.

-- Número: mapeia cada número da Meta para a instância de envio (Evolution)
alter table public.numeros_whatsapp_status
  add column if not exists evolution_instance text,
  add column if not exists apelido text,
  add column if not exists ativo boolean not null default true;

update public.numeros_whatsapp_status
   set evolution_instance = 'sym-imoveis-oficial'
 where evolution_instance is null;

-- Agentes de mensagem (atendimento IA)
create table if not exists public.agentes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.agentes enable row level security;
create policy "Authenticated can read agentes" on public.agentes
  for select to authenticated using (true);

insert into public.agentes (slug, nome, descricao, padrao) values
  ('ana_paula', 'Ana Paula', 'Atendimento de reativação de leads', true),
  ('prospeccao', 'Prospecção', 'Abordagem de prospecção ativa', false)
on conflict (slug) do nothing;

-- Escolhas da campanha ficam em cada lead
alter table public.leads_reativacao
  add column if not exists phone_number_id text,
  add column if not exists agente_slug text;
