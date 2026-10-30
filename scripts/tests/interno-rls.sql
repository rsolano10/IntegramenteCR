-- Test: ningún campo interno llega a una cuenta de familia
-- (business/integramente-recursos-spec.md §8). Simula el JWT de una cuenta
-- familiar_admin y todo queda dentro de una transacción que se revierte.
-- Correr: supabase db query --linked -f scripts/tests/interno-rls.sql
-- Resultado esperado: ok = true (y los contadores en 0).
begin;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select profile_id from public.patient_links where relation = 'familiar_admin' limit 1), 'role', 'authenticated')::text,
  true
);
select set_config('request.jwt.claim.sub', (select profile_id::text from public.patient_links where relation = 'familiar_admin' limit 1), true);
set local role authenticated;

with r as (
  select
    (select count(*) from public.media_resources_interno) as internas_visibles,
    (select count(*) from public.actividades_sugeridas() s
       where s.objetivo is not null or s.progresion is not null or s.requisito is not null or s.dominios is not null) as sugeridas_con_internos,
    (select count(*) from public.media_resources m
       where m.objetivo is not null or m.progresion is not null or m.requisito is not null or m.dominios is not null) as publicos_con_internos,
    (select count(*) from public.media_resources m where m.codigo like 'COG-%' and m.por_que is not null) as cog_con_objetivo_esperado,
    coalesce(public.perfil_recursos() ?| array['ruta', 'rutaOverride', 'supervision', 'nutricion'], false) as perfil_expone_clinico,
    (select count(*) from public.actividades_sugeridas()) as sugeridas_total
)
select *,
  internas_visibles = 0 and sugeridas_con_internos = 0 and publicos_con_internos = 0
    and cog_con_objetivo_esperado = 0 and not perfil_expone_clinico as ok
from r;

rollback;
