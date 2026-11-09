-- Prueba de permisos de la memoria de Clara (todo se deshace al final).
-- Uso: supabase db query --linked -f scripts/tests/clara-memoria.sql
begin;
create temp table r (prueba text, ok boolean) on commit drop;
grant all on r to authenticated;

with dos as (select id from auth.users order by created_at limit 2)
insert into public.agent_memory (user_id, nombre, resumen_previo)
select id, 'Prueba', 'resumen de ' || id from dos;

select set_config('test.a', (select id::text from auth.users order by created_at limit 1), true);
select set_config('test.b', (select id::text from auth.users order by created_at offset 1 limit 1), true);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.a'), 'role', 'authenticated')::text, true);

insert into r select 've_solo_la_propia', (select count(*) from public.agent_memory) = 1 and (select user_id::text from public.agent_memory) = current_setting('test.a');
insert into r select 'no_ve_la_ajena', not exists (select 1 from public.agent_memory where user_id::text = current_setting('test.b'));

do $$ begin
  begin
    update public.agent_memory set resumen_previo = 'hackeado';
    insert into r values ('no_puede_editar', false);
  exception when insufficient_privilege then insert into r values ('no_puede_editar', true);
  end;
  begin
    insert into public.clara_conversaciones (conversation_id, user_id) values ('conv_falsa', current_setting('test.b')::uuid);
    insert into r values ('no_registra_conversaciones', false);
  exception when insufficient_privilege then insert into r values ('no_registra_conversaciones', true);
  end;
end $$;

reset role;
select prueba, ok from r order by prueba;
rollback;
