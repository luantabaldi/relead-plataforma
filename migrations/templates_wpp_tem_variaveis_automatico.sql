-- OPCIONAL (não aplicada): calcular tem_variaveis no banco, no momento em que o template é
-- sincronizado da Meta. Hoje o app já faz isso na hora do disparo (DispatchForm), então este
-- gatilho só é necessário se outros fluxos também precisarem do campo correto.
--
-- Recalcula só quando o template é inserido ou quando `componentes` muda; uma edição manual
-- do campo (aba Gerenciar) é preservada enquanto a Meta não alterar o corpo.
create or replace function public.templates_wpp_calcula_variaveis()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  corpo text;
begin
  if tg_op = 'INSERT' or new.componentes is distinct from old.componentes then
    if jsonb_typeof(new.componentes) = 'array' then
      select c->>'text' into corpo
        from jsonb_array_elements(new.componentes) c
       where c->>'type' = 'BODY'
       limit 1;
      if corpo is not null then
        new.tem_variaveis := corpo ~ '\{\{[^{}]+\}\}';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists templates_wpp_variaveis on public.templates_wpp;
create trigger templates_wpp_variaveis
  before insert or update on public.templates_wpp
  for each row execute function public.templates_wpp_calcula_variaveis();
