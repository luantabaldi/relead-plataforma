-- Sprint 2 (proposta, NÃO aplicada): opt-out automático e chave de telefone.
-- Revisar antes de aplicar. Tudo é aditivo; nada existente é alterado ou removido.

-- 1) Chave de comparação de telefone: DDD + últimos 8 dígitos (ignora o 55 e o 9º dígito)
create or replace function public.chave_telefone(t text)
returns text language sql immutable set search_path = '' as $$
  select case when length(n) >= 10 then left(n, 2) || right(n, 8) else n end
  from (
    select case when d like '55%' and length(d) >= 12 then substr(d, 3) else d end as n
    from (select regexp_replace(coalesce(t, ''), '\D', '', 'g') as d) a
  ) b
$$;

alter table public.blacklist
  add column if not exists telefone_chave text generated always as (public.chave_telefone(telefone)) stored;
create unique index if not exists blacklist_telefone_chave_key on public.blacklist (telefone_chave);

-- 2) A mensagem do lead é um pedido explícito de remoção?
--    Frases longas casam por trecho; palavras soltas ("sair", "parar") só se forem a mensagem inteira.
--    "Não tenho interesse no momento" NÃO é opt-out.
create or replace function public.eh_pedido_optout(msg text)
returns boolean language sql immutable set search_path = '' as $$
  with m as (
    select trim(regexp_replace(
             translate(lower(coalesce(msg, '')),
               'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'),
             '[^a-z0-9 ]', ' ', 'g')) as t
  ), n as (select regexp_replace(t, '\s+', ' ', 'g') as t from m)
  select
    t in ('sair','parar','pare','stop','cancelar','remover','descadastrar','sair da lista',
          'parar promocoes','cancelar inscricao','nao receber mais mensagens','me remove','me remova')
    or t ~ '(nao quero receber|nao receber mais|parar de receber|para de me mandar|para de mandar|para de enviar|nao me envie|nao me mande|nao envie mais|nao mande mais|nao me contate|nao me contacte|me tire da lista|me retire da lista|tirar da lista|retirar da lista|remover da lista|descadastr)'
  from n
$$;

-- 3) Captura: o workflow de atendimento grava o texto do lead em leads_reativacao.ultima_resposta_lead.
--    Se for opt-out, o número entra na blacklist e o lead recebe motivo_objecao = 'Solicitou remoção/opt-out'.
--    O trigger só dispara no UPDATE dessa coluna e não altera o fluxo do workflow.
create or replace function public.trg_captura_optout()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.eh_pedido_optout(new.ultima_resposta_lead) then
    insert into public.blacklist (telefone, nome, motivo, adicionado_por)
    values (
      case when length(regexp_replace(new.telefone, '\D', '', 'g')) in (10, 11)
           then '55' || regexp_replace(new.telefone, '\D', '', 'g')
           else regexp_replace(new.telefone, '\D', '', 'g') end,
      new.nome_lead,
      'Opt-out automático: "' || left(new.ultima_resposta_lead, 120) || '"',
      'automatico (atendimento)'
    )
    on conflict (telefone_chave) do nothing;

    update public.leads_reativacao
       set motivo_objecao = 'Solicitou remoção/opt-out'
     where id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists captura_optout on public.leads_reativacao;
create trigger captura_optout
  after update of ultima_resposta_lead on public.leads_reativacao
  for each row
  when (new.ultima_resposta_lead is distinct from old.ultima_resposta_lead)
  execute function public.trg_captura_optout();

-- 4) Quem entra na blacklist deixa de receber o que ainda está pendente.
--    O workflow de disparo pula leads cuja linha não está mais como 'Pendente'.
create or replace function public.trg_blacklist_bloqueia_pendentes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.leads_reativacao
     set status_reativacao = 'Erro no Disparo', tipo_erro = 'Opt-out/bloqueio'
   where status_reativacao = 'Pendente'
     and public.chave_telefone(telefone) = new.telefone_chave;
  return null;
end $$;

drop trigger if exists blacklist_bloqueia_pendentes on public.blacklist;
create trigger blacklist_bloqueia_pendentes
  after insert on public.blacklist
  for each row execute function public.trg_blacklist_bloqueia_pendentes();

-- 5) Checagem pontual para o n8n: só responde se um número está bloqueado, não lista nada.
create or replace function public.telefone_bloqueado(p_telefone text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blacklist where telefone_chave = public.chave_telefone(p_telefone))
$$;
revoke all on function public.telefone_bloqueado(text) from public;
grant execute on function public.telefone_bloqueado(text) to anon, authenticated;

-- 6) Agente define o tipo de campanha que o workflow de atendimento já entende.
alter table public.agentes add column if not exists tipo_campanha text;
update public.agentes set tipo_campanha = 'reativacao' where slug = 'ana_paula' and tipo_campanha is null;
update public.agentes set tipo_campanha = 'prospeccao' where slug = 'prospeccao' and tipo_campanha is null;
