-- Test de la máquina de estados (Fases 3 y 4). Todo dentro de una
-- transacción que se revierte. Correr:
--   supabase db query --linked -f scripts/tests/cuentas-estados.sql
-- Resultado esperado: todas las columnas ok_* en true.
begin;

-- Una cuenta confirmada sin paciente (cuestionario_pendiente) termina el cuestionario.
create temp table t_ctx as
select p.id as profile_id, (select id from public.profiles where role = 'profesional' limit 1) as clinica
from public.profiles p join auth.users u on u.id = p.id
where p.role in ('familiar', 'paciente') and u.email_confirmed_at is not null and public.paciente_de_cuenta(p.id) is null
limit 1;

insert into public.patients (nombre, edad, modalidad, onboarding_complete) values ('Prueba Estados', '78', 'autoguiado', true);
create temp table t_pt as select id from public.patients where nombre = 'Prueba Estados' order by created_at desc limit 1;
insert into public.patient_links (patient_id, profile_id, relation)
select (select id from t_pt), profile_id, 'familiar_admin' from t_ctx;

create temp table t_r as
select
  (select estado_cuenta::text from public.profiles where id = (select profile_id from t_ctx)) as tras_cuestionario,
  (select count(*) from public.plan_tasks t join public.plans p on p.id = t.plan_id where p.patient_id = (select id from t_pt) and p.origen = 'bienvenida' and t.es_onboarding) as tareas_bienvenida,
  null::text as tras_aprobar, null::int as demo_dias, null::text as tras_pago, null::bigint as historial, null::bigint as panel;

grant all on t_ctx, t_pt, t_r to authenticated;

-- Como clínica.
select set_config('request.jwt.claims', json_build_object('sub', (select clinica from t_ctx), 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', (select clinica::text from t_ctx), true);
set local role authenticated;

-- Sin aprobar no se pueden asignar recursos de la clínica.
do $$
begin
  insert into public.plan_tasks (plan_id, dia, titulo, tipo, estado)
  select id, 'Lunes', 'x', 'actividad', 'pendiente' from public.plans where patient_id = (select id from t_pt) limit 1;
  raise exception 'NO_BLOQUEO';
exception when others then
  if sqlerrm = 'NO_BLOQUEO' then raise; end if;
end $$;

select public.marcar_requiere_contacto((select id from t_pt), true, 'Confirmar edad');
select public.aprobar_cuenta((select id from t_pt));
update t_r set tras_aprobar = (select estado::text from public.panel_cuentas() where profile_id = (select profile_id from t_ctx)),
  demo_dias = (select round(extract(epoch from demo_fin - demo_inicio) / 86400)::int from public.patients where id = (select id from t_pt));

select public.marcar_cuenta_pagada((select id from t_pt), true, 'Prueba');
update t_r set tras_pago = (select estado::text from public.panel_cuentas() where profile_id = (select profile_id from t_ctx)),
  historial = (select count(*) from public.cuenta_estado_historial where patient_id = (select id from t_pt)),
  panel = (select count(*) from public.panel_cuentas() where patient_id = (select id from t_pt));

select *,
  tras_cuestionario = 'pendiente_aprobacion' as ok_cuestionario,
  tareas_bienvenida >= 1 as ok_bienvenida,
  tras_aprobar = 'en_demo' and demo_dias = (select dias_demo from public.config_clinica) as ok_aprobar,
  tras_pago = 'activa' as ok_pago,
  historial >= 4 as ok_historial,
  panel = 1 as ok_panel
from t_r;

rollback;
